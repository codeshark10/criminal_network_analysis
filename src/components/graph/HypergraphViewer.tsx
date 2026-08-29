import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useHypergraph } from '../../hooks/useHypergraph';
import { Loader2, AlertTriangle } from 'lucide-react';

interface HypergraphViewerProps {
  caseId: string;
  onNodeSelect?: (node: BipartiteNode) => void;
  selectedNodeId?: string;
}

interface BipartiteNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'EVENT' | 'PARTICIPANT';
  eventType?: string;
}

interface BipartiteLink extends d3.SimulationLinkDatum<BipartiteNode> {
  source: string | BipartiteNode;
  target: string | BipartiteNode;
}

const HypergraphViewer: React.FC<HypergraphViewerProps> = ({ caseId, onNodeSelect, selectedNodeId }) => {
  const { data, isLoading, isError, error } = useHypergraph(caseId);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<BipartiteNode, BipartiteLink> | null>(null);

  const buildGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !data) return;

    // Build nodes and links from hypergraph response
    const nodesMap = new Map<string, BipartiteNode>();
    const links: BipartiteLink[] = [];

    data.events.forEach((evt) => {
      // Event Node
      if (!nodesMap.has(evt.event_id)) {
        nodesMap.set(evt.event_id, {
          id: evt.event_id,
          label: evt.event_id,
          type: 'EVENT',
          eventType: evt.event_type,
        });
      }

      evt.participants.forEach((p) => {
        // Participant Node
        if (!nodesMap.has(p)) {
          nodesMap.set(p, {
            id: p,
            label: p,
            type: 'PARTICIPANT',
          });
        }

        // Link
        links.push({
          source: evt.event_id,
          target: p,
        });
      });
    });

    const nodes = Array.from(nodesMap.values());

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs
    const defs = svg.append('defs');

    // Arrow marker
    defs.append('marker')
      .attr('id', 'hyper-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', 'rgba(155, 89, 182, 0.4)');

    // Background grid
    const gridSize = 40;
    const grid = svg.append('g').attr('class', 'grid');
    for (let x = 0; x < width; x += gridSize) {
      grid.append('line').attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', height)
        .attr('stroke', 'rgba(155, 89, 182, 0.03)').attr('stroke-width', 0.5);
    }
    for (let y = 0; y < height; y += gridSize) {
      grid.append('line').attr('x1', 0).attr('y1', y).attr('x2', width).attr('y2', y)
        .attr('stroke', 'rgba(155, 89, 182, 0.03)').attr('stroke-width', 0.5);
    }

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom as any);
    
    svg.call(zoom.transform as any, d3.zoomIdentity.translate(width/2, height/2).scale(0.8).translate(-width/2, -height/2));

    // Hulls for events
    const eventNodes = nodes.filter(n => n.type === 'EVENT');
    const hullGroup = g.append('g').attr('class', 'hulls');
    const drawHull = d3.line().curve(d3.curveCatmullRomClosed);

    const hulls = hullGroup.selectAll('path')
      .data(eventNodes)
      .join('path')
      .attr('fill', d => selectedNodeId === d.id ? 'rgba(155, 89, 182, 0.4)' : 'rgba(155, 89, 182, 0.12)')
      .attr('stroke', d => selectedNodeId === d.id ? '#FFF' : '#9B59B6')
      .attr('stroke-width', d => selectedNodeId === d.id ? 3 : 1)
      .attr('stroke-dasharray', '4 4')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onNodeSelect) onNodeSelect(d);
      })
      .on('mouseenter', function() {
        d3.select(this).attr('fill', 'rgba(155, 89, 182, 0.25)');
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).attr('fill', selectedNodeId === d.id ? 'rgba(155, 89, 182, 0.4)' : 'rgba(155, 89, 182, 0.12)');
      });

    // Nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<any, BipartiteNode>()
        .on('start', (event, d) => {
          if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    node.each(function(d) {
      const el = d3.select(this);
      const isSelected = selectedNodeId === d.id;
      
      if (d.type === 'EVENT') {
        // Event nodes are now invisible centers for the hull, but we can draw a tiny dot
        el.append('circle')
          .attr('r', 2)
          .attr('fill', 'rgba(155,89,182,0.3)');
      } else {
        el.append('circle')
          .attr('r', 18)
          .attr('fill', isSelected ? 'rgba(201,184,106,0.2)' : '#C9B86A')
          .attr('stroke', isSelected ? '#FFF' : '#D4C374')
          .attr('stroke-width', isSelected ? 3 : 2);
      }
    });

    node.style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onNodeSelect) onNodeSelect(d);
      });

    node.append('text')
      .filter(d => d.type === 'PARTICIPANT')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', 26)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.8)');

    const simulation = d3.forceSimulation<BipartiteNode>(nodes)
      .force('link', d3.forceLink<BipartiteNode, BipartiteLink>(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(40));

    simulation.on('tick', () => {
      // Update hulls
      hulls.attr('d', function(d) {
        const relatedLinks = links.filter(l => l.source === d || l.target === d);
        const participantNodes = relatedLinks.map(l => l.source === d ? l.target as BipartiteNode : l.source as BipartiteNode);
        
        const points: [number, number][] = [];
        participantNodes.forEach(p => {
          // Add 4 points around each participant to create a padded boundary
          const pad = 30;
          points.push([p.x!, p.y! - pad]);
          points.push([p.x!, p.y! + pad]);
          points.push([p.x! - pad, p.y!]);
          points.push([p.x! + pad, p.y!]);
        });
        
        // Also include the event node's position to ensure the hull covers the center
        points.push([d.x! - 10, d.y! - 10]);
        points.push([d.x! + 10, d.y! + 10]);

        if (points.length < 3) return null;
        
        const hull = d3.polygonHull(points);
        return hull ? drawHull(hull) : null;
      });

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    simulationRef.current = simulation;

  }, [data, onNodeSelect, selectedNodeId]);

  useEffect(() => {
    buildGraph();
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [buildGraph]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <Loader2 size={32} className="animate-spin-slow" style={{ color: 'var(--accent)', marginBottom: '16px' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>COMPUTING HYPERGRAPH...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--critical)' }}>
        <AlertTriangle size={32} style={{ marginBottom: '16px' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>ERROR LOADING HYPERGRAPH</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>{error?.message}</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'var(--bg-base)', overflow: 'hidden' }} ref={containerRef}>
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#9B59B6', letterSpacing: '0.1em', marginBottom: '4px' }}>
          HYPERGRAPH MODE
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 300, color: 'var(--text-primary)', marginBottom: '12px' }}>
          {data?.case_name || caseId}
        </div>
        <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-elevated)', padding: '12px', border: '1px solid var(--border-dim)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-faint)', marginBottom: '4px' }}>TOTAL EVENTS</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{data?.total_events || 0}</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10, pointerEvents: 'none', display: 'flex', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', background: '#8E44AD', borderRadius: '2px' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>MULTI-PARTICIPANT EVENT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', background: '#C9B86A', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>PARTICIPANT</span>
        </div>
      </div>

      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

export default HypergraphViewer;
