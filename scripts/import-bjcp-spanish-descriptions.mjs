import fs from 'node:fs';

const [xmlPath, ...sourcePaths] = process.argv.slice(2);
if (!xmlPath || sourcePaths.length === 0) {
  throw new Error(
    'Usage: node scripts/import-bjcp-spanish-descriptions.mjs <xml> <extracted-pdf.txt> [...]',
  );
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const clean = (value) =>
  value
    .replace(/\n-- \d+ of \d+ --\n/g, ' ')
    .replace(/\nGuía BJCP[^\n]*\n/g, ' ')
    .replace(/Guía BJCP de estilos de cerveza – Edición 2021 – Español \d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sources = sourcePaths.map((path) => fs.readFileSync(path, 'utf8'));
let xml = fs.readFileSync(xmlPath, 'utf8');
let translated = 0;

xml = xml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, (originalBlock) => {
  const block = originalBlock.replace(/\s*<sensoryDescriptionEs>[^<]*<\/sensoryDescriptionEs>/, '');
  const code = block.match(/<code>([^<]+)<\/code>/)?.[1];
  const name = block.match(/<name>([^<]+)<\/name>/)?.[1];
  if (!code || !name) return block;
  const escapedCode = escapeRegExp(code);
  const headings = [
    `${escapedCode}\\. [^\\n.]+`,
    escapeRegExp(name.replace(/^Historical Beer:\s*/, 'Historical Beer: ')),
  ];
  const match = headings
    .flatMap((heading) =>
      sources.map((source) => {
        const headingMatch = source.match(new RegExp(`(?:^|\\n)${heading}\\n`, 'm'));
        if (!headingMatch || headingMatch.index === undefined) return null;
        const start = headingMatch.index + headingMatch[0].length;
        const remainder = source.slice(start);
        const nextHeading = remainder.search(/\n(?:[0-9]{1,2}[A-Z]|C[1-4][A-D])\. [^\n.]+\n/);
        const section = nextHeading < 0 ? remainder : remainder.slice(0, nextHeading);
        return section.match(
          /Impresión general:\s*([\s\S]*?)(?=\n(?:Aroma|Apariencia|Sensación en boca|Comentarios|Historia|Ingredientes|Instrucciones|Comparación|Estadísticas|Ejemplos|Etiquetas|Variedades)[^\n]*:)/m,
        );
      }),
    )
    .find(Boolean);
  if (!match) return block;
  translated += 1;
  return block.replace(
    '</style>',
    `\n    <sensoryDescriptionEs>${escapeXml(clean(match[1]))}</sensoryDescriptionEs>\n  </style>`,
  );
});

fs.writeFileSync(xmlPath, xml);
console.log(`Added ${translated} Spanish descriptions to ${xmlPath}`);
