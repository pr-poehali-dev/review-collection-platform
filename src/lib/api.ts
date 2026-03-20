const BASE_URL = 'https://functions.poehali.dev/e4cc9bd3-5dc1-4008-8a93-99fa8af01a9c';

export interface Review {
  id: number;
  author_name: string;
  text: string;
  rating: number;
  likes: number;
  created_at: string;
  status?: string;
}

export type SortOption = 'newest' | 'oldest' | 'best' | 'worst' | 'popular';

export async function getReviews(sort: SortOption = 'newest'): Promise<Review[]> {
  const res = await fetch(`${BASE_URL}/?sort=${sort}`);
  const data = await res.json();
  return data.reviews || [];
}

export async function submitReview(payload: {
  author_name: string;
  text: string;
  rating: number;
}): Promise<{ id: number; status: string }> {
  const res = await fetch(`${BASE_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Ошибка при отправке');
  }
  return res.json();
}

export async function getPendingReviews(key: string): Promise<Review[]> {
  const res = await fetch(`${BASE_URL}/pending`, {
    headers: { 'X-Moderator-Key': key },
  });
  if (!res.ok) throw new Error('Forbidden');
  const data = await res.json();
  return data.reviews || [];
}

export async function getAllReviews(key: string): Promise<Review[]> {
  const res = await fetch(`${BASE_URL}/all`, {
    headers: { 'X-Moderator-Key': key },
  });
  if (!res.ok) throw new Error('Forbidden');
  const data = await res.json();
  return data.reviews || [];
}

export async function approveReview(id: number, key: string): Promise<void> {
  await fetch(`${BASE_URL}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Moderator-Key': key },
    body: JSON.stringify({ id }),
  });
}

export async function rejectReview(id: number, key: string): Promise<void> {
  await fetch(`${BASE_URL}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Moderator-Key': key },
    body: JSON.stringify({ id }),
  });
}

export async function deleteReview(id: number, key: string): Promise<void> {
  await fetch(`${BASE_URL}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Moderator-Key': key },
    body: JSON.stringify({ id }),
  });
}

export async function likeReview(id: number): Promise<number> {
  const res = await fetch(`${BASE_URL}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  return data.likes;
}
