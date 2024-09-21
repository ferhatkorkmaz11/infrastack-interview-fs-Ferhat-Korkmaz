import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';

const MetricsClient = dynamic(() => import('@/components/MetricsDisplay').then(mod => mod.default as ComponentType), { ssr: false });

export default function MetricsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MetricsClient />
    </Suspense>
  );
}