import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const svgSource = path.join(rootDir, 'public', 'icons', 'logo.svg');
const svgBuffer = fs.readFileSync(svgSource);

async function createIcoFromPngs(pngBuffers, sizes) {
  // ICO header: 6 bytes
  // 2 bytes reserved (0), 2 bytes type (1 for ICO), 2 bytes count
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  // Directory entries: 16 bytes each
  const dirSize = 16 * count;
  let offset = 6 + dirSize;

  const dirBuffers = [];
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    dirBuffers.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirBuffers, ...pngBuffers]);
}

async function run() {
  console.log('Generating favicon icons with sharp...');

  const sizes = [16, 32, 48];
  const pngBuffers = [];

  for (const s of sizes) {
    const png = await sharp(svgBuffer, { density: 300 })
      .resize(s, s)
      .png()
      .toBuffer();
    pngBuffers.push(png);
  }

  const icoBuffer = await createIcoFromPngs(pngBuffers, sizes);

  // Write ICOs
  fs.writeFileSync(path.join(rootDir, 'public', 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(rootDir, 'app', 'favicon.ico'), icoBuffer);

  // Also write 180x180 apple-icon and 32x32 png
  const icon32 = await sharp(svgBuffer, { density: 300 }).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(rootDir, 'public', 'favicon-32x32.png'), icon32);
  fs.writeFileSync(path.join(rootDir, 'app', 'icon.png'), icon32);

  const appleIcon = await sharp(svgBuffer, { density: 300 }).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(rootDir, 'app', 'apple-icon.png'), appleIcon);

  // Also copy SVG to app/icon.svg for modern browsers
  fs.copyFileSync(svgSource, path.join(rootDir, 'app', 'icon.svg'));

  console.log('Successfully generated favicons (.ico, .png, .svg)!');
}

run().catch(console.error);
