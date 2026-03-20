import { useState } from 'react';
import StarRating from './StarRating';
import { submitReview } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface ReviewFormProps {
  onSubmitted?: () => void;
}

export default function ReviewForm({ onSubmitted }: ReviewFormProps) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Введите ваше имя');
    if (!rating) return setError('Выберите рейтинг');
    if (!text.trim()) return setError('Напишите отзыв');

    setLoading(true);
    try {
      await submitReview({ author_name: name.trim(), text: text.trim(), rating });
      setSuccess(true);
      setName('');
      setText('');
      setRating(0);
      onSubmitted?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Icon name="CheckCircle" size={24} className="text-green-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">Отзыв отправлен!</h3>
        <p className="text-sm text-gray-500 mb-4">Он появится после проверки модератором.</p>
        <button
          onClick={() => setSuccess(false)}
          className="text-sm text-primary hover:underline font-medium"
        >
          Оставить ещё один
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="font-semibold text-gray-900 text-lg mb-4">Оставить отзыв</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ваше имя</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Иван Иванов"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Рейтинг</label>
          <StarRating value={rating} onChange={setRating} size={28} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ваш отзыв</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Поделитесь своим впечатлением..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1.5">
            <Icon name="AlertCircle" size={14} />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 text-sm"
        >
          {loading ? 'Отправляем...' : 'Отправить отзыв'}
        </button>
      </form>
    </div>
  );
}
