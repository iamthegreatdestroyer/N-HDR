/**
 * ToneMapper — map HDR float32 buffer → SDR Uint8Array (0–255 RGB).
 * Supports reinhard, filmic (Hable/Uncharted2) and aces approximations.
 */

// ─── Reinhard ────────────────────────────────────────────────────────────────
function reinhardChannel(x) {
  return x / (1.0 + x);
}

// ─── Filmic / Uncharted-2 (John Hable) ───────────────────────────────────────
function uncharted2Partial(x) {
  const A = 0.15, B = 0.50, C = 0.10, D = 0.20, E = 0.02, F = 0.30;
  return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

function filmicChannel(x) {
  const W = 11.2; // linear white
  const exposureBias = 2.0;
  const curr = uncharted2Partial(x * exposureBias);
  const whiteScale = 1.0 / uncharted2Partial(W);
  return Math.min(1.0, curr * whiteScale);
}

// ─── ACES (Academy Color Encoding System approximation by Krzysztof Narkowicz) ─
function acesChannel(x) {
  const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return Math.min(1.0, Math.max(0.0, (x * (a * x + b)) / (x * (c * x + d) + e)));
}

/**
 * Tone-map an HDR float32 buffer to 8-bit SDR.
 * @param {Float32Array} hdr    interleaved RGB, linear light
 * @param {'reinhard'|'filmic'|'aces'} method
 * @param {number} width
 * @param {number} height
 * @returns {Uint8Array} clamped 0–255 interleaved RGB
 */
export function toneMap(hdr, method, width, height) {
  const pixels = width * height;
  const sdr = new Uint8Array(pixels * 3);

  let mapFn;
  switch (method) {
    case 'reinhard': mapFn = reinhardChannel; break;
    case 'filmic':   mapFn = filmicChannel;   break;
    case 'aces':     mapFn = acesChannel;     break;
    default: throw new Error(`Unknown tone mapping method: ${method}`);
  }

  for (let i = 0; i < pixels * 3; i++) {
    const mapped = mapFn(Math.max(0, hdr[i]));
    sdr[i] = Math.round(Math.min(255, Math.max(0, mapped * 255)));
  }

  return sdr;
}
