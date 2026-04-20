import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../server/api';
import AvaliacoesBar from './AvaliaçõesBar';
import PlanSubscriptionModal from './PlanSubscriptionModal';
import RatingStars from './RatingStars';
import type { ReviewSummary, ShopSummary } from '../types/domain';
import './css/ShopDetailsModal.css';

type DetailedShop = ShopSummary & {
  description?: string | null;
  phone?: string | null;
  fullAddress: {
    rua: string;
    cidade: string;
    estado: string;
    cep: string;
  };
};

type ShopDetailsModalProps = {
  shop: DetailedShop | null;
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (shop: DetailedShop) => void;
};

type StoredUser = {
  nome?: string;
  fotoUrl?: string | null;
  foto_url?: string | null;
  imagem_url?: string | null;
};

function getStoredUser(): StoredUser | null {
  const rawUser = localStorage.getItem('usuario');
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
}

export default function ShopDetailsModal({
  shop,
  isOpen,
  onClose,
  onSchedule,
}: ShopDetailsModalProps) {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [resolvedEmbedSrc, setResolvedEmbedSrc] = useState<string | null>(null);
  const [embedResolutionFailed, setEmbedResolutionFailed] = useState(false);
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [ratingSummary, setRatingSummary] = useState<{ avg: number; count: number } | null>(null);

  function getText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  function buildEmbedUrl(query: string) {
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  }

  function buildAddressQuery(currentShop: DetailedShop) {
    const parts = [
      getText(currentShop.fullAddress?.rua),
      getText(currentShop.fullAddress?.cidade),
      getText(currentShop.fullAddress?.estado),
      getText(currentShop.fullAddress?.cep),
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(', ');
    }

    return getText(currentShop.address);
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !shop) {
      setReviews([]);
      setReviewsError(null);
      setRatingSummary(null);
      return;
    }

    let cancelled = false;
    setReviewsLoading(true);
    setReviewsError(null);

    void api.getEstablishmentReviews(shop.id)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setReviews(result.reviews);
        setRatingSummary({
          avg: Number(result.ratingAvg || 0),
          count: Number(result.ratingCount || 0),
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setReviews([]);
        setReviewsError(error instanceof Error ? error.message : 'Erro ao carregar avaliacoes');
      })
      .finally(() => {
        if (!cancelled) {
          setReviewsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, shop]);

  const currentShop = shop;
  const imageUrl = currentShop?.imageUrl ? api.getPhotoUrl(currentShop.imageUrl) : null;
  const mapsUrl = getText(currentShop?.googleMapsUrl);
  const mapsEmbedUrl = getText(currentShop?.googleMapsEmbedUrl);
  const addressQuery =
    currentShop && (!mapsUrl || !mapsEmbedUrl) ? buildAddressQuery(currentShop) : null;
  const fallbackEmbedSrc = addressQuery
    ? buildEmbedUrl(addressQuery)
    : null;
  const fallbackMapsUrl = addressQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
    : null;

  const externalMapsUrl = mapsUrl || fallbackMapsUrl;
  const shouldResolveMapsUrl = Boolean(mapsUrl) && !mapsEmbedUrl;
  const embedSrc =
    mapsEmbedUrl ||
    resolvedEmbedSrc ||
    (!shouldResolveMapsUrl || embedResolutionFailed ? fallbackEmbedSrc : null);
  const displayedRating = ratingSummary?.avg ?? Number(shop?.rating || 0);
  const displayedRatingCount = ratingSummary?.count ?? Number(shop?.ratingCount || 0);

  useEffect(() => {
    let cancelled = false;

    if (!shouldResolveMapsUrl) {
      setResolvedEmbedSrc(null);
      setEmbedResolutionFailed(false);
      return () => {
        cancelled = true;
      };
    }

    const shortMapsUrl = mapsUrl;
    if (!shortMapsUrl) {
      setResolvedEmbedSrc(null);
      setEmbedResolutionFailed(true);
      return () => {
        cancelled = true;
      };
    }

    setResolvedEmbedSrc(null);
    setEmbedResolutionFailed(false);

    void api.resolveGoogleMapsEmbedUrl(shortMapsUrl)
      .then((result) => {
        if (!cancelled) {
          setResolvedEmbedSrc(getText(result.embedUrl));
          setEmbedResolutionFailed(!getText(result.embedUrl));
        }
      })
      .catch((error) => {
        console.error('Erro ao resolver link curto do Google Maps:', error);
        if (!cancelled) {
          setResolvedEmbedSrc(null);
          setEmbedResolutionFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mapsUrl, shouldResolveMapsUrl]);

  if (!isOpen || !shop) {
    return null;
  }

  return createPortal(
    <div className="shop-details-overlay" onClick={onClose}>
      <div
        className="shop-details-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-details-title"
      >
        <button
          className="shop-details-close-btn"
          onClick={onClose}
          aria-label="Fechar detalhes"
        >
          x
        </button>

        <div className="shop-details-header">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={shop.name}
              className="shop-details-cover"
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

          <div className="shop-details-placeholder" style={{ display: imageUrl ? 'none' : 'flex' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>

        <div className="shop-details-content">
          <h2 id="shop-details-title" className="shop-details-title">
            {shop.name}
          </h2>

          <div className="shop-details-meta">
            <div className="shop-details-rating">
              <span>{displayedRating.toFixed(1)}</span>
              <RatingStars rating={displayedRating} size="sm" />
              <span style={{ fontWeight: 400, color: '#99aabb' }}>
                ({displayedRatingCount} avaliacoes)
              </span>
            </div>
            <span>{shop.address}</span>
          </div>

          <div className="shop-details-actions">
            <button
              className="shop-details-book-btn"
              onClick={() => {
                onClose();
                onSchedule(shop);
              }}
            >
              Agendar Horario
            </button>
            <button
              className="shop-details-subscribe-btn"
              onClick={() => setShowSubscriptionModal(true)}
            >
              Assinar Plano
            </button>
          </div>

          <div className="shop-details-section">
            <h3 className="shop-details-subtitle">Sobre a Barbearia</h3>
            <div className="shop-details-desc">
              {shop.description || 'Barbearia de qualidade com profissionais experientes. Agende seu horario e venha conferir nossos servicos.'}
            </div>
          </div>

          <div className="shop-details-section">
            <h3 className="shop-details-subtitle">Informacoes</h3>
            <div className="shop-details-info-grid">
              <div className="shop-details-info-item">
                <strong>Endereco Completo</strong>
                <span>
                  {shop.fullAddress?.rua}, {shop.fullAddress?.cidade} - {shop.fullAddress?.estado}
                  <br />
                  CEP: {shop.fullAddress?.cep}
                </span>
              </div>
              <div className="shop-details-info-item">
                <strong>Telefone</strong>
                <span>{shop.phone || 'Nao informado'}</span>
              </div>
            </div>
          </div>

          {(embedSrc || externalMapsUrl) && (
            <div className="shop-details-section">
              <div className="shop-details-map-header">
                <h3 className="shop-details-subtitle">Localizacao</h3>
                {externalMapsUrl && (
                  <a
                    className="shop-details-map-link"
                    href={externalMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir no Google Maps
                  </a>
                )}
              </div>

              {embedSrc ? (
                <div className="shop-details-map-frame">
                  <iframe
                    src={embedSrc}
                    title={`Mapa da ${shop.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              ) : (
                <p className="shop-details-map-empty">
                  A localizacao desta barbearia ainda nao foi configurada.
                </p>
              )}
            </div>
          )}

          <div className="shop-details-section">
            <h3 className="shop-details-subtitle">Avaliacoes</h3>

            <div className="shop-details-reviews-summary">
              <div className="shop-details-reviews-score">
                <strong>{displayedRating.toFixed(1)}</strong>
                <RatingStars rating={displayedRating} size="md" />
              </div>
              <p>
                Baseado em {displayedRatingCount} {displayedRatingCount === 1 ? 'avaliacao' : 'avaliacoes'}.
              </p>
            </div>

            <AvaliacoesBar
              estabelecimentoId={shop.id}
              onSubmitted={(payload, result) => {
                const storedUser = getStoredUser();

                setReviews((currentReviews) => [
                  {
                    id: Date.now(),
                    rating: payload.rating,
                    comentario: payload.comentario,
                    usuarioNome: storedUser?.nome || 'Voce',
                    usuarioFotoUrl:
                      storedUser?.fotoUrl ||
                      storedUser?.foto_url ||
                      storedUser?.imagem_url ||
                      null,
                  },
                  ...currentReviews,
                ]);

                if (typeof result?.ratingAvg === 'number' && typeof result?.ratingCount === 'number') {
                  setRatingSummary({
                    avg: result.ratingAvg,
                    count: result.ratingCount,
                  });
                }
              }}
            />

            {reviewsError && <p className="shop-details-reviews-error">{reviewsError}</p>}

            {reviewsLoading ? (
              <div className="shop-details-reviews-list">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="shop-details-review-card is-loading">
                    <div className="shop-details-review-avatar skeleton-block" />
                    <div className="shop-details-review-body">
                      <div className="shop-details-review-line skeleton-block short" />
                      <div className="shop-details-review-line skeleton-block medium" />
                      <div className="shop-details-review-line skeleton-block long" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="shop-details-reviews-list">
                {reviews.map((review) => {
                  const reviewPhotoUrl = api.getPhotoUrl(review.usuarioFotoUrl) || null;

                  return (
                    <article key={review.id} className="shop-details-review-card">
                      <div className="shop-details-review-avatar">
                        {reviewPhotoUrl ? (
                          <img
                            src={reviewPhotoUrl}
                            alt={review.usuarioNome}
                            onError={(event) => {
                              const image = event.currentTarget;
                              image.style.display = 'none';
                              const fallback = image.nextElementSibling;
                              if (fallback instanceof HTMLElement) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}

                        <div
                          className="shop-details-review-avatar-fallback"
                          style={{ display: reviewPhotoUrl ? 'none' : 'flex' }}
                        >
                          {review.usuarioNome.slice(0, 1).toUpperCase()}
                        </div>
                      </div>

                      <div className="shop-details-review-body">
                        <div className="shop-details-review-header">
                          <strong>{review.usuarioNome}</strong>
                          <RatingStars rating={review.rating} size="sm" />
                        </div>
                        <p>{review.comentario || 'Cliente avaliou sem comentario adicional.'}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="shop-details-reviews-empty">
                Ainda nao ha avaliacoes para esta barbearia. Seja o primeiro a avaliar.
              </p>
            )}
          </div>
        </div>

        <PlanSubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          shop={shop}
        />
      </div>
    </div>,
    document.body,
  );
}
