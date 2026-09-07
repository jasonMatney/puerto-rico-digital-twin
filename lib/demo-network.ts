// Demo topology inferred from proximity and category; not verified dependencies.
export type NetworkNode = { id: string; kind: string; coordinates: number[] };
export type NetworkEdge = { from: string; to: string };
export function buildDemoNetwork(nodes: NetworkNode[]): NetworkEdge[] {
  const candidates = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const targets: Record<string, string> = {
    shelter: 'health',
    health: 'fire',
    police: 'fire',
    siren: 'police',
  };
  return candidates.flatMap((n) => {
    const nearest = candidates
      .filter((c) => c.id !== n.id && c.kind === targets[n.kind])
      .sort((a, b) => {
        const distance = (p: NetworkNode) =>
          (p.coordinates[0] - n.coordinates[0]) ** 2 +
          (p.coordinates[1] - n.coordinates[1]) ** 2;
        return distance(a) - distance(b) || a.id.localeCompare(b.id);
      })[0];
    return nearest ? [{ from: n.id, to: nearest.id }] : [];
  });
}
export function dependencyDepths(
  edges: NetworkEdge[],
  root: string,
): Map<string, number> {
  const depth = new Map([[root, 0]]),
    queue = [root];
  for (let i = 0; i < queue.length; i++)
    for (const e of edges)
      if (e.to === queue[i] && !depth.has(e.from)) {
        depth.set(e.from, depth.get(queue[i])! + 1);
        queue.push(e.from);
      }
  return depth;
}
export function networkStatus(
  id: string,
  hour: number,
  depths: Map<string, number>,
): 'online' | 'standby' | 'offline' {
  const depth = depths.get(id);
  if (depth === undefined || hour < 12 || hour >= 24) return 'online';
  if (hour >= 18 + Math.min(depth, 5)) return 'online';
  return hour >= 12 + Math.min(depth, 5) * 0.5 ? 'offline' : 'standby';
}
