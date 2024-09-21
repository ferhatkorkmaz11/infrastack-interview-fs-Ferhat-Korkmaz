'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Service {
  name: string;
  requestCount: number;
  avgLatency: number;
  errorRate: number;
}

const ServiceList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setServices(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching services');
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) return <div>Loading services...</div>;
  if (error) return <div>Error: {error}</div>;

  const getErrorRateColor = (rate: number) => {
    if (rate < 0.01) return 'text-success';
    if (rate < 0.05) return 'text-warning';
    return 'text-error';
  };

  const handleSeeTraces = (serviceName: string, e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/traces?service=${encodeURIComponent(serviceName)}`);
  };

  const handleSeeLogs = (serviceName: string, e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/logs?service=${encodeURIComponent(serviceName)}`);
  };

  const handleSeeMetrics = (serviceName: string, e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/metrics?service=${encodeURIComponent(serviceName)}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => (
        <div key={service.name} className="card p-4 hover:bg-secondary/10 transition duration-150 ease-in-out">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-accent">{service.name}</h3>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-accent text-white">
              {service.requestCount} requests
            </span>
          </div>
          <div className="text-sm text-foreground/80">
            <p>Avg Latency: {service.avgLatency.toFixed(2)}ms</p>
            <p className={`flex items-center ${getErrorRateColor(service.errorRate)}`}>
              Error Rate: {(service.errorRate * 100).toFixed(2)}%
              {service.errorRate >= 0.05 && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </p>
          </div>
          <div className="mt-4 flex justify-between">
            <button
              onClick={(e) => handleSeeTraces(service.name, e)}
              className="btn btn-sm btn-primary"
            >
              See Traces
            </button>
            <button
              onClick={(e) => handleSeeLogs(service.name, e)}
              className="btn btn-sm btn-secondary"
            >
              See Logs
            </button>
            <button
              onClick={(e) => handleSeeMetrics(service.name, e)}
              className="btn btn-sm btn-accent"
            >
              See Metrics
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceList;