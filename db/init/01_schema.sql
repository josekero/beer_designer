CREATE TABLE IF NOT EXISTS bjcp_styles (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  og_min NUMERIC(5, 3) NOT NULL,
  og_max NUMERIC(5, 3) NOT NULL,
  fg_min NUMERIC(5, 3) NOT NULL,
  fg_max NUMERIC(5, 3) NOT NULL,
  ibu_min NUMERIC(6, 1) NOT NULL,
  ibu_max NUMERIC(6, 1) NOT NULL,
  srm_min NUMERIC(6, 1) NOT NULL,
  srm_max NUMERIC(6, 1) NOT NULL,
  abv_min NUMERIC(5, 2) NOT NULL,
  abv_max NUMERIC(5, 2) NOT NULL,
  sensory_description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  alpha_acids NUMERIC(5, 2) NOT NULL,
  beta_acids NUMERIC(5, 2),
  format TEXT NOT NULL CHECK (format IN ('pellet', 'flor', 'cryo')),
  recommended_use TEXT[] NOT NULL DEFAULT '{}',
  aromas TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS malts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  potential NUMERIC(5, 3) NOT NULL,
  color_srm NUMERIC(7, 2) NOT NULL,
  diastatic_power NUMERIC(7, 2),
  max_recommended_percent NUMERIC(5, 2) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS yeasts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  laboratory TEXT,
  type TEXT NOT NULL CHECK (type IN ('ale', 'lager', 'kveik', 'sour')),
  attenuation_min NUMERIC(5, 2) NOT NULL,
  attenuation_max NUMERIC(5, 2) NOT NULL,
  temperature_min NUMERIC(5, 2) NOT NULL,
  temperature_max NUMERIC(5, 2) NOT NULL,
  flocculation TEXT NOT NULL CHECK (flocculation IN ('baja', 'media', 'alta')),
  alcohol_tolerance NUMERIC(5, 2) NOT NULL,
  sensory_profile TEXT NOT NULL,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS water_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  calcium NUMERIC(7, 2) NOT NULL,
  magnesium NUMERIC(7, 2) NOT NULL,
  sodium NUMERIC(7, 2) NOT NULL,
  sulfate NUMERIC(7, 2) NOT NULL,
  chloride NUMERIC(7, 2) NOT NULL,
  bicarbonate NUMERIC(7, 2) NOT NULL,
  target_ph NUMERIC(4, 2) NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  style_id TEXT NOT NULL REFERENCES bjcp_styles(id),
  batch_volume_l NUMERIC(7, 2) NOT NULL,
  efficiency_percent NUMERIC(5, 2) NOT NULL,
  boil_volume_l NUMERIC(7, 2) NOT NULL,
  yeast_id TEXT NOT NULL REFERENCES yeasts(id),
  water_profile_id TEXT NOT NULL REFERENCES water_profiles(id),
  primary_days INTEGER NOT NULL DEFAULT 0,
  primary_temp_c NUMERIC(5, 2) NOT NULL DEFAULT 0,
  secondary_days INTEGER NOT NULL DEFAULT 0,
  secondary_temp_c NUMERIC(5, 2) NOT NULL DEFAULT 0,
  dry_hop_enabled BOOLEAN NOT NULL DEFAULT false,
  dry_hop_days INTEGER NOT NULL DEFAULT 0,
  dry_hop_temp_c NUMERIC(5, 2) NOT NULL DEFAULT 0,
  maturation_days INTEGER NOT NULL DEFAULT 0,
  carbonation_volumes NUMERIC(4, 2) NOT NULL DEFAULT 0,
  packaging_method TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_malts (
  id BIGSERIAL PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  malt_id TEXT NOT NULL REFERENCES malts(id),
  amount_kg NUMERIC(8, 3) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipe_hops (
  id BIGSERIAL PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  hop_id TEXT NOT NULL REFERENCES hops(id),
  amount_g NUMERIC(8, 2) NOT NULL,
  alpha_acids NUMERIC(5, 2) NOT NULL,
  time_min INTEGER NOT NULL DEFAULT 0,
  use TEXT NOT NULL CHECK (use IN ('hervido', 'whirlpool', 'dry hop')),
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipe_water_additions (
  id BIGSERIAL PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount_g NUMERIC(8, 2) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipe_mash_steps (
  id BIGSERIAL PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  temperature_c NUMERIC(5, 2) NOT NULL,
  time_min INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipe_boil_steps (
  id BIGSERIAL PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  time_min INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bjcp_styles_category ON bjcp_styles(category);
CREATE INDEX IF NOT EXISTS idx_recipes_style_id ON recipes(style_id);
CREATE INDEX IF NOT EXISTS idx_recipe_malts_recipe_id ON recipe_malts(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_hops_recipe_id ON recipe_hops(recipe_id);
