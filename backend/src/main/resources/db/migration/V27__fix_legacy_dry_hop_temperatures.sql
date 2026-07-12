UPDATE brew_day_hops
SET planned_temperature_c=16,actual_temperature_c=16
WHERE lower(use)='dry hop' AND planned_temperature_c=100 AND actual_temperature_c=100;
