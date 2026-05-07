/**
 * One-time / maintenance: reads Original/HTML/projects/*.html and writes src/data/projects.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const PROJECTS_DIR = path.join(ROOT, 'Original/HTML/projects');
const OUT = path.join(__dirname, '../src/data/projects.json');

function extractVimeoIdsInOrder(html) {
  const re =
    /(?:player\.vimeo\.com%2Fvideo%2F|vimeo\.com%2Fvideo%2F|player\.vimeo\.com\/video\/|vimeo\.com\/video\/)(\d+)/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  const seen = new Set();
  return out.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
}

function extractYoutubeIdsInOrder(html) {
  const re = /youtube\.com%2Fembed%2F([\w-]+)|youtube\.com\/embed\/([\w-]+)/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push((m[1] || m[2]).split('%')[0]);
  const seen = new Set();
  return out.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
}

function decodeHtmlEntities(s) {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function parseProject(html, slug) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : slug;

  const headerMatch = html.match(/class="header"[^>]*>([^<]+)</);
  const displayTitle = headerMatch ? decodeHtmlEntities(headerMatch[1].trim()) : title;

  const subTexts = [...html.matchAll(/class="sub-text"[^>]*>([^<]+)</g)].map((m) => decodeHtmlEntities(m[1].trim()));
  const dateLabel = subTexts[0] || '';
  const location = subTexts[1] || '';

  const vimeoIds = extractVimeoIdsInOrder(html);
  const youtubeIds = extractYoutubeIdsInOrder(html);

  let sortDate = new Date(0);
  const tryParse = Date.parse(dateLabel);
  if (!Number.isNaN(tryParse)) sortDate = new Date(tryParse);

  return {
    slug,
    title: displayTitle,
    dateLabel,
    location,
    sortDate: sortDate.toISOString(),
    vimeo: [...vimeoIds],
    youtube: [...youtubeIds],
  };
}

function main() {
  const files = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.html'));
  const projects = files
    .map((f) => {
      const slug = f.replace(/\.html$/, '');
      const html = fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf8');
      return parseProject(html, slug);
    })
    .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(projects, null, 2), 'utf8');
  console.log(`Wrote ${projects.length} projects to ${OUT}`);
}

main();
