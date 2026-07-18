ALTER TABLE app_users ALTER COLUMN avatar_value SET DEFAULT 'hop-pirate';

UPDATE app_users
SET avatar_value = CASE avatar_value
  WHEN 'amber-pint' THEN 'hop-pirate'
  WHEN 'hazy-ipa' THEN 'hop-viking'
  WHEN 'stout' THEN 'beer-skull'
  WHEN 'red-ale' THEN 'mad-brewer'
  WHEN 'cider' THEN 'oak-barrel'
  WHEN 'teku' THEN 'brewmaster'
  ELSE avatar_value
END
WHERE avatar_kind = 'gallery'
  AND avatar_value IN ('amber-pint', 'hazy-ipa', 'stout', 'red-ale', 'cider', 'teku');
