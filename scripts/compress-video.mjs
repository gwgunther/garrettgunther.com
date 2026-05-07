import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

function fail(message) {
  console.error(`[compress-video] ${message}`);
  process.exit(1);
}

function usage() {
  console.log(
    [
      'Usage:',
      '  npm run compress-video -- <input.mp4> [output.mp4]',
      '',
      'Examples:',
      '  npm run compress-video -- media-source/video/WinterSticks_30s.mp4',
      '  npm run compress-video -- media-source/video/raw.mp4 media-source/video/raw.web.mp4',
    ].join('\n'),
  );
}

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(args.length === 0 ? 1 : 0);
}

const inputPath = path.resolve(args[0]);
const outputPath = args[1]
  ? path.resolve(args[1])
  : path.join(
      path.dirname(inputPath),
      `${path.basename(inputPath, path.extname(inputPath))}.web.mp4`,
    );

if (!fs.existsSync(inputPath)) fail(`Input file not found: ${inputPath}`);
if (path.extname(inputPath).toLowerCase() !== '.mp4') {
  fail('Input must be an .mp4 file.');
}
if (inputPath === outputPath) {
  fail('Output path must be different from input path.');
}

const ffmpegArgs = [
  '-y',
  '-i',
  inputPath,
  '-c:v',
  'libx264',
  '-preset',
  'slow',
  '-profile:v',
  'high',
  '-level',
  '4.1',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  '-vf',
  "scale='min(1920,iw)':-2",
  '-r',
  '30',
  '-b:v',
  '5200k',
  '-maxrate',
  '5800k',
  '-bufsize',
  '11600k',
  '-c:a',
  'aac',
  '-b:a',
  '128k',
  '-ac',
  '2',
  '-ar',
  '48000',
  outputPath,
];

console.log(`[compress-video] Encoding:\n  in:  ${inputPath}\n  out: ${outputPath}`);
const result = spawnSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

if (result.error) fail(`Failed to run ffmpeg: ${result.error.message}`);
if (result.status !== 0) process.exit(result.status ?? 1);

const inputBytes = fs.statSync(inputPath).size;
const outputBytes = fs.statSync(outputPath).size;
const toMb = (n) => (n / 1024 / 1024).toFixed(1);

console.log(
  `[compress-video] Done. ${toMb(inputBytes)}MB -> ${toMb(outputBytes)}MB (${(
    (outputBytes / inputBytes) *
    100
  ).toFixed(1)}%).`,
);
