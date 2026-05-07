/**
 * Title Case for display titles, dates, and locations.
 */

const TITLE_BY_SLUG: Record<string, string> = {
  'cote-dazur': "Côte d'Azur",
  'leaveyourlegacy': '#LeaveYourLegacy',
  'roominate-letgirlsbuild': 'Roominate - #LetGirlsBuild',
  'phildev-a-farmers-son': "PhilDev - A Farmer's Son",
};

const ACRONYM_WORDS: Record<string, string> = {
  ideo: 'IDEO',
  lbc: 'LBC',
  vigs: 'VIGS',
  bts: 'BTS',
  sols: 'SOLS',
  usa: 'USA',
};

export function formatDateLabel(raw: string): string {
  const s = raw.trim().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ');
  const m = s.match(/^([a-zA-Z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return s;
  const month = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  return `${month} ${m[2]}, ${m[3]}`;
}

export function formatTitle(slug: string, raw: string): string {
  const fromSlug = TITLE_BY_SLUG[slug];
  if (fromSlug) return fromSlug;

  const s = raw.trim().replace(/\u00a0/g, ' ');
  return s
    .split(/\s*[-–—]\s*/)
    .map((segment) => titleCaseSegment(segment))
    .join(' - ');
}

export function formatLocation(_slug: string, raw: string): string {
  const s = raw.trim().replace(/\u00a0/g, ' ');
  return s
    .split(',')
    .map((part) =>
      part
        .trim()
        .split('-')
        .map((h) => titleCaseSegment(h.trim()))
        .join('-')
    )
    .join(', ');
}

/** Title Case one segment (no em-dash split); handles & and spaces. */
function titleCaseSegment(segment: string): string {
  if (!segment) return segment;

  return segment
    .split(/(\s*&\s*)/)
    .map((piece) => {
      if (/^\s*&\s*$/.test(piece)) return piece.trim();
      return titleCaseWords(piece);
    })
    .join('');
}

function titleCaseWords(text: string): string {
  return text.replace(/\S+/g, (token) => {
    if (token.startsWith('#')) {
      const inner = token.slice(1);
      if (!inner) return token;
      return '#' + inner.charAt(0).toUpperCase() + inner.slice(1).toLowerCase();
    }

    if (/^\d+k\d{2,4}$/i.test(token)) {
      return token.replace(/^(\d+)k/i, (_, n) => `${n}K`);
    }

    const lower = token.toLowerCase();
    if (ACRONYM_WORDS[lower]) return ACRONYM_WORDS[lower];

    // Possessives and contractions: Farmer's, Let's, d'Azur-ish handled by single leading cap
    if (token.includes("'")) {
      const l = token.toLowerCase();
      return l.charAt(0).toUpperCase() + l.slice(1);
    }

    return capWord(token);
  });
}

function capWord(w: string): string {
  if (!w) return w;
  const lower = w.toLowerCase();
  if (ACRONYM_WORDS[lower]) return ACRONYM_WORDS[lower];
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}
