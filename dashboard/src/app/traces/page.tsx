import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const TracesClient = dynamic(() => import('@/components/TracesClient'), { ssr: false });

export default function TracesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TracesClient />
    </Suspense>
  );
}