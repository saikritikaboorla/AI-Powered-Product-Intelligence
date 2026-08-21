import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Database, AlertTriangle, FileText } from 'lucide-react';

const NODES = [
  { label: 'PDF DATASHEET', type: 'extracted', val: 'AeroFlow AF-220.pdf', conf: 98, source: 'Source Spec Doc' },
  { label: 'SKU / MODEL', type: 'extracted', val: 'AF-220-XP', conf: 99, source: 'Spec Sheet Header' },
  { label: 'DIMENSIONS', type: 'extracted', val: '2.5 in NPT', conf: 95, source: 'Spec Sheet Table' },
  { label: 'MATERIAL', type: 'extracted', val: 'Cast Iron', conf: 96, source: 'Spec Sheet Table' },
  { label: 'PRESSURE', type: 'extracted', val: '150 GPM', conf: 94, source: 'Spec Sheet Table' },
  { label: 'TEMPERATURE', type: 'inferred', val: '220 °F (104 °C)', conf: 85, source: 'pump_standards.txt' },
  { label: 'VOLTAGE', type: 'extracted', val: '460 V', conf: 96, source: 'Spec Sheet Table' },
  { label: 'CERTIFICATION', type: 'inferred', val: 'ISO 9001 / ANSI', conf: 90, source: 'pump_standards.txt' },
  { label: 'WEIGHT / MASS', type: 'flagged', val: 'insufficient_data', conf: 0, source: 'No Evidence Found' },
];

export default function IntelligenceCore3D({ onRunDemo }) {
  const canvasRef = useRef(null);
  const [activeNode, setActiveNode] = useState(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - canvas.width / 2;
      const y = e.clientY - rect.top - canvas.height / 2;
      mouseRef.current.targetX = x * 0.05;
      mouseRef.current.targetY = y * 0.05;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let angleX = 0;
    let angleY = 0;

    // Generate inner 3D geometric wireframe vertices (Icosahedron/Cube hybrid)
    const size = Math.min(canvas.width, canvas.height) * 0.18;
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];
    const vertices = rawVertices.map(v => ({ x: v[0] * size * 0.4, y: v[1] * size * 0.4, z: v[2] * size * 0.4 }));

    const edges = [
      [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
      [1, 5], [1, 7], [1, 8], [1, 9],
      [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
      [3, 4], [3, 6], [3, 8], [3, 9],
      [4, 5], [4, 9], [4, 11],
      [5, 9], [5, 11],
      [6, 7], [6, 8], [6, 10],
      [7, 8], [7, 10],
      [8, 9], [10, 11]
    ];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      angleX += 0.005;
      angleY += 0.008;

      const cx = canvas.width / 2 + mouseRef.current.x;
      const cy = canvas.height / 2 + mouseRef.current.y;

      // Draw background glow radial
      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, size * 2.5);
      grad.addColorStop(0, 'rgba(47, 128, 255, 0.18)');
      grad.addColorStop(0.5, 'rgba(47, 128, 255, 0.04)');
      grad.addColorStop(1, 'rgba(7, 9, 13, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Project and rotate 3D vertices
      const projected = vertices.map(v => {
        // Y rotation
        let x1 = v.x * Math.cos(angleY) + v.z * Math.sin(angleY);
        let z1 = -v.x * Math.sin(angleY) + v.z * Math.cos(angleY);
        // X rotation
        let y2 = v.y * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = v.y * Math.sin(angleX) + z1 * Math.cos(angleX);

        const fov = 400;
        const scale = fov / (fov + z2 + 300);
        return {
          x: cx + x1 * scale,
          y: cy + y2 * scale,
          scale,
          z: z2
        };
      });

      // Draw 3D wireframe edges
      ctx.strokeStyle = 'rgba(47, 128, 255, 0.6)';
      ctx.lineWidth = 1.2;
      edges.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw 3D vertex nodes
      projected.forEach(p => {
        ctx.fillStyle = '#5AA8FF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw orbiting node connections
      const radius = size * 1.6;
      NODES.forEach((node, i) => {
        const nodeAngle = angleY * 0.8 + (i * (Math.PI * 2 / NODES.length));
        const nx = cx + Math.cos(nodeAngle) * radius;
        const ny = cy + Math.sin(nodeAngle) * (radius * 0.45);

        // Connection line to center
        ctx.strokeStyle = node.type === 'extracted' ? 'rgba(47, 128, 255, 0.25)' : node.type === 'inferred' ? 'rgba(240, 163, 74, 0.25)' : 'rgba(230, 106, 106, 0.25)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbiting node dot
        ctx.fillStyle = node.type === 'extracted' ? '#2F80FF' : node.type === 'inferred' ? '#F0A34A' : '#E66A6A';
        ctx.beginPath();
        ctx.arc(nx, ny, 5, 0, Math.PI * 2);
        ctx.fill();

        // Node halo
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(nx, ny, 9, 0, Math.PI * 2);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-[520px] rounded-2xl border border-[#242C37] bg-[#0B0F15]/90 glass-panel overflow-hidden group">
      
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-pointer" />

      {/* Floating Node Badge Controls */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10151D]/90 border border-[#242C37] text-[11px] font-mono text-[#8D98A7]">
            <Database className="w-3.5 h-3.5 text-[#2F80FF]" />
            <span>PRODUCT INTELLIGENCE CORE</span>
          </div>
          <span className="text-[10px] font-mono text-[#8D98A7] bg-[#151B24] px-2.5 py-1 rounded border border-[#242C37]">
            INTERACTIVE 3D MODEL
          </span>
        </div>

        {/* Floating Tooltip Carousel / Interactive Cards */}
        <div className="grid grid-cols-3 gap-3 pointer-events-auto">
          {NODES.slice(0, 3).map((node, i) => (
            <div
              key={i}
              onMouseEnter={() => setActiveNode(node)}
              onMouseLeave={() => setActiveNode(null)}
              className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-md ${
                activeNode?.label === node.label 
                  ? 'bg-[#151B24] border-[#2F80FF] shadow-[0_0_20px_rgba(47,128,255,0.3)] scale-105' 
                  : 'bg-[#10151D]/80 border-[#242C37] hover:border-[#3E4C5E]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-[#8D98A7] tracking-wider">{node.label}</span>
                {node.type === 'extracted' && <ShieldCheck className="w-3.5 h-3.5 text-[#2F80FF]" />}
                {node.type === 'inferred' && <FileText className="w-3.5 h-3.5 text-[#F0A34A]" />}
                {node.type === 'flagged' && <AlertTriangle className="w-3.5 h-3.5 text-[#E66A6A]" />}
              </div>
              <div className="font-mono text-xs font-bold text-[#F5F7FA] truncate">{node.val}</div>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#242C37]/60 text-[9px] font-mono">
                <span className={node.type === 'extracted' ? 'text-[#2F80FF]' : node.type === 'inferred' ? 'text-[#F0A34A]' : 'text-[#E66A6A]'}>
                  {node.type.toUpperCase()}
                </span>
                <span className="text-[#8D98A7]">{node.conf}% CONF</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Node Detail Hover Overlay */}
      {activeNode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-5 py-3 rounded-xl bg-[#151B24] border border-[#2F80FF] shadow-[0_0_30px_rgba(47,128,255,0.4)] pointer-events-none animate-in fade-in zoom-in duration-150">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${activeNode.type === 'extracted' ? 'bg-[#2F80FF]' : activeNode.type === 'inferred' ? 'bg-[#F0A34A]' : 'bg-[#E66A6A]'}`} />
            <div>
              <div className="text-xs font-mono font-bold text-[#F5F7FA]">{activeNode.label}: {activeNode.val}</div>
              <div className="text-[10px] font-mono text-[#8D98A7]">
                Source: <span className="text-[#5AA8FF]">{activeNode.source}</span> • Confidence: <span className="text-[#F5F7FA]">{activeNode.conf}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Core Interactive Action Button overlay */}
      <div className="absolute bottom-6 right-6 z-10">
        <button
          onClick={onRunDemo}
          className="px-5 py-2.5 rounded-xl bg-[#2F80FF]/20 hover:bg-[#2F80FF] border border-[#2F80FF] text-[#F5F7FA] font-mono text-xs font-bold tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(47,128,255,0.3)] hover:shadow-[0_0_35px_rgba(47,128,255,0.6)] flex items-center gap-2"
        >
          <span>TRIGGER PIPELINE CORE</span>
        </button>
      </div>

    </div>
  );
}
