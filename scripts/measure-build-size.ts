import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const nextDir = path.join(process.cwd(), '.next');

function getFileSize(relPath: string): { raw: number; gz: number } {
  const cleanRel = relPath.replace(/^\/_next\//, '');
  const fullPath = path.join(nextDir, cleanRel);
  if (!fs.existsSync(fullPath)) {
    return { raw: 0, gz: 0 };
  }
  const buf = fs.readFileSync(fullPath);
  return {
    raw: buf.length,
    gz: zlib.gzipSync(buf).length,
  };
}

function measureHtmlRoute(htmlPath: string) {
  if (!fs.existsSync(htmlPath)) return null;
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Extract all script src="/_next/static/chunks/..."
  const scriptRegex = /src="(\/_next\/static\/chunks\/[^"]+\.js)"/g;
  const scripts = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.add(match[1]);
  }

  // Extract all preloaded fonts from html or rsc
  const rscPath = htmlPath.replace(/\.html$/, '.rsc');
  const combined = html + (fs.existsSync(rscPath) ? fs.readFileSync(rscPath, 'utf-8') : '');
  const fontRegex = /\/_next\/static\/media\/[^"'\s)]+/g;
  const preloadedFonts = new Set<string>();
  while ((match = fontRegex.exec(combined)) !== null) {
    preloadedFonts.add(match[0]);
  }

  const hasPuterInHtml = html.includes('js.puter.com');

  let totalRaw = 0;
  let totalGz = 0;
  const chunkDetails: Array<{ chunk: string; rawKB: number; gzKB: number }> = [];

  for (const s of scripts) {
    const sz = getFileSize(s);
    totalRaw += sz.raw;
    totalGz += sz.gz;
    chunkDetails.push({
      chunk: s.replace('/_next/static/chunks/', ''),
      rawKB: +(sz.raw / 1024).toFixed(2),
      gzKB: +(sz.gz / 1024).toFixed(2),
    });
  }

  let preloadedFontRaw = 0;
  for (const f of preloadedFonts) {
    preloadedFontRaw += getFileSize(f).raw;
  }

  const includeDetails = process.argv.includes('--details');
  return {
    scriptCount: scripts.size,
    firstLoadRawKB: +(totalRaw / 1024).toFixed(2),
    firstLoadGzKB: +(totalGz / 1024).toFixed(2),
    preloadedFontCount: preloadedFonts.size,
    preloadedFontKB: +(preloadedFontRaw / 1024).toFixed(2),
    hasPuterInHtml,
    ...(includeDetails ? { chunkDetails } : {}),
  };
}

const routesToMeasure: Array<{ route: string; htmlFile: string }> = [
  { route: '/', htmlFile: 'index.html' },
  { route: '/jobs', htmlFile: 'jobs.html' },
  { route: '/pricing', htmlFile: 'pricing.html' },
  { route: '/builder', htmlFile: 'builder.html' },
  { route: '/cover-letter', htmlFile: 'cover-letter.html' },
  { route: '/dashboard', htmlFile: 'dashboard.html' },
  { route: '/review', htmlFile: 'review.html' },
  { route: '/login', htmlFile: 'login.html' },
];

const routeResults: Record<string, any> = {};
for (const r of routesToMeasure) {
  const htmlPath = path.join(nextDir, 'server', 'app', r.htmlFile);
  routeResults[r.route] = measureHtmlRoute(htmlPath);
}

// Media (font) files in .next/static/media
const mediaDir = path.join(nextDir, 'static', 'media');
const mediaFiles = fs.existsSync(mediaDir)
  ? fs.readdirSync(mediaDir).map((f) => {
      const st = fs.statSync(path.join(mediaDir, f));
      return { file: f, ext: path.extname(f), kb: +(st.size / 1024).toFixed(2) };
    })
  : [];

const totalMediaKB = +mediaFiles.reduce((acc, m) => acc + m.kb, 0).toFixed(2);
const ttfFiles = mediaFiles.filter((m) => m.ext === '.ttf');
const woff2Files = mediaFiles.filter((m) => m.ext === '.woff2');
const preloadedMediaFiles = mediaFiles.filter((m) => m.file.includes('-s.p.'));
const preloadedMediaKB = +preloadedMediaFiles.reduce((acc, m) => acc + m.kb, 0).toFixed(2);

// Public fonts directory
const pubFontDir = path.join(process.cwd(), 'public', 'fonts', 'ibm-plex-sans-arabic');
const pubFontFiles = fs.existsSync(pubFontDir)
  ? fs.readdirSync(pubFontDir).map((f) => ({
      file: f,
      kb: +(fs.statSync(path.join(pubFontDir, f)).size / 1024).toFixed(2),
    }))
  : [];

console.log('=== BUILD MEASUREMENT REPORT ===');
console.log(
  JSON.stringify(
    {
      routes: routeResults,
      fonts: {
        totalMediaFiles: mediaFiles.length,
        totalMediaKB,
        preloadedMediaCount: preloadedMediaFiles.length,
        preloadedMediaKB,
        ttfCount: ttfFiles.length,
        ttfKB: +ttfFiles.reduce((a, b) => a + b.kb, 0).toFixed(2),
        woff2Count: woff2Files.length,
        woff2KB: +woff2Files.reduce((a, b) => a + b.kb, 0).toFixed(2),
        publicFonts: pubFontFiles,
      },
    },
    null,
    2
  )
);
