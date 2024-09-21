'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import dynamic from 'next/dynamic';

const DynamicJSONTree = dynamic(() => import('react-json-tree').then(mod => mod.JSONTree), { ssr: false });

interface LogEntry {
  Timestamp: string;
  TraceId: string;
  SpanId: string;
  TraceFlags: string;
  SeverityText: string;
  SeverityNumber: number;
  Body: string;
  ResourceAttributes: Record<string, unknown>;
  LogAttributes: Record<string, unknown>;
}

interface LogDetails extends LogEntry {}

const SEVERITY_OPTIONS = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

const LogsContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogDetails | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [serviceFilter, setServiceFilter] = useState(searchParams?.get('service') || '');
  const [severityFilter, setSeverityFilter] = useState(searchParams?.get('severity') || '');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(searchParams?.get('sortOrder') as 'ASC' | 'DESC' || 'DESC');
  const [uniqueServices, setUniqueServices] = useState<string[]>([]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        search: searchTerm,
        service: serviceFilter,
        severity: severityFilter,
        sortOrder: sortOrder,
      });

      const response = await fetch(`/api/logs?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
        setUniqueServices(data.metadata.uniqueServices || []);
      } else {
        console.error('Failed to fetch logs:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, serviceFilter, severityFilter, sortOrder]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const updateURL = useCallback(() => {
    const newParams = new URLSearchParams();
    if (searchTerm) newParams.set('search', searchTerm);
    if (serviceFilter) newParams.set('service', serviceFilter);
    if (severityFilter) newParams.set('severity', severityFilter);
    newParams.set('sortOrder', sortOrder);
    newParams.set('page', page.toString());
    router.push(`/logs?${newParams.toString()}`);
  }, [searchTerm, serviceFilter, severityFilter, sortOrder, page, router]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleSortChange = () => {
    setSortOrder(prevOrder => prevOrder === 'ASC' ? 'DESC' : 'ASC');
    setPage(1);
  };

  const handleFilterChange = (filterType: 'service' | 'severity', value: string) => {
    setPage(1);
    if (filterType === 'service') {
      setServiceFilter(value);
    } else if (filterType === 'severity') {
      setSeverityFilter(value);
    }
  };

  const openLogDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setIsOpen(true);
  };

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

  useEffect(() => {
    const search = searchParams?.get('search');
    if (search) {
      setSearchTerm(search);
      fetchLogs();
    }
  }, [searchParams, fetchLogs]); 

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          {serviceFilter ? `Logs for ${serviceFilter}` : 'All Logs'}
        </h1>
        
        <div className="card mb-6">
          <form onSubmit={handleSearch} className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="input flex-grow"
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          <div className="flex items-center space-x-4 mb-4">
            <select
              value={serviceFilter}
              onChange={(e) => handleFilterChange('service', e.target.value)}
              className="input"
            >
              <option value="">All Services</option>
              {uniqueServices.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="input"
            >
              <option value="">All Severities</option>
              {SEVERITY_OPTIONS.map(severity => (
                <option key={severity} value={severity}>{severity}</option>
              ))}
            </select>
            <button onClick={handleSortChange} className="btn btn-secondary">
              Sort {sortOrder === 'ASC' ? '↑' : '↓'}
            </button>
          </div>

          <ul className="divide-y divide-secondary/20">
            {logs.map((log) => (
              <li key={`${log.Timestamp}-${log.SpanId}`} className="px-6 py-4 hover:bg-secondary/10 cursor-pointer" onClick={() => openLogDetails(log)}>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium text-accent truncate">
                    {log.Body.substring(0, 100)}...
                  </p>
                  <div className="ml-2 flex-shrink-0 flex space-x-2">
                    <p className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      log.SeverityText === 'ERROR' ? 'bg-error/20 text-error' :
                      log.SeverityText === 'WARN' ? 'bg-warning/20 text-warning' :
                      'bg-success/20 text-success'
                    }`}>
                      {log.SeverityText}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <p className="flex items-center text-sm text-foreground/80">
                    TraceId: {log.TraceId}
                  </p>
                  <p className="mt-2 flex items-center text-sm text-foreground/80 sm:mt-0">
                    Timestamp: {new Date(log.Timestamp).toLocaleString()}
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
                  Log Details
                </Dialog.Title>
                {selectedLog && (
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm text-foreground/80">
                        <strong>Severity:</strong> {selectedLog.SeverityText}
                      </p>
                      <p className="text-sm text-foreground/80">
                        <strong>Trace ID:</strong> {selectedLog.TraceId}
                      </p>
                      <p className="text-sm text-foreground/80">
                        <strong>Span ID:</strong> {selectedLog.SpanId}
                      </p>
                      <p className="text-sm text-foreground/80">
                        <strong>Trace Flags:</strong> {selectedLog.TraceFlags}
                      </p>
                      <p className="text-sm text-foreground/80 col-span-2">
                        <strong>Timestamp:</strong> {new Date(selectedLog.Timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-md font-medium mb-2">Log Body:</h4>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{selectedLog.Body}</p>
                    </div>
                    <div>
                      <JsonView data={selectedLog.ResourceAttributes} name="Resource Attributes:" />
                    </div>
                    <div>
                      <JsonView data={selectedLog.LogAttributes} name="Log Attributes:" />
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

export default LogsContent;