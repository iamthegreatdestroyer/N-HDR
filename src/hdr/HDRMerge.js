/**
 * HDRMerge — merge multi-exposure images into a linear HDR float32 buffer.
 * Uses hat (tent) weighting so under/over-exposed pixels contribute less.
 */

/** Hat weighting function: w(z) peaks at mid-grey (127) and tapers to 0 at 0 and 255. */
function hatWeight(z) {
  const mid = 127.5;
  return 1.0 - Math.abs((z - mid) / mid);
}

/**
 * Merge 3+ exposure images into an HDR float32 buffer.
 * @param {Array<{image: Buffer, ev: number}>} exposures
 *   Each entry is a raw interleaved RGB Buffer (width*height*3 bytes) + exposure value in EV stops.
 *   ev=0 is "normal", ev=-2 is 2 stops under, ev=+2 is 2 stops over.
 * @param {number} width  image width in pixels
 * @param {number} height image height in pixels
 * @returns {Float32Array} interleaved R,G,B HDR values (linear light, un-tone-mapped)
 */
export function mergeToHDR(exposures, width, height) {
  if (!exposures || exposures.length < 3) {
    throw new Error('mergeToHDR requires at least 3 exposures');
  }

  const pixels = width * height;
  const hdr = new Float32Array(pixels * 3);
  const weights = new Float32Array(pixels * 3);

  for (const { image, ev } of exposures) {
    const scale = Math.pow(2, -ev); // convert pixel to linear-light luminance
    for (let i = 0; i < pixels * 3; i++) {
      const z = image[i] & 0xff;
      const w = hatWeight(z);
      if (w <= 0) continue;
      const linearValue = (z / 255.0) * scale;
      hdr[i] += w * linearValue;
      weights[i] += w;
    }
  }

  // Normalise by accumulated weight; fall back to mean of all exposures where weight==0
  for (let i = 0; i < pixels * 3; i++) {
    if (weights[i] > 0) {
      hdr[i] /= weights[i];
    } else {
      // all pixels were clipped — average raw values
      let sum = 0;
      for (const { image, ev } of exposures) {
        const z = image[i] & 0xff;
        sum += (z / 255.0) * Math.pow(2, -ev);
      }
      hdr[i] = sum / exposures.length;
    }
  }

  return hdr;
}
