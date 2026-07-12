ALTER TABLE recipes ADD COLUMN mash_profile_id TEXT REFERENCES mash_profiles(id);
ALTER TABLE recipes ADD COLUMN carbonation_profile_id TEXT REFERENCES carbonation_profiles(id);
ALTER TABLE recipes ADD COLUMN fermentation_profile_id TEXT REFERENCES fermentation_profiles(id);

UPDATE recipes SET
  mash_profile_id = 'single-infusion-66',
  carbonation_profile_id = CASE WHEN packaging_method ILIKE '%barril%' THEN 'keg-standard' ELSE 'bottle-standard' END,
  fermentation_profile_id = 'ale-standard';
