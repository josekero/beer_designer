ALTER TABLE brew_day_hops
  ADD COLUMN planned_temperature_c NUMERIC(5,2),
  ADD COLUMN actual_temperature_c NUMERIC(5,2);

UPDATE brew_day_hops SET planned_temperature_c=CASE WHEN lower(use)='whirlpool' THEN 80 ELSE 100 END WHERE planned_temperature_c IS NULL;
UPDATE brew_day_hops SET actual_temperature_c=planned_temperature_c WHERE actual_temperature_c IS NULL;
