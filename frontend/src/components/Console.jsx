import React, { useState, useRef } from 'react';
import ReviewPopup from './ReviewPopup';

// ---- SVG ICONS ----
const Icon = {
  Play: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>,
  Upload: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  FileJson: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  Spinner: () => <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />,
  Filter: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/></svg>,
  Eye: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Info: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Alert: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Edit: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Layers: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 2,7 12,12 22,7 12,2"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/></svg>,
  Zap: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>,
  FileText: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  ExternalLink: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
};

const STEPS = ['INGEST', 'EXTRACT', 'ENRICH', 'VALIDATE', 'COMPLETE'];

function getConfidenceColor(conf) {
  if (conf >= 0.8) return 'var(--blue)';
  if (conf >= 0.5) return 'var(--warning)';
  return 'var(--error)';
}

function getMethodBadge(method, isInsufficient) {
  if (isInsufficient) return <span className="badge badge-warning">INSUFFICIENT DATA</span>;
  if (method === 'inferred') return <span className="badge badge-warning">{method}</span>;
  if (method === 'flagged') return <span className="badge badge-error">{method}</span>;
  return <span className="badge badge-blue">{method}</span>;
}

export default function Console({
  activeTab = 'catalog',
  onTabChange,
  batchData,
  samplePdfs = [],
  selectedPdfFilename,
  isProcessing,
  processingLogs,
  processingStep,
  onRunBatch,
  onProcessSamplePDF,
  onUploadFile,
  onReviewAction,
  onExportCsv,
  onExportJson,
  apiBaseUrl,
}) {
  const [selectedSku, setSelectedSku] = useState(null);
  const [consoleView, setConsoleView] = useState('catalog'); // 'catalog' | 'product' | 'field'
  const [evidenceField, setEvidenceField] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [filterReview, setFilterReview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [reviewField, setReviewField] = useState(null);
  const fileInputRef = useRef(null);

  // When activeTab changes to 'review', jump to catalog+filter
  React.useEffect(() => {
    if (activeTab === 'review') {
      setFilterReview(true);
      setConsoleView('catalog');
    } else {
      setFilterReview(false);
    }
  }, [activeTab]);

  const navigateToProduct = (sku) => {
    setSelectedSku(sku);
    setConsoleView('product');
    setEvidenceField(null);
    setReviewField(null);
  };

  const navigateToField = (key, fVal, label) => {
    setEvidenceField({ key, val: fVal, name: label });
    setEditingField(null);
    setConsoleView('field');
  };

  const navigateToReview = (key, fVal, label) => {
    setReviewField({ key, val: fVal, name: label });
    setConsoleView('field');
  };

  const backToCatalog = () => {
    setConsoleView('catalog');
    setEvidenceField(null);
    setReviewField(null);
  };

  const backToProduct = () => {
    setConsoleView('product');
    setEvidenceField(null);
    setReviewField(null);
  };

  const summary = batchData?.catalog_summary || {
    products_processed: 0,
    attributes_extracted: 0,
    attributes_enriched: 0,
    attributes_verified: 0,
    needs_review: 0,
    average_confidence: 0,
    catalog_completeness: 0,
  };

  const records = batchData?.product_records || [];
  const displayRecords = filterReview ? records.filter(r => r.validation?.review_required) : records;
  const selectedRecord = records.find(r => r.sku === selectedSku) || (records.length > 0 ? records[0] : null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') onUploadFile(file);
    else if (file) alert('Please upload a PDF file.');
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) onUploadFile(file);
  };

  const openEvidence = (key, fVal, label) => {
    navigateToField(key, fVal, label);
  };

  const openReviewPopup = (key, fVal, label) => {
    navigateToReview(key, fVal, label);
  };

  const submitReview = (sku, key, action, newVal) => {
    onReviewAction(sku, key, action, newVal);
    setEditingField(null);
    backToProduct();
  };

  const openRawPdf = (filename) => {
    const pdfUrl = `${apiBaseUrl}/api/sample-pdf/${encodeURIComponent(filename)}`;
    window.open(pdfUrl, '_blank');
  };

  const defaultSamples = [
    { filename: 'aeroflow_af220_pump.pdf', title: 'AeroFlow Centrifugal Pump', sku: 'AF-220-XP', category: 'Pumps', tag: 'RAG Enriched Temp' },
    { filename: 'grade8_screw.pdf', title: 'Grade 8 Hex Cap Screw', sku: 'SCR-G8-3816', category: 'Fasteners', tag: 'Grade 8 Standard' },
    { filename: 'baldor_motor.pdf', title: 'Baldor Electric Motor', sku: 'VM3613T', category: 'Motors', tag: 'NEMA Frame Enriched' },
    { filename: 'parker_valve.pdf', title: 'Parker Safety Relief Valve', sku: 'PRV-50-SS', category: 'Valves', tag: 'High Temp 316SS' },
    { filename: 'milacron_fan.pdf', title: 'Milacron Blower Fan', sku: 'CF-400-IND', category: 'Fans', tag: '4500 CFM Industrial' },
    { filename: 'teflon_ball_valve_sparse.pdf', title: 'Teflon Ball Valve (Sparse)', sku: 'TBV-200-SPARSE', category: 'Valves', tag: 'Insufficient Data Demo' },
  ];

  const availableSamples = samplePdfs.length > 0 ? samplePdfs : defaultSamples;

  // ---------- RENDER ----------
  return (
    <section id="console" style={{ padding: '0 0 80px', background: 'var(--bg)', minHeight: '100vh', paddingTop: '56px' }}>
      <div className="container" style={{ paddingTop: '32px' }}>

        {/* ── Breadcrumb / Back navigation ── */}
        {consoleView !== 'catalog' && (
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '8px 14px' }}
              onClick={backToCatalog}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Back to Catalog
            </button>
            {consoleView === 'field' && (
              <>
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>›</span>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                  onClick={backToProduct}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Back to Product
                </button>
              </>
            )}
            {selectedRecord && (
              <>
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>›</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--blue)' }}>{selectedRecord.sku}</span>
                {consoleView === 'field' && evidenceField && (
                  <>
                    <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>›</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted-bright)' }}>{evidenceField.name}</span>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Console toolbar (always visible at top) ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '20px 28px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon.Zap />
              {consoleView === 'catalog' && 'INTELLIGENCE CONSOLE / CATALOG'}
              {consoleView === 'product' && `INTELLIGENCE CONSOLE / PRODUCT DETAIL — ${selectedRecord?.sku || ''}`}
              {consoleView === 'field' && `INTELLIGENCE CONSOLE / FIELD EVIDENCE — ${evidenceField?.name || reviewField?.name || ''}`}
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, margin: 0 }}>
              {consoleView === 'catalog' && 'CATALOG'}
              {consoleView === 'product' && (selectedRecord?.name?.value || 'PRODUCT DETAIL')}
              {consoleView === 'field' && (evidenceField?.name || reviewField?.name || 'FIELD REVIEW')}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {consoleView === 'catalog' && (
              <>
                <button className="btn btn-primary" onClick={onRunBatch} disabled={isProcessing} aria-busy={isProcessing}>
                  {isProcessing ? <Icon.Spinner /> : <Icon.Play />}
                  {isProcessing ? 'Processing...' : 'Run Demo Catalog'}
                </button>
                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                  <Icon.Upload /> Upload Spec Sheet
                  <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileInput} />
                </label>
                <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />
                <button className="btn-icon" onClick={onExportCsv} disabled={!records.length} title="Export CSV" aria-label="Export CSV">
                  <Icon.Download />
                </button>
                <button className="btn-icon" onClick={onExportJson} disabled={!records.length} title="Export JSON" aria-label="Export JSON">
                  <Icon.FileJson />
                </button>
              </>
            )}
            {consoleView === 'product' && selectedRecord && (
              <span className="badge badge-blue">{Object.keys(selectedRecord.attributes || {}).length} Attributes</span>
            )}
          </div>
        </div>

        {/* ── DEMO SPECIFICATION PDFS ── */}
        <div style={{ marginBottom: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '4px' }}>
              DEMO SPECIFICATION PDFS
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Select a spec sheet to analyze with the AI pipeline
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {availableSamples.map((sample) => {
              const isSelected = selectedPdfFilename === sample.filename;
              const hasMatchingRecord = records.find(r => r.sku === sample.sku);
              
              return (
                <div
                  key={sample.filename}
                  style={{
                    padding: '14px',
                    background: isSelected ? 'rgba(62, 124, 177, 0.12)' : 'var(--surface-elevated)',
                    border: isSelected ? '2px solid var(--blue)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                  className="hover-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      {sample.title}
                    </div>
                    <span className="badge badge-blue" style={{ fontSize: '9px' }}>{sample.tag || sample.category}</span>
                  </div>
                  
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>SKU: {sample.sku}</span>
                    {hasMatchingRecord && <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '10px', padding: '5px 8px', justifyContent: 'center' }}
                      onClick={() => openRawPdf(sample.filename)}
                      title="View original PDF"
                    >
                      <Icon.ExternalLink /> View PDF
                    </button>

                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '10px', padding: '5px 8px', justifyContent: 'center' }}
                      onClick={() => !isProcessing && onProcessSamplePDF(sample.filename)}
                      disabled={isProcessing}
                      title="Run AI analysis"
                    >
                      <Icon.Zap /> Analyze
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CUSTOM PDF UPLOAD / DROP ZONE ── */}
        <div style={{ marginBottom: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '8px' }}>
            UPLOAD CUSTOM PDF
          </div>

          <div
            className={`drop-zone${isDragging ? ' dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            aria-label="Drop zone: drag and drop a PDF spec sheet"
          >
            <div className="drop-zone-icon"><Icon.Upload /></div>
            <div className="drop-zone-title">Drag & drop PDF or click to browse</div>
          </div>
        </div>

        {/* ── Processing Tracker ── */}
        {isProcessing && (
          <div className="processing-box" style={{ marginBottom: '24px' }}>
            <div className="processing-header">
              <div className="processing-title">
                <Icon.Spinner /> Processing...
              </div>
              <div className="processing-step-count">Step {processingStep} of 5</div>
            </div>
            <div className="processing-steps">
              {STEPS.map((s, i) => (
                <div key={i} className={`processing-step${processingStep === i + 1 ? ' current' : processingStep > i + 1 ? ' done' : ''}`}>
                  {processingStep > i + 1 ? '✓ ' : `${i + 1}. `}{s}
                </div>
              ))}
            </div>
            {processingLogs.length > 0 && (
              <div className="processing-log">
                {processingLogs.map((l, idx) => (
                  <div key={idx} className="processing-log-line">
                    <span className="processing-log-msg">{l.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Metrics ── */}
        <div className="metrics-grid">
          {[
            { label: 'PROCESSED', value: summary.products_processed, sub: 'Products', className: '' },
            { label: 'EXTRACTED', value: summary.attributes_extracted, sub: 'Attributes', className: '' },
            { label: 'ENRICHED', value: summary.attributes_enriched, sub: 'Via RAG', className: 'warning' },
            { label: 'REVIEW', value: summary.needs_review, sub: 'Required', className: 'error' },
            { label: 'CONFIDENCE', value: `${summary.average_confidence}%`, sub: 'Average', className: 'blue', highlight: true },
          ].map((m, i) => (
            <div key={i} className={`metric-card${m.highlight ? ' highlight' : ''}`}>
              <div className="metric-label">{m.label}</div>
              <div className={`metric-value ${m.className}`}>{m.value}</div>
              <div className="metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Main Catalog Grid (shown in catalog and product views) ── */}
        {(consoleView === 'catalog' || consoleView === 'product') && (
          <div className="console-grid">

          {/* LEFT: Catalog Table */}
          <div className="console-card">
            <div className="console-card-header">
              <div>
                <h3 className="console-card-title">PROCESSED PRODUCT CATALOG</h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
                  {displayRecords.length} records available
                </div>
              </div>
              <button
                className={`btn btn-secondary${filterReview ? ' active' : ''}`}
                onClick={() => setFilterReview(!filterReview)}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <Icon.Filter /> {filterReview ? 'Showing Review Required' : 'Filter Review Required'}
              </button>
            </div>

            {records.length === 0 ? (
              <div className="empty-state">
                <Icon.Layers />
                <div className="empty-state-title">No Catalog Data Yet</div>
                <div className="empty-state-sub">Select a demo PDF card above or click "Run Full Catalog Batch" to generate data.</div>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="catalog-table" aria-label="Product catalog">
                  <thead>
                    <tr>
                      <th scope="col">SKU</th>
                      <th scope="col">PRODUCT</th>
                      <th scope="col">CATEGORY</th>
                      <th scope="col">CONFIDENCE</th>
                      <th scope="col">STATUS</th>
                      <th scope="col" style={{ textAlign: 'right' }}>INSPECT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRecords.map((r) => {
                      const conf = r.name?.confidence || 0.9;
                      const hasConflict = r.validation?.conflicts?.length > 0;
                      const needsReview = r.validation?.review_required || hasConflict;
                      const isSelected = (selectedRecord?.sku === r.sku);

                      return (
                        <tr
                          key={r.sku}
                          className={isSelected ? 'selected' : ''}
                          onClick={() => navigateToProduct(r.sku)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--blue)' }}>{r.sku}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.name?.value || 'N/A'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.pipeline_version}</div>
                          </td>
                          <td>
                            <span className="badge badge-blue">{r.category?.value || 'General'}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="conf-bar-mini" style={{ width: '48px' }}>
                                <div className="conf-bar-mini-fill" style={{ width: `${Math.round(conf * 100)}%`, background: getConfidenceColor(conf) }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: getConfidenceColor(conf) }}>
                                {Math.round(conf * 100)}%
                              </span>
                            </div>
                          </td>
                          <td>
                            {needsReview ? (
                              <span className="badge badge-error"><Icon.Alert /> REVIEW</span>
                            ) : (
                              <span className="badge badge-success"><Icon.Check /> READY</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn-icon"
                              onClick={(e) => { e.stopPropagation(); navigateToProduct(r.sku); }}
                              aria-label={`Inspect ${r.name?.value}`}
                            >
                              <Icon.Eye />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT: Dossier Inspector */}
          <div className="console-card">
            <div className="console-card-header">
              <div>
                <h3 className="console-card-title">PRODUCT ATTRIBUTE DOSSIER</h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
                  {selectedRecord ? `SKU: ${selectedRecord.sku}` : 'Select a product from the table'}
                </div>
              </div>
              {selectedRecord && (
                <span className="badge badge-blue">
                  {Object.keys(selectedRecord.attributes || {}).length} Attributes
                </span>
              )}
            </div>

            {!selectedRecord ? (
              <div className="empty-state">
                <Icon.Eye />
                <div className="empty-state-title">Select a Product</div>
                <div className="empty-state-sub">Click any row in the catalog table or select a demo spec PDF above to inspect attributes.</div>
              </div>
            ) : (
              <div>
                {/* Product Header */}
                <div style={{ padding: '16px', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
                    {selectedRecord.name?.value}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', fontFamily: 'var(--font-mono)', alignItems: 'center' }}>
                    <span style={{ color: 'var(--blue)' }}>Category: {selectedRecord.category?.value}</span>
                    <span style={{ color: 'var(--muted)' }}>•</span>
                    <span style={{ color: 'var(--muted)' }}>Source: {selectedRecord.name?.source || 'Spec Sheet PDF'}</span>
                    {selectedRecord.name?.source?.endsWith('.pdf') && (
                      <>
                        <span style={{ color: 'var(--muted)' }}>•</span>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: '11px', padding: '2px 8px', color: 'var(--blue)' }}
                          onClick={() => openRawPdf(selectedRecord.name.source)}
                        >
                          <Icon.ExternalLink /> View Source PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Validation Warnings if any */}
                {selectedRecord.validation?.conflicts?.length > 0 && (
                  <div className="warning-banner" style={{ marginBottom: '16px' }}>
                    <Icon.Alert />
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '2px' }}>VALIDATION WARNING / HUMAN REVIEW REQUIRED</div>
                      {selectedRecord.validation.conflicts.map((c, i) => (
                        <div key={i} style={{ fontSize: '12px' }}>• {c}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attributes Cards Grid */}
                <div className="attr-grid">
                  {Object.entries(selectedRecord.attributes || {}).map(([key, fVal]) => {
                    const label = key.replace(/_/g, ' ').toUpperCase();
                    return (
                      <AttrCard
                        key={key}
                        attrKey={key}
                        label={label}
                        fVal={fVal}
                        sku={selectedRecord.sku}
                        onInspect={() => openEvidence(key, fVal, label)}
                        onReview={() => openReviewPopup(key, fVal, label)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
        )}

        {/* ── Evidence Inspection Modal ── */}
        {consoleView === 'field' && evidenceField && selectedRecord && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) backToProduct(); }} role="dialog" aria-modal="true">
            <div className="modal" style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--blue)', textTransform: 'uppercase' }}>
                    FIELD TRACEABILITY & EVIDENCE DOSSIER
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    {evidenceField.name} — {selectedRecord.sku}
                  </h3>
                </div>
                <button className="btn-icon" onClick={backToProduct} aria-label="Close modal">
                  <Icon.X />
                </button>
              </div>

              <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>CURRENT VALUE</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)', background: 'var(--surface-elevated)', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    {evidenceField.val.value}
                  </div>
                </div>

                {evidenceField.val.original_value && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>ORIGINAL EXTRACTED UN-NORMALIZED VALUE</div>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--surface-elevated)', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      {evidenceField.val.original_value}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>CONFIDENCE SCORE</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: getConfidenceColor(evidenceField.val.confidence) }}>
                      {Math.round(evidenceField.val.confidence * 100)}% ({evidenceField.val.confidence})
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>EXTRACTION METHOD</div>
                    <div>{getMethodBadge(evidenceField.val.method, evidenceField.val.value === 'insufficient_data')}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>SOURCE CITATION</div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--blue)', background: 'var(--surface-elevated)', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    {evidenceField.val.source || 'Spec Sheet PDF Document'}
                  </div>
                </div>

                {evidenceField.val.evidence && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>GROUNDING EVIDENCE QUOTE</div>
                    <div style={{ fontSize: '12px', lineHeight: 1.6, background: 'var(--surface-elevated)', borderLeft: '3px solid var(--blue)', padding: '12px 14px', borderRadius: '0 var(--radius) var(--radius) 0', color: 'var(--text)' }}>
                      {evidenceField.val.evidence}
                    </div>
                  </div>
                )}

                {/* Edit Form inside modal if editing */}
                {editingField === evidenceField.key ? (
                  <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>HUMAN OVERRIDE VALUE</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter new attribute value..."
                        autoFocus
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => submitReview(selectedRecord.sku, evidenceField.key, 'edit', editValue)}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => submitReview(selectedRecord.sku, evidenceField.key, 'approve')}
                  >
                    <Icon.Check /> Approve Field
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => {
                      setEditingField(evidenceField.key);
                      setEditValue(evidenceField.val.value === 'insufficient_data' ? '' : evidenceField.val.value);
                    }}
                  >
                    <Icon.Edit /> Edit Value
                  </button>
                  {(evidenceField.val.method === 'flagged' || evidenceField.val.method === 'inferred' || evidenceField.val.value === 'insufficient_data') && (
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => {
                        openReviewPopup(evidenceField.key, evidenceField.val, evidenceField.name);
                        setEvidenceField(null);
                      }}
                    >
                      <Icon.Alert /> Review This Field
                    </button>
                  )}
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ color: 'var(--error)', fontSize: '12px' }}
                  onClick={() => submitReview(selectedRecord.sku, evidenceField.key, 'reject')}
                >
                  <Icon.X /> Reject Field
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Review Popup for Flagged/Conflicting Fields ── */}
        {consoleView === 'field' && reviewField && selectedRecord && (
          <ReviewPopup
            isOpen={true}
            onClose={backToProduct}
            fieldName={reviewField.name}
            fieldKey={reviewField.key}
            currentValue={reviewField.val.value}
            proposedValue={reviewField.val.original_value || reviewField.val.value}
            confidence={reviewField.val.confidence || 0}
            method={reviewField.val.method || 'extracted'}
            reason={
              reviewField.val.method === 'flagged'
                ? 'This field value was flagged during validation — a potential conflict or implausible value was detected by the AI auditor.'
                : reviewField.val.method === 'inferred'
                  ? 'This value was inferred by the AI from contextual clues and may not be directly stated in the source document.'
                  : reviewField.val.value === 'insufficient_data'
                    ? 'The AI pipeline could not find sufficient data to extract this attribute from the available sources.'
                    : 'This field has been marked for human review to verify accuracy.'
            }
            evidence={reviewField.val.evidence}
            source={reviewField.val.source}
            sku={selectedRecord.sku}
            allAttributes={selectedRecord.attributes || {}}
            onAccept={(sku, key, action) => {
              onReviewAction(sku, key, action);
            }}
            onReject={(sku, key, action) => {
              onReviewAction(sku, key, action);
            }}
            onEdit={(sku, key, action, val) => {
              onReviewAction(sku, key, action, val);
            }}
          />
        )}

      </div>
    </section>
  );
}

function AttrCard({ attrKey, label, fVal, sku, onInspect, onReview }) {
  const isInsufficient = fVal.value === 'insufficient_data';
  const isFlagged = fVal.method === 'flagged';
  const isInferred = fVal.method === 'inferred';
  const needsReview = isFlagged || isInferred || isInsufficient;
  const confPct = Math.round((fVal.confidence || 0) * 100);
  const barColor = isInsufficient ? 'var(--error)' : getConfidenceColor(fVal.confidence);

  return (
    <div
      className={`attr-card${isFlagged ? ' conflict' : ''}${isInsufficient ? ' insufficient' : ''}`}
      onClick={onInspect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onInspect()}
      aria-label={`Inspect ${label}`}
    >
      <div className="attr-card-header">
        <div className="attr-card-name">{label}</div>
        {getMethodBadge(fVal.method, isInsufficient)}
      </div>
      <div className="conf-bar-mini">
        <div className="conf-bar-mini-fill" style={{ width: `${confPct}%`, background: barColor }} />
      </div>
      <div className="attr-card-value">{fVal.value}</div>
      <div className="attr-card-footer">
        <span>{fVal.source ? fVal.source.split(':')[0].substring(0, 20) : 'Spec Doc'}</span>
        <span style={{ color: barColor, fontWeight: 600 }}>{confPct}%</span>
      </div>
      {needsReview && (
        <div
          className={`attr-card-review-flag${isInferred || isInsufficient ? ' attr-card-review-flag--warning' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onReview();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onReview(); } }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          REVIEW
        </div>
      )}
    </div>
  );
}
