import React from 'react';

export default function EditorialTransition() {
  return (
    <section id="editorial" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '120px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle grid pattern */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="eyebrow" style={{ margin: '0 auto 20px', display: 'inline-flex' }}>
          THE PROBLEM / 02
        </div>

        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(3rem, 7vw, 7rem)',
          fontWeight: 800,
          lineHeight: 0.95,
          letterSpacing: '-0.04em',
          maxWidth: '900px',
          margin: '0 auto',
          color: 'var(--text)',
        }}>
          INDUSTRIAL DATA<br />
          IS <span style={{ color: 'var(--muted)', fontWeight: 300, fontStyle: 'italic' }}>EVERYWHERE.</span><br />
          <span style={{ color: 'var(--blue)' }}>INTELLIGENCE IS NOT.</span>
        </h2>

        <p style={{ fontSize: '16px', color: 'var(--muted-bright)', maxWidth: '560px', margin: '40px auto 0', lineHeight: 1.7 }}>
          Industrial suppliers manage thousands of unstandardized spec sheets — missing ratings, incompatible units, and unverified parameters. Apex bridges the gap with grounded AI.
        </p>
      </div>
    </section>
  );
}
