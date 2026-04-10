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

  function getText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  // MUDAR PARA QUE O LINK DO GOOGLE RENDERIZE DIREITO
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

  if (!isOpen || !shop) {
    return null;
  }

  const currentShop = shop;
  const imageUrl = shop.imageUrl ? api.getPhotoUrl(shop.imageUrl) : null;
  const mapsUrl = getText(currentShop.googleMapsUrl);
  const mapsEmbedUrl = getText(currentShop.googleMapsEmbedUrl);
  const addressQuery = buildAddressQuery(currentShop);

  const embedSrc =
    mapsEmbedUrl ||
    (addressQuery
      ? `https://www.google.com/maps?q=${encodeURIComponent(addressQuery)}&z=15&output=embed`
      : null);

  const externalMapsUrl =
    mapsUrl ||
    (addressQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
      : null);

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
