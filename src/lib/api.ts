const REVIEWS_URL = 'https://functions.poehali.dev/e4cc9bd3-5dc1-4008-8a93-99fa8af01a9c';
const MODERATION_URL = 'https://functions.poehali.dev/e4ecb7e3-7320-4176-a0dd-884fb1377560';

export interface Review {
  id: number;
  author_name: string;
  rating: number;
  text: string;
  helpful_count: number;
  created_at: string;
  status?: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
  stats: {
    avg_rating: number;
    total: number;
    distribution: Record<string, number>;
  };
}

export interface ModerationResponse {
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
  counts: Record<string, number>;
}

export type SortOption = 'newest' | 'oldest' | 'best' | 'worst' | 'helpful';

export async function getReviews(sort: SortOption = 'newest', page = 1): Promise<ReviewsResponse> {
  const res = await fetch(`${REVIEWS_URL}?sort=${sort}&page=${page}&limit=20`);
  return res.json();
}

export async function submitReview(data: { author_name: string; text: string; rating: number }) {
  const res = await fetch(REVIEWS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка отправки');
  return json;
}

export async function getModerationReviews(
  key: string,
  status = 'all',
  page = 1
): Promise<ModerationResponse> {
  const res = await fetch(`${MODERATION_URL}?status=${status}&page=${page}&limit=20`, {
    headers: { 'X-Moderator-Key': key },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка доступа');
  return json;
}

export async function moderateReview(key: string, id: number, status: 'approved' | 'rejected') {
  const res = await fetch(`${MODERATION_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Moderator-Key': key },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка');
  return json;
}

export async function deleteReview(key: string, id: number) {
  const res = await fetch(`${MODERATION_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'X-Moderator-Key': key },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка удаления');
  return json;
}
