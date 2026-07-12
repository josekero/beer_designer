import fs from 'node:fs';

const dataDir = 'public/assets/data';
const outputPath = 'db/init/02_seed_catalog.sql';

const readXml = (name) => fs.readFileSync(`${dataDir}/${name}`, 'utf8');

const blocks = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, 'g'))]
  .map((match) => ({
    attrs: attrs(match[1]),
    body: match[2]
  }));

const selfClosing = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}\\b([^>]*)\\s*/>`, 'g'))]
  .map((match) => attrs(match[1]));

const attrs = (source) => Object.fromEntries(
  [...source.matchAll(/([A-Za-z0-9_-]+)="([^"]*)"/g)].map((match) => [match[1], unescapeXml(match[2])])
);

const text = (body, tag) => {
  const match = body.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? unescapeXml(match[1].trim()) : '';
};

const unescapeXml = (value) => value
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

const q = (value) => value === undefined || value === ''
  ? 'NULL'
  : `'${String(value).replace(/'/g, "''")}'`;

const required = (value) => `'${String(value).replace(/'/g, "''")}'`;
const n = (value) => value === undefined || value === '' ? 'NULL' : String(value);
const bool = (value) => value === 'true' ? 'true' : 'false';
const array = (value) => {
  const items = String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `'${item.replace(/'/g, "''")}'`);
  return `ARRAY[${items.join(', ')}]::text[]`;
};

let sql = `-- Generated from public/assets/data XML files. Regenerate with:
-- node scripts/generate-postgres-seed.mjs

`;

sql += 'INSERT INTO bjcp_styles (id, code, name, category, og_min, og_max, fg_min, fg_max, ibu_min, ibu_max, srm_min, srm_max, abv_min, abv_max, sensory_description, sensory_description_es) VALUES\n';
sql += blocks(readXml('bjcp-styles.xml'), 'style').map(({ attrs: styleAttrs, body }) => `  (${required(styleAttrs.id)}, ${required(text(body, 'code'))}, ${required(text(body, 'name'))}, ${required(text(body, 'category'))}, ${n(text(body, 'ogMin'))}, ${n(text(body, 'ogMax'))}, ${n(text(body, 'fgMin'))}, ${n(text(body, 'fgMax'))}, ${n(text(body, 'ibuMin'))}, ${n(text(body, 'ibuMax'))}, ${n(text(body, 'srmMin'))}, ${n(text(body, 'srmMax'))}, ${n(text(body, 'abvMin'))}, ${n(text(body, 'abvMax'))}, ${required(text(body, 'sensoryDescription'))}, ${q(text(body, 'sensoryDescriptionEs'))})`).join(',\n');
sql += '\nON CONFLICT (id) DO NOTHING;\n\n';

sql += 'INSERT INTO hops (id, name, country, alpha_acids, beta_acids, format, recommended_use, aromas, description) VALUES\n';
sql += blocks(readXml('hops.xml'), 'hop').map(({ attrs: hopAttrs, body }) => `  (${required(hopAttrs.id)}, ${required(text(body, 'name'))}, ${required(text(body, 'country'))}, ${n(text(body, 'alphaAcids'))}, ${n(text(body, 'betaAcids'))}, ${required(text(body, 'format'))}, ${array(text(body, 'recommendedUse'))}, ${array(text(body, 'aromas'))}, ${required(text(body, 'description'))})`).join(',\n');
sql += '\nON CONFLICT (id) DO NOTHING;\n\n';

sql += 'INSERT INTO malts (id, name, type, potential, color_srm, diastatic_power, max_recommended_percent, description) VALUES\n';
sql += blocks(readXml('malts.xml'), 'malt').map(({ attrs: maltAttrs, body }) => `  (${required(maltAttrs.id)}, ${required(text(body, 'name'))}, ${required(text(body, 'type'))}, ${n(text(body, 'potential'))}, ${n(text(body, 'colorSrm'))}, ${n(text(body, 'diastaticPower'))}, ${n(text(body, 'maxRecommendedPercent'))}, ${required(text(body, 'description'))})`).join(',\n');
sql += '\nON CONFLICT (id) DO NOTHING;\n\n';

sql += 'INSERT INTO yeasts (id, name, laboratory, type, attenuation_min, attenuation_max, temperature_min, temperature_max, flocculation, alcohol_tolerance, sensory_profile) VALUES\n';
sql += blocks(readXml('yeasts.xml'), 'yeast').map(({ attrs: yeastAttrs, body }) => `  (${required(yeastAttrs.id)}, ${required(text(body, 'name'))}, ${q(text(body, 'laboratory'))}, ${required(text(body, 'type'))}, ${n(text(body, 'attenuationMin'))}, ${n(text(body, 'attenuationMax'))}, ${n(text(body, 'temperatureMin'))}, ${n(text(body, 'temperatureMax'))}, ${required(text(body, 'flocculation'))}, ${n(text(body, 'alcoholTolerance'))}, ${required(text(body, 'sensoryProfile'))})`).join(',\n');
sql += '\nON CONFLICT (id) DO NOTHING;\n\n';

sql += 'INSERT INTO water_profiles (id, name, calcium, magnesium, sodium, sulfate, chloride, bicarbonate, target_ph, description) VALUES\n';
sql += blocks(readXml('water-profiles.xml'), 'profile').map(({ attrs: profileAttrs, body }) => `  (${required(profileAttrs.id)}, ${required(text(body, 'name'))}, ${n(text(body, 'calcium'))}, ${n(text(body, 'magnesium'))}, ${n(text(body, 'sodium'))}, ${n(text(body, 'sulfate'))}, ${n(text(body, 'chloride'))}, ${n(text(body, 'bicarbonate'))}, ${n(text(body, 'targetPh'))}, ${required(text(body, 'description'))})`).join(',\n');
sql += '\nON CONFLICT (id) DO NOTHING;\n\n';

for (const { attrs: recipeAttrs, body } of blocks(readXml('recipes.xml'), 'recipe')) {
  sql += `INSERT INTO recipes (id, name, style_id, batch_volume_l, efficiency_percent, boil_volume_l, yeast_id, water_profile_id, primary_days, primary_temp_c, secondary_days, secondary_temp_c, dry_hop_enabled, dry_hop_days, dry_hop_temp_c, maturation_days, carbonation_volumes, packaging_method, notes) VALUES (${required(recipeAttrs.id)}, ${required(text(body, 'name'))}, ${required(text(body, 'styleId'))}, ${n(text(body, 'batchVolumeL'))}, ${n(text(body, 'efficiencyPercent'))}, ${n(text(body, 'boilVolumeL'))}, ${required(text(body, 'yeastId'))}, ${required(text(body, 'waterProfileId'))}, ${n(text(body, 'primaryDays'))}, ${n(text(body, 'primaryTempC'))}, ${n(text(body, 'secondaryDays'))}, ${n(text(body, 'secondaryTempC'))}, ${bool(text(body, 'dryHopEnabled'))}, ${n(text(body, 'dryHopDays'))}, ${n(text(body, 'dryHopTempC'))}, ${n(text(body, 'maturationDays'))}, ${n(text(body, 'carbonationVolumes'))}, ${required(text(body, 'packagingMethod'))}, ${required(text(body, 'notes'))}) ON CONFLICT (id) DO NOTHING;\n`;
  sql += selfClosing(body, 'recipeMalt').map((item, index) => `INSERT INTO recipe_malts (recipe_id, malt_id, amount_kg, position) VALUES (${required(recipeAttrs.id)}, ${required(item.maltId)}, ${n(item.amountKg)}, ${index}) ON CONFLICT DO NOTHING;`).join('\n') + '\n';
  sql += selfClosing(body, 'recipeHop').map((item, index) => `INSERT INTO recipe_hops (recipe_id, hop_id, amount_g, alpha_acids, time_min, use, position) VALUES (${required(recipeAttrs.id)}, ${required(item.hopId)}, ${n(item.amountG)}, ${n(item.alphaAcids)}, ${n(item.timeMin)}, ${required(item.use)}, ${index}) ON CONFLICT DO NOTHING;`).join('\n') + '\n';
  sql += selfClosing(body, 'waterAddition').map((item, index) => `INSERT INTO recipe_water_additions (recipe_id, name, amount_g, position) VALUES (${required(recipeAttrs.id)}, ${required(item.name)}, ${n(item.amountG)}, ${index}) ON CONFLICT DO NOTHING;`).join('\n') + '\n';
  sql += selfClosing(body, 'mashStep').map((item, index) => `INSERT INTO recipe_mash_steps (recipe_id, name, temperature_c, time_min, position) VALUES (${required(recipeAttrs.id)}, ${required(item.name)}, ${n(item.temperatureC)}, ${n(item.timeMin)}, ${index}) ON CONFLICT DO NOTHING;`).join('\n') + '\n';
  sql += selfClosing(body, 'boilStep').map((item, index) => `INSERT INTO recipe_boil_steps (recipe_id, name, time_min, description, position) VALUES (${required(recipeAttrs.id)}, ${required(item.name)}, ${n(item.timeMin)}, ${required(item.description)}, ${index}) ON CONFLICT DO NOTHING;`).join('\n') + '\n\n';
}

sql += `UPDATE hops SET brand = 'Yakima Chief Hops' WHERE id IN ('cascade', 'citra', 'centennial', 'mosaic-cryo') AND brand IS NULL;
UPDATE hops SET brand = 'Noble hop grower' WHERE id IN ('hallertau-mittelfruh', 'saaz') AND brand IS NULL;
UPDATE hops SET brand = 'UK hop merchant' WHERE id = 'east-kent-golding' AND brand IS NULL;

UPDATE malts SET brand = 'Weyermann' WHERE id IN ('pilsner', 'munich-light', 'wheat') AND brand IS NULL;
UPDATE malts SET brand = 'Crisp Malt' WHERE id IN ('pale-ale', 'flaked-barley', 'roasted-barley') AND brand IS NULL;
UPDATE malts SET brand = 'Briess' WHERE id = 'caramel-40' AND brand IS NULL;

UPDATE yeasts SET brand = laboratory WHERE brand IS NULL AND laboratory IS NOT NULL;
`;

fs.writeFileSync(outputPath, sql);
console.log(`Wrote ${outputPath}`);
