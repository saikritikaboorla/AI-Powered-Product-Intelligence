import React from 'react';

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const BAD = [
  'Manual PDF copy-pasting prone to typos and human error.',
  'Inconsistent units: mixed °F/°C, GPM/LPM, psi/bar.',
  'Generic LLM hallucinations fabricate missing specs.',
  'Zero source citations or audit trail for commerce teams.',
];

const GOOD = [
  'Automated PDF ingestion & schema-guided extraction.',
  'Robust unit normalization: temp, pressure, power, mass.',
  'Anti-hallucination RAG fallback returns insufficient_data.',
  'Every field carries source quote, evidence, and validation.',
];

export default function WhyApex() {
  return (
    <section id="architecture" style={{ padding: '100px 0', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="eyebrow" style={{ display: 'inline-flex', marginBottom: '20px' }}>
            ARCHITECTURAL COMPARISON
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            CHAOS VS STRUCTURE.
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--muted)', maxWidth: '520px', margin: '16px auto 0', lineHeight: 1.7 }}>
            How Apex Intelligence re-architects industrial catalog management.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
          {/* Bad */}
          <div style={{ padding: '36px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: 'var(--muted)' }}>TRADITIONAL PRODUCT DATA</h3>
              <span className="badge badge-error">MANUAL & FRAGMENTED</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {BAD.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', color: 'var(--muted-bright)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--error)', flexShrink: 0, marginTop: '1px' }}><XIcon /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Good */}
          <div style={{ padding: '36px', background: 'var(--surface-elevated)', border: '1px solid rgba(47,128,255,0.3)', borderRadius: '20px', boxShadow: '0 0 30px rgba(47,128,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid rgba(47,128,255,0.2)', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>APEX INTELLIGENCE</h3>
              <span className="badge badge-blue">AUTOMATED & GROUNDED</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {GOOD.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--blue)', flexShrink: 0, marginTop: '1px' }}><CheckIcon /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            #architecture .container > div:nth-child(2) {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
