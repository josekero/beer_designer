ALTER TABLE recipe_hops ALTER COLUMN hop_id DROP NOT NULL;
ALTER TABLE recipe_hops ADD COLUMN type TEXT NOT NULL DEFAULT 'lúpulo' CHECK(type IN ('lúpulo','adjunto'));
ALTER TABLE recipe_hops ADD COLUMN adjunct_id TEXT REFERENCES adjuncts(id);
ALTER TABLE recipe_hops ADD COLUMN notes TEXT NOT NULL DEFAULT '';

INSERT INTO recipe_hops(recipe_id,type,hop_id,adjunct_id,amount_g,alpha_acids,time_min,use,notes,position)
SELECT p.recipe_id,'adjunto',NULL,a.id,p.amount_g,0,COALESCE(p.time_min,0),p.stage,
       concat_ws(' · ',NULLIF(p.brand,''),NULLIF(p.notes,'')),100+p.position
FROM recipe_process_additions p
LEFT JOIN adjuncts a ON lower(trim(a.name))=lower(trim(p.name))
WHERE p.stage IN ('hervido','whirlpool');

DELETE FROM recipe_process_additions WHERE stage IN ('hervido','whirlpool');
