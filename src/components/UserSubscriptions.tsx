import { useEffect, useState } from 'react';
import { api } from '../../server/api';
import type { UserSubscription } from '../types/domain';
import './css/UserSubscriptions.css';

type UserSubscriptionsProps = {
  isOpen: boolean;
  onClose: () => void;
};

function readStringField(record: UserSubscription, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

export default function UserSubscriptions({
  isOpen,
  onClose,
}: UserSubscriptionsProps) {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadSubscriptions();
  }, [isOpen]);

  async function loadSubscriptions() {
    try {
      setLoading(true);
      const usuarioId = localStorage.getItem('usuarioId');
      if (!usuarioId) {
        setSubscriptions([]);
        return;
      }

      const data = await api.getUserSubscriptions(usuarioId);
      setSubscriptions(data);
    } catch (caughtError) {
      console.error(caughtError);
      alert('Erro ao carregar assinaturas');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: number) {
    const motivo = prompt('Motivo do cancelamento (opcional):');

    try {
      await api.cancelSubscription(id, motivo);
      alert('Assinatura cancelada com sucesso!');
      await loadSubscriptions();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao cancelar assinatura';
      alert(message);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="subscriptions-overlay" onClick={onClose}>
      <div className="subscriptions-modal" onClick={(event) => event.stopPropagation()}>
        <button className="subscriptions-close" onClick={onClose}>x</button>

        <h2>Minhas Assinaturas</h2>

        {loading ? (
          <div className="subscriptions-loading">Carregando...</div>
        ) : subscriptions.length === 0 ? (
          <div className="no-subscriptions">
            <p>Voce ainda nao possui assinaturas ativas.</p>
          </div>
        ) : (
          <div className="subscriptions-list">
            {subscriptions.map((subscription) => {
              const precoAtual = readStringField(subscription, 'preÃ§o_periodo_atual');
              const proximaCobranca = readStringField(subscription, 'proxima_data_cobranÃ§a') || subscription.proxima_cobranca;

              return (
                <div key={subscription.id} className="subscription-card">
                  <div className="subscription-header">
                    <h3>{subscription.plano_nome}</h3>
                    <span className={`subscription-status ${String(subscription.status).replace(' ', '-')}`}>
                      {subscription.status}
                    </span>
                  </div>

                  {subscription.plano_description && (
                    <p className="subscription-description">{subscription.plano_description}</p>
                  )}

                  <div className="subscription-details">
                    <div className="subscription-detail">
                      <strong>Estabelecimento:</strong> {subscription.estabelecimento_nome}
                    </div>
                    <div className="subscription-detail">
                      <strong>Preco:</strong> R$ {Number(precoAtual || 0).toFixed(2)}
                    </div>
                    <div className="subscription-detail">
                      <strong>Ciclo:</strong> {subscription.ciclo_pagamento}
                    </div>
                    <div className="subscription-detail">
                      <strong>Inicio:</strong> {subscription.data_incio ? new Date(subscription.data_incio).toLocaleDateString('pt-BR') : '-'}
                    </div>
                    <div className="subscription-detail">
                      <strong>Proxima Cobranca:</strong> {proximaCobranca ? new Date(proximaCobranca).toLocaleDateString('pt-BR') : '-'}
                    </div>
                  </div>

                  <button
                    className="btn-cancel-subscription"
                    onClick={() => {
                      void handleCancel(subscription.id);
                    }}
                  >
                    Cancelar Assinatura
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
