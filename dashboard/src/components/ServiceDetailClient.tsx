'use client';

import React from 'react';
import ServiceDetailContent from './ServiceDetailContent';

interface ServiceDetailClientProps {
  params: { id: string };
}

const ServiceDetailClient: React.FC<ServiceDetailClientProps> = ({ params }) => {
  return <ServiceDetailContent params={params} />;
};

export default ServiceDetailClient;