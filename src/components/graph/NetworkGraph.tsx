// ============================================================
// NEXUS — D3 Force-Directed Network Graph
// Neo4j-compatible knowledge graph visualization
// SIH26189 | AI-Powered Criminal Network Analysis
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphRelationship, SimulationNode, SimulationLink } from '../../types/graph';

interface NetworkGraphProps {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  centerNodeId?: string;
  onNodeSelect?: (node: GraphNode | null) => void;
  onRelationshipSelect?: (rel: GraphRelationship | null) => void;
  selectedNodeId?: string | null;
}

// Node visual config by type
const nodeConfig: Record<string, { color: string; size: number; shape: 'circle' | 'rect' }> = {
  PERSON:       { color: '#C9B86A', size: 20, shape: 'circle' },
  ORGANIZATION: { color: '#8A7E45', size: 18, shape: 'rect' },
  LOCATION:     { color: '#6B6040', size: 16, shape: 'circle' },
  PHONE:        { color: '#5A5348', size: 12, shape: 'circle' },
  VEHICLE:      { color: '#4A4840', size: 14, shape: 'circle' },
  BANK_ACCOUNT: { color: '#8A7E45', size: 14, shape: 'circle' },
  TRANSACTION:  { color: '#9A7E35', size: 13, shape: 'circle' },
  EVIDENCE:     { color: '#5E5040', size: 12, shape: 'circle' },
  EVENT:        { color: '#4A4840', size: 12, shape: 'circle' },
  CASE:         { color: '#C9B86A', size: 24, shape: 'circle' },
};

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  relationships,
  centerNodeId,
  onNodeSelect,
  onRelationshipSelect,
  selectedNodeId,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);

  // Build graph
  const buildGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs
    const defs = svg.append('defs');

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', 'rgba(201,184,106,0.35)');

    // Selected glow filter
    defs.append('filter')
      .attr('id', 'glow')
      .call((f) => {
        f.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
        f.append('feMerge').call((m) => {
          m.append('feMergeNode').attr('in', 'blur');
          m.append('feMergeNode').attr('in', 'SourceGraphic');
        });
      });

    // Background grid
    const gridSize = 40;
    const grid = svg.append('g').attr('class', 'grid');
    for (let x = 0; x < width; x += gridSize) {
      grid.append('line').attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', height)
        .attr('stroke', 'rgba(201,184,106,0.02)').attr('stroke-width', 0.5);
    }
    for (let y = 0; y < height; y += gridSize) {
      grid.append('line').attr('x1', 0).attr('y1', y).attr('x2', width).attr('y2', y)
        .attr('stroke', 'rgba(201,184,106,0.02)').attr('stroke-width', 0.5);
    }

    // Zoom container
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setTooltip(null);
      });
    svg.call(zoom);

    // Clone nodes and links for simulation
    const simNodes: SimulationNode[] = nodes.map((n) => ({
      ...n,
      x: n.id === centerNodeId ? width / 2 : undefined,
      y: n.id === centerNodeId ? height / 2 : undefined,
      fx: n.id === centerNodeId ? width / 2 : undefined,
      fy: n.id === centerNodeId ? height / 2 : undefined,
    }));

    const nodeMap = new Map<string, SimulationNode>(simNodes.map((n) => [n.id, n]));

    const simLinks: SimulationLink[] = relationships
      .filter((r) => nodeMap.has(r.source as string) && nodeMap.has(r.target as string))
      .map((r) => ({ ...r, source: r.source as string, target: r.target as string }));

    // Force simulation
    const simulation = d3.forceSimulation<SimulationNode>(simNodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(simLinks)
        .id((d) => d.id)
        .distance(120)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimulationNode>().radius((d) => {
        const cfg = nodeConfig[d.type] || { size: 14 };
        return cfg.size + 20;
      }));

    simulationRef.current = simulation;

    // Links
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup.selectAll<SVGLineElement, SimulationLink>('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', 'rgba(201,184,106,0.15)')
      .attr('stroke-width', (d) => Math.max(0.5, (d.properties.confidence || 0.7) * 1.5))
      .attr('stroke-dasharray', (d) => d.directed ? 'none' : 'none')
      .attr('marker-end', (d) => d.directed ? 'url(#arrow)' : '')
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('stroke', 'rgba(201,184,106,0.6)').attr('stroke-width', 2);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke', 'rgba(201,184,106,0.15)').attr('stroke-width', 0.8);
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        // Find original relationship
        const orig = relationships.find((r) => r.id === d.id);
        if (orig && onRelationshipSelect) onRelationshipSelect(orig);
      });

    // Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll<SVGGElement, SimulationNode>('g')
      .data(simNodes)
      .join('g')
      .attr('class', 'graph-node')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, SimulationNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            if (d.id !== centerNodeId) {
              d.fx = null;
              d.fy = null;
            }
          })
      );

    // Node shapes
    node.each(function (d) {
      const cfg = nodeConfig[d.type] || { color: '#5A5348', size: 14, shape: 'circle' };
      const el = d3.select(this);
      const isSelected = d.id === selectedNodeId;
      const isCenter = d.id === centerNodeId;

      if (cfg.shape === 'rect') {
        el.append('rect')
          .attr('x', -30).attr('y', -10)
          .attr('width', 60).attr('height', 20)
          .attr('rx', 2)
          .attr('fill', isSelected ? 'rgba(201,184,106,0.15)' : 'rgba(13,16,18,0.9)')
          .attr('stroke', isSelected ? '#C9B86A' : isCenter ? '#8A7E45' : cfg.color)
          .attr('stroke-width', isSelected ? 1.5 : 0.8)
          .attr('filter', isSelected ? 'url(#glow)' : '');
      } else {
        // Outer ring for high-priority persons
        if (d.type === 'PERSON' && (d.investigationPriority || 0) > 70) {
          el.append('circle')
            .attr('r', cfg.size + 6)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(201,184,106,0.15)')
            .attr('stroke-width', 0.5)
            .attr('stroke-dasharray', '4 4');
        }

        el.append('circle')
          .attr('r', isCenter ? cfg.size + 4 : cfg.size)
          .attr('fill', isSelected ? 'rgba(201,184,106,0.12)' : 'rgba(13,16,18,0.92)')
          .attr('stroke', isSelected ? '#C9B86A' : isCenter ? '#C9B86A' : cfg.color)
          .attr('stroke-width', isSelected ? 2 : isCenter ? 1.5 : 0.8)
          .attr('filter', isSelected ? 'url(#glow)' : '');
      }

      // Label
      const labelY = cfg.shape === 'rect' ? 0 : cfg.size + 12;
      el.append('text')
        .attr('y', cfg.shape === 'rect' ? 4 : labelY)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'JetBrains Mono', monospace")
        .attr('font-size', cfg.shape === 'rect' ? '7px' : '8px')
        .attr('fill', isSelected ? '#C9B86A' : '#A5A49B')
        .attr('pointer-events', 'none')
        .text(() => {
          const name = d.displayName;
          return name.length > 14 ? name.slice(0, 13) + '…' : name;
        });

      // Priority score for persons
      if (d.type === 'PERSON' && d.investigationPriority && d.investigationPriority > 60) {
        el.append('text')
          .attr('y', labelY + 10)
          .attr('text-anchor', 'middle')
          .attr('font-family', "'JetBrains Mono', monospace")
          .attr('font-size', '6px')
          .attr('fill', 'rgba(201,184,106,0.5)')
          .attr('pointer-events', 'none')
          .text(`${d.investigationPriority}/100`);
      }
    });

    // Mouse interactions
    node
      .on('mouseenter', function (event, d) {
        const rect = svgRef.current!.getBoundingClientRect();
        const transform = d3.zoomTransform(svgRef.current!);
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          node: d,
        });
        // Highlight connections
        link
          .attr('stroke', (l) => {
            const s = typeof l.source === 'object' ? (l.source as SimulationNode).id : l.source;
            const t = typeof l.target === 'object' ? (l.target as SimulationNode).id : l.target;
            return s === d.id || t === d.id ? 'rgba(201,184,106,0.7)' : 'rgba(201,184,106,0.06)';
          })
          .attr('stroke-width', (l) => {
            const s = typeof l.source === 'object' ? (l.source as SimulationNode).id : l.source;
            const t = typeof l.target === 'object' ? (l.target as SimulationNode).id : l.target;
            return s === d.id || t === d.id ? 2 : 0.5;
          });
      })
      .on('mouseleave', function () {
        setTooltip(null);
        link.attr('stroke', 'rgba(201,184,106,0.15)').attr('stroke-width', 0.8);
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        const orig = nodes.find((n) => n.id === d.id);
        if (orig && onNodeSelect) onNodeSelect(orig);
      });

    // Click empty area to deselect
    svg.on('click', () => { if (onNodeSelect) onNodeSelect(null); });

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimulationNode).x || 0)
        .attr('y1', (d) => (d.source as SimulationNode).y || 0)
        .attr('x2', (d) => (d.target as SimulationNode).x || 0)
        .attr('y2', (d) => (d.target as SimulationNode).y || 0);

      node.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Initial zoom to fit
    simulation.on('end', () => {
      const bounds = g.node()?.getBBox();
      if (bounds) {
        const scale = Math.min(0.9, Math.min(width / bounds.width, height / bounds.height) * 0.85);
        const tx = (width - bounds.width * scale) / 2 - bounds.x * scale;
        const ty = (height - bounds.height * scale) / 2 - bounds.y * scale;
        svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }
    });

  }, [nodes, relationships, centerNodeId, selectedNodeId]);

  useEffect(() => {
    buildGraph();
    return () => {
      simulationRef.current?.stop();
    };
  }, [buildGraph]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', background: 'var(--bg-void)' }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="graph-tooltip"
          style={{ left: Math.min(tooltip.x + 12, window.innerWidth - 200), top: tooltip.y + 12 }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.12em', marginBottom: '6px' }}>
            {tooltip.node.type}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '6px' }}>
            {tooltip.node.displayName}
          </div>
          {tooltip.node.type === 'PERSON' && (
            <>
              {tooltip.node.properties.alias && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Alias: {String(tooltip.node.properties.alias)}
                </div>
              )}
              {tooltip.node.investigationPriority && (
                <div style={{ fontSize: '0.65rem', color: 'var(--accent)' }}>
                  Priority: {tooltip.node.investigationPriority}/100
                </div>
              )}
            </>
          )}
          {tooltip.node.connectionCount && (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              Connections: {tooltip.node.connectionCount}
            </div>
          )}
          {tooltip.node.evidenceCount && (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Evidence: {tooltip.node.evidenceCount}
            </div>
          )}
          <div style={{ fontSize: '0.6rem', color: 'var(--text-faint)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {tooltip.node.caseIds[0]}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
