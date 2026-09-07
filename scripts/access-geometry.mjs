// Local equirectangular metric projection, centered at the shelter; screening only.
export function projection(center) {
  const sy = (Math.PI * 6371008.8) / 180,
    sx = sy * Math.cos((center[1] * Math.PI) / 180);
  return {
    to: (p) => [(p[0] - center[0]) * sx, (p[1] - center[1]) * sy],
    from: (p) => [center[0] + p[0] / sx, center[1] + p[1] / sy],
  };
}
export function clipRoad(geometry, center, radius) {
  const { to, from } = projection(center),
    parts = [];
  const lines =
    geometry.type === 'LineString'
      ? [geometry.coordinates]
      : geometry.coordinates;
  for (const line of lines) {
    let part = [];
    for (let i = 1; i < line.length; i++) {
      const a = to(line[i - 1]),
        b = to(line[i]),
        d = [b[0] - a[0], b[1] - a[1]];
      const aa = d[0] ** 2 + d[1] ** 2;
      if (aa === 0) continue;
      const bb = 2 * (a[0] * d[0] + a[1] * d[1]),
        cc = a[0] ** 2 + a[1] ** 2 - radius ** 2,
        disc = bb ** 2 - 4 * aa * cc;
      if (disc <= 0) {
        if (part.length > 1) parts.push(part);
        part = [];
        continue;
      }
      const lo = Math.max(0, (-bb - Math.sqrt(disc)) / (2 * aa)),
        hi = Math.min(1, (-bb + Math.sqrt(disc)) / (2 * aa));
      if (hi <= lo) {
        if (part.length > 1) parts.push(part);
        part = [];
        continue;
      }
      const start = from([a[0] + lo * d[0], a[1] + lo * d[1]]),
        end = from([a[0] + hi * d[0], a[1] + hi * d[1]]);
      if (lo > 0 && part.length > 1) {
        parts.push(part);
        part = [];
      }
      if (!part.length) part.push(start);
      part.push(end);
      if (hi < 1) {
        parts.push(part);
        part = [];
      }
    }
    if (part.length > 1) parts.push(part);
  }
  return parts.length ? { type: 'MultiLineString', coordinates: parts } : null;
}
export function radiusRing(center, radius) {
  const { from } = projection(center),
    ring = Array.from({ length: 96 }, (_, i) =>
      from([
        radius * Math.cos((2 * Math.PI * i) / 96),
        radius * Math.sin((2 * Math.PI * i) / 96),
      ]),
    );
  ring.push(ring[0]);
  return { type: 'Polygon', coordinates: [ring] };
}
