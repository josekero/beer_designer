import fs from 'node:fs';

const seed = fs.readFileSync('db/init/02_seed_catalog.sql', 'utf8');
const match = seed.match(/INSERT INTO bjcp_styles[\s\S]*?ON CONFLICT \(id\) DO NOTHING;/);
if (!match) throw new Error('BJCP style seed block was not found.');

const upsert = match[0].replace(
  'ON CONFLICT (id) DO NOTHING;',
  `ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  og_min = EXCLUDED.og_min,
  og_max = EXCLUDED.og_max,
  fg_min = EXCLUDED.fg_min,
  fg_max = EXCLUDED.fg_max,
  ibu_min = EXCLUDED.ibu_min,
  ibu_max = EXCLUDED.ibu_max,
  srm_min = EXCLUDED.srm_min,
  srm_max = EXCLUDED.srm_max,
  abv_min = EXCLUDED.abv_min,
  abv_max = EXCLUDED.abv_max,
  sensory_description = EXCLUDED.sensory_description,
  sensory_description_es = EXCLUDED.sensory_description_es;`,
);

const migration = `ALTER TABLE bjcp_styles
  ADD COLUMN IF NOT EXISTS sensory_description_es TEXT,
  ALTER COLUMN ibu_min DROP NOT NULL,
  ALTER COLUMN ibu_max DROP NOT NULL,
  ALTER COLUMN srm_min DROP NOT NULL,
  ALTER COLUMN srm_max DROP NOT NULL;

${upsert}
`;

const output =
  'backend/src/main/resources/db/migration/V28__add_bjcp_2025_cider_and_spanish_descriptions.sql';
fs.writeFileSync(output, migration);
console.log(`Wrote ${output}`);
