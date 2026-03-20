import { useState, useEffect, useCallback } from 'react';
import { getReviews, type Review, type SortOption, type ReviewsResponse } from '@/lib/api';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';
import SortBar from '@/components/SortBar';
import RatingSummary from '@/components/RatingSummary';
import Icon from '@/components/ui/icon';

const DEFAULT_STATS = { avg_rating: 0, total: 0, distribution: {} };

export default function Index() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [sort, setSort] = useState<SortOption>('newest');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async (s: SortOption) => {
    setLoading(true);
    try {
      const res = await getReviews(s);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(sort); }, [sort, load]);

  const handleSort = (s: SortOption) => { setSort(s); };
  const handleSubmitted = () => { setShowForm(false); load(sort); };

  const reviews: Review[] = data?.reviews || [];
  const stats = data?.stats || DEFAULT_STATS;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl">🚀</span>
            </div>
            <div className="leading-tight">
              <span className="font-bold text-[#3AAD46] text-lg tracking-wide">SPACE</span>
              <span className="font-bold text-[#1B6B2A] text-lg tracking-wide ml-1">WORK</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/moderator"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors px-3 py-1.5 rounded-full border border-gray-200 hover:border-primary/40"
            >
              <Icon name="Shield" size={13} />
              Модератор
            </a>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Icon name="PenLine" size={15} />
              Оставить отзыв
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Отзывы клиентов</h1>
          <p className="text-gray-500 text-sm">Реальные отзывы о Space Work — честно и без купюр</p>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md slide-down">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
              <ReviewForm onSubmitted={handleSubmitted} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-4">
            <RatingSummary stats={stats} />

            <SortBar value={sort} onChange={handleSort} total={data?.total || 0} />

            {loading ? (
              <div className="text-center py-16 text-gray-300">
                <Icon name="Loader2" size={32} className="mx-auto mb-3 animate-spin" />
                <p className="text-sm text-gray-400">Загружаем отзывы...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-4xl mb-3">💬</div>
                <p className="font-semibold text-gray-700 mb-1">Отзывов пока нет</p>
                <p className="text-sm text-gray-400 mb-4">Будьте первым, кто оставит отзыв!</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Написать отзыв
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-24 space-y-4">
            <ReviewForm onSubmitted={handleSubmitted} />

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">О сервисе</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Space Work помогает запустить ваш бизнес в цифровую эпоху. Все отзывы проходят
                модерацию перед публикацией.
              </p>
              <a
                href="/moderator"
                className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors"
              >
                <Icon name="Shield" size={12} />
                Панель модератора
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
