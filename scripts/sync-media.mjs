/**
 * Astro-native media sync.
 *
 * Copies curated media from `media-source/` to `public/` using `src/data/media-manifest.json`.
 * This keeps runtime assets deterministic for GitHub + Cloudflare Pages builds and avoids
 * direct dependency on legacy Webflow HTML exports.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MEDIA_SOURCE_ROOT = path.join(ROOT, 'media-source');
const MEDIA_SOURCE_IMAGES = path.join(MEDIA_SOURCE_ROOT, 'media');
const MEDIA_SOURCE_VIDEO = path.join(MEDIA_SOURCE_ROOT, 'video');
const MEDIA_SOURCE_ICONS = path.join(MEDIA_SOURCE_ROOT, 'icons');
const MEDIA_SOURCE_FAVICON = path.join(MEDIA_SOURCE_ROOT, 'favicon.png');

const PUBLIC_ROOT = path.join(ROOT, 'public');
const PUBLIC_MEDIA = path.join(PUBLIC_ROOT, 'media');
const PUBLIC_VIDEO = path.join(PUBLIC_ROOT, 'video');
const PUBLIC_ICONS = path.join(PUBLIC_ROOT, 'icons');
const PUBLIC_FAVICON = path.join(PUBLIC_ROOT, 'favicon.png');
const MANIFEST_PATH = path.join(ROOT, 'src/data/media-manifest.json');

const VIDEO_MAX_BYTES = 25 * 1024 * 1024;
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm']);

function readManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resetDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function syncProjectMedia(manifest) {
  resetDir(PUBLIC_MEDIA);
  if (!fs.existsSync(MEDIA_SOURCE_IMAGES)) {
    throw new Error(`Missing media source directory: ${MEDIA_SOURCE_IMAGES}`);
  }

  const missing = [];
  let copiedCount = 0;

  for (const [slug, files] of Object.entries(manifest)) {
    if (!Array.isArray(files)) continue;
    const targetDir = path.join(PUBLIC_MEDIA, slug);
    ensureDir(targetDir);
    for (const filename of files) {
      const sourceFile = path.join(MEDIA_SOURCE_IMAGES, slug, filename);
      const targetFile = path.join(targetDir, filename);
      if (!fs.existsSync(sourceFile)) {
        missing.push(`${slug}/${filename}`);
        continue;
      }
      fs.copyFileSync(sourceFile, targetFile);
      copiedCount += 1;
    }
  }

  return { missing, copiedCount };
}

function syncDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return 0;
  resetDir(targetDir);

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  let copied = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const src = path.join(sourceDir, entry.name);
    const dest = path.join(targetDir, entry.name);
    fs.copyFileSync(src, dest);
    copied += 1;
  }
  return copied;
}

function syncFavicon() {
  if (!fs.existsSync(MEDIA_SOURCE_FAVICON)) return false;
  fs.copyFileSync(MEDIA_SOURCE_FAVICON, PUBLIC_FAVICON);
  return true;
}

function warnForLargeVideos() {
  if (!fs.existsSync(PUBLIC_VIDEO)) return;
  const entries = fs.readdirSync(PUBLIC_VIDEO, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!VIDEO_EXTENSIONS.has(ext)) continue;
    const filePath = path.join(PUBLIC_VIDEO, entry.name);
    const size = fs.statSync(filePath).size;
    if (size > VIDEO_MAX_BYTES) {
      console.warn(
        `[warning] ${entry.name} is ${(size / 1024 / 1024).toFixed(1)} MiB. Cloudflare Pages soft limit is ~25 MiB/file.`,
      );
    }
  }
}

function main() {
  const manifest = readManifest();
  const { missing, copiedCount } = syncProjectMedia(manifest);
  const copiedIcons = syncDirectory(MEDIA_SOURCE_ICONS, PUBLIC_ICONS);
  const copiedVideo = syncDirectory(MEDIA_SOURCE_VIDEO, PUBLIC_VIDEO);
  const copiedFavicon = syncFavicon();
  warnForLargeVideos();

  if (missing.length) {
    const sample = missing.slice(0, 10).join(', ');
    console.warn(`Missing manifest files in media-source (${missing.length} total). Example: ${sample}`);
  }

  console.log(
    `Synced media assets: ${copiedCount} images, ${copiedVideo} videos, ${copiedIcons} icons${copiedFavicon ? ', favicon' : ''}.`,
  );
}

main();
