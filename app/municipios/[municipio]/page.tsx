import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Atlas from '@/app/atlas';
import { isMunicipio, type Municipio } from '@/lib/municipalities';
export const dynamic = 'force-dynamic';
async function ProtectedAtlas({ municipio }: { municipio: Municipio }) {
  const h = await headers();
  if (!h.get('oai-authenticated-user-id'))
    redirect(
      '/signin-with-chatgpt?return_to=' +
        encodeURIComponent('/municipios/' + municipio),
    );
  return <Atlas municipio={municipio} />;
}
export default async function MunicipalityPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  if (!isMunicipio(municipio)) notFound();
  return <ProtectedAtlas municipio={municipio} />;
}
