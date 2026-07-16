CREATE TABLE IF NOT EXISTS breweries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  untappd_url TEXT NOT NULL DEFAULT '',
  logo_stored_name TEXT,
  logo_original_name TEXT,
  logo_content_type TEXT,
  logo_size_bytes BIGINT,
  logo_width INTEGER,
  logo_height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE brew_days
  ADD COLUMN IF NOT EXISTS brewery_id TEXT REFERENCES breweries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_brew_days_brewery_id ON brew_days(brewery_id);
