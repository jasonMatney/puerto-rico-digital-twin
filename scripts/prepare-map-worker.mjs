import fs from 'node:fs/promises';
await fs.mkdir('public/vendor', { recursive: true });
for (const name of [
  'maplibre-gl-worker.mjs',
  'maplibre-gl-shared.mjs',
  'maplibre-gl-worker.mjs.map',
  'maplibre-gl-shared.mjs.map',
])
  await fs.copyFile(
    'node_modules/maplibre-gl/dist/' + name,
    'public/vendor/' + name,
  );
await fs.copyFile(
  'node_modules/maplibre-gl/LICENSE.txt',
  'public/vendor/MAPLIBRE-LICENSE.txt',
);
