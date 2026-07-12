CREATE TABLE brewing_salts(id TEXT PRIMARY KEY,name TEXT NOT NULL,formula TEXT NOT NULL,category TEXT NOT NULL,calcium_percent NUMERIC(6,2) NOT NULL DEFAULT 0,magnesium_percent NUMERIC(6,2) NOT NULL DEFAULT 0,sodium_percent NUMERIC(6,2) NOT NULL DEFAULT 0,sulfate_percent NUMERIC(6,2) NOT NULL DEFAULT 0,chloride_percent NUMERIC(6,2) NOT NULL DEFAULT 0,bicarbonate_percent NUMERIC(6,2) NOT NULL DEFAULT 0,description TEXT NOT NULL DEFAULT '');
INSERT INTO brewing_salts VALUES
('calcium-sulfate','Sulfato de calcio / Yeso','CaSO₄·2H₂O','sal',23.3,0,0,55.8,0,0,'Aumenta calcio y sulfato; favorece perfiles secos y lupulados.'),
('calcium-chloride','Cloruro de calcio','CaCl₂·2H₂O','sal',27.2,0,0,0,48.2,0,'Aumenta calcio y cloruro; potencia cuerpo y maltosidad.'),
('magnesium-sulfate','Sulfato de magnesio / Epsom','MgSO₄·7H₂O','sal',9.9,9.9,0,39,0,0,'Aporta magnesio y sulfato; usar con moderación.'),
('sodium-chloride','Cloruro de sodio / Sal','NaCl','sal',0,0,39.3,0,60.7,0,'Aporta sodio y cloruro.'),
('sodium-bicarbonate','Bicarbonato de sodio','NaHCO₃','alcalinizante',0,0,27.4,0,0,72.6,'Eleva alcalinidad y bicarbonato.'),
('calcium-carbonate','Carbonato de calcio','CaCO₃','alcalinizante',40,0,0,0,0,60,'Eleva calcio y alcalinidad; solubilidad limitada.'),
('calcium-hydroxide','Hidróxido de calcio / Cal','Ca(OH)₂','alcalinizante',54.1,0,0,0,0,0,'Alcalinizante potente para macerados oscuros.'),
('lactic-acid','Ácido láctico','C₃H₆O₃','ácido',0,0,0,0,0,0,'Reduce pH de macerado o lavado.'),
('phosphoric-acid','Ácido fosfórico','H₃PO₄','ácido',0,0,0,0,0,0,'Reduce pH con impacto sensorial bajo.'),
('citric-acid','Ácido cítrico','C₆H₈O₇','ácido',0,0,0,0,0,0,'Acidificante; puede aportar carácter cítrico.'),
('potassium-chloride','Cloruro de potasio','KCl','sal',0,0,0,0,47.6,0,'Alternativa de cloruro sin sodio.'),
('pickling-lime','Cal para encurtidos','Ca(OH)₂','alcalinizante',54.1,0,0,0,0,0,'Eleva el pH; dosificar cuidadosamente.');
ALTER TABLE recipe_water_additions ADD COLUMN salt_id TEXT REFERENCES brewing_salts(id);
UPDATE recipe_water_additions SET salt_id='calcium-sulfate' WHERE lower(name) IN ('gypsum','yeso','sulfato de calcio');
UPDATE recipe_water_additions SET salt_id='calcium-chloride' WHERE lower(name) IN ('calcium chloride','cloruro de calcio');
