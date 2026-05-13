#!/usr/bin/env node
/**
 * Compresse les PNG/JPG de /public en WebP haute qualité.
 *
 *   node scripts/optimize-images.mjs            -> dry-run, liste ce qui serait fait
 *   node scripts/optimize-images.mjs --apply    -> écrit les fichiers .webp et supprime l'original
 *   node scripts/optimize-images.mjs --apply --keep -> écrit les .webp sans supprimer
 *
 * Le script ne touche pas aux fichiers déjà en .webp ni au favicon. Il met automatiquement
 * à jour toutes les références (src + .astro + .css) du PNG/JPG vers le nouveau .webp.
 *
 * Configuration : MAX_WIDTH = 1600px (suffisant pour un écran retina 2x), qualité 80.
 */
import sharp from 'sharp';
import { readdir, stat, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SRC_DIR = path.join(ROOT, 'src');

const MAX_WIDTH = 1600;
const QUALITY = 80;
const TARGETS = new Set(['.png', '.jpg', '.jpeg']);
const SKIP_FILENAMES = new Set(['favicon-32x32.png']);

const APPLY = process.argv.includes('--apply');
const KEEP_ORIGINAL = process.argv.includes('--keep');

const fmt = (n) => (n / 1024).toFixed(1) + ' KB';

async function walkPublic() {
  const out = [];
  for (const entry of await readdir(PUBLIC_DIR)) {
    const ext = path.extname(entry).toLowerCase();
    if (!TARGETS.has(ext)) continue;
    if (SKIP_FILENAMES.has(entry)) continue;
    const full = path.join(PUBLIC_DIR, entry);
    const s = await stat(full);
    if (!s.isFile()) continue;
    out.push({ name: entry, full, size: s.size, ext });
  }
  return out;
}

async function findSourceFiles() {
  const out = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(astro|ts|tsx|js|jsx|css|html|md|mdx)$/i.test(entry.name)) {
        out.push(full);
      }
    }
  }
  await walk(SRC_DIR);
  return out;
}

async function updateReferences(oldName, newName) {
  const files = await findSourceFiles();
  let changed = 0;
  for (const f of files) {
    const raw = await readFile(f, 'utf8');
    const oldRef = '/' + oldName;
    const newRef = '/' + newName;
    if (raw.includes(oldRef)) {
      await writeFile(f, raw.split(oldRef).join(newRef));
      changed++;
    }
  }
  return changed;
}

async function main() {
  const items = await walkPublic();
  if (items.length === 0) {
    console.log('Aucune image PNG/JPG à optimiser dans public/.');
    return;
  }

  console.log(`Mode : ${APPLY ? 'APPLY' : 'dry-run'}${KEEP_ORIGINAL ? ' (--keep)' : ''}\n`);
  let totalBefore = 0;
  let totalAfter = 0;

  for (const item of items) {
    totalBefore += item.size;
    const webpName = item.name.slice(0, -item.ext.length) + '.webp';
    const webpPath = path.join(PUBLIC_DIR, webpName);

    const pipeline = sharp(item.full)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY });

    const buf = await pipeline.toBuffer();
    totalAfter += buf.length;

    const saving = ((1 - buf.length / item.size) * 100).toFixed(0);
    console.log(`  ${item.name}  →  ${webpName}   ${fmt(item.size)}  →  ${fmt(buf.length)}  (${saving}% économisé)`);

    if (APPLY) {
      await writeFile(webpPath, buf);
      const refs = await updateReferences(item.name, webpName);
      if (refs > 0) console.log(`    ↳ ${refs} fichier(s) source mis à jour`);
      if (!KEEP_ORIGINAL) await unlink(item.full);
    }
  }

  console.log(`\nTotal : ${fmt(totalBefore)}  →  ${fmt(totalAfter)}  (${((1 - totalAfter / totalBefore) * 100).toFixed(0)}% économisé)`);
  if (!APPLY) console.log('\nRien n\'a été écrit. Relancez avec --apply pour appliquer.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
