import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import StarRating from './StarRating';
import Icon from '@/components/ui/icon';
import {
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview,
  type Review,
} from '@/lib/api';

const AVATAR_COLORS = [
  '#4ADE80', '#34D399', '#60A5FA', '#A78BFA',
  '#F472B6', '#FB923C', '#FACC15', '#2DD4BF',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type TabFilter = 'pending' | 'approved' | 'rejected' | 'all';

export default function ModeratorPanel() {
  const [key, setKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabFilter>('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadReviews = useCallback(async (k: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllReviews(k);
      setReviews(data);
    } catch {
      setError('Неверный ключ доступа');
      setKey('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (key) loadReviews(key);
  }, [key, loadReviews]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) setKey(inputKey.trim());
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    await approveReview(id, key);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r));
    setActionLoading(null);
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    await rejectReview(id, key);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected' } : r));
    setActionLoading(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот отзыв безвозвратно?')) return;
    setActionLoading(id);
    await deleteReview(id, key);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setActionLoading(null);
  };

  const filtered = reviews.filter((r) => tab === 'all' ? true : r.status === tab);
  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  const TAB_CONFIG: { value: TabFilter; label: string; color: string }[] = [
    { value: 'pending', label: `На проверке${pendingCount > 0 ? ` (${pendingCount})` : ''}`, color: 'amber' },
    { value: 'approved', label: 'Одобренные', color: 'green' },
    { value: 'rejected', label: 'Отклонённые', color: 'red' },
    { value: 'all', label: 'Все', color: 'gray' },
  ];

  if (!key) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="Lock" size={22} className="text-primary" />
            </div>
            <h2 className="font-semibold text-gray-900 text-lg">Панель модератора</h2>
            <p className="text-sm text-gray-500 mt-1">Введите ключ доступа</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Ключ доступа"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              className="w-full bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
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
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="Shield" size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Панель модератора</h1>
              <p className="text-xs text-gray-400">Space Work — управление отзывами</p>
            </div>
          </div>
          <button
            onClick={() => { setKey(''); setReviews([]); }}
            className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors"
          >
            <Icon name="LogOut" size={15} />
            Выйти
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {TAB_CONFIG.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium
                ${tab === t.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 text-gray-500 hover:border-primary/40 hover:text-primary'
                }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => loadReviews(key)}
            className="ml-auto text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-primary/40 hover:text-primary transition-all flex items-center gap-1.5"
          >
            <Icon name="RefreshCw" size={12} />
            Обновить
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <Icon name="Loader2" size={24} className="mx-auto mb-2 animate-spin" />
            <p className="text-sm">Загрузка...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Нет отзывов в этом разделе</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((review) => {
              const initial = review.author_name.charAt(0).toUpperCase();
              const avatarColor = getAvatarColor(review.author_name);
              const dateStr = format(new Date(review.created_at), 'd MMMM yyyy', { locale: ru });
              const isLoading = actionLoading === review.id;

              const statusBadge = {
                pending: 'bg-amber-50 text-amber-600 border-amber-200',
                approved: 'bg-green-50 text-green-600 border-green-200',
                rejected: 'bg-red-50 text-red-600 border-red-200',
              }[review.status || 'pending'];

              const statusLabel = {
                pending: 'На проверке',
                approved: 'Одобрен',
                rejected: 'Отклонён',
              }[review.status || 'pending'];

              return (
                <div key={review.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initial}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{review.author_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating value={review.rating} readonly size={16} />
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge}`}>
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
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-60"
                        >
                          <Icon name="Check" size={13} />
                          Одобрить
                        </button>
                        <button
                          onClick={() => handleReject(review.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-60"
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
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-60"
                      >
                        <Icon name="Check" size={13} />
                        Одобрить
                      </button>
                    )}
                    {review.status === 'approved' && (
                      <button
                        onClick={() => handleReject(review.id)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-60"
                      >
                        <Icon name="X" size={13} />
                        Скрыть
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-all disabled:opacity-60"
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
