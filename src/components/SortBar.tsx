import type { SortOption } from '@/lib/api';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Новые' },
  { value: 'oldest', label: 'Старые' },
  { value: 'best', label: 'Сначала хорошие' },
  { value: 'worst', label: 'Сначала плохие' },
  { value: 'popular', label: 'Самые полезные' },
];

interface SortBarProps {
  value: SortOption;
  onChange: (val: SortOption) => void;
  total: number;
}

export default function SortBar({ value, onChange, total }: SortBarProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-900">{total}</span>{' '}
        {total === 1 ? 'отзыв' : total >= 2 && total <= 4 ? 'отзыва' : 'отзывов'}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium
              ${value === opt.value
                ? 'bg-primary text-white border-primary'
                : 'border-gray-200 text-gray-500 hover:border-primary/40 hover:text-primary'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
