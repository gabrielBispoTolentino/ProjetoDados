import React, { useState, useEffect, useRef, useMemo } from 'react'
import { api } from '../../server/api'
import UserBar from '../components/UserBar';
import SearchBar from '../components/SearchBar';
import AvaliaçõesBar from '../components/AvaliaçõesBar';
import BookingModal from '../components/BookingModal';

const PAGE_SIZE = 10;

const PLANOS = {
  '1': 'Corte Simples',
  '2': 'Corte + Barba',
  '3': 'Pacote Premium'
};

const getNomePlano = (planoId) => PLANOS[String(planoId)] || `Plano ${planoId}`;

function ShopsList({ onView, onSchedule, searchQuery = '', sortOption = 'relevance' }) {
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
      filtered = shops.filter(s => (s.name || '').toLowerCase().includes(q));
    }

    const sorted = [...filtered];
    switch (sortOption) {
      case 'alpha-asc':
        sorted.sort((a,b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
        break;
      case 'alpha-desc':
        sorted.sort((a,b) => (b.name || '').localeCompare(a.name || '', 'pt-BR'));
        break;
      case 'rating-desc':
        sorted.sort((a,b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
        break;
      case 'rating-asc':
        sorted.sort((a,b) => (Number(a.rating) || 0) - (Number(b.rating) || 0));
        break;
      case 'reviews-desc':
        sorted.sort((a,b) => (Number(b.ratingCount) || 0) - (Number(a.ratingCount) || 0));
        break;
      case 'reviews-asc':
        sorted.sort((a,b) => (Number(a.ratingCount) || 0) - (Number(b.ratingCount) || 0));
        break;
      default:
        // relevance: keep server order
        break;
    }

    return sorted;
  }, [shops, searchQuery, sortOption]);

  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !loadingRef.current && hasMore) {
          loadPage(page + 1);
        }
      }
    }, { root: null, rootMargin: '200px', threshold: 0.1 });
    
    io.observe(el);
    return () => io.disconnect();
  }, [page, hasMore, loading]);

  async function loadPage(nextPage) {
    if (loadingRef.current || loading || !hasMore) {
      console.log('⚠️ Carregamento ignorado - loading:', loading, 'hasMore:', hasMore);
      return;
    }
    
    if (nextPage <= page && page !== 0) {
      console.log('⚠️ Página já carregada:', nextPage);
      return;
    }
    
    console.log(`🔵 Carregando página ${nextPage}...`);
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      let data = await api.getEstablishments(nextPage, PAGE_SIZE);
      console.log('✅ Dados recebidos:', data);

      if (!data || data.length === 0) {
        console.log('⚠️ Nenhum dado retornado - fim da lista');
        setHasMore(false);
        return;
      }

      data = data.map(shop => ({
        ...shop,
        name: shop.name ?? shop.nome ?? "Sem nome",
        address: shop.address ?? shop.cidade ?? "Sem endereço",
        rating: shop.rating ?? shop.rating_avg ?? 0,
        ratingCount: shop.ratingCount ?? shop.rating_count ?? 0,
        imageUrl: shop.imagem_url || shop.img || null,
        fullAddress: {
          rua: shop.fullAddress?.rua ?? shop.rua ?? "",
          cidade: shop.fullAddress?.cidade ?? shop.cidade ?? "",
          estado: shop.fullAddress?.estado ?? shop.stado ?? "",
          cep: shop.fullAddress?.cep ?? shop.cep ?? ""
        }
      }));

      console.log('✅ Dados processados:', data);
      
      setShops(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newShops = data.filter(s => !existingIds.has(s.id));
        
        if (newShops.length === 0) {
          console.log('⚠️ Todos os estabelecimentos já existem - fim da lista');
          setHasMore(false);
          return prev;
        }
        
        console.log(`🔧 Adicionando ${newShops.length} novos estabelecimentos`);
        return [...prev, ...newShops];
      });
      
      setPage(nextPage);
      
      if (data.length < PAGE_SIZE) {
        console.log('⚠️ Menos dados que PAGE_SIZE, sem mais páginas');
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar barbearias:', err);
      setError(`Erro ao carregar: ${err.message}`);
      setHasMore(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      console.log('✅ Carregamento finalizado');
    }
  }

  async function refreshShop(id) {
    try {
      const est = await api.getEstablishmentById(id);
      const normalized = {
        id: est.id,
        name: est.name ?? est.nome ?? 'Sem nome',
        address: est.address ?? est.cidade ?? est.address ?? 'Sem endereço',
        rating: est.rating ?? est.rating_avg ?? 0,
        ratingCount: est.ratingCount ?? est.rating_count ?? 0,
        imageUrl: est.img || est.imageUrl || est.imagem_url || null,
        fullAddress: est.fullAddress ?? est.fullAddress
      };

      setShops(prev => prev.map(s => (s.id === id ? { ...s, ...normalized } : s)));
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
              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
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
                <div className="shop-image-placeholder" style={{ display: s.imageUrl ? 'none' : 'flex' }}>
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
                    <span style={{ fontSize: '0.85em', color: '#6b7280' }}>
                      {' '}({s.ratingCount})
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
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.backgroundColor = '#0b5b54';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.backgroundColor = 'var(--accent)';
                }}
                title={`Agendar em ${s.name}`}
              >
                +
              </button>
            </article>

            <div className={`shop-details ${expandedId === s.id ? 'open' : ''}`}>
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
                        e.target.nextElementSibling.style.display = 'flex';
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
                    <p><strong>Sobre:</strong> {s.description}</p>
                  ) : (
                    <p><strong>Sobre:</strong> Barbearia de qualidade com profissionais experientes.</p>
                  )}
                  {s.phone && (
                    <p><strong>Telefone:</strong> {s.phone}</p>
                  )}
                  {s.fullAddress && (
                    <p>
                      <strong>Endereço completo:</strong> {s.fullAddress.rua}, {s.fullAddress.cidade} - {s.fullAddress.estado}, CEP: {s.fullAddress.cep}
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
                    <AvaliaçõesBar estabelecimentoId={s.id} onSubmitted={() => refreshShop(s.id)} />
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
  const [agendamentos, setAgendamentos] = useState([]);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('relevance');

  useEffect(() => {
    loadAgendamentosDoUsuario();
  }, []);

  async function loadAgendamentosDoUsuario() {
    try {
      const usuarioId = localStorage.getItem('usuarioId') || '1';
      
      try {
        const response = await fetch(`/api/agendamentos?usuario_id=${usuarioId}`);
        if (response.ok) {
          const data = await response.json();
          
          const agendamentosComNome = await Promise.all(
            (data || []).map(async (ag) => {
              try {
                const estab = await api.getEstablishmentById(ag.estabelecimento_id);
                return {
                  ...ag,
                  nome: estab?.nome || estab?.name || 'Estabelecimento',
                  plano_nome: getNomePlano(ag.plano_id)
                };
              } catch {
                return {
                  ...ag,
                  nome: 'Estabelecimento',
                  plano_nome: getNomePlano(ag.plano_id)
                };
              }
            })
          );
          
          setAgendamentos(agendamentosComNome);
          setLoadingAgendamentos(false);
          return;
        }
      } catch (err) {
        console.warn('Endpoint GET /agendamentos não disponível, usando cache local');
      }
      
      const cachedAgendamentos = sessionStorage.getItem('agendamentos');
      if (cachedAgendamentos) {
        const parsed = JSON.parse(cachedAgendamentos);
        const comNomePlano = parsed.map(ag => ({
          ...ag,
          plano_nome: ag.plano_nome || getNomePlano(ag.plano_id)
        }));
        setAgendamentos(comNomePlano);
      }
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      setAgendamentos([]);
    } finally {
      setLoadingAgendamentos(false);
    }
  }

  function handleView(shop) {
    alert(`Abrindo detalhes de: ${shop.name}\n\nEndereço: ${shop.address}\nAvaliação: ${shop.rating}`);
  }

  function handleScheduleClick(shop) {
    setSelectedShop(shop);
    setShowBookingModal(true);
  }

  const handleBookingSubmit = async (formData) => {
    try {
      const usuarioId = localStorage.getItem('usuarioId') || '1';
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
        throw new Error(errorData.erro || 'Erro ao criar agendamento');
      }

      const result = await response.json();
      
      const estab = await api.getEstablishmentById(estabId);
      const nomeEstab = estab?.nome || estab?.name || 'Estabelecimento';
      
      const novoAgendamento = { 
        id: result.id, 
        ...payload, 
        nome: nomeEstab,
        plano_nome: getNomePlano(formData.plano_id)
      };
      const agendamentosAtualizados = [...agendamentos, novoAgendamento];
      
      setAgendamentos(agendamentosAtualizados);
      sessionStorage.setItem('agendamentos', JSON.stringify(agendamentosAtualizados));
      alert('Agendamento criado com sucesso!');
    } catch (err) {
      throw err;
    }
  };

  return (
    <>
      <UserBar />
      <main style={{ padding: '2rem' }}>
        <div style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ marginLeft: 'auto' }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              sort={sortOption}
              onSortChange={setSortOption}
            />
          </div>
        </div>

        {agendamentos.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <h3>Meus Agendamentos</h3>
            {loadingAgendamentos ? (
              <div className="loader">Carregando agendamentos...</div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {agendamentos.map((ag) => (
                  <div
                    key={ag.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid #e6eef2',
                      borderRadius: '10px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <p><strong>Estabelecimento:</strong> {ag.nome}</p>
                    <p><strong>Plano:</strong> {ag.plano_nome}</p>
                    <p><strong>Data/Hora:</strong> {new Date(ag.proximo_pag).toLocaleString('pt-BR')}</p>
                    <p><strong>Status:</strong> {ag.status}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

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