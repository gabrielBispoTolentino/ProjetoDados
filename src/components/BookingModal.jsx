import React, { useState, useEffect } from 'react';

export default function BookingModal({ isOpen, onClose, onSubmit, selectedShop }) {
  const [formData, setFormData] = useState({
    estabelecimento_id: '',
    plano_id: '1',
    proximo_pag: '',
    status: 'ativo'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        throw new Error('Escolha uma data/hora');
      }

      await onSubmit(formData);
      setFormData({
        estabelecimento_id: '',
        plano_id: '1',
        proximo_pag: '',
        status: 'ativo'
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
      }}>
        <h3 style={{ marginTop: 0, color: 'var(--text)' }}>
          Agendar em {selectedShop?.name || 'Barbearia'}
        </h3>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
              <strong>Estabelecimento:</strong>
            </p>
            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text)', fontWeight: '600' }}>
              {selectedShop?.name}
            </p>
            {selectedShop?.address && (
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                📍 {selectedShop.address}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="plano_id" style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Plano
            </label>
            <select
              id="plano_id"
              name="plano_id"
              value={formData.plano_id}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.6rem',
                border: '1px solid #e6eef2',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: 'var(--text)',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            >
              <option value="1">Corte Simples</option>
              <option value="2">Corte + Barba</option>
              <option value="3">Pacote Premium</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="proximo_pag" style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Data e Hora
            </label>
            <input
              id="proximo_pag"
              type="datetime-local"
              name="proximo_pag"
              value={formData.proximo_pag}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.6rem',
                border: '1px solid #e6eef2',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: 'var(--text)',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="status" style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.6rem',
                border: '1px solid #e6eef2',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: 'var(--text)',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            >
              <option value="ativo">Ativo</option>
              <option value="atrasado">Atrasado</option>
              <option value="cancelado">Cancelado</option>
              <option value="free trial">Free Trial</option>
              <option value="pausado">Pausado</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.2rem',
                border: '1px solid #e6eef2',
                borderRadius: '10px',
                backgroundColor: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: '0.6rem 1.2rem',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
