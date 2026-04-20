import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { api } from '../../server/api';
import RatingStars from './RatingStars';
import { useFeedback } from './FeedbackProvider';
import type { ReviewPayload } from '../types/domain';
import './css/AvaliaçõesBar.css';

type AvaliacoesBarProps = {
  estabelecimentoId: number | string;
  onSubmitted?: (payload: ReviewPayload, result?: { ratingAvg?: number; ratingCount?: number }) => void;
};

function formatRatingLabel(value: number) {
  return `${value.toFixed(1).replace('.', ',')} estrelas`;
}

export default function AvaliacoesBar({
  estabelecimentoId,
  onSubmitted,
}: AvaliacoesBarProps) {
  const feedback = useFeedback();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayedRating = hoverRating ?? rating;

  function getStarState(starIndex: number) {
    const difference = displayedRating - starIndex;

    if (difference >= 1) {
      return 'full';
    }

    if (difference >= 0.5) {
      return 'half';
    }

    return 'empty';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const usuarioId = Number(localStorage.getItem('usuarioId') || 0);
      if (!usuarioId) {
        throw new Error('Voce precisa estar logado para avaliar.');
      }

      const payload: ReviewPayload = {
        usuario_id: usuarioId,
        estabelecimento_id: Number(estabelecimentoId),
        rating,
        comentario: comentario || '',
      };

      const result = await api.createReview(payload);

      setComentario('');
      setRating(5);
      setHoverRating(null);
      onSubmitted?.(payload, {
        ratingAvg: result.ratingAvg,
        ratingCount: result.ratingCount,
      });
      feedback.success('Avaliacao enviada com sucesso!');
    } catch (caughtError) {
      console.error('Erro ao enviar avaliacao:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Erro ao enviar avaliacao');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="avaliacoes-bar" onSubmit={handleSubmit}>
      <textarea
        value={comentario}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setComentario(event.target.value)}
        placeholder="Escreva sua avaliacao..."
        rows={2}
        className="avaliacoes-textarea"
        aria-label="Comentario da avaliacao"
      />

      <div className="avaliacoes-rating-picker">
        <span className="avaliacoes-rating-label">Sua nota</span>
        <div
          className="avaliacoes-stars"
          onMouseLeave={() => setHoverRating(null)}
          aria-label={`Nota selecionada: ${formatRatingLabel(displayedRating)}`}
        >
          {Array.from({ length: 5 }).map((_, index) => {
            const starValue = index + 1;
            const starState = getStarState(index);

            return (
              <div key={starValue} className={`avaliacoes-star avaliacoes-star-${starState}`}>
                <span className="avaliacoes-star-icon" aria-hidden="true">{'\u2605'}</span>
                <button
                  type="button"
                  className="avaliacoes-star-hitbox avaliacoes-star-hitbox-left"
                  onMouseEnter={() => setHoverRating(index + 0.5)}
                  onFocus={() => setHoverRating(index + 0.5)}
                  onClick={() => setRating(index + 0.5)}
                  aria-label={`Selecionar ${formatRatingLabel(index + 0.5)}`}
                />
                <button
                  type="button"
                  className="avaliacoes-star-hitbox avaliacoes-star-hitbox-right"
                  onMouseEnter={() => setHoverRating(index + 1)}
                  onFocus={() => setHoverRating(index + 1)}
                  onClick={() => setRating(index + 1)}
                  aria-label={`Selecionar ${formatRatingLabel(index + 1)}`}
                />
              </div>
            );
          })}
        </div>
        <RatingStars rating={displayedRating} className="avaliacoes-rating-preview" size="sm" />
        <span className="avaliacoes-rating-value">{formatRatingLabel(displayedRating)}</span>
      </div>

      <button type="submit" disabled={loading} className="avaliacoes-submit">
        {loading ? 'Enviando...' : 'Avaliar'}
      </button>

      {error && <div className="avaliacoes-error">{error}</div>}
    </form>
  );
}
