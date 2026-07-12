ALTER TABLE recipe_maturation_additions ADD COLUMN adjunct_id TEXT REFERENCES adjuncts(id);
UPDATE recipe_maturation_additions r
SET adjunct_id = a.id
FROM adjuncts a
WHERE r.type='adjunto' AND lower(trim(r.name))=lower(trim(a.name));
