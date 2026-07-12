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
  brand TEXT,
  country TEXT NOT NULL,
  alpha_acids NUMERIC(5, 2) NOT NULL,
  beta_acids NUMERIC(5, 2),
  format TEXT NOT NULL CHECK (format IN ('pellet', 'flor', 'cryo')),
  recommended_use TEXT[] NOT NULL DEFAULT '{}',
  aromas TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  image_url TEXT,
  distributor_name TEXT,
  distributor_url TEXT
);

CREATE TABLE IF NOT EXISTS malts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  type TEXT NOT NULL,
  potential NUMERIC(5, 3) NOT NULL,
  color_srm NUMERIC(7, 2) NOT NULL,
  diastatic_power NUMERIC(7, 2),
  max_recommended_percent NUMERIC(5, 2) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  distributor_name TEXT,
  distributor_url TEXT
);

CREATE TABLE IF NOT EXISTS yeasts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  laboratory TEXT,
  type TEXT NOT NULL CHECK (type IN ('ale', 'lager', 'kveik', 'sour')),
  attenuation_min NUMERIC(5, 2) NOT NULL,
  attenuation_max NUMERIC(5, 2) NOT NULL,
  temperature_min NUMERIC(5, 2) NOT NULL,
  temperature_max NUMERIC(5, 2) NOT NULL,
  flocculation TEXT NOT NULL CHECK (flocculation IN ('baja', 'media', 'alta')),
  alcohol_tolerance NUMERIC(5, 2) NOT NULL,
  sensory_profile TEXT NOT NULL,
  image_url TEXT,
  distributor_name TEXT,
  distributor_url TEXT
);

CREATE TABLE IF NOT EXISTS adjuncts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  format TEXT NOT NULL,
  recommended_use TEXT[] NOT NULL DEFAULT '{}',
  dosage_guidance TEXT,
  fermentability_percent NUMERIC(5, 2),
  allergens TEXT,
  description TEXT NOT NULL,
  image_url TEXT,
  distributor_name TEXT,
  distributor_url TEXT
);

CREATE TABLE IF NOT EXISTS aging_ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  type TEXT NOT NULL,
  wood_type TEXT NOT NULL,
  previous_use TEXT,
  origin TEXT,
  barrel_details TEXT,
  intensity TEXT,
  contact_time_days_min INTEGER,
  contact_time_days_max INTEGER,
  description TEXT NOT NULL,
  image_url TEXT,
  distributor_name TEXT,
  distributor_url TEXT
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

CREATE TABLE IF NOT EXISTS equipment_profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL, batch_volume_l NUMERIC(9,2) NOT NULL, boil_volume_l NUMERIC(9,2) NOT NULL, efficiency_percent NUMERIC(5,2) NOT NULL, boil_off_l_per_hour NUMERIC(7,2) NOT NULL DEFAULT 0, mash_tun_deadspace_l NUMERIC(7,2) NOT NULL DEFAULT 0, trub_chiller_loss_l NUMERIC(7,2) NOT NULL DEFAULT 0, fermentation_loss_l NUMERIC(7,2) NOT NULL DEFAULT 0, hop_utilization_percent NUMERIC(6,2) NOT NULL DEFAULT 100, notes TEXT NOT NULL DEFAULT '', mash_tun_volume_l NUMERIC(9,2), kettle_volume_l NUMERIC(9,2), fermenter_volume_l NUMERIC(9,2));
INSERT INTO equipment_profiles VALUES ('pilot-20l','Piloto 20 L',20,24,72,3,1,1,1,100,'Equipo piloto para desarrollo de recetas.',30,30,25), ('production-500l','Producción 500 L',500,570,80,45,12,20,25,120,'Perfil inicial de producción; ajusta las pérdidas con datos reales.',650,650,600) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS mash_profiles (id TEXT PRIMARY KEY,name TEXT NOT NULL,mash_temp_c NUMERIC(5,2) NOT NULL,mash_time_min INTEGER NOT NULL,mash_out_temp_c NUMERIC(5,2),mash_out_time_min INTEGER,notes TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS carbonation_profiles (id TEXT PRIMARY KEY,name TEXT NOT NULL,method TEXT NOT NULL,target_volumes NUMERIC(4,2) NOT NULL,temperature_c NUMERIC(5,2),pressure_bar NUMERIC(5,2),notes TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS fermentation_profiles (id TEXT PRIMARY KEY,name TEXT NOT NULL,primary_days INTEGER NOT NULL,primary_temp_c NUMERIC(5,2) NOT NULL,secondary_days INTEGER NOT NULL,secondary_temp_c NUMERIC(5,2),maturation_days INTEGER NOT NULL,maturation_temp_c NUMERIC(5,2),notes TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS recipe_folders (id TEXT PRIMARY KEY,name TEXT NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0,is_default BOOLEAN NOT NULL DEFAULT false);
INSERT INTO recipe_folders VALUES ('general','General',0,true) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brewer TEXT NOT NULL DEFAULT '',
  untappd_url TEXT,
  equipment_profile_id TEXT REFERENCES equipment_profiles(id),
  mash_profile_id TEXT REFERENCES mash_profiles(id),
  carbonation_profile_id TEXT REFERENCES carbonation_profiles(id),
  fermentation_profile_id TEXT REFERENCES fermentation_profiles(id),
  folder_id TEXT NOT NULL DEFAULT 'general' REFERENCES recipe_folders(id),
  folder_sort_order INTEGER NOT NULL DEFAULT 0,
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
  version INTEGER NOT NULL DEFAULT 1,
  image_stored_name TEXT,
  image_original_name TEXT,
  image_content_type TEXT,
  image_size_bytes BIGINT,
  image_width INTEGER,
  image_height INTEGER,
  image_uploaded_at TIMESTAMPTZ,
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
CREATE INDEX IF NOT EXISTS idx_adjuncts_category ON adjuncts(category);
CREATE INDEX IF NOT EXISTS idx_aging_ingredients_type ON aging_ingredients(type);
CREATE INDEX IF NOT EXISTS idx_aging_ingredients_previous_use ON aging_ingredients(previous_use);

-- Recipe process details (water targets, mash percentages and non-hop additions).
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS water_calcium NUMERIC(7,2), ADD COLUMN IF NOT EXISTS water_magnesium NUMERIC(7,2), ADD COLUMN IF NOT EXISTS water_sodium NUMERIC(7,2), ADD COLUMN IF NOT EXISTS water_sulfate NUMERIC(7,2), ADD COLUMN IF NOT EXISTS water_chloride NUMERIC(7,2), ADD COLUMN IF NOT EXISTS water_bicarbonate NUMERIC(7,2), ADD COLUMN IF NOT EXISTS mash_target_ph NUMERIC(4,2), ADD COLUMN IF NOT EXISTS sparge_target_ph NUMERIC(4,2), ADD COLUMN IF NOT EXISTS water_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE recipe_malts ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS recipe_process_additions (id BIGSERIAL PRIMARY KEY, recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE, name TEXT NOT NULL, brand TEXT NOT NULL DEFAULT '', amount_g NUMERIC(9,2) NOT NULL DEFAULT 0, stage TEXT NOT NULL, time_min INTEGER, temperature_c NUMERIC(5,2), day_label TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0);

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

ALTER TABLE brew_days ADD COLUMN IF NOT EXISTS sparge_ph NUMERIC(4,2), ADD COLUMN IF NOT EXISTS water_calcium NUMERIC(7,2), ADD COLUMN IF NOT EXISTS water_magnesium NUMERIC(7,2), ADD COLUMN IF NOT EXISTS water_sodium NUMERIC(7,2), ADD COLUMN IF NOT EXISTS water_sulfate NUMERIC(7,2), ADD COLUMN IF NOT EXISTS water_chloride NUMERIC(7,2), ADD COLUMN IF NOT EXISTS water_bicarbonate NUMERIC(7,2), ADD COLUMN IF NOT EXISTS water_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE brew_day_malts ADD COLUMN IF NOT EXISTS planned_percent NUMERIC(5,2);
CREATE TABLE IF NOT EXISTS brew_day_additions (id BIGSERIAL PRIMARY KEY, brew_day_id TEXT NOT NULL REFERENCES brew_days(id) ON DELETE CASCADE, ingredient_name TEXT NOT NULL, brand TEXT NOT NULL DEFAULT '', planned_amount_g NUMERIC(9,2), actual_amount_g NUMERIC(9,2), stage TEXT NOT NULL DEFAULT '', planned_time_min INTEGER, actual_time_min INTEGER, temperature_c NUMERIC(5,2), day_label TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS brew_day_tasks (id BIGSERIAL PRIMARY KEY, brew_day_id TEXT NOT NULL REFERENCES brew_days(id) ON DELETE CASCADE, task_date DATE NOT NULL, task_time TIME NOT NULL DEFAULT '09:00', type TEXT NOT NULL DEFAULT 'tarea', title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pendiente', notes TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_brew_day_tasks_date ON brew_day_tasks(task_date);
