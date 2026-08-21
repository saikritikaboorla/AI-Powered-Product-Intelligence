import React from 'react';

export default function ConsoleHeader({
  onBackToLanding,
  activeTab,
  onTabChange,
  isConfigured,
  activeProvider,
  onOpenSettings,
}) {
  return (
    <header className="console-header" role="banner">
      <div className="console-header-inner">

        {/* Left: back + logo */}
        <button
          className="console-header-back"
          onClick={onBackToLanding}
          aria-label="Back to Apex Intelligence landing page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <div className="console-header-logo-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <div className="console-header-logo-text">APEX <span>INTELLIGENCE</span></div>
            <div className="console-header-status">
              <span className="status-dot" aria-hidden="true" />
              <span>{isConfigured ? `${(activeProvider || 'AI').toUpperCase()} ONLINE` : 'DEMO MODE'}</span>
            </div>
          </div>
        </button>

        {/* Center: nav tabs */}
        <nav className="console-header-tabs" aria-label="Console navigation">
          <button
            className={`console-tab${activeTab === 'catalog' ? ' active' : ''}`}
            onClick={() => onTabChange('catalog')}
            aria-current={activeTab === 'catalog' ? 'page' : undefined}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12,2 2,7 12,12 22,7 12,2" />
              <polyline points="2,17 12,22 22,17" />
              <polyline points="2,12 12,17 22,12" />
            </svg>
            CATALOG
          </button>
          <button
            className={`console-tab${activeTab === 'review' ? ' active' : ''}`}
            onClick={() => onTabChange('review')}
            aria-current={activeTab === 'review' ? 'page' : undefined}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            REVIEW
          </button>
        </nav>

        {/* Right: settings */}
        <div className="console-header-actions">
          <button
            onClick={onOpenSettings}
            className="btn-icon"
            aria-label="Configure LLM API keys"
            title="Configure LLM API Keys"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

      </div>
    </header>
  );
}
