CREATE TABLE IF NOT EXISTS t_p42046443_review_collection_pl.reviews (
  id SERIAL PRIMARY KEY,
  author_name VARCHAR(100) NOT NULL,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);