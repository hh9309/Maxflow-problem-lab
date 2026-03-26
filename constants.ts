import { Graph } from './types';

export const INITIAL_GRAPH: Graph = {
  nodes: [
    { id: 's', x: 0, y: 300, isSource: true },
    { id: 'v1', x: 300, y: 100 },
    { id: 'v2', x: 300, y: 500 },
    { id: 'v3', x: 600, y: 100 },
    { id: 'v4', x: 600, y: 500 },
    { id: 't', x: 900, y: 300, isSink: true },
  ],
  edges: [
    { id: 'e1', source: 's', target: 'v1', capacity: 10, flow: 0 },
    { id: 'e2', source: 's', target: 'v2', capacity: 10, flow: 0 },
    { id: 'e3', source: 'v1', target: 'v2', capacity: 2, flow: 0 },
    { id: 'e4', source: 'v1', target: 'v3', capacity: 4, flow: 0 },
    { id: 'e5', source: 'v1', target: 'v4', capacity: 8, flow: 0 },
    { id: 'e6', source: 'v2', target: 'v4', capacity: 9, flow: 0 },
    { id: 'e7', source: 'v4', target: 'v3', capacity: 6, flow: 0 },
    { id: 'e8', source: 'v3', target: 't', capacity: 10, flow: 0 },
    { id: 'e9', source: 'v4', target: 't', capacity: 10, flow: 0 },
  ],
};

export const COLORS = {
  primary: '#3b82f6', // blue-500
  secondary: '#64748b', // slate-500
  accent: '#f59e0b', // amber-500
  success: '#10b981', // emerald-500
  danger: '#ef4444', // red-500
  neutral: '#e2e8f0', // slate-200
  nodeBg: '#ffffff',
  nodeBorder: '#1e293b',
};
