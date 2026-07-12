ALTER TABLE recipe_hops ADD COLUMN temperature_c NUMERIC(5,2) NOT NULL DEFAULT 100;
UPDATE recipe_hops SET temperature_c=80 WHERE use='whirlpool';
