ALTER TABLE recipe_hops DROP CONSTRAINT recipe_hops_use_check;
ALTER TABLE recipe_hops ADD CONSTRAINT recipe_hops_use_check CHECK (use IN ('first wort','hervido','whirlpool','dry hop'));

CREATE TABLE recipe_maturation_additions (
 id BIGSERIAL PRIMARY KEY, recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
 type TEXT NOT NULL CHECK(type IN ('lúpulo','adjunto')), hop_id TEXT REFERENCES hops(id), name TEXT NOT NULL DEFAULT '',
 amount NUMERIC(9,2) NOT NULL DEFAULT 0, unit TEXT NOT NULL CHECK(unit IN ('g','kg','ml')),
 add_day INTEGER NOT NULL DEFAULT 0, contact_days INTEGER NOT NULL DEFAULT 0, temperature_c NUMERIC(5,2) NOT NULL DEFAULT 16,
 notes TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_recipe_maturation_additions_recipe ON recipe_maturation_additions(recipe_id);

INSERT INTO recipe_maturation_additions(recipe_id,type,hop_id,name,amount,unit,add_day,contact_days,temperature_c,notes,position)
SELECT h.recipe_id,'lúpulo',h.hop_id,'',h.amount_g,'g',3,r.dry_hop_days,r.dry_hop_temp_c,'Migrado del dry hop de la receta',h.position
FROM recipe_hops h JOIN recipes r ON r.id=h.recipe_id WHERE h.use='dry hop';

INSERT INTO recipe_maturation_additions(recipe_id,type,hop_id,name,amount,unit,add_day,contact_days,temperature_c,notes,position)
SELECT p.recipe_id,'adjunto',NULL,p.name,p.amount_g,'g',COALESCE(NULLIF(regexp_replace(p.day_label,'[^0-9]','','g'),''),'0')::INTEGER,0,COALESCE(p.temperature_c,16),p.notes,100+p.position
FROM recipe_process_additions p WHERE p.stage='dry hop';

DELETE FROM recipe_hops WHERE use='dry hop';
DELETE FROM recipe_process_additions WHERE stage='dry hop';
