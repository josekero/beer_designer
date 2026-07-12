CREATE TABLE recipe_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO recipe_folders (id, name, sort_order, is_default) VALUES ('general', 'General', 0, true);

ALTER TABLE recipes ADD COLUMN folder_id TEXT NOT NULL DEFAULT 'general' REFERENCES recipe_folders(id);
ALTER TABLE recipes ADD COLUMN folder_sort_order INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY name, id) - 1 AS position FROM recipes
)
UPDATE recipes SET folder_sort_order = ordered.position FROM ordered WHERE recipes.id = ordered.id;
