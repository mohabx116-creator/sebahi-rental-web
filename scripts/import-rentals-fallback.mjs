import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value?.startsWith('--')) continue;

    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      args.set(value, next);
      index += 1;
    } else {
      args.set(value, 'true');
    }
  }

  return args;
}

function buildFallbackModule(listings) {
  return `import type { RentalListing } from '../lib/api/types';

export const RENTALS_FALLBACK: RentalListing[] = ${JSON.stringify(listings, null, 2)};

export function getFallbackRentalBySlug(slug: string) {
  return RENTALS_FALLBACK.find((listing) => listing.slug === slug);
}
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = resolve(
    process.cwd(),
    args.get('--input') || '../compound-os-api/backups/rentals/rentals-backup-latest.json',
  );
  const outputPath = resolve(
    process.cwd(),
    args.get('--output') || 'src/data/rentals-fallback.ts',
  );

  const raw = await readFile(inputPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.listings)) {
    throw new Error('Backup file does not contain a listings array');
  }

  const moduleSource = buildFallbackModule(parsed.listings);
  await writeFile(outputPath, `${moduleSource}\n`, 'utf8');

  console.log(`Updated fallback module from ${inputPath}`);
  console.log(`Wrote ${parsed.listings.length} listings to ${outputPath}`);
}

main().catch((error) => {
  console.error('Failed to import rentals fallback');
  console.error(error);
  process.exitCode = 1;
});

