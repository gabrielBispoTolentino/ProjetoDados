import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../server/api';
import AvaliaçõesBar from './AvaliaçõesBar';
import './css/ShopDetailsModal.css';

export default function ShopDetailsModal({
    shop,
    isOpen,
    onClose,
    onSchedule
}) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!isOpen || !shop) return null;

    const imageUrl = shop.imageUrl ? api.getPhotoUrl(shop.imageUrl) : null;

    return createPortal(
        <div className="shop-details-overlay" onClick={onClose}>
            <div
                className="shop-details-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="shop-details-title"
            >
                <button
                    className="shop-details-close-btn"
                    onClick={onClose}
                    aria-label="Fechar detalhes"
                >
                    ×
                </button>

                <div className="shop-details-header">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={shop.name}
                            className="shop-details-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}

                    <div
                        className="shop-details-placeholder"
                        style={{ display: imageUrl ? 'none' : 'flex' }}
                    >
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
                            ⭐ {Number(shop.rating).toFixed(1)}
                            <span style={{ fontWeight: 400, color: '#99aabb' }}>
                                ({shop.ratingCount} avaliações)
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
                            Agendar Horário
                        </button>
                    </div>

                    <div className="shop-details-section">
                        <h3 className="shop-details-subtitle">Sobre a Barbearia</h3>
                        <div className="shop-details-desc">
                            {shop.description || "Barbearia de qualidade com profissionais experientes. Agende seu horário e venha conferir nossos serviços."}
                        </div>
                    </div>

                    <div className="shop-details-section">
                        <h3 className="shop-details-subtitle">Informações</h3>
                        <div className="shop-details-info-grid">
                            <div className="shop-details-info-item">
                                <strong>Endereço Completo</strong>
                                <span>
                                    {shop.fullAddress?.rua}, {shop.fullAddress?.cidade} - {shop.fullAddress?.estado}<br />
                                    CEP: {shop.fullAddress?.cep}
                                </span>
                            </div>
                            <div className="shop-details-info-item">
                                <strong>Telefone</strong>
                                <span>{shop.phone || "Não informado"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="shop-details-section">
                        <h3 className="shop-details-subtitle">Avaliações</h3>
                        <AvaliaçõesBar
                            estabelecimentoId={shop.id}
                            onSubmitted={() => { }} // Optional: Refresh capability if needed
                        />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
