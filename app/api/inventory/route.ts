import { effectiveInventory, publicationRows } from '@/lib/inventory-server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const owner = request.headers.get('oai-authenticated-user-id');
  if (!owner)
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  try {
    return Response.json(effectiveInventory(await publicationRows(owner)), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return Response.json(
      { error: 'Published inventory is unavailable. Reload to retry.' },
      { status: 503 },
    );
  }
}
