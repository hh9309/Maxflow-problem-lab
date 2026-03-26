export enum AppStage {
  CONSTRUCTION = 'CONSTRUCTION',
  SOLVING = 'SOLVING',
  FINISHED = 'FINISHED',
}

export interface Node {
  id: string;
  x: number;
  y: number;
  label?: {
    prevNodeId: string | null;
    direction: '+' | '-';
    flow: number;
  };
  isSource?: boolean;
  isSink?: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  capacity: number;
  flow: number;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export enum AlgorithmPhase {
  IDLE = 'IDLE',
  LABELING = 'LABELING', // Finding an augmenting path
  AUGMENTING = 'AUGMENTING', // Updating flow along the path
  FINISHED = 'FINISHED', // No more paths
}

export interface AlgorithmState {
  phase: AlgorithmPhase;
  queue: string[]; // For BFS labeling
  pathFound: string[] | null; // The augmenting path (node IDs)
  bottleneck: number | null;
  visited: Set<string>;
  maxFlow: number;
  logs: string[];
}

export interface SelectionState {
  type: 'node' | 'edge';
  id: string;
}

export type ToolType = 'SELECT' | 'ADD_NODE' | 'ADD_EDGE' | 'SET_SOURCE' | 'SET_SINK' | 'DELETE';

export type AIProvider = 'gemini' | 'deepseek';