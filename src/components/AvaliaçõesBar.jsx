import React, { useState } from 'react';
import { api } from '../../server/api';

export default function AvaliaçõesBar({ estabelecimentoId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const usuarioId = Number(localStorage.getItem('usuarioId') || 1);
      const payload = {
        usuario_id: usuarioId,
        estabelecimento_id: Number(estabelecimentoId),
        rating: Number(rating),
        comentario: comentario || ''
      };

      await api.createReview(payload);

      setComentario('');
      setRating(5);
      if (typeof onSubmitted === 'function') onSubmitted(payload);
      alert('Avaliação enviada com sucesso!');
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err);
      setError(err.message || 'Erro ao enviar avaliação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="avaliacoes-bar" onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Escreva sua avaliação..."
        rows={2}
        style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #e6eef2' }}
        aria-label="Comentário da avaliação"
      />

      <select
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        aria-label="Nota (estrelas)"
        style={{ padding: '0.45rem', borderRadius: '8px', border: '1px solid #e6eef2' }}
      >
        <option value={1}>1 Estrela</option>
        <option value={2}>2 Estrelas</option>
        <option value={3}>3 Estrelas</option>
        <option value={4}>4 Estrelas</option>
        <option value={5}>5 Estrelas</option>
      </select>

      <button
        type="submit"
        disabled={loading}
        style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: 'var(--accent)', color: 'white', border: 'none' }}
      >
        {loading ? 'Enviando...' : 'Avaliar'}
      </button>

      {error && (
        <div style={{ color: '#b91c1c', marginLeft: '0.5rem' }}>{error}</div>
      )}
    </form>
  );
}