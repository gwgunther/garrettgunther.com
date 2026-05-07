import projectsJson from '../data/projects.json';
import mediaManifest from '../data/media-manifest.json';
import { formatDateLabel, formatLocation, formatTitle } from './formatDisplay';

export type Project = {
  slug: string;
  title: string;
  dateLabel: string;
  location: string;
  sortDate: string;
  vimeo: string[];
  youtube: string[];
  gallery: string[];
  /** URL path under site root (e.g. /video/foo.mp4) when using self-hosted MP4 instead of Vimeo */
  localVideo?: string;
};

/** Public URL path after sync-media — disables Vimeo for that slug */
const LOCAL_VIDEO_BY_SLUG: Record<string, string> = {
  'winter-sticks': '/video/winter-sticks.mp4',
};

export function loadProjects(): Project[] {
  const manifest = mediaManifest as Record<string, string[]>;
  const hydrated = (projectsJson as Omit<Project, 'gallery' | 'localVideo'>[]).map((p) => {
    const localVideo = LOCAL_VIDEO_BY_SLUG[p.slug];
    return {
      ...p,
      title: formatTitle(p.slug, p.title),
      dateLabel: formatDateLabel(p.dateLabel),
      location: formatLocation(p.slug, p.location),
      vimeo: localVideo ? [] : p.vimeo,
      ...(localVideo ? { localVideo } : {}),
      gallery: manifest[p.slug] ?? [],
    };
  });

  // Merge Al-Fatiha into Qargha Refugee Camp as a single project.
  const qargha = hydrated.find((p) => p.slug === 'qargha-refugee-camp');
  const alFatiha = hydrated.find((p) => p.slug === 'al-fatiha');
  if (qargha && alFatiha) {
    qargha.vimeo = [...new Set([...qargha.vimeo, ...alFatiha.vimeo])];
    qargha.youtube = [...new Set([...qargha.youtube, ...alFatiha.youtube])];
  }
  return hydrated.filter((p) => p.slug !== 'al-fatiha');
}

export function projectYears(projects: Project[]): number[] {
  const ys = new Set(projects.map((p) => new Date(p.sortDate).getFullYear()));
  return [...ys].sort((a, b) => b - a);
}

/** Curated homepage selection (order preserved). Revise anytime. */
export const FEATURED_SLUGS: string[] = [
  'winter-sticks',
  'qargha-refugee-camp',
  'venture-boldly',
  'nishika-2k19',
  'cote-dazur',
  'kickstart-joy',
  'chez-dede-the-roman-journey',
  'wadi-rum',
  'kabul',
];

export function featuredProjects(all: Project[]): Project[] {
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const out: Project[] = [];
  for (const slug of FEATURED_SLUGS) {
    const p = bySlug.get(slug);
    if (p) out.push(p);
  }
  return out;
}
