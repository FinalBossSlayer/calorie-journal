/**
 * Downloads and unzips the USDA FoodData Central CSV datasets into
 * scripts/seed/data/usda/ (gitignored). Skips files that already exist.
 *
 *   npm run seed:download
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { unzipSync } from 'fflate';

import { USDA_DATASETS, USDA_DIR } from './lib/paths';

const BASE_URL = 'https://fdc.nal.usda.gov/fdc-datasets/';

async function download(zipName: string, dirName: string): Promise<void> {
  const target = join(USDA_DIR, dirName);
  if (existsSync(target)) {
    console.log(`✓ ${dirName} already present`);
    return;
  }

  console.log(`↓ ${zipName}`);
  const res = await fetch(BASE_URL + zipName);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText} (${zipName})`);
  const zip = new Uint8Array(await res.arrayBuffer());
  console.log(`  ${(zip.length / 1e6).toFixed(1)} MB, unzipping…`);

  // Only the CSVs we need; flatten the zip's inner folder.
  const files = unzipSync(zip, { filter: (f) => f.name.endsWith('.csv') });
  mkdirSync(target, { recursive: true });
  for (const [path, data] of Object.entries(files)) {
    writeFileSync(join(target, path.split('/').pop()!), data);
  }
  console.log(`✓ ${dirName}: ${Object.keys(files).length} CSV files`);
}

async function main() {
  mkdirSync(USDA_DIR, { recursive: true });
  for (const ds of Object.values(USDA_DATASETS)) {
    await download(ds.zip, ds.dir);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
