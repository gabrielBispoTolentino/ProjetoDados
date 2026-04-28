import './css/RatingStars.css';

type RatingStarsProps = {
  rating: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

function clampRating(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(5, value));
}

export default function RatingStars({
  rating,
  className = '',
  size = 'md',
}: RatingStarsProps) {
  const clampedRating = clampRating(rating);
  const widthPercent = `${(clampedRating / 5) * 100}%`;
  const classes = ['rating-stars', `rating-stars-${size}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes} aria-label={`${clampedRating.toFixed(1)} de 5 estrelas`}>
      <span className="rating-stars-base" aria-hidden="true">{'\u2605'.repeat(5)}</span>
      <span className="rating-stars-fill" style={{ width: widthPercent }} aria-hidden="true">
        {'\u2605'.repeat(5)}
      </span>
    </span>
  );
}
