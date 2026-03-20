interface Stats {
  avg_rating: number;
  total: number;
  distribution: Record<string, number>;
}

interface RatingSummaryProps {
  stats: Stats;
}

export default function RatingSummary({ stats }: RatingSummaryProps) {
  if (!stats || stats.total === 0) return null;

  const { avg_rating, total, distribution } = stats;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-8 items-center flex-wrap">
      <div className="text-center min-w-[80px]">
        <p className="text-5xl font-bold text-gray-900">{avg_rating.toFixed(1)}</p>
        <div className="flex justify-center mt-1.5 gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              style={{ color: s <= Math.round(avg_rating) ? '#F59E0B' : '#D1D5DB', fontSize: 16 }}
            >
              ★
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {total} {total === 1 ? 'отзыв' : total >= 2 && total <= 4 ? 'отзыва' : 'отзывов'}
        </p>
      </div>

      <div className="flex-1 space-y-2 min-w-[160px]">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[String(star)] || 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-3 text-right">{star}</span>
              <span style={{ color: '#F59E0B', fontSize: 12, lineHeight: 1 }}>★</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-6">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
