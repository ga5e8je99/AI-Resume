import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * Creates an uncompressed/deflated raw PNG image with the specified width, height, and background color.
 */
function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(2, 9); // Color type 2 (Truecolor / RGB)
  ihdrData.writeUInt8(0, 10); // Compression method
  ihdrData.writeUInt8(0, 11); // Filter method
  ihdrData.writeUInt8(0, 12); // Interlace method

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image scanlines
  // Each scanline starts with filter byte 0
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Gradient effect
      const factor = (x / width) * 0.4 + (y / height) * 0.6;
      rawData[pxOffset] = Math.min(255, Math.floor(r * (0.8 + factor * 0.4)));
      rawData[pxOffset + 1] = Math.min(255, Math.floor(g * (0.8 + factor * 0.4)));
      rawData[pxOffset + 2] = Math.min(255, Math.floor(b * (0.8 + factor * 0.4)));
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Simple CRC32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('public');

// 1. og-image.png (1200x630, brand pine accent #0F5C4D rgb(15, 92, 77))
const ogBuffer = createPng(1200, 630, 15, 92, 77);
fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogBuffer);
console.log('Created public/og-image.png (1200x630)');

// 2. apple-icon.png (180x180, pine accent #0F5C4D rgb(15, 92, 77))
const appleBuffer = createPng(180, 180, 15, 92, 77);
fs.writeFileSync(path.join(publicDir, 'apple-icon.png'), appleBuffer);
console.log('Created public/apple-icon.png (180x180)');
