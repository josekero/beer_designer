ALTER TABLE hops ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE hops ADD COLUMN IF NOT EXISTS distributor_name TEXT;
ALTER TABLE hops ADD COLUMN IF NOT EXISTS distributor_url TEXT;

ALTER TABLE malts ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE malts ADD COLUMN IF NOT EXISTS distributor_name TEXT;
ALTER TABLE malts ADD COLUMN IF NOT EXISTS distributor_url TEXT;

ALTER TABLE yeasts ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE yeasts ADD COLUMN IF NOT EXISTS distributor_name TEXT;
ALTER TABLE yeasts ADD COLUMN IF NOT EXISTS distributor_url TEXT;

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

UPDATE hops SET brand = 'Yakima Chief Hops' WHERE id IN ('cascade', 'citra', 'centennial', 'mosaic-cryo') AND brand IS NULL;
UPDATE hops SET brand = 'Noble hop grower' WHERE id IN ('hallertau-mittelfruh', 'saaz') AND brand IS NULL;
UPDATE hops SET brand = 'UK hop merchant' WHERE id = 'east-kent-golding' AND brand IS NULL;

UPDATE malts SET brand = 'Weyermann' WHERE id IN ('pilsner', 'munich-light', 'wheat') AND brand IS NULL;
UPDATE malts SET brand = 'Crisp Malt' WHERE id IN ('pale-ale', 'flaked-barley', 'roasted-barley') AND brand IS NULL;
UPDATE malts SET brand = 'Briess' WHERE id = 'caramel-40' AND brand IS NULL;

UPDATE yeasts SET brand = laboratory WHERE brand IS NULL AND laboratory IS NOT NULL;
