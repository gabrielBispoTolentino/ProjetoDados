import React, { useState, useEffect } from 'react';
import { api } from '../../server/api';
import './css/PlanMarketplace.css';

export default function PlanMarketplace({ estabelecimentoId, onClose }) {
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlano, setSelectedPlano] = useState(null);

    useEffect(() => {
        loadMarketplace();
    }, [estabelecimentoId]);

    const loadMarketplace = async () => {
        try {
            setLoading(true);
            const data = await api.getMarketplacePlanos(estabelecimentoId);
            setPlanos(data);
        } catch (err) {
            console.error(err);
            alert('Erro ao carregar marketplace');
        } finally {
            setLoading(false);
        }
    };

    const handleParticipar = async (plano) => {
        if (!window.confirm(`Deseja participar da parceria "${plano.nome}"?\n\nCriado por: ${plano.criador_nome}\nPreço: R$ ${parseFloat(plano.preco).toFixed(2)}`)) {
            return;
        }

        try {
            await api.participarPlano(plano.id, estabelecimentoId);
            alert('Você entrou na parceria com sucesso!');
            loadMarketplace();
            if (onClose) onClose();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return <div className="marketplace-loading">Carregando planos disponíveis...</div>;
    }

    return (
        <div className="marketplace-container">
            <div className="marketplace-header">
                <h3>Marketplace de Planos</h3>
                <p className="marketplace-subtitle">
                    Participe de planos criados por outras barbearias
                </p>
            </div>

            {planos.length === 0 ? (
                <div className="marketplace-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p>Nenhum plano disponível no momento</p>
                    <span>Todos os planos públicos já foram adicionados ou não existem planos disponíveis</span>
                </div>
            ) : (
                <div className="marketplace-grid">
                    {planos.map((plano) => (
                        <div key={plano.id} className="marketplace-card">
                            <div className="marketplace-card-header">
                                <h4>{plano.nome}</h4>
                                <span className="marketplace-badge">
                                    {plano.num_parceiros} {plano.num_parceiros === 1 ? 'parceiro' : 'parceiros'}
                                </span>
                            </div>

                            {plano.description && (
                                <p className="marketplace-description">{plano.description}</p>
                            )}

                            <div className="marketplace-details">
                                <div className="marketplace-detail">
                                    <span className="detail-label">Criado por:</span>
                                    <span className="detail-value">{plano.criador_nome}</span>
                                </div>
                                {plano.criador_cidade && (
                                    <div className="marketplace-detail">
                                        <span className="detail-label">Cidade:</span>
                                        <span className="detail-value">{plano.criador_cidade}</span>
                                    </div>
                                )}
                                <div className="marketplace-detail">
                                    <span className="detail-label">Preço:</span>
                                    <span className="detail-value price">R$ {parseFloat(plano.preco).toFixed(2)}</span>
                                </div>
                                <div className="marketplace-detail">
                                    <span className="detail-label">Ciclo:</span>
                                    <span className="detail-value">{plano.ciclo_pagamento}</span>
                                </div>
                                {plano.dias_freetrial > 0 && (
                                    <div className="marketplace-detail">
                                        <span className="detail-label">Free Trial:</span>
                                        <span className="detail-value">{plano.dias_freetrial} dias</span>
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn-participar"
                                onClick={() => handleParticipar(plano)}
                            >
                                Participar da Parceria
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
