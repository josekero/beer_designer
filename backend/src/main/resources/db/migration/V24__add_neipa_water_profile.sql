INSERT INTO water_profiles (id,name,calcium,magnesium,sodium,sulfate,chloride,bicarbonate,target_ph,description)
VALUES ('neipa-chloride','NEIPA · cloruros altos',144,15,8,74,180,197,5.3,'Perfil sedoso para NEIPA, orientado a una relación cloruro/sulfato aproximada de 2:1.')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,calcium=EXCLUDED.calcium,magnesium=EXCLUDED.magnesium,sodium=EXCLUDED.sodium,sulfate=EXCLUDED.sulfate,chloride=EXCLUDED.chloride,bicarbonate=EXCLUDED.bicarbonate,target_ph=EXCLUDED.target_ph,description=EXCLUDED.description;
