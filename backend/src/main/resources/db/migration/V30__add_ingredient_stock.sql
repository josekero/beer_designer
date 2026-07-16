CREATE TABLE ingredient_stock (
  ingredient_type TEXT NOT NULL CHECK (ingredient_type IN ('hops', 'malts', 'yeasts', 'adjuncts', 'salts', 'aging')),
  ingredient_id TEXT NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ingredient_type, ingredient_id)
);

CREATE INDEX idx_ingredient_stock_available
  ON ingredient_stock (ingredient_type, in_stock);
