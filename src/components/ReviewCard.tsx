import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import StarRating from './StarRating';
import { likeReview, type Review } from '@/lib/api';
import Icon from '@/components/ui/icon';

const AVATAR_COLORS = [
  '#4ADE80', '#34D399', '#60A5FA', '#A78BFA',
  '#F472B6', '#FB923C', '#FACC15', '#2DD4BF',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface ReviewCardProps {
  review: Review;
  onLike?: (id: number, newCount: number) => void;
}

export default function ReviewCard({ review, onLike }: ReviewCardProps) {
  const [likeCount, setLikeCount] = useState(review.likes);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const initial = review.author_name.charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(review.author_name);

  const handleLike = async () => {
    if (liked || liking) return;
    setLiking(true);
    try {
      const newCount = await likeReview(review.id);
      setLikeCount(newCount);
      setLiked(true);
      onLike?.(review.id, newCount);
    } finally {
      setLiking(false);
    }
  };

  const dateStr = format(new Date(review.created_at), 'd MMMM yyyy', { locale: ru });

  return (
    <div className="review-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100 fade-in">
      <div className="flex items-start justify-between gap-3">
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
        <StarRating value={review.rating} readonly size={18} />
      </div>

      <p className="mt-3 text-gray-700 text-sm leading-relaxed">{review.text}</p>

      <div className="mt-4 flex items-center gap-1">
        <button
          onClick={handleLike}
          disabled={liked || liking}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all
            ${liked
              ? 'border-green-200 bg-green-50 text-green-600'
              : 'border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-500 hover:bg-green-50'
            }`}
        >
          <Icon name="ThumbsUp" size={13} />
          <span>{likeCount > 0 ? likeCount : ''} {liked ? 'Полезно!' : 'Полезно'}</span>
        </button>
      </div>
    </div>
  );
}
