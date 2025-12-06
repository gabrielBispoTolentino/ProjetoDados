import React, { useState } from 'react';
import { api } from '../../server/api';
import './css/AvaliaçõesBar.css';
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
        className='avaliacoes-textarea'
        aria-label="Comentário da avaliação"
      />

      <select
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        aria-label="Nota (estrelas)"
        className='avaliacoes-select'
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
        className='avaliacoes-submit'
      >
        {loading ? 'Enviando...' : 'Avaliar'}
      </button>

      {error && (
        <div className='avaliacoes-error'></div>
      )}
    </form>
  );
}