import React, { useState, useEffect, useRef } from 'react';

// ---- SVG ICONS (local to keep component self-contained) ----
const PopupIcon = {
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
  Edit: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  XCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
    </svg>
  ),
  Alert: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  FileText: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813L20 12l-6.088 3.187L12 21l-1.912-5.813L4 12l6.088-3.187z" />
    </svg>
  ),
};

function getConfidenceColor(conf) {
  if (conf >= 0.8) return 'var(--blue)';
  if (conf >= 0.5) return 'var(--warning)';
  return 'var(--error)';
}

function getConfidenceLabel(conf) {
  if (conf >= 0.9) return 'Very High';
  if (conf >= 0.8) return 'High';
  if (conf >= 0.6) return 'Medium';
  if (conf >= 0.4) return 'Low';
  return 'Very Low';
}

/**
 * ReviewPopup — Interactive review popup for flagged/conflicting product fields.
 *
 * Props:
 *   isOpen         – boolean  – whether the popup is visible
 *   onClose        – fn()     – called to dismiss popup
 *   fieldName      – string   – human-readable field label  (e.g. "OPERATING TEMP")
 *   fieldKey       – string   – machine key                  (e.g. "operating_temp")
 *   currentValue   – string   – the current/original value
 *   proposedValue  – string   – AI-proposed replacement value (may be same as current)
 *   confidence     – number   – 0-1 confidence score
 *   method         – string   – extraction method ("extracted", "inferred", "flagged", …)
 *   reason         – string   – explanation of why it's flagged
 *   evidence       – string   – grounding evidence quote
 *   source         – string   – source citation
 *   sku            – string   – product SKU
 *   onAccept       – fn(sku, fieldKey, 'approve')   – accept proposed value
 *   onReject       – fn(sku, fieldKey, 'reject')     – reject proposed value
 *   onEdit         – fn(sku, fieldKey, 'edit', val)  – save edited value
 */
export default function ReviewPopup({
  isOpen,
  onClose,
  fieldName,
  fieldKey,
  currentValue,
  proposedValue,
  confidence = 0,
  method = 'extracted',
  reason,
  evidence,
  source,
  sku,
  allAttributes = {},
  onAccept,
  onReject,
  onEdit,
}) {
  const [isEditingMain, setIsEditingMain] = useState(false);
  const [editMainValue, setEditMainValue] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null); // 'accepted' | 'rejected' | 'edited'

  // State for minor changes (other fields)
  // Store local state for minor edits: { [key]: string }
  const [minorEditValues, setMinorEditValues] = useState({});
  // Track which minor keys are currently in edit mode: { [key]: boolean }
  const [editingMinorKeys, setEditingMinorKeys] = useState({});
  // Feedback state for specific minor items: { [key]: 'accepted' | 'rejected' | 'edited' }
  const [minorFeedback, setMinorFeedback] = useState({});

  const editInputRef = useRef(null);

  // Reset state when popup opens/closes or field changes
  useEffect(() => {
    if (isOpen) {
      setIsEditingMain(false);
      setEditMainValue('');
      setActionFeedback(null);
      setMinorEditValues({});
      setEditingMinorKeys({});
      setMinorFeedback({});
    }
  }, [isOpen, fieldKey]);

  // Auto-focus the edit input for main field
  useEffect(() => {
    if (isEditingMain && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditingMain]);

  if (!isOpen) return null;

  const confPct = Math.round(confidence * 100);
  const confColor = getConfidenceColor(confidence);
  const confLabel = getConfidenceLabel(confidence);
  const hasProposedChange = proposedValue && proposedValue !== currentValue;
  const isInsufficient = currentValue === 'insufficient_data';
  const isFlagged = method === 'flagged';
  const isInferred = method === 'inferred';

  // Extract all related minor changes (excluding the main fieldKey being reviewed)
  const minorChangesList = Object.entries(allAttributes)
    .filter(([key]) => key !== fieldKey)
    .map(([key, fVal]) => ({
      key,
      name: key.replace(/_/g, ' ').toUpperCase(),
      currentValue: fVal.value,
      proposedValue: fVal.original_value || fVal.value,
      confidence: fVal.confidence || 0,
      method: fVal.method || 'extracted',
      evidence: fVal.evidence,
      source: fVal.source,
      fVal
    }));

  // --- Main Change Handlers ---
  const handleAcceptMain = () => {
    setActionFeedback('accepted');
    setTimeout(() => {
      onAccept(sku, fieldKey, 'approve');
    }, 500);
  };

  const handleRejectMain = () => {
    setActionFeedback('rejected');
    setTimeout(() => {
      onReject(sku, fieldKey, 'reject');
    }, 500);
  };

  const handleEditSaveMain = () => {
    if (!editMainValue.trim()) return;
    setActionFeedback('edited');
    setTimeout(() => {
      onEdit(sku, fieldKey, 'edit', editMainValue.trim());
      setIsEditingMain(false);
    }, 500);
  };

  const handleEditStartMain = () => {
    setIsEditingMain(true);
    setEditMainValue(isInsufficient ? '' : (proposedValue || currentValue));
  };

  const handleEditCancelMain = () => {
    setIsEditingMain(false);
    setEditMainValue('');
  };

  // --- Minor Changes Handlers ---
  const handleAcceptMinor = (mKey) => {
    setMinorFeedback(prev => ({ ...prev, [mKey]: 'accepted' }));
    setTimeout(() => {
      onAccept(sku, mKey, 'approve');
    }, 500);
  };

  const handleRejectMinor = (mKey) => {
    setMinorFeedback(prev => ({ ...prev, [mKey]: 'rejected' }));
    setTimeout(() => {
      onReject(sku, mKey, 'reject');
    }, 500);
  };

  const handleEditStartMinor = (mKey, currentVal, proposedVal) => {
    setEditingMinorKeys(prev => ({ ...prev, [mKey]: true }));
    setMinorEditValues(prev => ({
      ...prev,
      [mKey]: currentVal === 'insufficient_data' ? '' : (proposedVal || currentVal)
    }));
  };

  const handleEditCancelMinor = (mKey) => {
    setEditingMinorKeys(prev => ({ ...prev, [mKey]: false }));
  };

  const handleEditSaveMinor = (mKey) => {
    const val = minorEditValues[mKey];
    if (!val || !val.trim()) return;
    setMinorFeedback(prev => ({ ...prev, [mKey]: 'edited' }));
    setTimeout(() => {
      onEdit(sku, mKey, 'edit', val.trim());
      setEditingMinorKeys(prev => ({ ...prev, [mKey]: false }));
    }, 500);
  };

  return (
    <div
      className="review-popup-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-popup-title"
    >
      <div className={`review-popup${actionFeedback ? ' review-popup--feedback' : ''}`}>

        {/* ── Main Feedback Overlay ── */}
        {actionFeedback && (
          <div className={`review-popup-feedback review-popup-feedback--${actionFeedback}`}>
            <div className="review-popup-feedback-icon">
              {actionFeedback === 'accepted' && <PopupIcon.Check />}
              {actionFeedback === 'rejected' && <PopupIcon.XCircle />}
              {actionFeedback === 'edited' && <PopupIcon.Edit />}
            </div>
            <div className="review-popup-feedback-text">
              {actionFeedback === 'accepted' && 'Main Change Accepted'}
              {actionFeedback === 'rejected' && 'Main Change Rejected'}
              {actionFeedback === 'edited' && 'Main Value Updated'}
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="review-popup-header">
          <div>
            <div className="review-popup-eyebrow">
              <PopupIcon.Shield />
              FIELD REVIEW — HUMAN-IN-THE-LOOP
            </div>
            <h3 id="review-popup-title" className="review-popup-title">
              {fieldName}
            </h3>
            <div className="review-popup-sku">SKU: {sku}</div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close review popup">
            <PopupIcon.X />
          </button>
        </div>

        {/* ── Status Banner for Main Change ── */}
        <div className={`review-popup-status ${isFlagged ? 'review-popup-status--flagged' : isInferred ? 'review-popup-status--inferred' : isInsufficient ? 'review-popup-status--insufficient' : 'review-popup-status--normal'}`}>
          <PopupIcon.Alert />
          <span>
            {isFlagged && 'This field has been flagged for review — a potential conflict was detected.'}
            {isInferred && 'This value was AI-inferred and may need verification.'}
            {isInsufficient && 'Insufficient data was found for this field.'}
            {!isFlagged && !isInferred && !isInsufficient && 'This field value requires human verification.'}
          </span>
        </div>

        {/* ── Main Value Comparison ── */}
        <div className="review-popup-comparison">
          <div className="review-popup-value-block review-popup-value-block--current">
            <div className="review-popup-value-label">CURRENT VALUE</div>
            <div className={`review-popup-value-text${isInsufficient ? ' review-popup-value-text--insufficient' : ''}`}>
              {isInsufficient ? 'Insufficient Data' : currentValue}
            </div>
          </div>

          {hasProposedChange && (
            <>
              <div className="review-popup-arrow">
                <PopupIcon.ArrowRight />
              </div>
              <div className="review-popup-value-block review-popup-value-block--proposed">
                <div className="review-popup-value-label">
                  <PopupIcon.Sparkles />
                  PROPOSED VALUE
                </div>
                <div className="review-popup-value-text review-popup-value-text--proposed">
                  {proposedValue}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Metadata Grid for Main Change ── */}
        <div className="review-popup-meta-grid">
          <div className="review-popup-meta-item">
            <div className="review-popup-meta-label">CONFIDENCE</div>
            <div className="review-popup-meta-value">
              <div className="review-popup-conf-bar">
                <div
                  className="review-popup-conf-fill"
                  style={{ width: `${confPct}%`, background: confColor }}
                />
              </div>
              <span style={{ color: confColor, fontWeight: 700 }}>{confPct}%</span>
              <span className="review-popup-conf-label">{confLabel}</span>
            </div>
          </div>
          <div className="review-popup-meta-item">
            <div className="review-popup-meta-label">METHOD</div>
            <div className="review-popup-meta-value">
              <span className={`badge ${isFlagged ? 'badge-error' : isInferred ? 'badge-warning' : 'badge-blue'}`}>
                {method?.toUpperCase() || 'EXTRACTED'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Reason for Main Change ── */}
        {reason && (
          <div className="review-popup-section">
            <div className="review-popup-section-label">
              <PopupIcon.Alert /> REASON FOR REVIEW
            </div>
            <div className="review-popup-reason">
              {reason}
            </div>
          </div>
        )}

        {/* ── Grounding Evidence for Main Change ── */}
        {evidence && (
          <div className="review-popup-section">
            <div className="review-popup-section-label">
              <PopupIcon.FileText /> GROUNDING EVIDENCE
            </div>
            <div className="review-popup-evidence">
              <blockquote>{evidence}</blockquote>
              {source && (
                <div className="review-popup-evidence-source">
                  Source: <span>{source}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Main Edit Form (conditionally shown) ── */}
        {isEditingMain && (
          <div className="review-popup-edit-section">
            <div className="review-popup-section-label">
              <PopupIcon.Edit /> MANUAL OVERRIDE (MAIN FIELD)
            </div>
            <div className="review-popup-edit-row">
              <input
                ref={editInputRef}
                type="text"
                className="review-popup-edit-input"
                value={editMainValue}
                onChange={(e) => setEditMainValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSaveMain();
                  if (e.key === 'Escape') handleEditCancelMain();
                }}
                placeholder="Enter corrected value..."
              />
              <button className="btn btn-primary btn-sm" onClick={handleEditSaveMain} disabled={!editMainValue.trim()}>
                <PopupIcon.Check /> Save
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleEditCancelMain}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Main Action Buttons ── */}
        {!actionFeedback && (
          <div className="review-popup-actions">
            <button
              className="review-popup-action-btn review-popup-action-btn--edit"
              onClick={handleEditStartMain}
              disabled={isEditingMain}
            >
              <PopupIcon.Edit />
              <span>Edit</span>
            </button>
            <button
              className="review-popup-action-btn review-popup-action-btn--accept"
              onClick={handleAcceptMain}
              disabled={isEditingMain}
            >
              <PopupIcon.Check />
              <span>Accept Change</span>
            </button>
            <button
              className="review-popup-action-btn review-popup-action-btn--reject"
              onClick={handleRejectMain}
              disabled={isEditingMain}
            >
              <PopupIcon.XCircle />
              <span>Reject Change</span>
            </button>
          </div>
        )}

        {/* ── Related Minor Changes Section ── */}
        {minorChangesList.length > 0 && (
          <div className="review-popup-minor-section">
            <div className="review-popup-minor-header">
              <div className="review-popup-minor-title">
                <PopupIcon.Sparkles />
                CHANGES ({minorChangesList.length} RELATED MINOR ATTRIBUTES)
              </div>
              <div className="review-popup-minor-subtitle">
                Review and individually manage other attributes for this product.
              </div>
            </div>

            <div className="review-popup-minor-list">
              {minorChangesList.map((item) => {
                const isEditing = editingMinorKeys[item.key];
                const feedback = minorFeedback[item.key];
                const itemConfPct = Math.round(item.confidence * 100);
                const itemConfColor = getConfidenceColor(item.confidence);
                const itemIsInsufficient = item.currentValue === 'insufficient_data';
                const itemIsFlagged = item.method === 'flagged';
                const itemIsInferred = item.method === 'inferred';

                return (
                  <div key={item.key} className={`minor-change-card${feedback ? ' minor-change-card--feedback' : ''}`}>
                    
                    {/* Minor feedback notice */}
                    {feedback && (
                      <div className={`minor-change-feedback minor-change-feedback--${feedback}`}>
                        {feedback === 'accepted' && <><PopupIcon.Check /> Accepted</>}
                        {feedback === 'rejected' && <><PopupIcon.XCircle /> Rejected / Removed</>}
                        {feedback === 'edited' && <><PopupIcon.Edit /> Updated</>}
                      </div>
                    )}

                    <div className="minor-change-top">
                      <div className="minor-change-name">
                        {item.name}
                        <span className={`badge ${itemIsFlagged ? 'badge-error' : itemIsInferred ? 'badge-warning' : 'badge-blue'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {item.method.toUpperCase()}
                        </span>
                      </div>
                      <div className="minor-change-conf" style={{ color: itemConfColor }}>
                        {itemConfPct}% Confidence
                      </div>
                    </div>

                    <div className="minor-change-body">
                      <div className="minor-change-val-box">
                        <span className="minor-change-val-label">Current:</span>
                        <span className={`minor-change-val-text${itemIsInsufficient ? ' minor-change-val-text--insufficient' : ''}`}>
                          {itemIsInsufficient ? 'Insufficient Data' : item.currentValue}
                        </span>
                      </div>

                      {item.proposedValue && item.proposedValue !== item.currentValue && (
                        <div className="minor-change-val-box">
                          <span className="minor-change-val-label">Proposed:</span>
                          <span className="minor-change-val-text minor-change-val-text--proposed">
                            {item.proposedValue}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.evidence && (
                      <div className="minor-change-evidence">
                        "{item.evidence}"
                      </div>
                    )}

                    {/* Inline edit input for minor item */}
                    {isEditing ? (
                      <div className="minor-change-edit-row">
                        <input
                          type="text"
                          className="review-popup-edit-input"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          value={minorEditValues[item.key] || ''}
                          onChange={(e) => setMinorEditValues({ ...minorEditValues, [item.key]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSaveMinor(item.key);
                            if (e.key === 'Escape') handleEditCancelMinor(item.key);
                          }}
                          placeholder="Enter new value..."
                          autoFocus
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                          onClick={() => handleEditSaveMinor(item.key)}
                          disabled={!minorEditValues[item.key]?.trim()}
                        >
                          <PopupIcon.Check /> Save
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => handleEditCancelMinor(item.key)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      /* Individual action buttons for minor change */
                      !feedback && (
                        <div className="minor-change-actions">
                          <button
                            className="btn btn-secondary btn-sm minor-btn-edit"
                            onClick={() => handleEditStartMinor(item.key, item.currentValue, item.proposedValue)}
                            title="Edit this specific attribute value"
                          >
                            <PopupIcon.Edit /> Edit
                          </button>
                          <button
                            className="btn btn-secondary btn-sm minor-btn-accept"
                            onClick={() => handleAcceptMinor(item.key)}
                            title="Accept this specific attribute change"
                          >
                            <PopupIcon.Check /> Accept
                          </button>
                          <button
                            className="btn btn-ghost btn-sm minor-btn-reject"
                            onClick={() => handleRejectMinor(item.key)}
                            title="Reject/Delete this specific attribute change"
                          >
                            <PopupIcon.XCircle /> Reject / Delete
                          </button>
                        </div>
                      )
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
