CREATE TABLE app_users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  avatar_kind TEXT NOT NULL DEFAULT 'gallery' CHECK (avatar_kind IN ('gallery', 'upload')),
  avatar_value TEXT NOT NULL DEFAULT 'amber-pint',
  enabled BOOLEAN NOT NULL DEFAULT true,
  password_change_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_app_users_email_lower ON app_users (lower(email));

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  csrf_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, expires_at) WHERE revoked_at IS NULL;

INSERT INTO app_users (id, email, password_hash, display_name, role, password_change_required)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@beerdesigner.local',
        '{bootstrap}', 'Beer Designer Admin', 'ADMIN', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE recipes ADD COLUMN owner_id UUID REFERENCES app_users(id);
UPDATE recipes SET owner_id = '00000000-0000-0000-0000-000000000001' WHERE owner_id IS NULL;
ALTER TABLE recipes ALTER COLUMN owner_id SET NOT NULL;
CREATE INDEX idx_recipes_owner ON recipes(owner_id, name);

ALTER TABLE recipe_folders ADD COLUMN owner_id UUID REFERENCES app_users(id);
UPDATE recipe_folders SET owner_id = '00000000-0000-0000-0000-000000000001' WHERE owner_id IS NULL;
ALTER TABLE recipe_folders ALTER COLUMN owner_id SET NOT NULL;
CREATE INDEX idx_recipe_folders_owner ON recipe_folders(owner_id, sort_order);

ALTER TABLE brew_days ADD COLUMN owner_id UUID REFERENCES app_users(id);
UPDATE brew_days SET owner_id = '00000000-0000-0000-0000-000000000001' WHERE owner_id IS NULL;
ALTER TABLE brew_days ALTER COLUMN owner_id SET NOT NULL;
CREATE INDEX idx_brew_days_owner ON brew_days(owner_id, brew_date);

ALTER TABLE breweries ADD COLUMN owner_id UUID REFERENCES app_users(id);
UPDATE breweries SET owner_id = '00000000-0000-0000-0000-000000000001' WHERE owner_id IS NULL;
ALTER TABLE breweries ALTER COLUMN owner_id SET NOT NULL;
CREATE INDEX idx_breweries_owner ON breweries(owner_id, name);

ALTER TABLE ingredient_stock ADD COLUMN user_id UUID REFERENCES app_users(id);
UPDATE ingredient_stock SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
ALTER TABLE ingredient_stock ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE ingredient_stock DROP CONSTRAINT ingredient_stock_pkey;
ALTER TABLE ingredient_stock ADD PRIMARY KEY(user_id, ingredient_type, ingredient_id);
DROP INDEX IF EXISTS idx_ingredient_stock_available;
CREATE INDEX idx_ingredient_stock_available ON ingredient_stock(user_id, ingredient_type, in_stock);

ALTER TABLE hops ADD COLUMN owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE;
ALTER TABLE malts ADD COLUMN owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE;
ALTER TABLE yeasts ADD COLUMN owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE;
ALTER TABLE adjuncts ADD COLUMN owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE;
ALTER TABLE aging_ingredients ADD COLUMN owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE;
ALTER TABLE brewing_salts ADD COLUMN owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE;
ALTER TABLE equipment_profiles ADD COLUMN owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE;
ALTER TABLE mash_profiles ADD COLUMN owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE;
ALTER TABLE carbonation_profiles ADD COLUMN owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE;
ALTER TABLE fermentation_profiles ADD COLUMN owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE;
CREATE INDEX idx_hops_owner ON hops(owner_id);
CREATE INDEX idx_malts_owner ON malts(owner_id);
CREATE INDEX idx_yeasts_owner ON yeasts(owner_id);
CREATE INDEX idx_adjuncts_owner ON adjuncts(owner_id);
CREATE INDEX idx_aging_owner ON aging_ingredients(owner_id);
CREATE INDEX idx_salts_owner ON brewing_salts(owner_id);
CREATE INDEX idx_equipment_profiles_owner ON equipment_profiles(owner_id);
CREATE INDEX idx_mash_profiles_owner ON mash_profiles(owner_id);
CREATE INDEX idx_carbonation_profiles_owner ON carbonation_profiles(owner_id);
CREATE INDEX idx_fermentation_profiles_owner ON fermentation_profiles(owner_id);
