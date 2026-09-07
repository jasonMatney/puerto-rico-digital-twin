import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDemoNetwork, dependencyDepths, networkStatus } from '../lib/demo-network.ts';

for (const [path, count] of [['public/data/facilities.geojson', 31], ['public/data/catano/facilities.geojson', 6]]) {
  const features = JSON.parse(readFileSync(path, 'utf8')).features;
  const nodes = features.map(f => ({ id: f.properties.id, kind: f.properties.kind, coordinates: f.geometry.coordinates }));
  assert.equal(nodes.length, count);
  const before = JSON.stringify(nodes);
  const edges = buildDemoNetwork(nodes);
  assert.deepEqual(edges, buildDemoNetwork([...nodes].reverse()));
  assert.equal(JSON.stringify(nodes), before);
  assert(edges.length > 0);
  for (const edge of edges) {
    assert.notEqual(edge.from, edge.to);
    assert(nodes.some(n => n.id === edge.to));
  }
  const root = nodes.find(n => n.kind === 'fire').id;
  const depths = dependencyDepths(edges, root);
  assert(depths.size > 1);
  assert.equal(networkStatus(root, 11.9, depths), 'online');
  assert.equal(networkStatus(root, 12, depths), 'offline');
  assert.equal(networkStatus(root, 18, depths), 'online');
  const dependent = [...depths].find(([, d]) => d === 1)[0];
  assert.equal(networkStatus(dependent, 12, depths), 'standby');
  assert.equal(networkStatus(dependent, 12.5, depths), 'offline');
  assert.equal(networkStatus(dependent, 18, depths), 'offline');
  assert.equal(networkStatus(dependent, 19, depths), 'online');
  for (const node of nodes) assert.equal(networkStatus(node.id, 24, depths), 'online');
  assert.equal(networkStatus('unrelated', 13, depths), 'online');
}
assert.equal(dependencyDepths([{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }], 'a').size, 2);
console.log('PASS: both municipal inventories, deterministic topology, outage propagation, recovery, cycle handling and input preservation.');
