'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  ConnectionLineType,
  MarkerType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './ServiceMap.module.css';

interface ServiceInteraction {
  source: string;
  target: string;
  count: number;
  avgLatency: number;
  errorRate: number;
}

interface ServiceMapResponse {
  interactions: ServiceInteraction[];
  isolatedServices: string[];
}

const timeRangeOptions = [
  { value: 5, label: 'Last 5 minutes' },
  { value: 10, label: 'Last 10 minutes' },
  { value: 30, label: 'Last 30 minutes' },
  { value: 60, label: 'Last 1 hour' },
  { value: 360, label: 'Last 6 hours' },
  { value: 1440, label: 'Last 24 hours' },
  { value: 10080, label: 'Last 7 days' },
  { value: 0, label: 'All time' },
];

const ServiceMap: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(10); 
  const [noDataFound, setNoDataFound] = useState<boolean>(false);

  const calculateNodePositions = useMemo(() => (services: string[]) => {
    const centerX = 400;
    const centerY = 300;
    const minRadius = 200; 
    const radius = Math.max(minRadius, services.length * 50);
    
    return services.map((service, index) => {
      let angle;
      if (services.length === 2) {
        angle = index === 0 ? Math.PI : 0;
      } else {
        angle = (index / services.length) * 2 * Math.PI;
      }
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { id: service, position: { x, y } };
    });
  }, []);

  const fetchServiceMapData = useMemo(() => async () => {
    try {
      const response = await fetch(`/api/service-map?timeRange=${timeRange}`);
      const data: ServiceMapResponse = await response.json();

      if (data.interactions.length === 0 && data.isolatedServices.length === 0) {
        setNoDataFound(true);
        setNodes([]);
        setEdges([]);
        return;
      }

      setNoDataFound(false);
      const interactions: ServiceInteraction[] = data.interactions;
      
      const services = Array.from(new Set([...interactions.flatMap(i => [i.source, i.target]), ...data.isolatedServices]));
      const nodePositions = calculateNodePositions(services);
      
      const newNodes: Node[] = nodePositions.map((node) => ({
        id: node.id,
        data: { label: node.id },
        position: node.position,
        style: { 
          background: 'var(--card-bg)', 
          color: 'var(--foreground)', 
          border: '1px solid var(--primary)',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        },
      }));

      const newEdges: Edge[] = interactions.map((interaction, index) => ({
        id: `e${index}`,
        source: interaction.source,
        target: interaction.target,
        type: 'smoothstep',
        animated: true,
        style: { stroke: interaction.errorRate > 0.1 ? 'var(--error)' : 'var(--success)', strokeWidth: 2 },
        label: `${interaction.count} req | ${interaction.avgLatency.toFixed(2)}ms`,
        labelStyle: { fill: 'var(--foreground)', fontSize: 12 },
        labelBgStyle: { fill: 'var(--accent)', fillOpacity: 0.7 },
        labelBgBorderRadius: 4,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: interaction.errorRate > 0.1 ? 'var(--error)' : 'var(--success)',
        },
      }));

      setNodes(newNodes);
      setEdges(newEdges);
      setError(null);
    } catch (error) {
      console.error('Error fetching service map data:', error);
      setError(`Error fetching service map data: ${(error as Error).message}`);
      setNoDataFound(true);
    }
  }, [timeRange, calculateNodePositions, setNodes, setEdges]);

  useEffect(() => {
    fetchServiceMapData();
  }, [fetchServiceMapData]);

  const handleTimeRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(Number(event.target.value));
  };

  if (error) {
    return <div className="text-error">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center space-x-2">
        <label htmlFor="timeRange" className="text-foreground">Time Range:</label>
        <select
          id="timeRange"
          value={timeRange}
          onChange={handleTimeRangeChange}
          className="bg-card-bg text-foreground border border-primary rounded px-2 py-1"
        >
          {timeRangeOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      {noDataFound ? (
        <div className="text-center py-8">
          <p className="text-xl mb-2">No services found within the selected time period 😢</p>
          <p>Try adjusting the time range above to see more data.</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: '700px' }} className={styles.serviceMap}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Controls />
            <Background color="var(--primary)" gap={16} variant={BackgroundVariant.Dots} />
          </ReactFlow>
        </div>
      )}
    </div>
  );
};

export default ServiceMap;