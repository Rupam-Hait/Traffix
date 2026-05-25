const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const crcTable = new Uint32Array(256).map((_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
};

const insidePolygon = (x, y, points) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};

const distanceToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length));
  const x = ax + t * dx;
  const y = ay + t * dy;
  return Math.hypot(px - x, py - y);
};

const setPixel = (pixels, size, x, y, rgba) => {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const offset = (Math.floor(y) * size + Math.floor(x)) * 4;
  pixels[offset] = rgba[0];
  pixels[offset + 1] = rgba[1];
  pixels[offset + 2] = rgba[2];
  pixels[offset + 3] = rgba[3];
};

const drawIcon = (size) => {
  const pixels = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const hexRadius = size * 0.36;
  const hex = Array.from({ length: 6 }, (_, index) => {
    const angle = Math.PI / 6 + (Math.PI * 2 * index) / 6;
    return [center + Math.cos(angle) * hexRadius, center + Math.sin(angle) * hexRadius];
  });
  const route = [
    [size * 0.28, size * 0.61],
    [size * 0.43, size * 0.44],
    [size * 0.56, size * 0.56],
    [size * 0.72, size * 0.36],
  ];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const vignette = 1 - Math.min(0.72, Math.hypot(x - center, y - center) / center);
      const base = Math.floor(10 + vignette * 18);
      setPixel(pixels, size, x, y, [5, base, 28 + Math.floor(vignette * 28), 255]);

      const inHex = insidePolygon(x, y, hex);
      const edgeDistance = Math.abs(Math.hypot(x - center, y - center) - hexRadius);
      if (inHex) {
        setPixel(pixels, size, x, y, [0, 45 + Math.floor(vignette * 40), 62 + Math.floor(vignette * 70), 255]);
      }
      if (edgeDistance < size * 0.018) {
        setPixel(pixels, size, x, y, [0, 245, 255, 255]);
      }

      for (let i = 0; i < route.length - 1; i += 1) {
        const distance = distanceToSegment(x, y, route[i][0], route[i][1], route[i + 1][0], route[i + 1][1]);
        if (distance < size * 0.022) {
          setPixel(pixels, size, x, y, [226, 240, 255, 255]);
        } else if (distance < size * 0.045) {
          setPixel(pixels, size, x, y, [0, 245, 255, 180]);
        }
      }
    }
  }

  route.forEach(([x, y], index) => {
    const radius = index === 0 || index === route.length - 1 ? size * 0.05 : size * 0.035;
    for (let py = y - radius; py <= y + radius; py += 1) {
      for (let px = x - radius; px <= x + radius; px += 1) {
        if (Math.hypot(px - x, py - y) <= radius) {
          setPixel(pixels, size, px, py, index === route.length - 1 ? [191, 0, 255, 255] : [0, 255, 136, 255]);
        }
      }
    }
  });

  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    scanlines[rowStart] = 0;
    pixels.copy(scanlines, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(scanlines)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

[192, 512].forEach((size) => {
  const output = path.join(__dirname, '..', 'public', `icon-${size}.png`);
  fs.writeFileSync(output, drawIcon(size));
  console.log(`Generated ${output}`);
});
