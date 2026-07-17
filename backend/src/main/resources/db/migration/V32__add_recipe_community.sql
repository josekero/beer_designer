CREATE TABLE recipe_sharing (
  recipe_id TEXT PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_template BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (NOT is_template OR is_public)
);

CREATE INDEX idx_recipe_sharing_public
  ON recipe_sharing(published_at DESC)
  WHERE is_public = true;
