CREATE TABLE recipe_yeasts (
  id BIGSERIAL PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  yeast_id TEXT NOT NULL REFERENCES yeasts(id),
  format TEXT NOT NULL CHECK (format IN ('seca','líquida')),
  amount NUMERIC(9,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL CHECK (unit IN ('g','ml','paquetes')),
  pitch_temp_c NUMERIC(5,2) NOT NULL DEFAULT 18,
  starter_volume_l NUMERIC(7,2) NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_recipe_yeasts_recipe_id ON recipe_yeasts(recipe_id);
INSERT INTO recipe_yeasts(recipe_id,yeast_id,format,amount,unit,pitch_temp_c,starter_volume_l,notes,position)
SELECT id,yeast_id,'seca',11.5,'g',primary_temp_c,0,'',0 FROM recipes;
