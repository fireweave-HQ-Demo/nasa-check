/** Deterministic placeholder "space" images as SVG data URIs, so mocks work fully offline. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10_000) / 10_000;
  };
}

export function spaceArt(seed: string, width = 960, height = 640): string {
  const r = rng(hash(seed));
  const hueA = Math.floor(r() * 360);
  const hueB = (hueA + 60 + Math.floor(r() * 120)) % 360;
  const cx = Math.floor(width * (0.3 + r() * 0.4));
  const cy = Math.floor(height * (0.3 + r() * 0.4));
  const stars = Array.from({ length: 90 }, () => {
    const x = Math.floor(r() * width);
    const y = Math.floor(r() * height);
    const rad = (r() * 1.6 + 0.3).toFixed(2);
    const o = (r() * 0.7 + 0.3).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${rad}" fill="#fff" opacity="${o}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><radialGradient id="g" cx="${cx}" cy="${cy}" r="${Math.max(width, height) * 0.6}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="hsl(${hueA},85%,62%)" stop-opacity=".95"/><stop offset=".35" stop-color="hsl(${hueB},70%,35%)" stop-opacity=".7"/><stop offset="1" stop-color="#050814"/></radialGradient></defs><rect width="100%" height="100%" fill="#050814"/><rect width="100%" height="100%" fill="url(#g)"/>${stars}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
