import { useEffect, useState } from 'react';
import { api } from '../../server/api';
import type { AvailablePlan, PaymentMethodValue, ShopSummary } from '../types/domain';
import './css/PlanSubscriptionModal.css';

type PlanSubscriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  shop: ShopSummary | null;
};

export default function PlanSubscriptionModal({
  isOpen,
  onClose,
  shop,
}: PlanSubscriptionModalProps) {
  const [planos, setPlanos] = useState<AvailablePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<AvailablePlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>('3');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && shop) {
      void loadPlanos();
      return;
    }

    setPlanos([]);
    setSelectedPlan(null);
    setLoading(false);
  }, [isOpen, shop]);

  async function loadPlanos() {
    if (!shop) {
      return;
    }

    try {
      setLoading(true);
      const data = await api.getPlanosDisponiveisByEstabelecimento(shop.id);
      setPlanos(data);
    } catch (caughtError) {
      console.error(caughtError);
      alert('Erro ao carregar planos disponiveis');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    if (!selectedPlan) {
      alert('Por favor, selecione um plano');
      return;
    }

    try {
      setSubmitting(true);
      const usuarioId = localStorage.getItem('usuarioId');
      if (!usuarioId) {
        alert('Usuario nao autenticado');
        return;
      }

      const response = await api.subscribeToPlan({
        usuario_id: Number.parseInt(usuarioId, 10),
        plano_id: selectedPlan.id,
        pagamento_metodo_id: Number.parseInt(paymentMethod, 10) as 1 | 2 | 3 | 4,
      });

      if (selectedPlan.dias_freetrial > 0 && response.proxima_cobranca) {
        alert(
          `Assinatura criada com sucesso!\n\nVoce tem ${selectedPlan.dias_freetrial} dias de teste gratis.\nPrimeira cobranca em: ${new Date(response.proxima_cobranca).toLocaleDateString('pt-BR')}`,
        );
      } else {
        alert('Assinatura criada com sucesso!\n\nPagamento pendente. Voce tem 7 dias para efetuar o pagamento.');
      }

      onClose();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao criar assinatura';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="plan-subscription-overlay" onClick={onClose}>
      <div
        className="plan-subscription-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="plan-subscription-close" onClick={onClose}>x</button>

        <h2 className="plan-subscription-title">Assinar Plano</h2>
        <p className="plan-subscription-subtitle">{shop?.name}</p>

        {loading ? (
          <div className="plan-subscription-loading">Carregando planos...</div>
        ) : planos.length === 0 ? (
          <div className="plan-subscription-empty">
            <p>Esta barbearia ainda nao oferece planos de assinatura.</p>
          </div>
        ) : (
          <>
            <div className="plan-subscription-plans">
              {planos.map((plano) => (
                <div
                  key={plano.id}
                  className={`plan-subscription-card ${selectedPlan?.id === plano.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(plano)}
                >
                  <div className="plan-subscription-card-header">
                    <h3>{plano.nome}</h3>
                    {plano.dias_freetrial > 0 && (
                      <span className="plan-free-trial-badge">
                        {plano.dias_freetrial} dias gratis
                      </span>
                    )}
                  </div>

                  {plano.description && (
                    <p className="plan-subscription-description">{plano.description}</p>
                  )}

                  <div className="plan-subscription-price">
                    <span className="price-value">R$ {Number(plano.preco).toFixed(2)}</span>
                    <span className="price-cycle">/{plano.ciclo_pagamento}</span>
                  </div>

                  {selectedPlan?.id === plano.id && (
                    <div className="plan-selected-indicator">Selecionado</div>
                  )}
                </div>
              ))}
            </div>

            {selectedPlan && (
              <div className="plan-subscription-payment">
                <h3>Metodo de Pagamento</h3>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethodValue)}
                  className="payment-method-select"
                >
                  <option value="3">Cartao de Credito</option>
                  <option value="4">Cartao de Debito</option>
                  <option value="2">PIX</option>
                  <option value="1">Boleto</option>
                </select>

                <div className="plan-subscription-summary">
                  <div className="summary-row">
                    <span>Plano:</span>
                    <strong>{selectedPlan.nome}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Valor:</span>
                    <strong>R$ {Number(selectedPlan.preco).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Ciclo:</span>
                    <strong>{selectedPlan.ciclo_pagamento}</strong>
                  </div>
                  {selectedPlan.dias_freetrial > 0 && (
                    <div className="summary-row highlight">
                      <span>Periodo Gratis:</span>
                      <strong>{selectedPlan.dias_freetrial} dias</strong>
                    </div>
                  )}
                </div>

                <button
                  className="btn-subscribe"
                  onClick={() => {
                    void handleSubscribe();
                  }}
                  disabled={submitting}
                >
                  {submitting ? 'Processando...' : 'Confirmar Assinatura'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
