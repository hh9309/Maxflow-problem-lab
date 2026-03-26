import { Graph, Node, Edge, AlgorithmState, AlgorithmPhase } from '../types';

// Helper to find edge between u and v (either direction)
const findEdge = (edges: Edge[], u: string, v: string) => {
  return edges.find(e => (e.source === u && e.target === v) || (e.source === v && e.target === u));
};

export const initializeAlgorithm = (): AlgorithmState => ({
  phase: AlgorithmPhase.IDLE,
  queue: [],
  pathFound: null,
  bottleneck: null,
  visited: new Set(),
  maxFlow: 0,
  logs: ["算法初始化完成，准备就绪。"]
});

export const clearLabels = (nodes: Node[]): Node[] => {
  return nodes.map(n => ({
    ...n,
    label: n.isSource ? { prevNodeId: null, direction: '+', flow: Infinity } : undefined
  }));
};

// Single Step Execution
export const stepAlgorithm = (
  currentGraph: Graph,
  currentState: AlgorithmState
): { graph: Graph; state: AlgorithmState } => {
  
  let { nodes, edges } = currentGraph;
  let { phase, queue, visited, maxFlow, logs, pathFound, bottleneck } = currentState;

  // 1. START / IDLE -> Start a new BFS search (Labeling Phase)
  if (phase === AlgorithmPhase.IDLE || phase === AlgorithmPhase.FINISHED) {
    // Reset for new iteration
    const newNodes = clearLabels(nodes);
    const source = newNodes.find(n => n.isSource);
    
    if (!source) return { graph: currentGraph, state: currentState }; // Safety check

    return {
      graph: { ...currentGraph, nodes: newNodes },
      state: {
        ...currentState,
        phase: AlgorithmPhase.LABELING,
        queue: [source.id],
        visited: new Set([source.id]),
        pathFound: null,
        bottleneck: null,
        logs: [...logs, "开始新一轮标号，从源点 (s) 出发。"]
      }
    };
  }

  // 2. LABELING (BFS)
  if (phase === AlgorithmPhase.LABELING) {
    if (queue.length === 0) {
      // Queue empty, no path to sink found
      return {
        graph: currentGraph,
        state: {
          ...currentState,
          phase: AlgorithmPhase.FINISHED,
          logs: [...logs, `未找到更多增广路径。算法结束，最大流为 ${maxFlow}。`]
        }
      };
    }

    const uId = queue[0]; // Peek first
    const u = nodes.find(n => n.id === uId)!;
    
    // Find all neighbors we can label
    // Forward edges: u -> v where flow < capacity
    // Backward edges: v -> u where flow > 0
    let neighborsFound = false;

    // We process neighbors one by one or all at once? 
    // For visualization, let's process one neighbor per step or the whole node expansion?
    // Let's do standard BFS: Remove u, add valid neighbors.
    
    const newQueue = queue.slice(1);
    const newNodes = [...nodes];
    const newVisited = new Set(visited);
    let sinkReached = false;
    let newPath: string[] | null = null;
    let newBottleneck: number | null = null;

    // Helper to label node
    const labelNode = (targetId: string, direction: '+' | '-', flowAvailable: number) => {
        const targetIndex = newNodes.findIndex(n => n.id === targetId);
        if (targetIndex !== -1 && !newVisited.has(targetId)) {
            newNodes[targetIndex] = {
                ...newNodes[targetIndex],
                label: {
                    prevNodeId: uId,
                    direction,
                    flow: Math.min(u.label!.flow, flowAvailable)
                }
            };
            newVisited.add(targetId);
            newQueue.push(targetId);
            neighborsFound = true;
            
            // Check if sink
            if (newNodes[targetIndex].isSink) {
                sinkReached = true;
                // Backtrack path
                const path: string[] = [targetId];
                let curr = newNodes[targetIndex];
                let pathMinFlow = curr.label!.flow;
                while(curr.id !== 's') {
                    const prevId = curr.label!.prevNodeId!;
                    path.unshift(prevId);
                    curr = newNodes.find(n => n.id === prevId)!;
                }
                newPath = path;
                newBottleneck = pathMinFlow;
            }
        }
    };

    // Forward check
    edges.filter(e => e.source === uId).forEach(e => {
        if (!sinkReached && e.flow < e.capacity) {
            labelNode(e.target, '+', e.capacity - e.flow);
        }
    });

    // Backward check
    edges.filter(e => e.target === uId).forEach(e => {
         if (!sinkReached && e.flow > 0) {
            labelNode(e.source, '-', e.flow);
        }
    });

    if (sinkReached) {
        return {
            graph: { ...currentGraph, nodes: newNodes },
            state: {
                ...currentState,
                phase: AlgorithmPhase.AUGMENTING,
                queue: [], // Clear queue to stop BFS
                pathFound: newPath,
                bottleneck: newBottleneck,
                visited: newVisited,
                logs: [...logs, `汇点 (t) 已标号！发现增广路径，可增广量 ${newBottleneck}。`]
            }
        };
    }

    return {
        graph: { ...currentGraph, nodes: newNodes },
        state: {
            ...currentState,
            queue: newQueue,
            visited: newVisited,
            logs: neighborsFound ? [...logs, `已检查节点 ${uId} 并标记了其邻居。`] : logs
        }
    };
  }

  // 3. AUGMENTING
  if (phase === AlgorithmPhase.AUGMENTING) {
      if (!pathFound || bottleneck === null) return { graph: currentGraph, state: currentState };

      const newEdges = edges.map(e => ({ ...e }));
      const pathLog: string[] = [];

      for (let i = 0; i < pathFound.length - 1; i++) {
          const uId = pathFound[i];
          const vId = pathFound[i+1];
          
          // Is it forward or backward?
          // Forward: u -> v
          const forwardIdx = newEdges.findIndex(e => e.source === uId && e.target === vId);
          if (forwardIdx !== -1) {
              newEdges[forwardIdx].flow += bottleneck;
          } else {
              // Backward: v -> u
              const backwardIdx = newEdges.findIndex(e => e.source === vId && e.target === uId);
              if (backwardIdx !== -1) {
                  newEdges[backwardIdx].flow -= bottleneck;
              }
          }
      }

      return {
          graph: { ...currentGraph, edges: newEdges },
          state: {
              ...currentState,
              phase: AlgorithmPhase.IDLE, // Go back to start to reset labels
              maxFlow: maxFlow + bottleneck,
              pathFound: null,
              bottleneck: null,
              logs: [...logs, `已沿路径增广流量 ${bottleneck}。当前最大流: ${maxFlow + bottleneck}。清除标号，准备下一轮...`]
          }
      };
  }

  return { graph: currentGraph, state: currentState };
};