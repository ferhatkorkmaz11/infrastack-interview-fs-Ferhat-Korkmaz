'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Metric {
  ServiceName: string;
  MetricName: string;
  MetricUnit: string;
  AvgValue: number;
  MaxValue: number;
  MinValue: number;
  TotalCount: number;
  Minute: string;
}

const timeRangeOptions = [
  { value: 5, label: 'Last 5 minutes' },
  { value: 15, label: 'Last 15 minutes' },
  { value: 30, label: 'Last 30 minutes' },
  { value: 60, label: 'Last 1 hour' },
  { value: 360, label: 'Last 6 hours' },
  { value: 1440, label: 'Last 24 hours' },
  { value: 10080, label: 'Last 7 days' },
  { value: 0, label: 'All time' },
];

const MetricsDisplay: React.FC = () => {
  const searchParams = useSearchParams();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [timeRange, setTimeRange] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const service = searchParams?.get('service');

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ timeRange: timeRange.toString() });
      if (service) {
        params.append('service', service);
      }
      const response = await fetch(`/api/metrics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError('Error fetching metrics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, service]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const groupedMetrics = metrics.reduce((acc, metric) => {
    const key = `${metric.ServiceName}-${metric.MetricName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(metric);
    return acc;
  }, {} as Record<string, Metric[]>);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {service && <h2 className="text-2xl font-bold">Metrics for {service}</h2>}
        <div className="flex items-center space-x-2">
          <label htmlFor="timeRange" className="text-foreground">Time Range:</label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="bg-card-bg text-foreground border border-primary rounded px-2 py-1"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading metrics...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : metrics.length === 0 ? (
        <div>No metrics data available for the selected time range{service ? ` and service (${service})` : ''}.</div>
      ) : (
        Object.entries(groupedMetrics).map(([key, metricData]) => (
          <div key={key} className="bg-card-bg p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">{`${metricData[0].ServiceName} - ${metricData[0].MetricName}`}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Minute" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="AvgValue" stroke="#8884d8" name="Average" />
                <Line type="monotone" dataKey="MaxValue" stroke="#82ca9d" name="Max" />
                <Line type="monotone" dataKey="MinValue" stroke="#ffc658" name="Min" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 text-sm">
              <p>Unit: {metricData[0].MetricUnit}</p>
              <p>Total Count: {metricData[0].TotalCount}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MetricsDisplay;