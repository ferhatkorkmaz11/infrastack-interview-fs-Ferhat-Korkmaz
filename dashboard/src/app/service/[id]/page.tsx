'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import dynamic from 'next/dynamic';

const DynamicJSONTree = dynamic(() => import('react-json-tree').then(mod => mod.JSONTree), { ssr: false });

interface Trace {
  SpanId: string;
  TraceId: string;
  SpanName: string;
  Duration: number;
  Timestamp: string;
  SpanAttributes: Record<string, unknown>;
  ResourceAttributes: Record<string, unknown>;
}

interface TraceDetails extends Trace {
  SpanAttributes: Record<string, unknown>;
  ResourceAttributes: Record<string, unknown>;
}

interface ServiceDetailProps {
  params: { id: string };
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ params }) => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<TraceDetails | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const serviceName = decodeURIComponent(params.id);

  const fetchTraces = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/traces?service=${encodeURIComponent(serviceName)}&page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setTraces(prevTraces => [...prevTraces, ...data]);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(`Failed to fetch traces: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error fetching traces:', error);
      setError(`Error fetching traces: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [serviceName, page]);

  useEffect(() => {
    fetchTraces();
  }, [fetchTraces]);

  const openTraceDetails = useCallback(async (traceId: string) => {
    try {
      const response = await fetch(`/api/trace/${traceId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTrace(data[0]);
        setIsOpen(true);
      } else {
        const errorData = await response.json();
        setError(`Failed to fetch trace details: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error fetching trace details:', error);
      setError(`Error fetching trace details: ${(error as Error).message}`);
    }
  }, []);

  const loadMore = useCallback(() => {
    setPage(prevPage => prevPage + 1);
  }, []);

  if (error) {
    return <div className="text-error">{error}</div>;
  }

  const JsonView: React.FC<{ data: Record<string, unknown>, name: string }> = ({ data, name }) => (
    <div className="bg-secondary/10 p-2 rounded-md overflow-x-auto">
      <h5 className="text-sm font-medium mb-2">{name}</h5>
      <DynamicJSONTree
        data={data}
        theme={{
          base00: 'var(--secondary)',
          base01: '#383830',
          base02: '#49483e',
          base03: '#75715e',
          base04: '#a59f85',
          base05: '#f8f8f2',
          base06: '#f5f4f1',
          base07: '#f9f8f5',
          base08: '#f92672',
          base09: '#fd971f',
          base0A: '#f4bf75',
          base0B: '#a6e22e',
          base0C: '#a1efe4',
          base0D: '#66d9ef',
          base0E: '#ae81ff',
          base0F: '#cc6633',
        }}
        invertTheme={false}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-navbar-bg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-foreground text-lg font-semibold">
                Service Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">{serviceName} Details</h1>
        
        <div className="card">
          <ul className="divide-y divide-secondary/20">
            {traces.map((trace) => (
              <li key={trace.SpanId} className="px-6 py-4 hover:bg-secondary/10 cursor-pointer" onClick={() => openTraceDetails(trace.TraceId)}>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium text-accent truncate">
                    {trace.SpanName}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 py-1 text-xs font-semibold rounded-full bg-success/20 text-success">
                      {trace.Duration.toFixed(2)}ms
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <p className="flex items-center text-sm text-foreground/80">
                    TraceId: {trace.TraceId.substring(0, 8)}...
                  </p>
                  <p className="mt-2 flex items-center text-sm text-foreground/80 sm:mt-0">
                    Timestamp: {new Date(trace.Timestamp).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <button
              onClick={loadMore}
              className="w-full py-2 text-accent hover:bg-secondary/10 transition duration-150 ease-in-out"
            >
              Load More
            </button>
          )}
        </div>
      </main>

      <Transition show={isOpen} as={React.Fragment}>
        <Dialog onClose={() => setIsOpen(false)} className="fixed inset-0 z-10 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-card-bg shadow-xl rounded-2xl">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-foreground mb-4">
                  Trace Details
                </Dialog.Title>
                {selectedTrace && (
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm text-foreground/80">
                        <strong>Span Name:</strong> {selectedTrace.SpanName}
                      </p>
                      <p className="text-sm text-foreground/80">
                        <strong>Trace ID:</strong> {selectedTrace.TraceId}
                      </p>
                      <p className="text-sm text-foreground/80">
                        <strong>Span ID:</strong> {selectedTrace.SpanId}
                      </p>
                      <p className="text-sm text-foreground/80">
                        <strong>Duration:</strong> {selectedTrace.Duration.toFixed(2)}ms
                      </p>
                      <p className="text-sm text-foreground/80 col-span-2">
                        <strong>Timestamp:</strong> {new Date(selectedTrace.Timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Span Attributes:</h4>
                      <JsonView data={selectedTrace.SpanAttributes} name="Span Attributes" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Resource Attributes:</h4>
                      <JsonView data={selectedTrace.ResourceAttributes} name="Resource Attributes" />
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-foreground bg-primary/20 border border-transparent rounded-md hover:bg-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default ServiceDetail;