import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../server/api';
import UserBar from '../components/UserBar';
import SearchBar from '../components/SearchBar';
import BookingModal from '../components/BookingModal';
import ShopDetailsModal from '../components/ShopDetailsModal';
import type {
  BookingFormData,
  Establishment,
  PaymentMethodId,
  ShopSummary,
  UserSubscription,
} from '../types/domain';
import './css/PainelCliente.css';

const PAGE_SIZE = 10;

type SortOption =
  | 'relevance'
  | 'my-subscriptions'
  | 'alpha-asc'
  | 'alpha-desc'
  | 'rating-desc'
  | 'rating-asc'
  | 'reviews-desc'
  | 'reviews-asc';

type NormalizedShop = ShopSummary & {
  description?: string | null;
  phone?: string | null;
  fullAddress: {
    rua: string;
    cidade: string;
    estado: string;
    cep: string;
  };
};

type ShopsListProps = {
  onSchedule: (shop: NormalizedShop) => void;
  searchQuery?: string;
  sortOption?: SortOption;
};

function normalizeShop(shop: Establishment): NormalizedShop {
  return {
    ...shop,
    id: shop.id,
    name: shop.name ?? shop.nome ?? 'Sem nome',
    address: shop.address ?? shop.cidade ?? 'Sem endereco',
    rating: shop.rating ?? shop.rating_avg ?? 0,
    ratingCount: shop.ratingCount ?? shop.rating_count ?? 0,
    imageUrl: shop.imageUrl ?? shop.imagem_url ?? shop.img ?? null,
    latitude: shop.latitude ?? null,
    longitude: shop.longitude ?? null,
    googleMapsUrl:
      (typeof shop.googleMapsUrl === 'string' && shop.googleMapsUrl) ||
      (typeof shop.google_maps_url === 'string' && shop.google_maps_url) ||
      null,
    googleMapsEmbedUrl:
      (typeof shop.googleMapsEmbedUrl === 'string' && shop.googleMapsEmbedUrl) ||
      (typeof shop.google_maps_embed_url === 'string' && shop.google_maps_embed_url) ||
      null,
    locationVerified: shop.locationVerified ?? shop.location_verified ?? null,
    description: typeof shop.description === 'string' ? shop.description : null,
    phone: typeof shop.phone === 'string' ? shop.phone : null,
    fullAddress: {
      rua: shop.rua ?? '',
      cidade: shop.cidade ?? '',
      estado: shop.stado ?? '',
      cep: shop.cep ?? '',
    },
  };
}

function getActiveSubscriptionShopIds(subscriptions: UserSubscription[]): number[] {
  return subscriptions
    .filter((subscription) => ['ativo', 'free trial'].includes(subscription.status))
    .map((subscription) => subscription.estabelecimento_id ?? subscription.id_estabelecimento ?? null)
    .filter((id): id is number => typeof id === 'number');
}

function parsePaymentMethodId(value: BookingFormData['metodo_pagamento']): PaymentMethodId {
  return Number.parseInt(value, 10) as PaymentMethodId;
}

function ShopsList({
  onSchedule,
  searchQuery = '',
  sortOption = 'relevance',
}: ShopsListProps) {
  const [shops, setShops] = useState<NormalizedShop[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<number[]>([]);
  const [subscriptionsLoaded, setSubscriptionsLoaded] = useState(false);
  const [detailsShop, setDetailsShop] = useState<NormalizedShop | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const visibleShops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = shops;

    if (q.length > 0) {
      filtered = shops.filter((shop) => (shop.name || '').toLowerCase().includes(q));
    }

    if (sortOption === 'my-subscriptions' && subscriptionsLoaded) {
      filtered = filtered.filter((shop) => userSubscriptions.includes(shop.id));
    }

    const sorted = [...filtered];
    switch (sortOption) {
      case 'alpha-asc':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
        break;
      case 'alpha-desc':
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'pt-BR'));
        break;
      case 'rating-desc':
        sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
        break;
      case 'rating-asc':
        sorted.sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0));
        break;
      case 'reviews-desc':
        sorted.sort((a, b) => Number(b.ratingCount || 0) - Number(a.ratingCount || 0));
        break;
      case 'reviews-asc':
        sorted.sort((a, b) => Number(a.ratingCount || 0) - Number(b.ratingCount || 0));
        break;
      default:
        break;
    }

    return sorted;
  }, [searchQuery, shops, sortOption, subscriptionsLoaded, userSubscriptions]);

  useEffect(() => {
    void loadPage(1);
    void loadUserSubscriptions();
  }, []);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasMore || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loadingRef.current && hasMore) {
            void loadPage(page + 1);
          }
        });
      },
      { root: null, rootMargin: '200px', threshold: 0.1 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, loading, page]);

  async function loadUserSubscriptions() {
    try {
      const usuarioId = localStorage.getItem('usuarioId');
      if (!usuarioId) {
        setSubscriptionsLoaded(true);
        return;
      }

      const subscriptions = await api.getUserSubscriptions(usuarioId);
      setUserSubscriptions(getActiveSubscriptionShopIds(subscriptions));
      setSubscriptionsLoaded(true);
    } catch (caughtError) {
      console.error('Erro ao carregar assinaturas:', caughtError);
      setSubscriptionsLoaded(true);
    }
  }

  async function loadPage(nextPage: number) {
    if (loadingRef.current || loading || !hasMore) {
      return;
    }

    if (nextPage <= page && page !== 0) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await api.getEstablishments(nextPage, PAGE_SIZE);
      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      const normalizedData = data.map(normalizeShop);

      setShops((currentShops) => {
        const existingIds = new Set(currentShops.map((shop) => shop.id));
        const newShops = normalizedData.filter((shop) => !existingIds.has(shop.id));

        if (newShops.length === 0) {
          setHasMore(false);
          return currentShops;
        }

        return [...currentShops, ...newShops];
      });

      setPage(nextPage);

      if (normalizedData.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro desconhecido';
      setError(`Erro ao carregar: ${message}`);
      setHasMore(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  return (
    <section className="shops-section">
      <h3 className="shops-title">Barbearias disponiveis</h3>

      {error && <div className="loader error">{error}</div>}

      <div className="shops-list" role="list">
        {shops.length === 0 && !loading && !error && (
          <div className="loader">Nenhuma barbearia encontrada</div>
        )}

        {visibleShops.map((shop) => (
          <div
            key={shop.id}
            className="shop-card"
            role="listitem"
            onClick={() => setDetailsShop(shop)}
            style={{ cursor: 'pointer' }}
          >
            <div className="shop-content-wrapper">
              <div className="shop-image">
                {shop.imageUrl ? (
                  <img
                    src={api.getPhotoUrl(shop.imageUrl) || undefined}
                    alt={shop.name}
                    onError={(event) => {
                      const image = event.currentTarget;
                      image.style.display = 'none';
                      const placeholder = image.nextElementSibling;
                      if (placeholder instanceof HTMLElement) {
                        placeholder.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}

                <div
                  className="shop-image-placeholder"
                  style={{ display: shop.imageUrl ? 'none' : 'flex' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                </div>
              </div>

              <div className="shop-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 className="shop-name">{shop.name}</h4>
                  {userSubscriptions.includes(shop.id) && (
                    <span className="subscription-badge" title="Voce tem assinatura ativa nesta barbearia">
                      *
                    </span>
                  )}
                </div>
                <p className="shop-address">{shop.address}</p>
                <div className="shop-rating-row">
                  <div className="shop-rating">
                    {Number(shop.rating || 0).toFixed(1)}{' '}
                    <span style={{ color: '#6b7280', fontWeight: '400' }}>
                      ({shop.ratingCount || 0})
                    </span>
                  </div>

                  <button
                    className="schedule-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSchedule(shop);
                    }}
                    aria-label={`Agendar em ${shop.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {hasMore && <div ref={sentinelRef} style={{ height: '1px' }} />}
      </div>

      {loading && <div className="loader">Carregando...</div>}

      <ShopDetailsModal
        shop={detailsShop}
        isOpen={Boolean(detailsShop)}
        onClose={() => setDetailsShop(null)}
        onSchedule={(shop: NormalizedShop) => {
          setDetailsShop(null);
          onSchedule(shop);
        }}
      />
    </section>
  );
}

export default function PainelCliente() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<NormalizedShop | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('relevance');

  useEffect(() => {
    console.log('ID salvo no localStorage:', localStorage.getItem('usuarioId'));
  }, []);

  function handleScheduleClick(shop: NormalizedShop) {
    setSelectedShop(shop);
    setShowBookingModal(true);
  }

  async function handleBookingSubmit(formData: BookingFormData) {
    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) {
      alert('Usuario nao autenticado.');
      return;
    }

    await api.createAgendamento({
      usuario_id: Number.parseInt(usuarioId, 10),
      estabelecimento_id: Number.parseInt(formData.estabelecimento_id, 10),
      barbeiro_id: Number.parseInt(formData.barbeiro_id, 10),
      servico_id: Number.parseInt(formData.servico_id, 10),
      proximo_pag: formData.proximo_pag,
      metodo_pagamento: parsePaymentMethodId(formData.metodo_pagamento),
    });

    alert('Agendamento criado com sucesso!');
  }

  return (
    <>
      <UserBar />
      <main className="painel-main">
        <div className="painel-header">
          <div style={{ marginLeft: 'auto' }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              sort={sortOption}
              onSortChange={(value) => setSortOption(value as SortOption)}
            />
          </div>
        </div>

        <ShopsList
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
