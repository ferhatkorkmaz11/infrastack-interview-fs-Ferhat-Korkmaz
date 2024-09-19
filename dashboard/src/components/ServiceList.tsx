'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Service {
  name: string;
  requestCount: number;
  avgLatency: number;
  errorRate: number;
}

const ServiceList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const data = await response.json();
          setServices(data);
          setError(null);
        } else {
          const errorData = await response.json();
          setError(`Failed to fetch services: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setError(`Error fetching services: ${(error as Error).message}`);
      }
    };

    fetchServices();
  }, []);

  if (error) {
    return <div className="text-error">{error}</div>;
  }

  return (
    <div className="card">
      <ul className="divide-y divide-secondary/30">
        {services.map((service) => (
          <li key={service.name}>
            <Link href={`/service/${encodeURIComponent(service.name)}`}>
              <div className="block hover:bg-secondary/10 transition duration-150 ease-in-out">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-accent">
                      {service.name}
                    </p>
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-accent text-white">
                      {service.requestCount} requests
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-foreground/80">
                    <p>Avg Latency: {service.avgLatency.toFixed(2)}ms</p>
                    <p className={`flex items-center ${getErrorRateColor(service.errorRate)}`}>
                      Error Rate: {(service.errorRate * 100).toFixed(2)}%
                      {service.errorRate >= 0.9 && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const getErrorRateColor = (errorRate: number): string => {
  if (errorRate < 0.05) return 'text-success';
  if (errorRate < 0.15) return 'text-orange-500';
  return 'text-error';
};

export default ServiceList;