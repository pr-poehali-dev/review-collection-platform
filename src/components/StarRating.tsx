import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: number;
}

export default function StarRating({ value, onChange, readonly = false, size = 20 }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const active = hovered || value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`star-btn leading-none ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          style={{ fontSize: size, lineHeight: 1 }}
        >
          <span
            style={{
              color: star <= active ? '#F59E0B' : '#D1D5DB',
              transition: 'color 0.15s ease',
              display: 'inline-block',
            }}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}
