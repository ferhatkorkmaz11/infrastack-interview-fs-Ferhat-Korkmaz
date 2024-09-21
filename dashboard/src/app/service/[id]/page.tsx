import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ServiceDetailClient = dynamic(() => import('@/components/ServiceDetailClient'), { ssr: false });

interface ServiceDetailProps {
  params: { id: string };
}

export default function ServiceDetailPage({ params }: ServiceDetailProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ServiceDetailClient params={params} />
    </Suspense>
  );
}