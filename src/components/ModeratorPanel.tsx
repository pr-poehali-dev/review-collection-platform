import { useState, useCallback } from 'react';
import StarRating from './StarRating';
import Icon from '@/components/ui/icon';
import { getModerationReviews, moderateReview, deleteReview, type Review } from '@/lib/api';

const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-orange-100 text-orange-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-yellow-100 text-yellow-700',
  'bg-teal-100 text-teal-700',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type TabFilter = 'pending' | 'approved' | 'rejected' | 'all';

export default function ModeratorPanel() {
  const [inputKey, setInputKey] = useState('');
  const [key, setKey] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabFilter>('pending');
  const [actionId, setActionId] = useState<number | null>(null);

  const loadReviews = useCallback(async (k: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getModerationReviews(k, 'all');
      setReviews(data.reviews);
      setCounts(data.counts);
    } catch {
      setError('Неверный ключ доступа');
      setKey('');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      setKey(inputKey.trim());
      loadReviews(inputKey.trim());
    }
  };

  const handleApprove = async (id: number) => {
    setActionId(id);
    await moderateReview(key, id, 'approved');
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r));
    setCounts((prev) => ({ ...prev, pending: (prev.pending || 1) - 1, approved: (prev.approved || 0) + 1 }));
    setActionId(null);
  };

  const handleReject = async (id: number) => {
    setActionId(id);
    await moderateReview(key, id, 'rejected');
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected' } : r));
    setCounts((prev) => ({ ...prev, pending: (prev.pending || 1) - 1, rejected: (prev.rejected || 0) + 1 }));
    setActionId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот отзыв безвозвратно?')) return;
    setActionId(id);
    await deleteReview(key, id);
    const deleted = reviews.find((r) => r.id === id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    if (deleted?.status) {
      setCounts((prev) => ({ ...prev, [deleted.status!]: (prev[deleted.status!] || 1) - 1 }));
    }
    setActionId(null);
  };

  const filtered = reviews.filter((r) => tab === 'all' || r.status === tab);
  const pendingCount = counts['pending'] || 0;

  const TABS: { value: TabFilter; label: string }[] = [
    { value: 'pending', label: `На проверке${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { value: 'approved', label: `Одобренные (${counts['approved'] || 0})` },
    { value: 'rejected', label: `Отклонённые (${counts['rejected'] || 0})` },
    { value: 'all', label: `Все (${reviews.length})` },
  ];

  if (!key) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="Shield" size={26} className="text-primary" />
            </div>
            <h2 className="font-bold text-gray-900 text-xl">Панель модератора</h2>
            <p className="text-sm text-gray-500 mt-1">Space Work — введите ключ доступа</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Секретный ключ"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <Icon name="AlertCircle" size={14} />
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Icon name="Shield" size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Панель модератора</h1>
              <p className="text-xs text-gray-400">Space Work — управление отзывами</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadReviews(key)}
              className="text-sm text-gray-400 hover:text-primary flex items-center gap-1.5 transition-colors"
            >
              <Icon name="RefreshCw" size={15} />
              Обновить
            </button>
            <button
              onClick={() => { setKey(''); setReviews([]); setCounts({}); }}
              className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1.5 transition-colors"
            >
              <Icon name="LogOut" size={15} />
              Выйти
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium
                ${tab === t.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-gray-200 text-gray-500 hover:border-primary/40 hover:text-primary'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <Icon name="Loader2" size={28} className="mx-auto mb-3 animate-spin" />
            <p className="text-sm">Загрузка...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-300">
            <Icon name="Inbox" size={40} className="mx-auto mb-3" />
            <p className="text-sm text-gray-400">Нет отзывов в этом разделе</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((review) => {
              const avatarColor = getAvatarColor(review.author_name);
              const isLoading = actionId === review.id;
              const statusStyle = {
                pending: 'bg-amber-50 text-amber-600 border border-amber-200',
                approved: 'bg-green-50 text-green-600 border border-green-200',
                rejected: 'bg-red-50 text-red-600 border border-red-200',
              }[review.status || 'pending'];
              const statusLabel = {
                pending: 'На проверке',
                approved: 'Одобрен',
                rejected: 'Отклонён',
              }[review.status || 'pending'];

              return (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 fade-in"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor}`}>
                        {review.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{review.author_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarRating value={review.rating} readonly size={14} />
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-gray-700 text-sm leading-relaxed">{review.text}</p>

                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    {review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(review.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50 font-medium"
                        >
                          <Icon name="Check" size={13} />
                          Одобрить
                        </button>
                        <button
                          onClick={() => handleReject(review.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 font-medium"
                        >
                          <Icon name="X" size={13} />
                          Отклонить
                        </button>
                      </>
                    )}
                    {review.status === 'rejected' && (
                      <button
                        onClick={() => handleApprove(review.id)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50 font-medium"
                      >
                        <Icon name="Check" size={13} />
                        Одобрить
                      </button>
                    )}
                    {review.status === 'approved' && (
                      <button
                        onClick={() => handleReject(review.id)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50 font-medium"
                      >
                        <Icon name="EyeOff" size={13} />
                        Скрыть
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50 ml-auto"
                    >
                      <Icon name="Trash2" size={13} />
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
