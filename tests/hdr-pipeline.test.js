/**
 * HDR pipeline tests: HDRMerge, ToneMapper, NeuralEnhancer
 */

import { mergeToHDR }    from '../src/hdr/HDRMerge.js';
import { toneMap }       from '../src/hdr/ToneMapper.js';
import { neuralEnhance } from '../src/hdr/NeuralEnhancer.js';

const WIDTH  = 64;
const HEIGHT = 64;
const PIXELS = WIDTH * HEIGHT;

// ─── synthetic exposure fixture ───────────────────────────────────────────────
function makeExposure(brightness) {
  // brightness 0–255, solid-color image
  const buf = Buffer.alloc(PIXELS * 3);
  buf.fill(brightness);
  return buf;
}

const EXPOSURES = [
  { image: makeExposure(60),  ev: -2 }, // under-exposed
  { image: makeExposure(128), ev:  0 }, // normal
  { image: makeExposure(200), ev: +2 }, // over-exposed
];

// ─── tests ───────────────────────────────────────────────────────────────────

describe('HDR Pipeline', () => {

  // 1. mergeToHDR → correct output length
  test('mergeToHDR produces Float32Array of length width*height*3', () => {
    const hdr = mergeToHDR(EXPOSURES, WIDTH, HEIGHT);
    expect(hdr).toBeInstanceOf(Float32Array);
    expect(hdr.length).toBe(PIXELS * 3);
  });

  // 2. toneMap reinhard → all values in [0,255]
  test('toneMap reinhard → all values in [0, 255]', () => {
    const hdr = mergeToHDR(EXPOSURES, WIDTH, HEIGHT);
    const sdr = toneMap(hdr, 'reinhard', WIDTH, HEIGHT);
    expect(sdr).toBeInstanceOf(Uint8Array);
    expect(sdr.length).toBe(PIXELS * 3);
    for (const v of sdr) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(255);
    }
  });

  // 3. toneMap filmic → output differs from reinhard
  test('toneMap filmic output differs from reinhard', () => {
    const hdr = mergeToHDR(EXPOSURES, WIDTH, HEIGHT);
    const reinhard = toneMap(hdr, 'reinhard', WIDTH, HEIGHT);
    const filmic   = toneMap(hdr, 'filmic',   WIDTH, HEIGHT);
    // At least one channel value should differ
    let differs = false;
    for (let i = 0; i < reinhard.length; i++) {
      if (reinhard[i] !== filmic[i]) { differs = true; break; }
    }
    expect(differs).toBe(true);
  });

  // 4. mergeToHDR with <3 exposures throws
  test('mergeToHDR with fewer than 3 exposures throws', () => {
    expect(() => mergeToHDR([EXPOSURES[0], EXPOSURES[1]], WIDTH, HEIGHT))
      .toThrow(/at least 3/i);
    expect(() => mergeToHDR([], WIDTH, HEIGHT))
      .toThrow(/at least 3/i);
  });

  // 5. neuralEnhance passthrough → same length
  test('neuralEnhance passthrough returns same-length array', async () => {
    const hdr = mergeToHDR(EXPOSURES, WIDTH, HEIGHT);
    const sdr = toneMap(hdr, 'reinhard', WIDTH, HEIGHT);
    const out = await neuralEnhance(sdr);
    expect(out.length).toBe(sdr.length);
  });

});
