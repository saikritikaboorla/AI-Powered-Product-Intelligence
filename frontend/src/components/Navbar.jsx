import React, { useState, useEffect } from 'react';

export default function Navbar({ onOpenConsole, onOpenSettings, isConfigured, activeProvider }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        {/* Logo */}
        <button className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Apex Intelligence home">
          <div className="nav-logo-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <div className="nav-logo-text">APEX <span>INTELLIGENCE</span></div>
            <div className="nav-status">
              <span className="status-dot" aria-hidden="true" />
              <span>{isConfigured ? `${(activeProvider || 'AI').toUpperCase()} ONLINE` : 'DEMO MODE'}</span>
            </div>
          </div>
        </button>

        {/* Nav Links */}
        <ul className="nav-links" role="list">
          <li>
            <button className="nav-link" onClick={() => scrollTo('hero')}>Product</button>
          </li>
          <li>
            <button className="nav-link" onClick={() => scrollTo('pipeline')}>Pipeline</button>
          </li>
          <li>
            <button className="nav-link" onClick={() => scrollTo('architecture')}>Architecture</button>
          </li>
        </ul>

        {/* Actions */}
        <div className="nav-actions">
          <button
            onClick={onOpenSettings}
            className="btn-icon"
            aria-label="Configure LLM API keys"
            title="Configure LLM API Keys"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            className="btn btn-primary"
            onClick={onOpenConsole}
            aria-label="Open live intelligence console"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Open Console
          </button>
        </div>
      </div>
    </nav>
  );
}
