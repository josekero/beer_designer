import fs from 'node:fs';
import path from 'node:path';

const projectRoot = fs.realpathSync(process.cwd());
const outputRoot = fs.realpathSync(path.join(projectRoot, 'public/assets/data'));
const assertInside = (root, candidate, message) => {
  const relative = path.relative(root, candidate);
  if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(message);
};

const safeExistingInput = (candidate) => {
  const requested = path.resolve(projectRoot, candidate);
  assertInside(projectRoot, requested, 'Input must be a regular file inside the project directory.');
  const resolved = fs.realpathSync(requested);
  assertInside(projectRoot, resolved, 'Input symbolic links must stay inside the project directory.');
  if (!fs.statSync(resolved).isFile()) throw new Error('Input must be a regular file.');
  return resolved;
};

const safeOutput = (candidate) => {
  const resolved = path.resolve(projectRoot, candidate);
  assertInside(outputRoot, resolved, 'Output must stay inside public/assets/data.');
  const parent = fs.realpathSync(path.dirname(resolved));
  assertInside(outputRoot, path.join(parent, path.basename(resolved)), 'Output symbolic links must stay inside public/assets/data.');
  if (fs.existsSync(resolved) && fs.lstatSync(resolved).isSymbolicLink()) throw new Error('Symbolic-link outputs are not allowed.');
  return resolved;
};

if (!process.argv[2]) throw new Error('Usage: node scripts/generate-bjcp-xml.mjs <project-local-input.json> [public/assets/data/output.xml]');
const inputPath = safeExistingInput(process.argv[2]);
const outputPath = safeOutput(process.argv[3] ?? 'public/assets/data/bjcp-styles.xml');
const styles = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const escapeXml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const slugify = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const normalizeCategory = (value) => String(value)
  .replace(/\bAnd\b/g, 'and')
  .replace(/^Ipa$/, 'IPA');

const hasCompleteVitalStats = (style) => [
  'ibumin',
  'ibumax',
  'ogmin',
  'ogmax',
  'fgmin',
  'fgmax',
  'abvmin',
  'abvmax',
  'srmmin',
  'srmmax'
].every((key) => style[key]);

const completeStyles = styles
  .filter(hasCompleteVitalStats)
  .sort((a, b) => Number(a.categorynumber) - Number(b.categorynumber) || a.number.localeCompare(b.number, undefined, { numeric: true }));

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<bjcpStyles>\n';

for (const style of completeStyles) {
  xml += `  <style id="${escapeXml(slugify(style.name))}">\n`;
  xml += `    <code>${escapeXml(style.number)}</code>\n`;
  xml += `    <name>${escapeXml(style.name)}</name>\n`;
  xml += `    <category>${escapeXml(normalizeCategory(style.category))}</category>\n`;
  xml += `    <ogMin>${escapeXml(style.ogmin)}</ogMin>\n`;
  xml += `    <ogMax>${escapeXml(style.ogmax)}</ogMax>\n`;
  xml += `    <fgMin>${escapeXml(style.fgmin)}</fgMin>\n`;
  xml += `    <fgMax>${escapeXml(style.fgmax)}</fgMax>\n`;
  xml += `    <ibuMin>${escapeXml(style.ibumin)}</ibuMin>\n`;
  xml += `    <ibuMax>${escapeXml(style.ibumax)}</ibuMax>\n`;
  xml += `    <srmMin>${escapeXml(style.srmmin)}</srmMin>\n`;
  xml += `    <srmMax>${escapeXml(style.srmmax)}</srmMax>\n`;
  xml += `    <abvMin>${escapeXml(style.abvmin)}</abvMin>\n`;
  xml += `    <abvMax>${escapeXml(style.abvmax)}</abvMax>\n`;
  xml += `    <sensoryDescription>${escapeXml(String(style.overallimpression ?? '').replace(/\s+/g, ' ').trim())}</sensoryDescription>\n`;
  xml += '  </style>\n';
}

xml += '</bjcpStyles>\n';

fs.writeFileSync(outputPath, xml);
console.log(`Wrote ${completeStyles.length} BJCP styles to ${outputPath}`);
