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
  /** Cloudinary hosted video embed URL */
  cloudinaryEmbedUrl?: string;
  /** Direct Cloudinary MP4 URL used for muted autoplay card previews */
  cloudinaryPreviewVideoUrl?: string;
  /** Cloudinary JPEG thumbnail URL used as video poster */
  cloudinaryThumbnailUrl?: string;
  /** URL path under site root (e.g. /video/foo.mp4) when using self-hosted MP4 instead of Vimeo */
  localVideo?: string;
};

/** Cloudinary embed URLs keyed by project slug. */
const CLOUDINARY_EMBED_BY_SLUG: Record<string, string> = {
  'winter-sticks':
    'https://player.cloudinary.com/embed/?cloud_name=dnlcsxwo7&public_id=WinterSticks_30s_emxwft&profile=cld-adaptive-stream',
  'chubbies-x-kingsford':
    'https://player.cloudinary.com/embed/?cloud_name=dnlcsxwo7&public_id=chubbies-shorts-tailgate_qqg1as&profile=cld-adaptive-stream',
};

/** Public URL path after sync-media — disables Vimeo for that slug */
const LOCAL_VIDEO_BY_SLUG: Record<string, string> = {};

function cloudinaryPreviewVideoUrl(embedUrl: string | undefined): string | undefined {
  if (!embedUrl) return undefined;
  try {
    const url = new URL(embedUrl);
    const cloudName = url.searchParams.get('cloud_name');
    const publicId = url.searchParams.get('public_id');
    if (!cloudName || !publicId) return undefined;
    return `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_auto/${encodeURIComponent(publicId)}.mp4`;
  } catch {
    return undefined;
  }
}

function cloudinaryThumbnailUrl(embedUrl: string | undefined): string | undefined {
  if (!embedUrl) return undefined;
  try {
    const url = new URL(embedUrl);
    const cloudName = url.searchParams.get('cloud_name');
    const publicId = url.searchParams.get('public_id');
    if (!cloudName || !publicId) return undefined;
    return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,f_jpg,q_auto/${encodeURIComponent(publicId)}.jpg`;
  } catch {
    return undefined;
  }
}

export function loadProjects(): Project[] {
  const manifest = mediaManifest as Record<string, string[]>;
  const hydrated = (projectsJson as Omit<Project, 'gallery' | 'cloudinaryEmbedUrl' | 'cloudinaryPreviewVideoUrl' | 'localVideo'>[]).map((p) => {
    const cloudinaryEmbedUrl = CLOUDINARY_EMBED_BY_SLUG[p.slug];
    const cloudinaryVideoUrl = cloudinaryPreviewVideoUrl(cloudinaryEmbedUrl);
    const cloudinaryThumbUrl = cloudinaryThumbnailUrl(cloudinaryEmbedUrl);
    const localVideo = LOCAL_VIDEO_BY_SLUG[p.slug];
    return {
      ...p,
      title: formatTitle(p.slug, p.title),
      dateLabel: formatDateLabel(p.dateLabel),
      location: formatLocation(p.slug, p.location),
      vimeo: cloudinaryEmbedUrl || localVideo ? [] : p.vimeo,
      ...(cloudinaryEmbedUrl ? { cloudinaryEmbedUrl } : {}),
      ...(cloudinaryVideoUrl ? { cloudinaryPreviewVideoUrl: cloudinaryVideoUrl } : {}),
      ...(cloudinaryThumbUrl ? { cloudinaryThumbnailUrl: cloudinaryThumbUrl } : {}),
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
  'kickstart-joy',
  'athletics-canada-i-dont-do-easy',
  'july-on-a-boat',
  'phildev-a-farmers-son',
  'stanford-alumni-association-welcome-to-the-family',
  'leaveyourlegacy',
  'field-maintenance',
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
