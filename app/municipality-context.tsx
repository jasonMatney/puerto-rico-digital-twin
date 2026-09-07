'use client';
import { createContext, useContext } from 'react';
import { municipalities, type Municipio } from '@/lib/municipalities';
export const MunicipalityContext = createContext<Municipio>('toa-baja');
export function useMunicipality() {
  const slug = useContext(MunicipalityContext);
  const municipality = municipalities[slug];
  return {
    ...municipality,
    slug,
    api: (path: string) =>
      path + (path.includes('?') ? '&' : '?') + 'municipio=' + slug,
  };
}
