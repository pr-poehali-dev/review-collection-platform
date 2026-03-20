import StarRating from './StarRating';
import { type Review } from '@/lib/api';

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

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const avatarColor = getAvatarColor(review.author_name);

  return (
    <div className="review-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100 fade-in">
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
    </div>
  );
}
