import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../server/api';
import AvaliaçõesBar from './AvaliaçõesBar';
import PlanSubscriptionModal from './PlanSubscriptionModal';
import type { ShopSummary } from '../types/domain';
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

export default function ShopDetailsModal({
  shop,
  isOpen,
  onClose,
  onSchedule,
}: ShopDetailsModalProps) {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [resolvedEmbedSrc, setResolvedEmbedSrc] = useState<string | null>(null);

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

  function extractEmbedQueryFromMapsUrl(value: string): string | null {
    const directValue = getText(value);
    if (!directValue) {
      return null;
    }

    if (directValue.includes('output=embed')) {
      return directValue;
    }

    try {
      const url = new URL(directValue);
      const queryParams = ['q', 'query', 'destination', 'll', 'center'];

      for (const key of queryParams) {
        const paramValue = getText(url.searchParams.get(key));
        if (paramValue) {
          return buildEmbedUrl(paramValue);
        }
      }

      const placeMatch = url.pathname.match(/\/place\/([^/]+)/i);
      if (placeMatch?.[1]) {
        return buildEmbedUrl(decodeURIComponent(placeMatch[1]).replace(/\+/g, ' '));
      }

      const atMatch = directValue.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      if (atMatch) {
        return buildEmbedUrl(`${atMatch[1]},${atMatch[2]}`);
      }

      const dataMatch = directValue.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
      if (dataMatch) {
        return buildEmbedUrl(`${dataMatch[1]},${dataMatch[2]}`);
      }
    } catch {
      const atMatch = directValue.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      if (atMatch) {
        return buildEmbedUrl(`${atMatch[1]},${atMatch[2]}`);
      }
    }

    return null;
  }

  function isResolvableGoogleMapsShortLink(value: string | null) {
    if (!value) {
      return false;
    }

    try {
      const url = new URL(value);
      return /(^|\.)maps\.app\.goo\.gl$/i.test(url.hostname);
    } catch {
      return false;
    }
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const currentShop = shop;
  const imageUrl = currentShop?.imageUrl ? api.getPhotoUrl(currentShop.imageUrl) : null;
  const mapsUrl = getText(currentShop?.googleMapsUrl);
  const mapsEmbedUrl = getText(currentShop?.googleMapsEmbedUrl);
  const addressQuery =
    currentShop && (!mapsUrl || !mapsEmbedUrl) ? buildAddressQuery(currentShop) : null;
  const derivedEmbedSrc = mapsUrl && !mapsEmbedUrl ? extractEmbedQueryFromMapsUrl(mapsUrl) : null;
  const fallbackEmbedSrc = addressQuery
    ? buildEmbedUrl(addressQuery)
    : null;
  const fallbackMapsUrl = addressQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
    : null;

  const embedSrc = mapsEmbedUrl || derivedEmbedSrc || resolvedEmbedSrc || fallbackEmbedSrc;

  const externalMapsUrl = mapsUrl || fallbackMapsUrl;

  useEffect(() => {
    let cancelled = false;

    if (!mapsUrl || mapsEmbedUrl || derivedEmbedSrc || !isResolvableGoogleMapsShortLink(mapsUrl)) {
      setResolvedEmbedSrc(null);
      return () => {
        cancelled = true;
      };
    }

    void api.resolveGoogleMapsEmbedUrl(mapsUrl)
      .then((result) => {
        if (!cancelled) {
          setResolvedEmbedSrc(getText(result.embedUrl));
        }
      })
      .catch((error) => {
        console.error('Erro ao resolver link curto do Google Maps:', error);
        if (!cancelled) {
          setResolvedEmbedSrc(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [derivedEmbedSrc, mapsEmbedUrl, mapsUrl]);

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
              * {Number(shop.rating || 0).toFixed(1)}
              <span style={{ fontWeight: 400, color: '#99aabb' }}>
                ({shop.ratingCount || 0} avaliacoes)
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
            <AvaliaçõesBar estabelecimentoId={shop.id} onSubmitted={() => {}} />
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
