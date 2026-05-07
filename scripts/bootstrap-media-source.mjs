import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MANIFEST_PATH = path.join(ROOT, 'src/data/media-manifest.json');
const TARGET_ROOT = path.join(ROOT, 'media-source');
const TARGET_MEDIA = path.join(TARGET_ROOT, 'media');
const TARGET_VIDEO = path.join(TARGET_ROOT, 'video');
const TARGET_ICONS = path.join(TARGET_ROOT, 'icons');
const TARGET_FAVICON = path.join(TARGET_ROOT, 'favicon.png');

const ORIGINAL_ROOT = fs.existsSync(path.join(ROOT, 'ORIGINAL'))
  ? path.join(ROOT, 'ORIGINAL')
  : path.join(ROOT, 'Original');
const WEBFLOW_IMAGES = path.join(ORIGINAL_ROOT, 'images');
const PHOTOS_ROOT = path.join(ORIGINAL_ROOT, 'Images/Photos');
const ICONS_SRC = path.join(ORIGINAL_ROOT, 'images');
const FAVICON_SRC = path.join(ORIGINAL_ROOT, 'icons/favicon.png');
const VIDEO_SRC = path.join(ORIGINAL_ROOT, 'video/WinterSticks_30s.mp4');

const PHOTO_OVERRIDES = {
  'venture-boldly': 'Alter - Venture Boldly',
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

function main() {
  if (!fs.existsSync(ORIGINAL_ROOT)) {
    throw new Error(`Missing original source directory: ${ORIGINAL_ROOT}`);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  ensureDir(TARGET_MEDIA);
  ensureDir(TARGET_VIDEO);
  ensureDir(TARGET_ICONS);

  let copied = 0;
  const missing = [];

  for (const [slug, files] of Object.entries(manifest)) {
    if (!Array.isArray(files)) continue;
    const targetDir = path.join(TARGET_MEDIA, slug);
    ensureDir(targetDir);
    const overrideFolder = PHOTO_OVERRIDES[slug];

    for (const fileName of files) {
      const overrideSource = overrideFolder
        ? path.join(PHOTOS_ROOT, overrideFolder, fileName)
        : path.join(WEBFLOW_IMAGES, fileName);
      const normalizedSource = path.join(
        WEBFLOW_IMAGES,
        fileName.replaceAll('Alter ', 'Alter-').replace('Haiti - ', 'Haiti-'),
      );
      const sourceFile = fs.existsSync(overrideSource)
        ? overrideSource
        : fs.existsSync(path.join(WEBFLOW_IMAGES, fileName))
          ? path.join(WEBFLOW_IMAGES, fileName)
          : normalizedSource;
      const targetFile = path.join(targetDir, fileName);
      if (!copyIfExists(sourceFile, targetFile)) {
        missing.push(`${slug}/${fileName}`);
      } else {
        copied += 1;
      }
    }
  }

  copyIfExists(path.join(ICONS_SRC, 'instagram.png'), path.join(TARGET_ICONS, 'instagram.png'));
  copyIfExists(path.join(ICONS_SRC, 'linkedin.png'), path.join(TARGET_ICONS, 'linkedin.png'));
  copyIfExists(FAVICON_SRC, TARGET_FAVICON);
  copyIfExists(VIDEO_SRC, path.join(TARGET_VIDEO, 'winter-sticks.mp4'));

  if (missing.length) {
    const sample = missing.slice(0, 10).join(', ');
    console.warn(`Missing ${missing.length} manifest files from ORIGINAL. Example: ${sample}`);
  }

  console.log(`Bootstrapped media-source with ${copied} images from ORIGINAL.`);
}

main();
