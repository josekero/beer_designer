ALTER TABLE recipes
  ADD COLUMN water_calcium NUMERIC(7,2), ADD COLUMN water_magnesium NUMERIC(7,2),
  ADD COLUMN water_sodium NUMERIC(7,2), ADD COLUMN water_sulfate NUMERIC(7,2),
  ADD COLUMN water_chloride NUMERIC(7,2), ADD COLUMN water_bicarbonate NUMERIC(7,2),
  ADD COLUMN mash_target_ph NUMERIC(4,2), ADD COLUMN sparge_target_ph NUMERIC(4,2),
  ADD COLUMN water_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE recipe_malts ADD COLUMN notes TEXT NOT NULL DEFAULT '';

CREATE TABLE recipe_process_additions (
  id BIGSERIAL PRIMARY KEY, recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL, brand TEXT NOT NULL DEFAULT '', amount_g NUMERIC(9,2) NOT NULL DEFAULT 0,
  stage TEXT NOT NULL, time_min INTEGER, temperature_c NUMERIC(5,2), day_label TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE brew_days
  ADD COLUMN water_calcium NUMERIC(7,2), ADD COLUMN water_magnesium NUMERIC(7,2),
  ADD COLUMN water_sodium NUMERIC(7,2), ADD COLUMN water_sulfate NUMERIC(7,2),
  ADD COLUMN water_chloride NUMERIC(7,2), ADD COLUMN water_bicarbonate NUMERIC(7,2),
  ADD COLUMN sparge_ph NUMERIC(4,2), ADD COLUMN water_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE brew_day_malts ADD COLUMN planned_percent NUMERIC(5,2);

CREATE TABLE brew_day_additions (
  id BIGSERIAL PRIMARY KEY, brew_day_id TEXT NOT NULL REFERENCES brew_days(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL, brand TEXT NOT NULL DEFAULT '', planned_amount_g NUMERIC(9,2),
  actual_amount_g NUMERIC(9,2), stage TEXT NOT NULL DEFAULT '', planned_time_min INTEGER,
  actual_time_min INTEGER, temperature_c NUMERIC(5,2), day_label TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0
);
