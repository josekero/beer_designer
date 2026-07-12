ALTER TABLE brew_day_malts ADD COLUMN lot_number TEXT NOT NULL DEFAULT '';
ALTER TABLE brew_day_hops ADD COLUMN lot_number TEXT NOT NULL DEFAULT '';
ALTER TABLE brew_day_additions ADD COLUMN lot_number TEXT NOT NULL DEFAULT '';

CREATE TABLE brew_day_yeasts (
  id BIGSERIAL PRIMARY KEY,
  brew_day_id TEXT NOT NULL REFERENCES brew_days(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  planned_amount NUMERIC(9,2),
  actual_amount NUMERIC(9,2),
  unit TEXT NOT NULL DEFAULT 'g',
  lot_number TEXT NOT NULL DEFAULT '',
  pitch_temp_c NUMERIC(5,2),
  notes TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_brew_day_yeasts_brew_day_id ON brew_day_yeasts(brew_day_id);
