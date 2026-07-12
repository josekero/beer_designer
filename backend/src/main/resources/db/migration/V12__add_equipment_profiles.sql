CREATE TABLE equipment_profiles (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, batch_volume_l NUMERIC(9,2) NOT NULL,
  boil_volume_l NUMERIC(9,2) NOT NULL, efficiency_percent NUMERIC(5,2) NOT NULL,
  boil_off_l_per_hour NUMERIC(7,2) NOT NULL DEFAULT 0, mash_tun_deadspace_l NUMERIC(7,2) NOT NULL DEFAULT 0,
  trub_chiller_loss_l NUMERIC(7,2) NOT NULL DEFAULT 0, fermentation_loss_l NUMERIC(7,2) NOT NULL DEFAULT 0,
  hop_utilization_percent NUMERIC(6,2) NOT NULL DEFAULT 100, notes TEXT NOT NULL DEFAULT ''
);
INSERT INTO equipment_profiles VALUES
('pilot-20l','Piloto 20 L',20,24,72,3,1,1,1,100,'Equipo piloto para desarrollo de recetas.'),
('production-500l','Producción 500 L',500,570,80,45,12,20,25,120,'Perfil inicial de producción; ajusta las pérdidas con datos reales.');
ALTER TABLE recipes ADD COLUMN equipment_profile_id TEXT REFERENCES equipment_profiles(id);
UPDATE recipes SET equipment_profile_id=CASE WHEN batch_volume_l>=200 THEN 'production-500l' ELSE 'pilot-20l' END;
