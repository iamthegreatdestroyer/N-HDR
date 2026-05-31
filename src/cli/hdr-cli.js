#!/usr/bin/env node
/**
 * N-HDR CLI — merge exposures and tone-map HDR images.
 *
 *   node dist/index.js merge -i low.jpg mid.jpg high.jpg -o result.hdr
 *   node dist/index.js tonemap -i result.hdr -o result.jpg --method=filmic
 */

import { readFileSync, writeFileSync } from 'fs';
import { mergeToHDR } from '../hdr/HDRMerge.js';
import { toneMap }    from '../hdr/ToneMapper.js';
import { neuralEnhance } from '../hdr/NeuralEnhancer.js';

// ─── argument parser (no deps) ────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) { args[k] = v; }
      else { args[k] = argv[++i] ?? true; }
    } else if (a.startsWith('-') && a.length === 2) {
      args[a.slice(1)] = argv[++i] ?? true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
async function getImagePixels(filePath, expectedWidth, expectedHeight) {
  const { Jimp } = await import('jimp');
  const img = await Jimp.read(filePath);
  img.resize({ w: expectedWidth, h: expectedHeight });
  const buf = Buffer.alloc(expectedWidth * expectedHeight * 3);
  for (let y = 0; y < expectedHeight; y++) {
    for (let x = 0; x < expectedWidth; x++) {
      const pixel = img.getPixelColor(x, y);
      const idx = (y * expectedWidth + x) * 3;
      buf[idx]     = (pixel >>> 24) & 0xff; // R
      buf[idx + 1] = (pixel >>> 16) & 0xff; // G
      buf[idx + 2] = (pixel >>>  8) & 0xff; // B
    }
  }
  return buf;
}

async function saveJpeg(sdr, width, height, outPath) {
  const { Jimp } = await import('jimp');
  const img = new Jimp({ width, height, color: 0x000000ff });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const r = sdr[idx], g = sdr[idx + 1], b = sdr[idx + 2];
      img.setPixelColor(((r << 24) | (g << 16) | (b << 8) | 0xff) >>> 0, x, y);
    }
  }
  await img.write(outPath);
}

// ─── HDR file format: JSON header + raw float32 buffer ───────────────────────
function saveHDRFile(hdr, width, height, outPath) {
  const header = JSON.stringify({ width, height, channels: 3 });
  const headerBuf = Buffer.from(header + '\n');
  const dataBuf   = Buffer.from(hdr.buffer);
  writeFileSync(outPath, Buffer.concat([headerBuf, dataBuf]));
}

function loadHDRFile(filePath) {
  const raw = readFileSync(filePath);
  const nl  = raw.indexOf(0x0a);
  const header = JSON.parse(raw.slice(0, nl).toString());
  const dataBuf = raw.slice(nl + 1);
  const hdr = new Float32Array(dataBuf.buffer, dataBuf.byteOffset, dataBuf.length / 4);
  return { hdr, ...header };
}

// ─── commands ────────────────────────────────────────────────────────────────
async function cmdMerge(args) {
  const inputs = Array.isArray(args.i) ? args.i : [args.i];
  const output = args.o;
  if (!inputs.length || !output) {
    console.error('Usage: merge -i img1.jpg img2.jpg img3.jpg -o result.hdr');
    process.exit(1);
  }

  // Auto-detect size from first image
  const { Jimp } = await import('jimp');
  const first = await Jimp.read(inputs[0]);
  const width  = first.width;
  const height = first.height;

  // EV values: spread from -2 to +2 across all inputs
  const evStep = inputs.length > 1 ? 4 / (inputs.length - 1) : 0;
  const exposures = await Promise.all(inputs.map(async (p, idx) => ({
    image: await getImagePixels(p, width, height),
    ev: -2 + idx * evStep,
  })));

  const hdr = mergeToHDR(exposures, width, height);
  saveHDRFile(hdr, width, height, output);
  console.log(`Merged ${inputs.length} exposures → ${output} (${width}x${height})`);
}

async function cmdTonemap(args) {
  const input  = args.i;
  const output = args.o;
  const method = args.method || 'reinhard';
  const enhance = args.enhance !== undefined;

  if (!input || !output) {
    console.error('Usage: tonemap -i result.hdr -o result.jpg [--method=filmic] [--enhance]');
    process.exit(1);
  }

  const { hdr, width, height } = loadHDRFile(input);
  let sdr = toneMap(hdr, method, width, height);
  if (enhance) sdr = await neuralEnhance(sdr);
  await saveJpeg(sdr, width, height, output);
  console.log(`Tone-mapped (${method}) → ${output}`);
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd  = args._[0];

  switch (cmd) {
    case 'merge':   await cmdMerge(args);   break;
    case 'tonemap': await cmdTonemap(args); break;
    default:
      console.log('N-HDR Neural HDR Imaging Pipeline');
      console.log('  merge   -i img1 img2 img3 -o out.hdr');
      console.log('  tonemap -i in.hdr -o out.jpg [--method=reinhard|filmic|aces] [--enhance]');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
