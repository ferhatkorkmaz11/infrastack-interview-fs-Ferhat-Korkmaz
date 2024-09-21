import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const LogsClient = dynamic(() => import('@/components/LogsClient'), { ssr: false });

export default function LogsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogsClient />
    </Suspense>
  );
}