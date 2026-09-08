import { scopedOwner, requestMunicipio } from '@/lib/municipalities';
import { effectiveInventory, publicationRows } from '@/lib/inventory-server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  let owner: string | null;
  try {
    owner = scopedOwner(request);
    requestMunicipio(request);
  } catch {
    return Response.json({ error: 'Unknown municipality' }, { status: 400 });
  }
  if (!owner)
    return Response.json(
      { error: 'Browser session unavailable. Reload to retry.' },
      { status: 401 },
    );
  try {
    return Response.json(
      effectiveInventory(
        await publicationRows(owner),
        requestMunicipio(request),
      ),
      {
        headers: { 'Cache-Control': 'private, no-store' },
      },
    );
  } catch {
    return Response.json(
      { error: 'Published inventory is unavailable. Reload to retry.' },
      { status: 503 },
    );
  }
}
