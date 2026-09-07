// Fictional presentation values. Never use as operational or forecast data.
export function stormFrame(hour: number) {
  const t = Math.max(0, Math.min(24, Number.isFinite(hour) ? hour : 0));
  const knots = [
    [0, 32, 5],
    [8, 90, 45],
    [12, 128, 75],
    [16, 82, 30],
    [24, 20, 0],
  ];
  const right = knots.findIndex((k) => k[0] > t),
    i = right < 0 ? knots.length - 2 : Math.max(0, right - 1);
  const a = knots[i],
    b = knots[i + 1],
    p = (t - a[0]) / (b[0] - a[0]);
  return {
    hour: t,
    phase: t < 8 ? 'approach' : t < 16 ? 'peak' : 'recovery',
    wind: Math.round(a[1] + (b[1] - a[1]) * p),
    rain: Math.round(a[2] + (b[2] - a[2]) * p),
    direction: Math.round(65 + (t / 24) * 155),
  };
}
export function demoStatus(
  index: number,
  hour: number,
): 'online' | 'standby' | 'offline' {
  const { hour: t, phase } = stormFrame(hour);
  if (phase === 'approach') return index % 5 === 0 ? 'standby' : 'online';
  if (phase === 'peak')
    return index % 4 === 0 ? 'offline' : index % 4 === 1 ? 'standby' : 'online';
  return t < 20 && index % 7 === 0
    ? 'offline'
    : index % 6 === 0
      ? 'standby'
      : 'online';
}
