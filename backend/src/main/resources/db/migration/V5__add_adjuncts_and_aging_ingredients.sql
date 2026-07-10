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

CREATE INDEX IF NOT EXISTS idx_adjuncts_category ON adjuncts(category);
CREATE INDEX IF NOT EXISTS idx_aging_ingredients_type ON aging_ingredients(type);
CREATE INDEX IF NOT EXISTS idx_aging_ingredients_previous_use ON aging_ingredients(previous_use);

INSERT INTO adjuncts (
  id, name, brand, category, format, recommended_use, dosage_guidance,
  fermentability_percent, allergens, description
) VALUES
  ('mango-puree', 'Mango Alphonso', 'Craft Fruit Purees', 'fruta', 'puré', ARRAY['secundario', 'maduración']::text[], '0.5-1.5 kg por 20 L según intensidad', 65, NULL, 'Puré de mango para IPAs, sours y saisons frutales. Aporta fruta tropical, color y azúcares fermentables.'),
  ('cacao-nibs', 'Nibs de cacao tostado', 'Cacao Barry', 'especia', 'nibs', ARRAY['maduración', 'secundario']::text[], '50-150 g por 20 L durante 3-10 días', 0, 'cacao', 'Nibs para stouts, porters y cervezas oscuras. Aportan cacao seco, tostado y ligera astringencia.'),
  ('vanilla-beans-madagascar', 'Vainas de vainilla Madagascar', 'Bourbon Vanilla', 'especia', 'vaina', ARRAY['maduración', 'barrica']::text[], '1-3 vainas abiertas por 20 L durante 3-14 días', 0, NULL, 'Vainilla intensa y cremosa, útil en stouts, pastry ales y cervezas envejecidas.'),
  ('lactose', 'Lactosa', 'Brewferm', 'azúcar no fermentable', 'polvo', ARRAY['hervido']::text[], '200-600 g por 20 L', 0, 'lactosa', 'Azúcar no fermentable que aporta dulzor y cuerpo.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO aging_ingredients (
  id, name, brand, type, wood_type, previous_use, origin, barrel_details,
  intensity, contact_time_days_min, contact_time_days_max, description
) VALUES
  ('bourbon-barrel-elijah-henry', 'Barrica bourbon Elijah Craig / Henry McKenna', 'Heaven Hill', 'barrica', 'roble americano', 'bourbon', 'Kentucky, Estados Unidos', 'Barrica procedente de bourbon 12-year Elijah Craig y 11-year Henry McKenna barrels', 'alta', 30, 180, 'Perfil de vainilla, coco, caramelo, roble dulce y bourbon. Ideal para imperial stout, barleywine y strong ales.'),
  ('french-oak-red-wine', 'Roble francés ex-vino tinto', 'Tonnellerie sample', 'barrica', 'roble francés', 'vino tinto', 'Francia', 'Barrica usada previamente con vino tinto seco', 'media', 21, 120, 'Tanino fino, fruta roja, especia y roble elegante para saisons oscuras, oud bruin y cervezas ácidas.'),
  ('american-oak-cubes-medium', 'Cubos roble americano tostado medio', 'The Barrel Mill', 'cubo', 'roble americano', 'sin uso previo', 'Estados Unidos', 'Cubos de tostado medio sin licor previo', 'media', 7, 45, 'Alternativa compacta a barrica. Aporta vainilla, madera limpia y dulzor tostado.'),
  ('rum-barrel-staves', 'Duelas ex-ron', 'Caribbean Rum Cask', 'duela', 'roble americano', 'ron', 'Caribe', 'Duelas de barrica con uso previo en ron oscuro', 'alta', 14, 90, 'Melaza, azúcar moreno, vainilla y especias cálidas para stouts y winter warmers.')
ON CONFLICT (id) DO NOTHING;
