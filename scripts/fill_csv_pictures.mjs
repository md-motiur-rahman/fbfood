#!/usr/bin/env node

// Usage:
//   node scripts/fill_csv_pictures.mjs --input path/to/input.csv --images path/to/images_dir --output path/to/output.csv --mode public-path
//   node scripts/fill_csv_pictures.mjs --input path/to/input.csv --images path/to/images_dir --output path/to/output.csv --mode data-uri
//
// Behavior:
// - Reads the CSV, finds rows with empty 'picture' column
// - Attempts to match an image from --images directory by:
//   1) outerbarcode.<ext>
//   2) sanitized productname.<ext>
//   with ext in [jpg,jpeg,png,webp,gif,svg]
// - When --mode public-path:
//   * Copies the matched image into public/images and sets picture cell to '/images/<newname>'
// - When --mode data-uri:
//   * Embeds the image bytes as 'data:<mime>;base64,<payload>' directly in picture cell
// - Writes the updated CSV to --output

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const args = Object.fromEntries(process.argv.slice(2).map((arg, i, arr) => {
  if (!arg.startsWith('--')) return [];
  const key = arg.slice(2);
  const val = arr[i+1] && !arr[i+1].startsWith('--') ? arr[i+1] : 'true';
  return [key, val];
}).filter(Boolean));

const INPUT = args.input;
const IMAGES_DIR = args.images;
const OUTPUT = args.output || (INPUT ? INPUT.replace(/\.csv$/i, '.filled.csv') : null);
const MODE = (args.mode || 'public-path').toLowerCase(); // 'public-path' | 'data-uri'

if (!INPUT || !IMAGES_DIR || !OUTPUT) {
  console.error('Usage: node scripts/fill_csv_pictures.mjs --input input.csv --images images_dir --output output.csv --mode public-path|data-uri');
  process.exit(1);
}
if (!['public-path','data-uri'].includes(MODE)) {
  console.error('Invalid --mode. Use public-path or data-uri');
  process.exit(1);
}

const exts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const mimeFromExt = (ext) => ({
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}[ext.toLowerCase()] || 'application/octet-stream');

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') { out.push(cur); cur = ''; }
      else if (ch === '"') { inQuotes = true; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out;
}

function toCSVField(s) {
  if (s == null) s = '';
  const needsQuote = /[",\n]/.test(s);
  let v = String(s).replace(/\r?\n/g, '\n');
  if (needsQuote) v = '"' + v.replace(/"/g, '""') + '"';
  return v;
}

function sanitizeName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function findImageForRow(row, headers, imagesDir) {
  const idx = Object.fromEntries(headers.map((h, i) => [h.toLowerCase(), i]));
  const barcode = row[idx['outerbarcode']]?.trim();
  const name = row[idx['productname']]?.trim();

  // Try by barcode first
  if (barcode) {
    for (const e of exts) {
      const p = path.join(imagesDir, barcode + e);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    }
  }
  // Try by sanitized productname
  if (name) {
    const base = sanitizeName(name);
    for (const e of exts) {
      const p = path.join(imagesDir, base + e);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    }
  }
  return null;
}

function loadCSV(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).map(l => parseCSVLine(l));
  return { headers, rows };
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function savePublicCopy(srcPath) {
  const pubDir = path.join(process.cwd(), 'public', 'images');
  ensureDir(pubDir);
  const ext = path.extname(srcPath) || '.bin';
  const name = crypto.randomBytes(8).toString('hex') + '_' + Date.now() + ext.toLowerCase();
  const dst = path.join(pubDir, name);
  fs.copyFileSync(srcPath, dst);
  return '/images/' + name;
}

function toDataURI(srcPath) {
  const ext = path.extname(srcPath) || '.bin';
  const mime = mimeFromExt(ext);
  const buf = fs.readFileSync(srcPath);
  const b64 = buf.toString('base64');
  return `data:${mime};base64,${b64}`;
}

(function main() {
  const { headers, rows } = loadCSV(INPUT);
  if (headers.length === 0) {
    console.error('Empty CSV or failed to parse.');
    process.exit(1);
  }
  const idx = Object.fromEntries(headers.map((h, i) => [h.toLowerCase(), i]));
  if (idx['picture'] == null) {
    console.error('CSV missing required picture column.');
    process.exit(1);
  }
  let updated = 0;
  const outRows = rows.map((row, r) => {
    const pic = (row[idx['picture']] || '').trim();
    if (pic) return row; // keep existing
    const img = findImageForRow(row, headers, IMAGES_DIR);
    if (!img) return row; // no image found, leave blank

    if (MODE === 'public-path') {
      const publicPath = savePublicCopy(img);
      row[idx['picture']] = publicPath;
    } else if (MODE === 'data-uri') {
      row[idx['picture']] = toDataURI(img);
    }
    updated++;
    return row;
  });

  const out = [headers.map(toCSVField).join(',')]
    .concat(outRows.map(cols => cols.map(toCSVField).join(',')))
    .join('\n');
  ensureDir(path.dirname(OUTPUT));
  fs.writeFileSync(OUTPUT, out, 'utf8');
  console.log(`Wrote ${OUTPUT}. Updated ${updated} rows with pictures using mode=${MODE}.`);
})();
