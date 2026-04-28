import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { BarbershopPlanType } from '../types/domain';

type SignupModalStep = 'plan' | 'payment';

type FakePaymentData = {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

type SignupPlanPaymentModalProps = {
  isOpen: boolean;
  plans: BarbershopPlanType[];
  loading: boolean;
  loadError: string;
  selectedPlanId?: string | number;
  submitting?: boolean;
  submitError?: string;
  onClose: () => void;
  onSelectPlan: (planId: number) => void;
  onConfirm: () => Promise<void> | void;
};

const INITIAL_FAKE_PAYMENT_DATA: FakePaymentData = {
  cardName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
};

export default function SignupPlanPaymentModal({
  isOpen,
  plans,
  loading,
  loadError,
  selectedPlanId,
  submitting = false,
  submitError = '',
  onClose,
  onSelectPlan,
  onConfirm,
}: SignupPlanPaymentModalProps) {
  const [step, setStep] = useState<SignupModalStep>('plan');
  const [paymentData, setPaymentData] = useState<FakePaymentData>(INITIAL_FAKE_PAYMENT_DATA);

  useEffect(() => {
    if (!isOpen) {
      setStep('plan');
      setPaymentData(INITIAL_FAKE_PAYMENT_DATA);
    }
  }, [isOpen]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan.id) === String(selectedPlanId || '')),
    [plans, selectedPlanId],
  );

  function handlePaymentChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setPaymentData((currentPaymentData) => ({
      ...currentPaymentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onConfirm();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="cadastro-modal-overlay" onClick={onClose}>
      <div className="cadastro-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="cadastro-modal-close"
          onClick={onClose}
          disabled={submitting}
        >
          x
        </button>

        {submitError && <p className="cadastro-error cadastro-modal-error">{submitError}</p>}

        {step === 'plan' && (
          <>
            <div className="cadastro-modal-header">
              <span className="cadastro-modal-step">Passo 1 de 2</span>
              <h3>Escolha o plano</h3>
              <p>Selecione o tipo de plano da conta antes de seguir para o pagamento.</p>
            </div>

            {loading ? (
              <div className="cadastro-plan-message">Carregando planos disponiveis...</div>
            ) : plans.length === 0 ? (
              <div className="cadastro-plan-message cadastro-plan-message-error">
                {loadError || 'Nenhum plano disponivel no momento.'}
              </div>
            ) : (
              <div className="cadastro-plan-grid">
                {plans.map((plan) => {
                  const selected = String(plan.id) === String(selectedPlanId || '');

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      className={`cadastro-plan-card ${selected ? 'selected' : ''}`}
                      onClick={() => onSelectPlan(plan.id)}
                      disabled={submitting}
                      aria-pressed={selected}
                    >
                      <div className="cadastro-plan-card-top">
                        <strong>{plan.name}</strong>
                        <span className="cadastro-plan-price">
                          R$ {Number(plan.price).toFixed(2)}/{plan.billingCycle}
                        </span>
                      </div>
                      {plan.description && <p>{plan.description}</p>}
                      <div className="cadastro-plan-meta">
                        <span>
                          {plan.maxBarbers ? `Ate ${plan.maxBarbers} barbeiros` : 'Barbeiros ilimitados'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="cadastro-modal-actions">
              <button
                type="button"
                className="cadastro-modal-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="cadastro-modal-primary"
                onClick={() => setStep('payment')}
                disabled={submitting || !selectedPlanId}
              >
                Ir para pagamento
              </button>
            </div>
          </>
        )}

        {step === 'payment' && (
          <form className="cadastro-payment-form" onSubmit={handleSubmit}>
            <div className="cadastro-modal-header">
              <span className="cadastro-modal-step">Passo 2 de 2</span>
              <h3>Pagamento</h3>
              <p>Pagamento fake por enquanto. Basta preencher os campos abaixo para concluir.</p>
            </div>

            {selectedPlan && (
              <div className="cadastro-payment-summary">
                <div>
                  <span className="cadastro-payment-summary-label">Plano selecionado</span>
                  <strong>{selectedPlan.name}</strong>
                </div>
                <div>
                  <span className="cadastro-payment-summary-label">Valor</span>
                  <strong>
                    R$ {Number(selectedPlan.price).toFixed(2)}/{selectedPlan.billingCycle}
                  </strong>
                </div>
              </div>
            )}

            <input
              type="text"
              name="cardName"
              placeholder="Nome no cartao"
              value={paymentData.cardName}
              onChange={handlePaymentChange}
              disabled={submitting}
              required
            />

            <input
              type="text"
              name="cardNumber"
              placeholder="Numero do cartao"
              value={paymentData.cardNumber}
              onChange={handlePaymentChange}
              disabled={submitting}
              minLength={13}
              required
            />

            <div className="cadastro-payment-row">
              <input
                type="text"
                name="expiry"
                placeholder="Validade MM/AA"
                value={paymentData.expiry}
                onChange={handlePaymentChange}
                disabled={submitting}
                required
              />
              <input
                type="text"
                name="cvv"
                placeholder="CVV"
                value={paymentData.cvv}
                onChange={handlePaymentChange}
                disabled={submitting}
                minLength={3}
                maxLength={4}
                required
              />
            </div>

            <div className="cadastro-payment-note">
              Este formulario e ilustrativo. Nenhum pagamento real sera processado nesta etapa.
            </div>

            <div className="cadastro-modal-actions">
              <button
                type="button"
                className="cadastro-modal-secondary"
                onClick={() => setStep('plan')}
                disabled={submitting}
              >
                Voltar para planos
              </button>
              <button type="submit" className="cadastro-modal-primary" disabled={submitting}>
                {submitting ? 'Cadastrando...' : 'Finalizar cadastro'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
