'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import dynamic from 'next/dynamic';

const DynamicJSONTree = dynamic(() => import('react-json-tree').then(mod => mod.JSONTree), { ssr: false });

interface Trace {
  SpanId: string;
  TraceId: string;
  SpanName: string;
  SpanKind: string;
  Duration: number;
  Timestamp: string;
  SpanAttributes: Record<string, unknown>;
  ResourceAttributes: Record<string, unknown>;
  HttpStatusCode?: string;
}

interface TraceDetails extends Trace {
  SpanAttributes: Record<string, unknown>;
  ResourceAttributes: Record<string, unknown>;
}

interface ServiceDetailProps {
  params: { id: string };
}

const ServiceDetailContent: React.FC<ServiceDetailProps> = ({ params }) => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<TraceDetails | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [spanKindFilter, setSpanKindFilter] = useState('');
  const [spanNameFilter, setSpanNameFilter] = useState('');
  const [statusCodeFilter, setStatusCodeFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [uniqueSpanKinds, setUniqueSpanKinds] = useState<string[]>([]);
  const [uniqueSpanNames, setUniqueSpanNames] = useState<string[]>([]);
  const [uniqueHttpStatusCodes, setUniqueHttpStatusCodes] = useState<string[]>([]);

  const serviceName = decodeURIComponent(params.id);

  const fetchTraces = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        service: serviceName,
        page: page.toString(),
        search: searchTerm,
        spanKind: spanKindFilter,
        spanName: spanNameFilter,
        statusCode: statusCodeFilter,
        sortOrder: sortOrder,
      });

      const response = await fetch(`/api/traces?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTraces(data.traces);
        setTotalPages(data.pagination.totalPages);
        setUniqueSpanKinds(data.metadata.uniqueSpanKinds);
        setUniqueSpanNames(data.metadata.uniqueSpanNames);
        setUniqueHttpStatusCodes(data.metadata.uniqueHttpStatusCodes);
      } else {
        console.error(`Failed to fetch traces: ${await response.text()}`);
      }
    } catch (error) {
      console.error('Error fetching traces:', error);
    } finally {
      setLoading(false);
    }
  }, [serviceName, page, searchTerm, spanKindFilter, spanNameFilter, statusCodeFilter, sortOrder]);

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
        console.error(`Failed to fetch trace details: ${await response.text()}`);
      }
    } catch (error) {
      console.error('Error fetching trace details:', error);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTraces();
  };

  const handleSortChange = () => {
    setSortOrder(prevOrder => prevOrder === 'ASC' ? 'DESC' : 'ASC');
    setPage(1);
  };

  const handleFilterChange = (filterType: 'spanKind' | 'spanName' | 'statusCode', value: string) => {
    setPage(1);
    if (filterType === 'spanKind') {
      setSpanKindFilter(value);
    } else if (filterType === 'spanName') {
      setSpanNameFilter(value);
    } else if (filterType === 'statusCode') {
      setStatusCodeFilter(value);
    }
  };

  useEffect(() => {
    fetchTraces();
  }, [page, sortOrder, spanKindFilter, spanNameFilter, statusCodeFilter, fetchTraces]);

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
        
        <div className="card mb-6">
          <form onSubmit={handleSearch} className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search traces..."
              className="input flex-grow"
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          <div className="flex items-center space-x-4 mb-4">
            <select
              value={spanKindFilter}
              onChange={(e) => handleFilterChange('spanKind', e.target.value)}
              className="input"
            >
              <option value="">All Span Kinds</option>
              {uniqueSpanKinds.map(kind => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>
            <select
              value={spanNameFilter}
              onChange={(e) => handleFilterChange('spanName', e.target.value)}
              className="input"
            >
              <option value="">All Span Names</option>
              {uniqueSpanNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <select
              value={statusCodeFilter}
              onChange={(e) => handleFilterChange('statusCode', e.target.value)}
              className="input"
            >
              <option value="">All Status Codes</option>
              {uniqueHttpStatusCodes.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            <button onClick={handleSortChange} className="btn btn-secondary">
              Sort {sortOrder === 'ASC' ? '↑' : '↓'}
            </button>
          </div>

          <ul className="divide-y divide-secondary/20">
            {traces.map((trace) => (
              <li key={trace.SpanId} className="px-6 py-4 hover:bg-secondary/10 cursor-pointer" onClick={() => openTraceDetails(trace.TraceId)}>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium text-accent truncate">
                    {trace.SpanName}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex space-x-2">
                    {trace.HttpStatusCode && (
                      <p className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        parseInt(trace.HttpStatusCode) >= 400 ? 'bg-error/20 text-error' : 'bg-success/20 text-success'
                      }`}>
                        {trace.HttpStatusCode}
                      </p>
                    )}
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
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
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
                      <JsonView data={selectedTrace.SpanAttributes} name="Span Attributes:" />
                    </div>
                    <div>
                      <JsonView data={selectedTrace.ResourceAttributes} name="Resource Attributes:" />
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

export default ServiceDetailContent;