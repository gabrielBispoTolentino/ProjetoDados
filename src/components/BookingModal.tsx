import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { api } from '../../server/api';
import { BarberPickerSkeletons } from './Skeleton';
import TimeSlotSelector from './TimeSlotSelector';
import type {
  BookingBarberOption,
  BookingFormData,
  ServiceOptionId,
  ShopSummary,
} from '../types/domain';
import './css/BookingModal.css';

type BookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: BookingFormData) => Promise<void> | void;
  selectedShop: ShopSummary | null;
};

const INITIAL_FORM_DATA: BookingFormData = {
  estabelecimento_id: '',
  barbeiro_id: '',
  servico_id: '1',
  selectedDate: '',
  proximo_pag: '',
  status: 'ativo',
  metodo_pagamento: '3',
};

const SERVICO_PRICES: Record<ServiceOptionId, number> = {
  '1': 40,
  '2': 30,
  '3': 60,
};

export default function BookingModal({
  isOpen,
  onClose,
  onSubmit,
  selectedShop,
}: BookingModalProps) {
  const [formData, setFormData] = useState<BookingFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [barbers, setBarbers] = useState<BookingBarberOption[]>([]);
  const [barbersLoading, setBarbersLoading] = useState(false);
  const [barbersError, setBarbersError] = useState('');

  useEffect(() => {
    if (isOpen && selectedShop) {
      setFormData((currentForm) => ({
        ...currentForm,
        estabelecimento_id: String(selectedShop.id),
        barbeiro_id: '',
        selectedDate: '',
        proximo_pag: '',
      }));
    }
  }, [isOpen, selectedShop]);

  useEffect(() => {
    if (!isOpen || !selectedShop) {
      setBarbers([]);
      setBarbersError('');
      return;
    }

    void loadBarbers(selectedShop.id);
  }, [isOpen, selectedShop]);

  async function loadBarbers(establishmentId: number | string) {
    setBarbersLoading(true);
    setBarbersError('');

    try {
      const data = await api.getBookingBarbers(establishmentId);
      setBarbers(data);
    } catch (caughtError) {
      console.error(caughtError);
      setBarbers([]);
      setBarbersError(caughtError instanceof Error ? caughtError.message : 'Erro ao carregar barbeiros');
    } finally {
      setBarbersLoading(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    } as BookingFormData));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.estabelecimento_id) {
        throw new Error('Estabelecimento nao selecionado');
      }

      if (!formData.barbeiro_id) {
        throw new Error('Selecione um barbeiro');
      }

      if (!formData.proximo_pag) {
        throw new Error('Escolha uma data e horario');
      }

      await onSubmit(formData);
      setFormData(INITIAL_FORM_DATA);
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Erro ao agendar');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="booking-modal-backdrop">
      <div className="booking-modal-container">
        <h3 className="booking-modal-title">
          Agendar em {selectedShop?.name || 'Barbearia'}
        </h3>

        {error && <div className="booking-modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="booking-establishment-info">
            <p className="booking-establishment-label">
              <strong>Estabelecimento:</strong>
            </p>
            <p className="booking-establishment-name">{selectedShop?.name}</p>
            {selectedShop?.address && (
              <p className="booking-establishment-address">{selectedShop.address}</p>
            )}
          </div>

          <div className="booking-form-group">
            <label className="booking-form-label">Selecione um barbeiro</label>
            {barbersLoading ? (
              <BarberPickerSkeletons count={6} />
            ) : barbersError ? (
              <div className="booking-modal-error">{barbersError}</div>
            ) : barbers.length === 0 ? (
              <div className="booking-barbers-loading">Nenhum barbeiro disponivel para esta barbearia.</div>
            ) : (
              <div className="booking-barbers-grid">
                {barbers.map((barber) => {
                  const isSelected = formData.barbeiro_id === String(barber.id);
                  const barberPhoto = api.getPhotoUrl(barber.fotoUrl || barber.imagem_url);

                  return (
                    <button
                      key={barber.id}
                      type="button"
                      className={`booking-barber-button ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData((currentForm) => ({
                          ...currentForm,
                          barbeiro_id: String(barber.id),
                          proximo_pag: '',
                        }));
                      }}
                      title={barber.nome}
                      aria-label={`Selecionar barbeiro ${barber.nome}`}
                    >
                      {barberPhoto ? (
                        <img src={barberPhoto} alt={barber.nome} className="booking-barber-photo" />
                      ) : (
                        <span className="booking-barber-fallback">{barber.nome.slice(0, 1).toUpperCase()}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {formData.barbeiro_id && (
              <p className="booking-barber-name">
                Barbeiro selecionado:{' '}
                {barbers.find((barber) => String(barber.id) === formData.barbeiro_id)?.nome || '-'}
              </p>
            )}
          </div>

          <div className="booking-form-group">
            <label htmlFor="servico_id" className="booking-form-label">
              Servico
            </label>
            <select
              id="servico_id"
              name="servico_id"
              value={formData.servico_id}
              onChange={handleChange}
              className="booking-form-select"
            >
              <option value="1">Corte de Cabelo - R$ {SERVICO_PRICES['1'].toFixed(2)}</option>
              <option value="2">Barba - R$ {SERVICO_PRICES['2'].toFixed(2)}</option>
              <option value="3">Combo Completo - R$ {SERVICO_PRICES['3'].toFixed(2)}</option>
            </select>
            <p style={{ marginTop: '0.5rem', color: '#4ade80', fontWeight: 'bold' }}>
              Total: R$ {SERVICO_PRICES[formData.servico_id].toFixed(2)}
            </p>
          </div>

          <div className="booking-form-group">
            <label htmlFor="metodo_pagamento" className="booking-form-label">
              Metodo de Pagamento
            </label>
            <select
              id="metodo_pagamento"
              name="metodo_pagamento"
              value={formData.metodo_pagamento}
              onChange={handleChange}
              className="booking-form-select"
            >
              <option value="3">Cartao de Credito</option>
              <option value="4">Cartao de Debito</option>
              <option value="2">Pix</option>
              <option value="1">Boleto</option>
            </select>
          </div>

          <div className="booking-form-group">
            <label htmlFor="selectedDate" className="booking-form-label">
              Selecione uma Data
            </label>
            <input
              id="selectedDate"
              type="date"
              name="selectedDate"
              value={formData.selectedDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="booking-form-input"
              required
            />
          </div>

          <div className="booking-timeslot-group">
            <TimeSlotSelector
              estabelecimentoId={formData.estabelecimento_id}
              barbeiroId={formData.barbeiro_id}
              selectedDate={formData.selectedDate}
              value={formData.proximo_pag}
              onSelectDateTime={(dateTime) => {
                setFormData((currentForm) => ({ ...currentForm, proximo_pag: dateTime }));
              }}
            />
          </div>

          <div className="booking-form-group">
            <label htmlFor="status" className="booking-form-label">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="booking-form-select"
            >
              <option value="ativo">Ativo</option>
              <option value="atrasado">Atrasado</option>
              <option value="cancelado">Cancelado</option>
              <option value="free trial">Free Trial</option>
              <option value="pausado">Pausado</option>
            </select>
          </div>

          <div className="booking-actions">
            <button
              type="button"
              onClick={onClose}
              className="booking-btn-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.proximo_pag || !formData.barbeiro_id}
              className={`btn btn-primary booking-btn-submit ${(!formData.proximo_pag || !formData.barbeiro_id || loading) ? 'disabled' : ''}`}
            >
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
