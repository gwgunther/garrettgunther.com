/**
 * Copies images referenced in Original/HTML/projects/*.html from Original/HTML/images/
 * (Webflow export) into public/media/{slug}/ and writes media-manifest.json.
 *
 * Rules:
 * - Only each <img>’s primary `src` is used (not every srcset URL), so galleries stay one file per frame.
 * - Syncs when the HTML has a real gallery (`project-page-image`), or when it’s photo-only
 *   (`image-main` and no Vimeo/YouTube embed).
 * - Skips video-only pieces so they never get stray stills.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const PROJECTS_HTML = path.join(ROOT, 'Original/HTML/projects');
const WEBFLOW_IMAGES = path.join(ROOT, 'Original/HTML/images');
const PHOTOS_ROOT = path.join(ROOT, 'Original/Images/Photos');
const PUBLIC = path.join(__dirname, '../public');
const PUBLIC_MEDIA = path.join(PUBLIC, 'media');
const MANIFEST = path.join(__dirname, '../src/data/media-manifest.json');

const IMG_EXT = /\.(jpe?g|png|webp|gif)$/i;

const SKIP_FILES = new Set(['linkedin.png', 'instagram.png', 'menu-icon_1menu-icon.png', 'menu-icon.png']);

/** Optional per-project override: include all files from Original/Images/Photos/<folder> */
const ALL_FROM_PHOTOS = {
  'venture-boldly': 'Alter - Venture Boldly',
};

function shouldSyncPhotosForSlug(slug) {
  const htmlPath = path.join(PROJECTS_HTML, `${slug}.html`);
  if (!fs.existsSync(htmlPath)) {
    console.warn('Missing project HTML:', htmlPath);
    return false;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  if (html.includes('project-page-image')) return true;
  const hasHostedVideo =
    /player\.vimeo\.com|youtube\.com\/embed|youtube-nocookie\.com\/embed/i.test(html);
  if (hasHostedVideo) return false;
  return html.includes('image-main');
}

/**
 * Primary `src` on each <img> pointing at ../images/... document order, deduped.
 */
function listImageFilesFromProjectHtml(html) {
  const re = /<img\b[^>]*\bsrc=["']\.\.\/images\/([^"'>\s]+)["']/gi;
  const seen = new Set();
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const name = m[1].split('?')[0];
    if (SKIP_FILES.has(name) || !IMG_EXT.test(name)) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

/** Self-hosted videos: copied to public/video/ — keep each file under ~25 MiB for Cloudflare Pages. */
const VIDEO_FILES = [{ src: ['Original', 'Video', 'WinterSticks_30s.mp4'], dest: 'winter-sticks.mp4' }];

function copySelfHostedVideo() {
  const destDir = path.join(PUBLIC, 'video');
  fs.mkdirSync(destDir, { recursive: true });
  for (const { src: rel, dest } of VIDEO_FILES) {
    const abs = path.join(ROOT, ...rel);
    if (!fs.existsSync(abs)) {
      console.warn('Video source missing:', abs);
      continue;
    }
    const maxBytes = 25 * 1024 * 1024;
    const st = fs.statSync(abs);
    if (st.size > maxBytes) {
      console.warn(
        `Video ${dest} is ${(st.size / 1024 / 1024).toFixed(1)} MiB (Pages limit ~25 MiB/file). Re-encode or host on R2.`,
      );
    }
    fs.copyFileSync(abs, path.join(destDir, dest));
    console.log('Synced video:', dest);
  }
}

function copyIcons() {
  const iconsSrc = path.join(ROOT, 'Original/Images/Icons');
  const dest = path.join(PUBLIC, 'icons');
  fs.mkdirSync(dest, { recursive: true });
  for (const f of ['linkedin.png', 'instagram.png']) {
    const fp = path.join(iconsSrc, f);
    if (fs.existsSync(fp)) fs.copyFileSync(fp, path.join(dest, f));
  }
  const favSrc = path.join(ROOT, 'Original/Images/fav/favicon/gg_favicon_32.png');
  if (fs.existsSync(favSrc)) fs.copyFileSync(favSrc, path.join(PUBLIC, 'favicon.png'));
}

function main() {
  copyIcons();
  copySelfHostedVideo();

  if (!fs.existsSync(PROJECTS_HTML) || !fs.existsSync(WEBFLOW_IMAGES)) {
    console.warn('Skipping Webflow media sync: source export folders are not present.');
    return;
  }

  fs.rmSync(PUBLIC_MEDIA, { recursive: true, force: true });
  fs.mkdirSync(PUBLIC_MEDIA, { recursive: true });

  const manifest = {};
  const skippedRule = [];
  const missingOnDisk = [];

  const projectFiles = fs.readdirSync(PROJECTS_HTML).filter((f) => f.endsWith('.html'));

  for (const file of projectFiles) {
    const slug = file.replace(/\.html$/i, '');
    if (!shouldSyncPhotosForSlug(slug)) {
      skippedRule.push(slug);
      continue;
    }

    const html = fs.readFileSync(path.join(PROJECTS_HTML, file), 'utf8');
    const overridePhotosFolder = ALL_FROM_PHOTOS[slug];
    const overrideSourceDir = overridePhotosFolder ? path.join(PHOTOS_ROOT, overridePhotosFolder) : null;
    if (overrideSourceDir && !fs.existsSync(overrideSourceDir)) {
      console.warn('Override photos folder missing for', slug, 'at', overrideSourceDir);
      continue;
    }
    const filenames = overridePhotosFolder
      ? fs
          .readdirSync(overrideSourceDir)
          .filter((name) => IMG_EXT.test(name))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      : listImageFilesFromProjectHtml(html);
    if (!filenames.length) {
      console.warn('No <img src="../images/..."> found for', slug);
      continue;
    }

    const destDir = path.join(PUBLIC_MEDIA, slug);
    fs.mkdirSync(destDir, { recursive: true });
    const copied = [];

    for (const name of filenames) {
      const srcFile = overrideSourceDir ? path.join(overrideSourceDir, name) : path.join(WEBFLOW_IMAGES, name);
      if (!fs.existsSync(srcFile)) {
        missingOnDisk.push({ slug, name });
        continue;
      }
      fs.copyFileSync(srcFile, path.join(destDir, name));
      copied.push(name);
    }

    if (copied.length) manifest[slug] = copied;
  }

  if (skippedRule.length) {
    console.log('Skipped (no gallery / video-only in Webflow HTML):', skippedRule.length, 'projects');
  }
  if (missingOnDisk.length) {
    const sample = missingOnDisk.slice(0, 8).map((x) => `${x.slug}: ${x.name}`);
    console.warn('Missing under Original/HTML/images/:', missingOnDisk.length, 'files', sample.length ? `e.g. ${sample.join('; ')}` : '');
  }

  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Synced Webflow images for', Object.keys(manifest).length, 'projects');
}

main();
