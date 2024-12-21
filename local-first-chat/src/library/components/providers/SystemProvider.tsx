import React, { Suspense, useMemo } from 'react';
import { Loader } from 'lucide-react';
import { PGliteProvider } from '@electric-sql/pglite-react';
import { db, pglite } from '@/dataLayer';

export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<Loader />}>
      {/* @ts-ignore*/}
      <PGliteProvider db={pglite}>{children}</PGliteProvider>
    </Suspense>
  );
};

export default SystemProvider;
