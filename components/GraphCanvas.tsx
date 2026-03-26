import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Graph, Node, Edge, ToolType, SelectionState } from '../types';
import { COLORS } from '../constants';

interface GraphCanvasProps {
  graph: Graph;
  pathFound: string[] | null;
  activeTool: ToolType;
  selection: SelectionState | null;
  onSelect: (id: string | null, type: 'node' | 'edge' | null) => void;
  onNodeAdd: (x: number, y: number) => void;
  onEdgeAdd: (sourceId: string, targetId: string) => void;
  onNodeDelete: (id: string) => void;
  onEdgeDelete: (id: string) => void;
  onSetSource: (id: string) => void;
  onSetSink: (id: string) => void;
  onNodeMove: (id: string, x: number, y: number) => void;
  readOnly?: boolean;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ 
  graph, 
  pathFound,
  activeTool,
  selection,
  onSelect,
  onNodeAdd, 
  onEdgeAdd,
  onNodeDelete,
  onEdgeDelete,
  onSetSource,
  onSetSink,
  onNodeMove,
  readOnly 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragEdgeStart, setDragEdgeStart] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState<string>("0 0 800 600");

  // Helper to map screen coordinates to SVG coordinates
  const getSVGPoint = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformed = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: transformed.x, y: transformed.y };
  };

  // Update viewBox to center the graph
  useEffect(() => {
    if (graph.nodes.length === 0) return;

    const minX = Math.min(...graph.nodes.map(n => n.x));
    const maxX = Math.max(...graph.nodes.map(n => n.x));
    const minY = Math.min(...graph.nodes.map(n => n.y));
    const maxY = Math.max(...graph.nodes.map(n => n.y));

    const padding = 220;
    const width = Math.max(800, (maxX - minX) + padding * 2);
    const height = Math.max(600, (maxY - minY) + padding * 2);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Center the viewBox on the graph's centroid
    const vbX = centerX - width / 2;
    const vbY = centerY - height / 2;

    setViewBox(`${vbX} ${vbY} ${width} ${height}`);
  }, [graph.nodes]);

  // Handle Canvas Click (Add Node)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    
    // Only add if active tool is ADD_NODE and clicked directly on SVG
    if (activeTool === 'ADD_NODE' && e.target === svgRef.current) {
      const point = getSVGPoint(e);
      onNodeAdd(point.x, point.y);
    }

    // Deselect if clicking blank space in SELECT mode
    if (activeTool === 'SELECT' && e.target === svgRef.current) {
        onSelect(null, null);
    }
    
    // Reset temp states
    setDragEdgeStart(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const point = getSVGPoint(e);
    setMousePos(point);

    if (draggingNode) {
        onNodeMove(draggingNode, point.x, point.y);
    }
  };

  const handleMouseUp = () => {
      setDraggingNode(null);
  };

  const handleNodeMouseDown = (id: string, e: React.MouseEvent) => {
      if (readOnly) return;
      e.stopPropagation();

      // Always allow dragging if not in ADD_EDGE mode
      if (activeTool !== 'ADD_EDGE') {
          setDraggingNode(id);
          onSelect(id, 'node');
      } else {
        setDragEdgeStart(id);
        const n = graph.nodes.find(node => node.id === id);
        if(n) setMousePos({x: n.x, y: n.y});
      }
  };

  const handleNodeMouseUp = (id: string, e: React.MouseEvent) => {
      if (readOnly) return;
      e.stopPropagation();

      if (activeTool === 'ADD_EDGE' && dragEdgeStart && dragEdgeStart !== id) {
          onEdgeAdd(dragEdgeStart, id);
          setDragEdgeStart(null);
      } else if (activeTool === 'SET_SOURCE') {
          onSetSource(id);
      } else if (activeTool === 'SET_SINK') {
          onSetSink(id);
      } else if (activeTool === 'DELETE') {
          onNodeDelete(id);
      }
  };

  const handleEdgeClick = (id: string, e: React.MouseEvent) => {
      if (readOnly) return;
      e.stopPropagation();
      
      if (activeTool === 'SELECT') {
          onSelect(id, 'edge');
      } else if (activeTool === 'DELETE') {
          onEdgeDelete(id);
      }
  };

  // Helper to determine if an edge is part of the augmenting path
  const isEdgeInPath = (e: Edge) => {
    if (!pathFound) return false;
    for (let i = 0; i < pathFound.length - 1; i++) {
      const u = pathFound[i];
      const v = pathFound[i+1];
      if ((e.source === u && e.target === v) || (e.source === v && e.target === u)) return true;
    }
    return false;
  };

  // Render Markers
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const defs = svg.select('defs');
    if (defs.empty()) svg.append('defs');
    
    // Normal Arrow
    svg.select('defs').selectAll('#arrowhead')
      .data([0])
      .enter().append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 32)
      .attr('refY', 0)
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', COLORS.secondary);

    // Active Arrow
     svg.select('defs').selectAll('#arrowhead-active')
      .data([0])
      .enter().append('marker')
      .attr('id', 'arrowhead-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 32)
      .attr('refY', 0)
      .attr('markerWidth', 12)
      .attr('markerHeight', 12)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', COLORS.accent);

     // Selected Arrow (Red)
     svg.select('defs').selectAll('#arrowhead-selected')
     .data([0])
     .enter().append('marker')
     .attr('id', 'arrowhead-selected')
     .attr('viewBox', '0 -5 10 10')
     .attr('refX', 32)
     .attr('refY', 0)
     .attr('markerWidth', 12)
     .attr('markerHeight', 12)
     .attr('orient', 'auto')
     .append('path')
     .attr('d', 'M0,-5L10,0L0,5')
     .attr('fill', COLORS.danger);
  }, []);

  return (
    <svg 
      ref={svgRef}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className={`w-full h-full bg-white rounded-lg shadow-inner border border-slate-200 select-none
        ${activeTool === 'ADD_NODE' ? 'cursor-crosshair' : ''}
        ${activeTool === 'SELECT' ? 'cursor-default' : ''}
      `}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <defs />

      {/* Edges */}
      {graph.edges.map((edge) => {
        const source = graph.nodes.find(n => n.id === edge.source);
        const target = graph.nodes.find(n => n.id === edge.target);
        if (!source || !target) return null;

        const isPath = isEdgeInPath(edge);
        const isSelected = selection?.type === 'edge' && selection.id === edge.id;
        
        let strokeColor = COLORS.secondary;
        if (isSelected) strokeColor = COLORS.danger;
        else if (isPath) strokeColor = COLORS.accent;

        const strokeWidth = isPath || isSelected ? 6 : 4;
        
        let markerId = 'url(#arrowhead)';
        if (isSelected) markerId = 'url(#arrowhead-selected)';
        else if (isPath) markerId = 'url(#arrowhead-active)';
        
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;

        return (
          <g 
            key={edge.id} 
            className="transition-all duration-300 group"
            onClick={(e) => handleEdgeClick(edge.id, e)}
          >
            {/* Invisible thick line for easier clicking */}
            <line
                x1={source.x} y1={source.y}
                x2={target.x} y2={target.y}
                stroke="transparent"
                strokeWidth="20"
                className={activeTool === 'DELETE' ? 'cursor-pointer hover:stroke-red-100' : 'cursor-pointer'}
            />
            <line
              x1={source.x} y1={source.y}
              x2={target.x} y2={target.y}
              stroke={activeTool === 'DELETE' ? 'currentColor' : strokeColor}
              className={activeTool === 'DELETE' ? 'group-hover:text-red-500 text-slate-400' : ''}
              strokeWidth={strokeWidth}
              markerEnd={markerId}
            />
            {/* Flow / Capacity Label */}
            <g transform={`translate(${midX}, ${midY})`}>
                <rect 
                    x="-32" y="-14" width="64" height="28" rx="6" 
                    fill="white" 
                    stroke={isSelected ? COLORS.danger : COLORS.neutral} 
                    strokeWidth={isSelected ? 3 : 2}
                />
                <text 
                    textAnchor="middle" 
                    dy="6" 
                    fontSize="16" 
                    fontWeight="bold"
                    fill={edge.flow === edge.capacity ? COLORS.danger : COLORS.nodeBorder}
                >
                    {edge.flow}/{edge.capacity}
                </text>
            </g>
          </g>
        );
      })}

      {/* Dragging Line */}
      {dragEdgeStart && (
        <line
          x1={graph.nodes.find(n => n.id === dragEdgeStart)?.x}
          y1={graph.nodes.find(n => n.id === dragEdgeStart)?.y}
          x2={mousePos.x}
          y2={mousePos.y}
          stroke={COLORS.primary}
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      )}

      {/* Nodes */}
      {graph.nodes.map((node) => {
        const isPathNode = pathFound?.includes(node.id);
        const isSelected = selection?.type === 'node' && selection.id === node.id;
        const isLabeled = !!node.label;
        
        let cursor = 'cursor-pointer';
        if (activeTool === 'SELECT') cursor = 'cursor-move';
        if (activeTool === 'DELETE') cursor = 'cursor-not-allowed';
        
        let strokeColor = isPathNode ? COLORS.accent : COLORS.nodeBorder;
        if (isSelected) strokeColor = COLORS.danger;

        return (
          <g 
            key={node.id} 
            transform={`translate(${node.x},${node.y})`}
            onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
            onMouseUp={(e) => handleNodeMouseUp(node.id, e)}
            className={`${cursor} transition-all duration-300`}
          >
            {/* Node Circle */}
            <circle
              r="26"
              fill={node.isSource ? COLORS.success : node.isSink ? COLORS.danger : COLORS.nodeBg}
              stroke={strokeColor}
              strokeWidth={isPathNode || isSelected ? 4 : 3}
              className={activeTool === 'DELETE' ? 'hover:fill-red-200' : ''}
            />
            <text 
                textAnchor="middle" 
                dy="7" 
                fill={node.isSource || node.isSink ? 'white' : 'black'}
                fontSize="18"
                fontWeight="bold"
                className="pointer-events-none"
            >
                {node.id}
            </text>

            {/* Label Badge */}
            {isLabeled && node.label && (
                <g transform="translate(24, -40)" className="pointer-events-none">
                    <rect 
                        x="0" y="0" 
                        width="85" height="34" 
                        rx="6" 
                        fill={COLORS.primary} 
                        className="shadow-md"
                    />
                    <text x="42.5" y="22" textAnchor="middle" fill="white" fontSize="17" fontWeight="600">
                        ({node.label.prevNodeId || '-'}, {node.label.direction}{node.label.flow === Infinity ? '∞' : node.label.flow})
                    </text>
                </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};