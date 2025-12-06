import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../server/api';
import UserBar from '../components/UserBar';
import SearchBar from '../components/SearchBar';
import AvaliaçõesBar from '../components/AvaliaçõesBar';
import BookingModal from '../components/BookingModal';

const PAGE_SIZE = 10;

function ShopsList({
  onView,
  onSchedule,
  searchQuery = '',
  sortOption = 'relevance'
}) {
  const [shops, setShops] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const visibleShops = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    let filtered = shops;
    if (q.length > 0) {
      filtered = shops.filter((s) =>
        (s.name || '').toLowerCase().includes(q)
      );
    }

    const sorted = [...filtered];
    switch (sortOption) {
      case 'alpha-asc':
        sorted.sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', 'pt-BR')
        );
        break;
      case 'alpha-desc':
        sorted.sort((a, b) =>
          (b.name || '').localeCompare(a.name || '', 'pt-BR')
        );
        break;
      case 'rating-desc':
        sorted.sort(
          (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)
        );
        break;
      case 'rating-asc':
        sorted.sort(
          (a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0)
        );
        break;
      case 'reviews-desc':
        sorted.sort(
          (a, b) =>
            (Number(b.ratingCount) || 0) - (Number(a.ratingCount) || 0)
        );
        break;
      case 'reviews-asc':
        sorted.sort(
          (a, b) =>
            (Number(a.ratingCount) || 0) - (Number(b.ratingCount) || 0)
        );
        break;
      default:
        break;
    }
    return sorted;
  }, [shops, searchQuery, sortOption]);

  useEffect(() => {
    loadPage(1);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !loadingRef.current &&
            hasMore
          ) {
            loadPage(page + 1);
          }
        });
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [page, hasMore, loading]);

  async function loadPage(nextPage) {
    if (loadingRef.current || loading || !hasMore) return;
    if (nextPage <= page && page !== 0) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      let data = await api.getEstablishments(nextPage, PAGE_SIZE);

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      data = data.map((shop) => ({
        ...shop,
        name: shop.name ?? shop.nome ?? 'Sem nome',
        address: shop.address ?? shop.cidade ?? 'Sem endereço',
        rating: shop.rating ?? shop.rating_avg ?? 0,
        ratingCount: shop.ratingCount ?? shop.rating_count ?? 0,
        imageUrl: shop.imagem_url || shop.img || null,
        fullAddress: {
          rua: shop.rua ?? '',
          cidade: shop.cidade ?? '',
          estado: shop.stado ?? '',
          cep: shop.cep ?? ''
        }
      }));

      setShops((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const newShops = data.filter((s) => !existingIds.has(s.id));
        if (newShops.length === 0) {
          setHasMore(false);
          return prev;
        }
        return [...prev, ...newShops];
      });

      setPage(nextPage);

      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err) {
      setError('Erro ao carregar: ' + err.message);
      setHasMore(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  async function refreshShop(id) {
    try {
      const est = await api.getEstablishmentById(id);

      const normalized = {
        id: est.id,
        name: est.name ?? est.nome ?? 'Sem nome',
        address: est.address ?? est.cidade ?? 'Sem endereço',
        rating: est.rating ?? est.rating_avg ?? 0,
        ratingCount: est.ratingCount ?? est.rating_count ?? 0,
        imageUrl: est.img || est.imageUrl || est.imagem_url || null,
        fullAddress: est.fullAddress
      };

      setShops((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...normalized } : s))
      );
    } catch (err) {
      console.warn('Erro ao atualizar estabelecimento:', err);
    }
  }

  return (
    <section className="shops-section">
      <h3 className="shops-title">Barbearias disponíveis</h3>

      {error && <div className="loader error">{error}</div>}

      <div className="shops-list" role="list">
        {shops.length === 0 && !loading && !error && (
          <div className="loader">Nenhuma barbearia encontrada</div>
        )}

        {visibleShops.map((s) => (
          <div key={s.id}>
            <article
              className="shop-card"
              role="listitem"
              onClick={() =>
                setExpandedId(expandedId === s.id ? null : s.id)
              }
              aria-expanded={expandedId === s.id}
              style={{ cursor: 'pointer' }}
            >
              <div className="shop-image">
                {s.imageUrl ? (
                  <img
                    src={api.getPhotoUrl(s.imageUrl)}
                    alt={s.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}

                <div
                  className="shop-image-placeholder"
                  style={{
                    display: s.imageUrl ? 'none' : 'flex'
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
              </div>

              <div className="shop-info" style={{ flex: 1 }}>
                <h4 className="shop-name">{s.name}</h4>
                <p className="shop-address">{s.address}</p>
                <div className="shop-rating" style={{ marginTop: '0.5rem' }}>
                  ⭐ {Number(s.rating).toFixed(1)}
                  {s.ratingCount > 0 && (
                    <span
                      style={{
                        fontSize: '0.85em',
                        color: '#6b7280'
                      }}
                    >
                      {' '}
                      ({s.ratingCount})
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSchedule(s);
                }}
                style={{
                  width: '45px',
                  height: '45px',
                  minWidth: '45px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(15,118,110,0.3)',
                  transition: 'all 150ms ease'
                }}
              >
                +
              </button>
            </article>

            <div
              className={`shop-details ${
                expandedId === s.id ? 'open' : ''
              }`}
            >
              <div className="shop-details-inner">
                <div className="shop-photos">
                  {s.imageUrl ? (
                    <img
                      src={api.getPhotoUrl(s.imageUrl)}
                      alt={s.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display =
                          'flex';
                      }}
                    />
                  ) : null}

                  <div
                    className="photo-placeholder"
                    style={{ display: s.imageUrl ? 'none' : 'flex' }}
                  />
                </div>

                <div className="shop-desc">
                  {s.description ? (
                    <p>
                      <strong>Sobre:</strong> {s.description}
                    </p>
                  ) : (
                    <p>
                      <strong>Sobre:</strong> Barbearia de qualidade
                      com profissionais experientes.
                    </p>
                  )}

                  {s.phone && (
                    <p>
                      <strong>Telefone:</strong> {s.phone}
                    </p>
                  )}

                  {s.fullAddress && (
                    <p>
                      <strong>Endereço completo:</strong>{' '}
                      {s.fullAddress.rua}, {s.fullAddress.cidade} -{' '}
                      {s.fullAddress.estado}, CEP:{' '}
                      {s.fullAddress.cep}
                    </p>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ marginTop: '0.5rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(s);
                    }}
                  >
                    Ver mais detalhes
                  </button>

                  <div style={{ marginTop: '0.75rem' }}>
                    <AvaliaçõesBar
                      estabelecimentoId={s.id}
                      onSubmitted={() => refreshShop(s.id)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {hasMore && <div ref={sentinelRef} style={{ height: '1px' }} />}
      </div>

      {loading && <div className="loader">Carregando...</div>}
    </section>
  );
}

function PainelCliente() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('relevance');

  useEffect(() => {
    console.log("ID salvo no localStorage:", localStorage.getItem("usuarioId"));
  }, []);

  function handleView(shop) {
    alert(
      `Abrindo detalhes de: ${shop.name}\n\nEndereço: ${shop.address}\nAvaliação: ${shop.rating}`
    );
  }

  function handleScheduleClick(shop) {
    setSelectedShop(shop);
    setShowBookingModal(true);
  }

  const handleBookingSubmit = async (formData) => {
    try {
      const usuarioId = localStorage.getItem('usuarioId');
      if (!usuarioId) {
        alert('Usuário não autenticado.');
        return;
      }

      const estabId = parseInt(formData.estabelecimento_id);

      const payload = {
        usuario_id: parseInt(usuarioId),
        estabelecimento_id: estabId,
        plano_id: parseInt(formData.plano_id),
        proximo_pag: formData.proximo_pag,
        status: formData.status
      };

      const response = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.erro || 'Erro ao criar agendamento'
        );
      }

      alert('Agendamento criado com sucesso!');
    } catch (err) {
      throw err;
    }
  };

  return (
    <>
      <UserBar />
      <main style={{ padding: '2rem' }}>
        <div
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ marginLeft: 'auto' }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              sort={sortOption}
              onSortChange={setSortOption}
            />
          </div>
        </div>

        {/* A seção "Meus Agendamentos" foi removida daqui pois agora
           reside no componente UserAppointments.jsx
        */}

        <ShopsList
          onView={handleView}
          onSchedule={handleScheduleClick}
          searchQuery={searchQuery}
          sortOption={sortOption}
        />

        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedShop(null);
          }}
          onSubmit={handleBookingSubmit}
          selectedShop={selectedShop}
        />
      </main>
    </>
  );
}

export default PainelCliente;