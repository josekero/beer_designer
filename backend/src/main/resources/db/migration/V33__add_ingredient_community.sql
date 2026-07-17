CREATE TABLE ingredient_sharing (
  ingredient_type TEXT NOT NULL CHECK (ingredient_type IN ('hops','malts','yeasts','adjuncts','salts','aging')),
  ingredient_id TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ingredient_type, ingredient_id)
);

CREATE INDEX idx_ingredient_sharing_published
  ON ingredient_sharing (published_at DESC);
