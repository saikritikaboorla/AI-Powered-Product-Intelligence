import React from 'react';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div style={{ width: '32px', height: '32px', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <div className="footer-brand-text">APEX INTELLIGENCE</div>
            <div className="footer-brand-sub">AI-Powered Product Intelligence for Industrial Commerce</div>
          </div>
        </div>

        <div className="footer-credit">
          <div>UniHack 2026 Prototype · FastAPI · RAG · React</div>
          <div className="footer-credit-blue">Grounding · Normalization · Traceability · Validation</div>
        </div>
      </div>
    </footer>
  );
}
