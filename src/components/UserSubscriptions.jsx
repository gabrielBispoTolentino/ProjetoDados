import React, { useState, useEffect } from 'react';
import { api } from '../../server/api';
import './css/UserSubscriptions.css';

export default function UserSubscriptions({ isOpen, onClose }) {
    if (!isOpen) return null;

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadSubscriptions();
        }
    }, [isOpen]);

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            const usuarioId = localStorage.getItem('usuarioId');
            const data = await api.getUserSubscriptions(usuarioId);
            setSubscriptions(data);
        } catch (err) {
            console.error(err);
            alert('Erro ao carregar assinaturas');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        const motivo = prompt('Motivo do cancelamento (opcional):');

        try {
            await api.cancelSubscription(id, motivo);
            alert('Assinatura cancelada com sucesso!');
            loadSubscriptions();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="subscriptions-overlay" onClick={onClose}>
            <div className="subscriptions-modal" onClick={(e) => e.stopPropagation()}>
                <button className="subscriptions-close" onClick={onClose}>×</button>

                <h2>Minhas Assinaturas</h2>

                {loading ? (
                    <div className="subscriptions-loading">Carregando...</div>
                ) : subscriptions.length === 0 ? (
                    <div className="no-subscriptions">
                        <p>Você ainda não possui assinaturas ativas.</p>
                    </div>
                ) : (
                    <div className="subscriptions-list">
                        {subscriptions.map((sub) => (
                            <div key={sub.id} className="subscription-card">
                                <div className="subscription-header">
                                    <h3>{sub.plano_nome}</h3>
                                    <span className={`subscription-status ${sub.status.replace(' ', '-')}`}>
                                        {sub.status}
                                    </span>
                                </div>

                                {sub.plano_description && (
                                    <p className="subscription-description">{sub.plano_description}</p>
                                )}

                                <div className="subscription-details">
                                    <div className="subscription-detail">
                                        <strong>Estabelecimento:</strong> {sub.estabelecimento_nome}
                                    </div>
                                    <div className="subscription-detail">
                                        <strong>Preço:</strong> R$ {parseFloat(sub.preço_periodo_atual).toFixed(2)}
                                    </div>
                                    <div className="subscription-detail">
                                        <strong>Ciclo:</strong> {sub.ciclo_pagamento}
                                    </div>
                                    <div className="subscription-detail">
                                        <strong>Início:</strong> {new Date(sub.data_incio).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="subscription-detail">
                                        <strong>Próxima Cobrança:</strong> {new Date(sub.proxima_data_cobrança).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>

                                <button
                                    className="btn-cancel-subscription"
                                    onClick={() => handleCancel(sub.id)}
                                >
                                    Cancelar Assinatura
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
