import type { Review } from '@/lib/api';

interface RatingSummaryProps {
  reviews: Review[];
}

export default function RatingSummary({ reviews }: RatingSummaryProps) {
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-6 items-center flex-wrap">
      <div className="text-center min-w-[80px]">
        <p className="text-5xl font-bold text-gray-900">{avg.toFixed(1)}</p>
        <div className="flex justify-center mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} style={{ color: s <= Math.round(avg) ? '#F59E0B' : '#D1D5DB', fontSize: 16 }}>★</span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">{reviews.length} отзывов</p>
      </div>

      <div className="flex-1 space-y-1.5 min-w-[160px]">
        {counts.map(({ star, count }) => {
          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
              <span style={{ color: '#F59E0B', fontSize: 12 }}>★</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
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
