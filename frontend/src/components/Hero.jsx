import React, { useRef, useEffect, useState } from 'react';

const ORBIT_NODES = [
  { label: 'SKU / MODEL', type: 'extracted', val: 'AF-220-XP', conf: 99 },
  { label: 'VOLTAGE', type: 'extracted', val: '460 V / 60 Hz', conf: 96 },
  { label: 'PRESSURE', type: 'extracted', val: '150 GPM @ 75 PSI', conf: 94 },
  { label: 'MATERIAL', type: 'extracted', val: 'Cast Iron', conf: 96 },
  { label: 'TEMPERATURE', type: 'inferred', val: '220°F (104°C)', conf: 85 },
  { label: 'DIMENSIONS', type: 'extracted', val: '2.5 in NPT', conf: 95 },
  { label: 'CERTIFICATION', type: 'inferred', val: 'ISO 9001 / ANSI', conf: 90 },
  { label: 'WEIGHT', type: 'flagged', val: 'insufficient_data', conf: 0 },
];

export default function Hero({ onRunDemo, onExplore }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement);

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.tx = (e.clientX - rect.left - canvas.width / 2) * 0.03;
      mouseRef.current.ty = (e.clientY - rect.top - canvas.height / 2) * 0.03;
    };
    canvas.addEventListener('mousemove', onMouseMove);

    // Icosahedron-like wireframe vertices
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVerts = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];
    const edges = [
      [0,1],[0,5],[0,7],[0,10],[0,11],[1,5],[1,7],[1,8],[1,9],
      [2,3],[2,4],[2,6],[2,10],[2,11],[3,4],[3,6],[3,8],[3,9],
      [4,5],[4,9],[4,11],[5,9],[5,11],[6,7],[6,8],[6,10],[7,8],[7,10],[8,9],[10,11]
    ];

    let angleX = 0, angleY = 0;
    let time = 0;

    const render = () => {
      animRef.current = requestAnimationFrame(render);
      time++;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.04;

      angleX += 0.004;
      angleY += 0.006;

      const cx = w / 2 + mouseRef.current.x;
      const cy = h / 2 + mouseRef.current.y;
      const size = Math.min(w, h) * 0.14;

      // Radial glow
      const grd = ctx.createRadialGradient(cx, cy, size * 0.2, cx, cy, size * 2.5);
      grd.addColorStop(0, 'rgba(47,128,255,0.12)');
      grd.addColorStop(0.5, 'rgba(47,128,255,0.04)');
      grd.addColorStop(1, 'rgba(7,9,13,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Project 3D
      const projected = rawVerts.map(v => {
        const sz = size * 0.4;
        let x = v[0] * sz, y = v[1] * sz, z = v[2] * sz;
        // Y rotation
        let x1 = x * Math.cos(angleY) + z * Math.sin(angleY);
        let z1 = -x * Math.sin(angleY) + z * Math.cos(angleY);
        // X rotation
        let y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);
        const fov = 500;
        const s = fov / (fov + z2 + 350);
        return { x: cx + x1 * s, y: cy + y2 * s, z: z2, s };
      });

      // Wireframe edges
      ctx.lineWidth = 1;
      edges.forEach(([i, j]) => {
        const depth = (projected[i].z + projected[j].z) * 0.5;
        const alpha = Math.max(0.15, Math.min(0.65, 0.4 + depth / (size * 2)));
        ctx.strokeStyle = `rgba(47,128,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(projected[i].x, projected[i].y);
        ctx.lineTo(projected[j].x, projected[j].y);
        ctx.stroke();
      });

      // Vertex dots
      projected.forEach(p => {
        ctx.fillStyle = `rgba(90,168,255,${0.7 + p.s * 0.3})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5 * p.s, 0, Math.PI * 2);
        ctx.fill();
      });

      // Orbit nodes
      const orbitRadius = size * 1.75;
      const orbitSkew = 0.45;
      ORBIT_NODES.forEach((node, i) => {
        const a = angleY * 0.7 + (i / ORBIT_NODES.length) * Math.PI * 2;
        const nx = cx + Math.cos(a) * orbitRadius;
        const ny = cy + Math.sin(a) * orbitRadius * orbitSkew;

        // Connection line
        const lineColor = node.type === 'extracted' ? 'rgba(47,128,255,0.22)' :
          node.type === 'inferred' ? 'rgba(240,163,74,0.22)' :
          'rgba(230,106,106,0.22)';
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        ctx.setLineDash([]);

        // Node dot
        const dotColor = node.type === 'extracted' ? '#2F80FF' :
          node.type === 'inferred' ? '#F0A34A' : '#E66A6A';
        const pulse = 1 + Math.sin(time * 0.05 + i) * 0.3;

        // Outer ring
        ctx.strokeStyle = dotColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.35 + Math.sin(time * 0.04 + i * 0.8) * 0.2;
        ctx.beginPath();
        ctx.arc(nx, ny, 10 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Inner dot
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(nx, ny, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    render();

    return () => {
      cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <section id="hero" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '55% 45%', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: '80px', background: 'var(--bg)' }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'rgba(47,128,255,0.06)', borderRadius: '50%', filter: 'blur(120px)', top: '-120px', left: '-80px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'rgba(47,128,255,0.04)', borderRadius: '50%', filter: 'blur(80px)', bottom: '60px', right: '200px', pointerEvents: 'none' }} />

      {/* Left: Content */}
      <div style={{ padding: '80px 60px 80px 80px', display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', zIndex: 1 }}>

        <div className="eyebrow">
          <span className="eyebrow-dot" />
          INDUSTRIAL PRODUCT INTELLIGENCE / 01
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(3.5rem, 6vw, 7rem)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.04em', color: 'var(--text)', margin: 0 }}>
          TURN<br />
          PRODUCT DATA<br />
          INTO<br />
          <span style={{ color: 'var(--blue)' }}>INTELLIGENCE.</span>
        </h1>

        <p style={{ fontSize: '16px', color: 'var(--muted-bright)', maxWidth: '480px', lineHeight: 1.7 }}>
          Transform fragmented industrial product datasheets into structured, RAG-grounded, validated, and commerce-ready intelligence.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button className="btn btn-primary" onClick={onRunDemo} style={{ fontSize: '13px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><polygon points="5,3 19,12 5,21" /></svg>
            Run Demo Catalog
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
          </button>
          <button className="btn btn-secondary" onClick={onExplore} style={{ fontSize: '13px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            Explore System
          </button>
        </div>

        {/* Feature signals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
              No Guessing
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>Returns <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning)', background: 'var(--warning-dim)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>insufficient_data</code> when evidence is unavailable.</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
              Full Traceability
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>Every value exposes source, method, and evidence quote.</div>
          </div>
        </div>
      </div>

      {/* Right: 3D Canvas */}
      <div style={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
          aria-label="3D Product Intelligence Core visualization"
          aria-hidden="true"
        />

        {/* Top label */}
        <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.12em', background: 'rgba(13,17,23,0.8)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            PRODUCT INTELLIGENCE CORE
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)', background: 'rgba(13,17,23,0.8)', backdropFilter: 'blur(10px)', padding: '6px 10px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            INTERACTIVE 3D
          </div>
        </div>

        {/* Bottom cards – first 3 nodes */}
        <div style={{ position: 'absolute', bottom: '24px', left: '16px', right: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', pointerEvents: 'none' }}>
          {ORBIT_NODES.slice(0, 3).map((node, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(13,17,23,0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '10px 12px',
                pointerEvents: 'all',
              }}
              onMouseEnter={() => setTooltip(node)}
              onMouseLeave={() => setTooltip(null)}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>
                {node.label}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {node.val}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600,
                  color: node.type === 'extracted' ? 'var(--blue)' : node.type === 'inferred' ? 'var(--warning)' : 'var(--error)',
                  background: node.type === 'extracted' ? 'var(--blue-dim)' : node.type === 'inferred' ? 'var(--warning-dim)' : 'var(--error-dim)',
                  padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase'
                }}>
                  {node.type}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)' }}>{node.conf}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
          {[
            { color: 'var(--blue)', label: 'Extracted' },
            { color: 'var(--warning)', label: 'Inferred' },
            { color: 'var(--error)', label: 'Insufficient' },
          ].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(13,17,23,0.8)', backdropFilter: 'blur(10px)', padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.06em' }}>{l.label.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* Tooltip overlay */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--surface-elevated)',
            border: `1px solid ${tooltip.type === 'extracted' ? 'var(--border-bright)' : tooltip.type === 'inferred' ? 'rgba(240,163,74,0.4)' : 'rgba(230,106,106,0.4)'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: '200px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              {tooltip.label}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
              {tooltip.val}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase',
                color: tooltip.type === 'extracted' ? 'var(--blue)' : tooltip.type === 'inferred' ? 'var(--warning)' : 'var(--error)',
                background: tooltip.type === 'extracted' ? 'var(--blue-dim)' : tooltip.type === 'inferred' ? 'var(--warning-dim)' : 'var(--error-dim)',
              }}>
                {tooltip.type === 'flagged' ? 'INSUFFICIENT DATA' : tooltip.type}
              </span>
              {tooltip.conf > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>Confidence: {tooltip.conf}%</span>}
            </div>
          </div>
        )}
      </div>

      {/* Mobile breakpoint */}
      <style>{`
        @media (max-width: 900px) {
          #hero {
            grid-template-columns: 1fr !important;
            padding-top: 90px !important;
          }
          #hero > div:first-of-type {
            padding: 40px 20px !important;
          }
          #hero > div:last-of-type {
            height: 50vh !important;
            min-height: 300px !important;
          }
        }
      `}</style>
    </section>
  );
}
