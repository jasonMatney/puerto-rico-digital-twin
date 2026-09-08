import { notFound } from 'next/navigation';
import Atlas from '@/app/atlas';
import { isMunicipio, type Municipio } from '@/lib/municipalities';
export const dynamic = 'force-dynamic';
async function MunicipalAtlas({ municipio }: { municipio: Municipio }) {
  return <Atlas municipio={municipio} />;
}
export default async function MunicipalityPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  if (!isMunicipio(municipio)) notFound();
  return <MunicipalAtlas municipio={municipio} />;
}
