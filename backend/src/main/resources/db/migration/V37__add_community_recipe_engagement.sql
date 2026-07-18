CREATE TABLE community_recipe_likes (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (recipe_id, user_id)
);

CREATE TABLE community_recipe_copies (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  first_copied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_copied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  copy_count INTEGER NOT NULL DEFAULT 1 CHECK (copy_count > 0),
  PRIMARY KEY (recipe_id, user_id)
);

CREATE INDEX idx_community_recipe_likes_popular
  ON community_recipe_likes(recipe_id, created_at DESC);

CREATE INDEX idx_community_recipe_copies_popular
  ON community_recipe_copies(recipe_id, first_copied_at DESC);
