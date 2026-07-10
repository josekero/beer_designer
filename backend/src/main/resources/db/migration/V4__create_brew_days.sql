CREATE TABLE IF NOT EXISTS brew_days (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  title TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  brew_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'planificada',
  brewer TEXT NOT NULL DEFAULT '',
  target_volume_l NUMERIC(7, 2),
  actual_volume_l NUMERIC(7, 2),
  target_og NUMERIC(5, 3),
  actual_og NUMERIC(5, 3),
  target_fg NUMERIC(5, 3),
  actual_fg NUMERIC(5, 3),
  actual_abv NUMERIC(5, 2),
  mash_ph NUMERIC(4, 2),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brew_day_malts (
  id BIGSERIAL PRIMARY KEY,
  brew_day_id TEXT NOT NULL REFERENCES brew_days(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  planned_amount_kg NUMERIC(8, 3),
  actual_amount_kg NUMERIC(8, 3),
  substitute_name TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS brew_day_hops (
  id BIGSERIAL PRIMARY KEY,
  brew_day_id TEXT NOT NULL REFERENCES brew_days(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  planned_amount_g NUMERIC(8, 2),
  actual_amount_g NUMERIC(8, 2),
  planned_time_min INTEGER,
  actual_time_min INTEGER,
  use TEXT NOT NULL DEFAULT '',
  substitute_name TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS brew_day_events (
  id BIGSERIAL PRIMARY KEY,
  brew_day_id TEXT NOT NULL REFERENCES brew_days(id) ON DELETE CASCADE,
  event_time TIME,
  type TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  value TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_brew_days_brew_date ON brew_days(brew_date);
CREATE INDEX IF NOT EXISTS idx_brew_days_recipe_id ON brew_days(recipe_id);
CREATE INDEX IF NOT EXISTS idx_brew_day_malts_brew_day_id ON brew_day_malts(brew_day_id);
CREATE INDEX IF NOT EXISTS idx_brew_day_hops_brew_day_id ON brew_day_hops(brew_day_id);
CREATE INDEX IF NOT EXISTS idx_brew_day_events_brew_day_id ON brew_day_events(brew_day_id);
