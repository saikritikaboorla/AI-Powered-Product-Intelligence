import React, { useState } from 'react';

export default function SettingsModal({ isOpen, onClose, onSaveKeys, keyStatus }) {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveKeys({
      gemini_key: geminiKey || undefined,
      openai_key: openaiKey || undefined,
      anthropic_key: anthropicKey || undefined,
    });
    setSaveStatus('Keys saved and applied.');
    setTimeout(() => {
      setSaveStatus('');
      onClose();
    }, 1200);
  };

  const providerColor = keyStatus?.is_configured ? 'var(--success)' : 'var(--warning)';

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--blue)', marginBottom: '4px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              LLM CONFIGURATION
            </div>
            <h2 id="settings-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, margin: 0 }}>
              CONFIGURE LLM PROVIDERS
            </h2>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Status Indicator */}
        <div style={{ padding: '12px 16px', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: providerColor, flexShrink: 0 }} />
          <div>
            <span style={{ color: 'var(--muted)' }}>Active Provider: </span>
            <span style={{ fontWeight: 700, color: providerColor }}>
              {keyStatus?.active_provider ? keyStatus.active_provider.toUpperCase() : 'NOT CONFIGURED — DEMO MODE'}
            </span>
          </div>
        </div>

        {/* Priority note */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.6 }}>
          Priority order: <span style={{ color: 'var(--blue)' }}>Gemini</span> → OpenAI → Anthropic. Leave blank to keep existing value.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="gemini-key">
              GOOGLE GEMINI API KEY {keyStatus?.gemini_configured && <span style={{ color: 'var(--success)' }}>✓ Configured</span>}
            </label>
            <input
              id="gemini-key"
              type="password"
              className="form-input"
              placeholder={keyStatus?.gemini_configured ? '••••••••••••••••' : 'AIzaSy...'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="openai-key">
              OPENAI API KEY {keyStatus?.openai_configured && <span style={{ color: 'var(--success)' }}>✓ Configured</span>}
            </label>
            <input
              id="openai-key"
              type="password"
              className="form-input"
              placeholder={keyStatus?.openai_configured ? '••••••••••••••••' : 'sk-...'}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="anthropic-key">
              ANTHROPIC API KEY {keyStatus?.anthropic_configured && <span style={{ color: 'var(--success)' }}>✓ Configured</span>}
            </label>
            <input
              id="anthropic-key"
              type="password"
              className="form-input"
              placeholder={keyStatus?.anthropic_configured ? '••••••••••••••••' : 'sk-ant-...'}
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              autoComplete="off"
            />
          </div>

          {saveStatus && (
            <div className="success-state" role="status" style={{ marginBottom: '16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
              {saveStatus}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Keys</button>
          </div>
        </form>
      </div>
    </div>
  );
}
