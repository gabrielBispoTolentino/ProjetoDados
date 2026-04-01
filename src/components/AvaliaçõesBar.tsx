import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { api } from '../../server/api';
import type { ReviewPayload } from '../types/domain';
import './css/AvaliaçõesBar.css';

type AvaliacoesBarProps = {
  estabelecimentoId: number | string;
  onSubmitted?: (payload: ReviewPayload) => void;
};

export default function AvaliaçõesBar({
  estabelecimentoId,
  onSubmitted,
}: AvaliacoesBarProps) {
  const [rating, setRating] = useState('5');
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const usuarioId = Number(localStorage.getItem('usuarioId') || 1);
      const payload: ReviewPayload = {
        usuario_id: usuarioId,
        estabelecimento_id: Number(estabelecimentoId),
        rating: Number(rating),
        comentario: comentario || '',
      };

      await api.createReview(payload);

      setComentario('');
      setRating('5');
      onSubmitted?.(payload);
      alert('Avaliacao enviada com sucesso!');
    } catch (caughtError) {
      console.error('Erro ao enviar avaliacao:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Erro ao enviar avaliacao');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="avaliacoes-bar" onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <textarea
        value={comentario}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setComentario(event.target.value)}
        placeholder="Escreva sua avaliacao..."
        rows={2}
        className="avaliacoes-textarea"
        aria-label="Comentario da avaliacao"
      />

      <select
        value={rating}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => setRating(event.target.value)}
        aria-label="Nota (estrelas)"
        className="avaliacoes-select"
      >
        <option value="1">1 Estrela</option>
        <option value="2">2 Estrelas</option>
        <option value="3">3 Estrelas</option>
        <option value="4">4 Estrelas</option>
        <option value="5">5 Estrelas</option>
      </select>

      <button type="submit" disabled={loading} className="avaliacoes-submit">
        {loading ? 'Enviando...' : 'Avaliar'}
      </button>

      {error && <div className="avaliacoes-error">{error}</div>}
    </form>
  );
}
