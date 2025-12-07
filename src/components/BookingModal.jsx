import React, { useState, useEffect } from 'react';
import TimeSlotSelector from './TimeSlotSelector';
import './css/BookingModal.css';

export default function BookingModal({ isOpen, onClose, onSubmit, selectedShop }) {
  const [formData, setFormData] = useState({
    estabelecimento_id: '',
    plano_id: '1',
    selectedDate: '',
    proximo_pag: '',
    status: 'ativo',
    metodo_pagamento: '1'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const PLAN_PRICES = {
    1: 25.00,
    2: 40.00,
    3: 60.00
  };

  useEffect(() => {
    if (isOpen && selectedShop) {
      setFormData(prev => ({
        ...prev,
        estabelecimento_id: String(selectedShop.id)
      }));
    }
  }, [isOpen, selectedShop]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.estabelecimento_id) {
        throw new Error('Estabelecimento não selecionado');
      }
      if (!formData.proximo_pag) {
        throw new Error('Escolha uma data e horário');
      }

      await onSubmit(formData);
      setFormData({
        estabelecimento_id: '',
        plano_id: '1',
        selectedDate: '',
        proximo_pag: '',
        status: 'ativo',
        metodo_pagamento: '1'
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao agendar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="booking-modal-backdrop">
      <div className="booking-modal-container">
        <h3 className="booking-modal-title">
          Agendar em {selectedShop?.name || 'Barbearia'}
        </h3>

        {error && (
          <div className="booking-modal-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="booking-establishment-info">
            <p className="booking-establishment-label">
              <strong>Estabelecimento:</strong>
            </p>
            <p className="booking-establishment-name">
              {selectedShop?.name}
            </p>
            {selectedShop?.address && (
              <p className="booking-establishment-address">
                📍 {selectedShop.address}
              </p>
            )}
          </div>

          <div className="booking-form-group">
            <label htmlFor="plano_id" className="booking-form-label">
              Plano
            </label>
            <select
              id="plano_id"
              name="plano_id"
              value={formData.plano_id}
              onChange={handleChange}
              className="booking-form-select"
            >
              <option value="1">Corte Simples - R$ {PLAN_PRICES[1].toFixed(2)}</option>
              <option value="2">Corte + Barba - R$ {PLAN_PRICES[2].toFixed(2)}</option>
              <option value="3">Pacote Premium - R$ {PLAN_PRICES[3].toFixed(2)}</option>
            </select>
            <p style={{ marginTop: '0.5rem', color: '#4ade80', fontWeight: 'bold' }}>
              Total: R$ {PLAN_PRICES[formData.plano_id]?.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="booking-form-group">
            <label htmlFor="metodo_pagamento" className="booking-form-label">
              Método de Pagamento
            </label>
            <select
              id="metodo_pagamento"
              name="metodo_pagamento"
              value={formData.metodo_pagamento}
              onChange={handleChange}
              className="booking-form-select"
            >
              <option value="1">Dinheiro</option>
              <option value="2">Cartão de Crédito</option>
              <option value="3">Cartão de Débito</option>
              <option value="4">Pix</option>
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
              selectedDate={formData.selectedDate}
              value={formData.proximo_pag}
              onSelectDateTime={(dateTime) => {
                setFormData(prev => ({ ...prev, proximo_pag: dateTime }));
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
              disabled={loading || !formData.proximo_pag}
              className={`btn btn-primary booking-btn-submit ${(!formData.proximo_pag || loading) ? 'disabled' : ''}`}
            >
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}