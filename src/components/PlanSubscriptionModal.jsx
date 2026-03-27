import React, { useState, useEffect } from 'react';
import { api } from '../../server/api';
import './css/PlanSubscriptionModal.css';

export default function PlanSubscriptionModal({ isOpen, onClose, shop }) {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('3');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && shop) {
      loadPlanos();
    }
  }, [isOpen, shop]);

  const loadPlanos = async () => {
    try {
      setLoading(true);
      const data = await api.getPlanosDisponiveisByEstabelecimento(shop.id);
      setPlanos(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar planos disponiveis');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
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
        usuario_id: parseInt(usuarioId, 10),
        plano_id: selectedPlan.id,
        pagamento_metodo_id: parseInt(paymentMethod, 10),
      });

      if (selectedPlan.dias_freetrial > 0) {
        alert(`Assinatura criada com sucesso!\n\nVoce tem ${selectedPlan.dias_freetrial} dias de teste gratis.\nPrimeira cobranca em: ${new Date(response.proxima_cobranca).toLocaleDateString('pt-BR')}`);
      } else {
        alert('Assinatura criada com sucesso!\n\nPagamento pendente. Voce tem 7 dias para efetuar o pagamento.');
      }

      onClose();
    } catch (err) {
      alert(err.message || 'Erro ao criar assinatura');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="plan-subscription-overlay" onClick={onClose}>
      <div className="plan-subscription-modal" onClick={(e) => e.stopPropagation()}>
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
                    <span className="price-value">R$ {parseFloat(plano.preco).toFixed(2)}</span>
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
                  onChange={(e) => setPaymentMethod(e.target.value)}
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
                    <strong>R$ {parseFloat(selectedPlan.preco).toFixed(2)}</strong>
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
                  onClick={handleSubscribe}
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
