import { readFile } from 'node:fs/promises';

export async function GET() {
  const html = await readFile(`${process.cwd()}/mesh-gradient.html`, 'utf-8');

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
