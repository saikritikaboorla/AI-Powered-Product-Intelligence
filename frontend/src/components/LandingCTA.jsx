import React from 'react';

export default function LandingCTA({ onOpenConsole }) {
  return (
    <section
      id="cta"
      style={{
        padding: '120px 0',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        width: '700px',
        height: '400px',
        background: 'rgba(47,128,255,0.07)',
        borderRadius: '50%',
        filter: 'blur(120px)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="eyebrow" style={{ display: 'inline-flex', marginBottom: '28px' }}>
          <span className="eyebrow-dot" />
          INTELLIGENCE CONSOLE / 05
        </div>

        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.5rem, 5vw, 5rem)',
          fontWeight: 800,
          lineHeight: 0.95,
          letterSpacing: '-0.04em',
          color: 'var(--text)',
          marginBottom: '24px',
        }}>
          TURN PRODUCT DATA<br />
          INTO <span style={{ color: 'var(--blue)' }}>COMMERCE-READY</span><br />
          <span style={{ color: 'var(--blue)' }}>INTELLIGENCE.</span>
        </h2>

        <p style={{
          fontSize: '16px',
          color: 'var(--muted-bright)',
          maxWidth: '560px',
          margin: '0 auto 48px',
          lineHeight: 1.7,
        }}>
          RAG-grounded extraction. Deterministic validation. Full evidence traceability. See the complete pipeline in action.
        </p>

        {/* Feature chips */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '48px',
        }}>
          {[
            'PDF Ingestion',
            'RAG Enrichment',
            'Confidence Scoring',
            'Evidence Traceability',
          ].map((chip) => (
            <span
              key={chip}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted-bright)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
              }}
            >
              {chip}
            </span>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          className="btn btn-primary"
          onClick={onOpenConsole}
          style={{ fontSize: '14px', padding: '18px 40px', gap: '12px' }}
          aria-label="Open Intelligence Console"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          RUN LIVE DEMO
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        {/* Sub-note */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--muted)',
          marginTop: '20px',
          letterSpacing: '0.06em',
        }}>
          6 synthetic demo PDFs · Real extraction pipeline · Full evidence traceability
        </p>
      </div>
    </section>
  );
}
