import React, { useState, useEffect, useRef } from 'react'
import fallbackShops from '../assets/shops.json'

const PAGE_SIZE = 5;

function ShopsList({ onView }) {
  const [shops, setShops] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    // load first page
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !loading && hasMore) {
          loadPage(page + 1);
        }
      }
    }, { root: null, rootMargin: '200px', threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelRef, loading, hasMore, page]);

  async function loadPage(nextPage) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      let data = null;
      try {
        const res = await fetch(`/api/shops?page=${nextPage}&limit=${PAGE_SIZE}`);
        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {
        // network error -> will fallback
      }

      if (!data) {
        // fallback to local JSON (simulate pagination)
        const start = (nextPage - 1) * PAGE_SIZE;
        data = fallbackShops.slice(start, start + PAGE_SIZE);
      }

      if (!data || data.length === 0) {
        setHasMore(false);
      } else {
        setShops((prev) => [...prev, ...data]);
        setPage(nextPage);
        if (data.length < PAGE_SIZE) setHasMore(false);
      }
    } catch (err) {
      setError('Erro ao carregar barbearias');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="shops-section">
      <h3 className="shops-title">Barbearias disponíveis</h3>
      <div className="shops-list" role="list">
        {shops.map((s) => (
          <div key={s.id}>
            <article
              className="shop-card"
              role="listitem"
              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              aria-expanded={expandedId === s.id}
            >
              <div className="shop-info">
                <h4 className="shop-name">{s.name}</h4>
                <p className="shop-address">{s.address}</p>
              </div>
              <div className="shop-meta">
                <div className="shop-rating">⭐ {s.rating}</div>
              </div>
            </article>

            <div className={`shop-details ${expandedId === s.id ? 'open' : ''}`}>
              <div className="shop-details-inner">
                <div className="shop-photos">
                  {/* Placeholder para imagens */}
                  <div className="photo-placeholder" />
                </div>
                <div className="shop-desc">
                  <p><strong>Sobre:</strong> Espaço para descrição detalhada da barbearia, serviços oferecidos e horários.</p>
                  <p><strong>Serviços:</strong> Corte, Barba, Sobrancelha, Tratamentos.</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={sentinelRef} />
      </div>
      {loading && <div className="loader">Carregando...</div>}
      {error && <div className="loader error">{error}</div>}
      {!hasMore && <div className="loader">Fim da lista</div>}
    </section>
  );
}

function PainelCliente() {
  function handleView(shop) {
    // placeholder: in a real app you'd navigate or open details
    // console.log(shop);
    alert(`Abrindo: ${shop.name}`);
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h2>Painel do Cliente</h2>
      <ShopsList onView={handleView} />
    </main>
  );
}

export default PainelCliente;