import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/e4cc9bd3-5dc1-4008-8a93-99fa8af01a9c";

type Review = {
  id: number;
  author_name: string;
  text: string;
  rating: number;
  likes: number;
  created_at: string;
  status?: string;
};

type SortOption = "newest" | "oldest" | "best" | "worst" | "popular";

const SORT_LABELS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Новые" },
  { value: "oldest", label: "Старые" },
  { value: "best", label: "Сначала хорошие" },
  { value: "worst", label: "Сначала плохие" },
  { value: "popular", label: "Самые полезные" },
];

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-orange-100 text-orange-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-yellow-100 text-yellow-700",
  "bg-teal-100 text-teal-700",
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 20,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readonly ? star <= value : star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            className={`star-btn ${readonly ? "cursor-default" : "cursor-pointer"}`}
            style={{ color: filled ? "hsl(43,96%,50%)" : "#d1d5db", background: "none", border: "none", padding: 0 }}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => !readonly && onChange?.(star)}
            aria-label={`${star} звезда`}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.5}>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ review, onLike, likedIds }: { review: Review; onLike: (id: number) => void; likedIds: Set<number> }) {
  const avatarColor = getAvatarColor(review.author_name);
  const liked = likedIds.has(review.id);

  return (
    <div className="review-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor}`}>
            {review.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm leading-tight">{review.author_name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{formatDate(review.created_at)}</div>
          </div>
        </div>
        <StarRating value={review.rating} readonly size={16} />
      </div>
      <p className="text-gray-700 text-sm leading-relaxed">{review.text}</p>
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
        <button
          onClick={() => !liked && onLike(review.id)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            liked ? "text-emerald-600" : "text-gray-400 hover:text-emerald-500"
          }`}
        >
          <Icon name="ThumbsUp" size={13} />
          <span>Полезно {review.likes > 0 ? `(${review.likes})` : ""}</span>
        </button>
      </div>
    </div>
  );
}

function ModeratorPanel({ modKey }: { modKey: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/all`, { headers: { "X-Moderator-Key": modKey } });
    const data = await res.json();
    setReviews(data.reviews || []);
    setLoading(false);
  }, [modKey]);

  useEffect(() => { load(); }, [load]);

  const filtered = reviews.filter((r) => filter === "all" || r.status === filter);

  const action = async (endpoint: string, id: number) => {
    await fetch(`${API_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Moderator-Key": modKey },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Icon name="Shield" size={16} className="text-emerald-600" />
        </div>
        <div>
          <div className="font-bold text-gray-900 font-display text-sm">Панель модератора</div>
          <div className="text-xs text-gray-400">Проверка и управление отзывами</div>
        </div>
      </div>

      <div className="px-6 pt-4 flex gap-2 flex-wrap">
        {(["pending", "all", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === f
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {f === "pending" && `На проверке (${counts.pending})`}
            {f === "all" && `Все (${counts.all})`}
            {f === "approved" && `Одобрены (${counts.approved})`}
            {f === "rejected" && `Отклонены (${counts.rejected})`}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-3">
        {loading && (
          <div className="text-center py-8 text-gray-400 text-sm">Загрузка...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            <Icon name="CheckCircle" size={32} className="mx-auto mb-2 text-gray-200" />
            Нет отзывов в этой категории
          </div>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="border border-gray-100 rounded-xl p-4 fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${getAvatarColor(r.author_name)}`}>
                  {r.author_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{r.author_name}</div>
                  <div className="text-xs text-gray-400">{formatDate(r.created_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StarRating value={r.rating} readonly size={13} />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  r.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  r.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                  "bg-red-100 text-red-600"
                }`}>
                  {r.status === "pending" ? "На проверке" : r.status === "approved" ? "Одобрен" : "Отклонён"}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">{r.text}</p>
            <div className="mt-3 flex gap-2">
              {r.status !== "approved" && (
                <button
                  onClick={() => action("approve", r.id)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors font-medium"
                >
                  <Icon name="Check" size={13} />
                  Одобрить
                </button>
              )}
              {r.status !== "rejected" && (
                <button
                  onClick={() => action("reject", r.id)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors font-medium"
                >
                  <Icon name="X" size={13} />
                  Отклонить
                </button>
              )}
              <button
                onClick={() => action("delete", r.id)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium ml-auto"
              >
                <Icon name="Trash2" size={13} />
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sort, setSort] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  const [form, setForm] = useState({ name: "", text: "", rating: 0 });
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const [modKeyInput, setModKeyInput] = useState("");
  const [modKey, setModKey] = useState("");
  const [modError, setModError] = useState(false);
  const [showModPanel, setShowModPanel] = useState(false);

  const loadReviews = useCallback(async (s: SortOption) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/?sort=${s}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      setReviews([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadReviews(sort); }, [sort, loadReviews]);

  const handleLike = async (id: number) => {
    setLikedIds((prev) => new Set([...prev, id]));
    await fetch(`${API_URL}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadReviews(sort);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim() || !form.rating) return;
    setFormState("loading");
    try {
      const res = await fetch(`${API_URL}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author_name: form.name, text: form.text, rating: form.rating }),
      });
      if (res.ok || res.status === 201) {
        setFormState("success");
        setForm({ name: "", text: "", rating: 0 });
      } else {
        setFormState("error");
      }
    } catch {
      setFormState("error");
    }
  };

  const handleModLogin = async () => {
    const res = await fetch(`${API_URL}/all`, {
      headers: { "X-Moderator-Key": modKeyInput },
    });
    if (res.ok) {
      setModKey(modKeyInput);
      setShowModPanel(true);
      setModError(false);
    } else {
      setModError(true);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="#f0fdf4"/>
                <ellipse cx="20" cy="27" rx="8" ry="3.5" fill="#86efac"/>
                <rect x="15" y="22" width="10" height="6" rx="2" fill="#4ade80"/>
                <rect x="14" y="23" width="3" height="4" rx="1" fill="#16a34a"/>
                <rect x="23" y="23" width="3" height="4" rx="1" fill="#16a34a"/>
                <path d="M20 8 C16 8 13 12 13 17 C13 21 16 23 20 23 C24 23 27 21 27 17 C27 12 24 8 20 8Z" fill="white" stroke="#16a34a" strokeWidth="1.2"/>
                <path d="M20 8 C18 8 16 12 16 17 C16 19 17.5 21.5 20 23 C22.5 21.5 24 19 24 17 C24 12 22 8 20 8Z" fill="#dcfce7"/>
                <circle cx="18.5" cy="16" r="1.5" fill="#15803d"/>
                <circle cx="21.5" cy="16" r="1.5" fill="#15803d"/>
                <path d="M17.5 19.5 Q20 21 22.5 19.5" stroke="#16a34a" strokeWidth="1" strokeLinecap="round" fill="none"/>
                <circle cx="20" cy="18" r="2.5" fill="none" stroke="#22c55e" strokeWidth="1.2"/>
                <circle cx="20" cy="18" r="1.2" fill="#4ade80"/>
              </svg>
            </div>
            <div>
              <div className="font-black text-gray-900 text-sm leading-tight" style={{fontFamily: "Montserrat, sans-serif"}}>
                SPACE <span className="text-emerald-600">WORK</span>
              </div>
              <div className="text-xs text-gray-400 leading-tight">отзывы клиентов</div>
            </div>
          </div>
          {avgRating && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="hsl(43,96%,50%)" stroke="none">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              <span className="font-bold text-yellow-800 text-sm">{avgRating}</span>
              <span className="text-yellow-600 text-xs">({reviews.length} отзывов)</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: form + moderator */}
        <aside className="lg:col-span-1 space-y-4">
          {/* Форма */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <div className="font-bold text-gray-900 text-sm" style={{fontFamily: "Montserrat, sans-serif"}}>Оставить отзыв</div>
              <div className="text-xs text-gray-400 mt-0.5">Ваше мнение важно для нас</div>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Ваше имя</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Александр"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-colors bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Рейтинг</label>
                <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} size={22} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Отзыв</label>
                <textarea
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  placeholder="Расскажите о вашем опыте..."
                  rows={4}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-colors resize-none bg-gray-50"
                  required
                />
              </div>

              {formState === "success" && (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2.5 text-sm slide-down">
                  <Icon name="CheckCircle" size={15} />
                  Отзыв отправлен на модерацию!
                </div>
              )}
              {formState === "error" && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2.5 text-sm slide-down">
                  <Icon name="AlertCircle" size={15} />
                  Ошибка. Попробуйте снова.
                </div>
              )}

              <button
                type="submit"
                disabled={formState === "loading" || !form.rating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {formState === "loading" ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Отправляю...
                  </>
                ) : (
                  <>
                    <Icon name="Send" size={15} />
                    Отправить отзыв
                  </>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center">Отзыв появится после проверки модератором</p>
            </form>
          </div>

          {/* Вход модератора */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Icon name="Lock" size={14} className="text-gray-400" />
              <div className="font-bold text-gray-800 text-sm" style={{fontFamily: "Montserrat, sans-serif"}}>
                {showModPanel ? "Модератор" : "Панель модератора"}
              </div>
              {showModPanel && <span className="ml-auto pulse-dot w-2 h-2 bg-emerald-400 rounded-full inline-block" />}
            </div>
            {!showModPanel ? (
              <div className="p-5 space-y-3">
                <input
                  type="password"
                  value={modKeyInput}
                  onChange={(e) => { setModKeyInput(e.target.value); setModError(false); }}
                  placeholder="Ключ доступа"
                  className={`w-full text-sm border rounded-xl px-3 py-2.5 outline-none transition-colors bg-gray-50 ${
                    modError ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                  }`}
                  onKeyDown={(e) => e.key === "Enter" && handleModLogin()}
                />
                {modError && (
                  <div className="text-xs text-red-500 flex items-center gap-1">
                    <Icon name="AlertCircle" size={12} />
                    Неверный ключ доступа
                  </div>
                )}
                <button
                  onClick={handleModLogin}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Войти
                </button>
              </div>
            ) : (
              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-medium">Доступ открыт</span>
                <button
                  onClick={() => { setShowModPanel(false); setModKey(""); setModKeyInput(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right column: reviews */}
        <section className="lg:col-span-2 space-y-4">
          {/* Sort bar */}
          <div className="flex gap-2 flex-wrap">
            {SORT_LABELS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={`text-xs px-3.5 py-2 rounded-xl font-medium transition-all ${
                  sort === s.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Reviews list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100" />
                    <div className="space-y-1 flex-1">
                      <div className="h-3 bg-gray-100 rounded w-28" />
                      <div className="h-2.5 bg-gray-100 rounded w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 bg-gray-100 rounded w-full" />
                    <div className="h-2.5 bg-gray-100 rounded w-4/5" />
                    <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center fade-in">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Icon name="MessageSquare" size={24} className="text-gray-300" />
              </div>
              <div className="font-bold text-gray-700 mb-1" style={{fontFamily: "Montserrat, sans-serif"}}>Отзывов пока нет</div>
              <div className="text-sm text-gray-400">Будьте первым, кто оставит отзыв!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <div key={r.id} className="fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <ReviewCard review={r} onLike={handleLike} likedIds={likedIds} />
                </div>
              ))}
            </div>
          )}

          {/* Moderator panel inside main area */}
          {showModPanel && <ModeratorPanel modKey={modKey} />}
        </section>
      </main>
    </div>
  );
}
