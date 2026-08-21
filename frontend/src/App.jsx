import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import EditorialTransition from './components/EditorialTransition';
import PipelineVisualizer from './components/PipelineVisualizer';
import WhyApex from './components/WhyApex';
import LandingCTA from './components/LandingCTA';
import Console from './components/Console';
import ConsoleHeader from './components/ConsoleHeader';
import SettingsModal from './components/SettingsModal';
import Footer from './components/Footer';

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'console'
  const [consoleTab, setConsoleTab] = useState('catalog'); // 'catalog' | 'review'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [keyStatus, setKeyStatus] = useState(null);
  const [batchData, setBatchData] = useState(null);
  const [samplePdfs, setSamplePdfs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLogs, setProcessingLogs] = useState([]);
  const [processingStep, setProcessingStep] = useState(1);
  const [selectedPdfFilename, setSelectedPdfFilename] = useState(null);
  
  // Backend API URL (relative to current domain or fallback)
  const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : '';

  // Fetch initial API status, sample PDFs & last batch state
  useEffect(() => {
    fetchKeyStatus();
    fetchBatchStatus();
    fetchSamplePdfs();
  }, []);

  const fetchKeyStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/check-keys`);
      if (res.ok) {
        const data = await res.json();
        setKeyStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch key status:', e);
    }
  };

  const fetchBatchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/batch-status`);
      if (res.ok) {
        const data = await res.json();
        setBatchData(data);
      }
    } catch (e) {
      console.error('Failed to fetch batch status:', e);
    }
  };

  const fetchSamplePdfs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sample-pdfs`);
      if (res.ok) {
        const data = await res.json();
        setSamplePdfs(data.samples || []);
      }
    } catch (e) {
      console.error('Failed to fetch sample PDFs:', e);
    }
  };

  const handleSaveKeys = async (keysData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/save-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keysData)
      });
      if (res.ok) {
        await fetchKeyStatus();
      }
    } catch (e) {
      console.error('Failed to save keys:', e);
    }
  };

  const handleRunBatch = async () => {
    setIsProcessing(true);
    setProcessingStep(1);
    setSelectedPdfFilename(null);
    setProcessingLogs([
      { message: 'Initiating full batch pipeline for all 6 synthetic catalog PDFs...', details: 'data/samples/' }
    ]);

    const stepTimer1 = setTimeout(() => {
      setProcessingStep(2);
      setProcessingLogs(prev => [...prev, { message: 'PDF Ingestion complete. Running schema-guided LLM extraction...', details: '6 PDFs' }]);
    }, 800);

    const stepTimer2 = setTimeout(() => {
      setProcessingStep(3);
      setProcessingLogs(prev => [...prev, { message: 'Schema extraction complete. Querying RAG vector store for missing attributes...', details: 'reference_corpus' }]);
    }, 1600);

    const stepTimer3 = setTimeout(() => {
      setProcessingStep(4);
      setProcessingLogs(prev => [...prev, { message: 'RAG enrichment complete. Running deterministic checks & LLM-as-judge audit...', details: 'weighted formula' }]);
    }, 2400);

    try {
      const res = await fetch(`${API_BASE_URL}/api/process-batch`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProcessingStep(5);
        setProcessingLogs(prev => [...prev, { message: 'Batch pipeline execution finished successfully!', details: 'Catalog persisted' }]);
        setBatchData(data);
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Server batch endpoint unavailable' }));
        throw new Error(errorData.detail || 'Server batch endpoint unavailable');
      }
    } catch (e) {
      console.error('Batch process failed:', e);
      setProcessingLogs(prev => [...prev, { message: `Batch pipeline failed: ${e.message}`, details: 'API Error' }]);
      setProcessingStep(5);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const handleProcessSamplePDF = async (filename) => {
    setIsProcessing(true);
    setProcessingStep(1);
    setSelectedPdfFilename(filename);
    setProcessingLogs([
      { message: `Ingesting chosen demo PDF: ${filename}...`, details: 'data/samples/' }
    ]);

    const timer1 = setTimeout(() => {
      setProcessingStep(2);
      setProcessingLogs(prev => [...prev, { message: 'Schema-guided extraction running...', details: 'JSON Schema' }]);
    }, 400);

    const timer2 = setTimeout(() => {
      setProcessingStep(3);
      setProcessingLogs(prev => [...prev, { message: 'Checking missing fields & searching RAG vector store...', details: 'TF-IDF Corpus' }]);
    }, 800);

    const timer3 = setTimeout(() => {
      setProcessingStep(4);
      setProcessingLogs(prev => [...prev, { message: 'Running deterministic validation & confidence scoring...', details: 'Plausibility rules' }]);
    }, 1200);

    try {
      const res = await fetch(`${API_BASE_URL}/api/process-sample/${encodeURIComponent(filename)}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.record) {
          setBatchData(prev => {
            const records = prev?.product_records ? [...prev.product_records] : [];
            const idx = records.findIndex(r => r.sku === data.record.sku);
            if (idx >= 0) records[idx] = data.record;
            else records.push(data.record);
            
            // Recalculate catalog summary
            const attributes_extracted = records.reduce((acc, r) => acc + Object.keys(r.attributes || {}).length, 0);
            const attributes_enriched = records.reduce((acc, r) => acc + Object.values(r.attributes || {}).filter(f => f.method === 'inferred').length, 0);
            const attributes_verified = records.reduce((acc, r) => acc + Object.values(r.attributes || {}).filter(f => f.validation_status === 'passed').length, 0);
            const needs_review = records.filter(r => r.validation?.review_required).length;
            const total_confidence = records.reduce((acc, r) => {
              let field_conf = 0;
              let field_count = 0;
              if (r.name?.confidence) { field_conf += r.name.confidence; field_count++; }
              if (r.category?.confidence) { field_conf += r.category.confidence; field_count++; }
              Object.values(r.attributes || {}).forEach(f => {
                if (f.confidence) { field_conf += f.confidence; field_count++; }
              });
              return acc + (field_count > 0 ? field_conf / field_count : 0);
            }, 0);
            const average_confidence = records.length > 0 ? (total_confidence / records.length) * 100 : 0;
            
            return {
              ...prev,
              product_records: records,
              catalog_summary: {
                products_processed: records.length,
                attributes_extracted,
                attributes_enriched,
                attributes_verified,
                needs_review,
                average_confidence: Math.round(average_confidence),
                catalog_completeness: Math.round((attributes_verified / (attributes_extracted || 1)) * 100)
              }
            };
          });
          setProcessingStep(5);
          setProcessingLogs([
            { message: `Ingested ${filename} successfully.`, details: 'Source PDF' },
            { message: 'Extracted attributes & schema normalization completed.', details: 'Extraction Engine' },
            { message: 'RAG enrichment and grounding verification completed.', details: 'RAG Engine' },
            { message: 'Validation checks completed.', details: 'Auditor' }
          ]);
        }
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Server sample processing endpoint unavailable' }));
        throw new Error(errorData.detail || 'Server sample processing endpoint unavailable');
      }
    } catch (e) {
      console.error('Sample PDF processing failed:', e);
      setProcessingLogs(prev => [...prev, { message: `Processing failed: ${e.message}`, details: 'API Error' }]);
      setProcessingStep(5);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const handleUploadFile = async (file) => {
    setIsProcessing(true);
    setProcessingStep(1);
    setSelectedPdfFilename(null);
    setProcessingLogs([
      { message: `Uploading and ingesting spec sheet: ${file.name}...` }
    ]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/process`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProcessingLogs(data.logs || []);
        setProcessingStep(5);
        await fetchBatchStatus();
      } else {
        const err = await res.json().catch(() => ({ detail: 'Server response error' }));
        alert(`Processing error: ${err.detail || 'Failed'}`);
      }
    } catch (e) {
      console.error('Upload error:', e);
      alert(`Upload failed: ${e.message}`);
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const handleReviewAction = async (sku, fieldName, action, newValue) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(sku)}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku,
          field_name: fieldName,
          action,
          new_value: newValue
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state with the response
        if (data.product) {
          setBatchData(prev => ({
            ...prev,
            product_records: prev.product_records.map(r => 
              r.sku === sku ? data.product : r
            ),
            catalog_summary: data.catalog_summary
          }));
        }
      }
    } catch (e) {
      console.error('Review action failed:', e);
    }
  };

  const handleExportCsv = () => {
    window.open(`${API_BASE_URL}/api/export/csv`, '_blank');
  };

  const handleExportJson = () => {
    window.open(`${API_BASE_URL}/api/export/json`, '_blank');
  };

  const openConsole = () => {
    setIsTransitioning(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      setCurrentView('console');
      setIsTransitioning(false);
    }, 320);
  };

  const backToLanding = () => {
    setIsTransitioning(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      setCurrentView('landing');
      setIsTransitioning(false);
    }, 320);
  };

  return (
    <div className={`min-h-screen bg-[#07090D] text-[#F5F7FA] view-root${isTransitioning ? ' view-transitioning' : ''}`}>

      {/* ── CONSOLE VIEW ── */}
      {currentView === 'console' && (
        <div className="view-console">
          <ConsoleHeader
            onBackToLanding={backToLanding}
            activeTab={consoleTab}
            onTabChange={setConsoleTab}
            isConfigured={keyStatus?.is_configured}
            activeProvider={keyStatus?.active_provider}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {keyStatus && !keyStatus.is_configured && (
            <div className="demo-mode-topbar" style={{ top: '56px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              DEMO MODE — HEURISTIC FALLBACK&nbsp;
              <span>No LLM key configured. Using rule-based extraction instead of AI. Configure key for full RAG capabilities.</span>
              <button onClick={() => setIsSettingsOpen(true)} style={{ marginLeft: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--warning)', background: 'rgba(240,163,74,0.15)', border: '1px solid rgba(240,163,74,0.4)', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}>
                Configure Key →
              </button>
            </div>
          )}

          <Console
            activeTab={consoleTab}
            onTabChange={setConsoleTab}
            batchData={batchData}
            samplePdfs={samplePdfs}
            selectedPdfFilename={selectedPdfFilename}
            isProcessing={isProcessing}
            processingLogs={processingLogs}
            processingStep={processingStep}
            onRunBatch={handleRunBatch}
            onProcessSamplePDF={handleProcessSamplePDF}
            onUploadFile={handleUploadFile}
            onReviewAction={handleReviewAction}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
            apiBaseUrl={API_BASE_URL}
          />
        </div>
      )}

      {/* ── LANDING VIEW ── */}
      {currentView === 'landing' && (
        <div className="view-landing">
          <Navbar
            activeSection={activeSection}
            onOpenConsole={openConsole}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isConfigured={keyStatus?.is_configured}
            activeProvider={keyStatus?.active_provider}
          />

          {keyStatus && !keyStatus.is_configured && (
            <div className="demo-mode-topbar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              DEMO MODE — HEURISTIC FALLBACK&nbsp;
              <span>No LLM key configured. Using rule-based extraction instead of AI. Configure key for full RAG capabilities.</span>
              <button onClick={() => setIsSettingsOpen(true)} style={{ marginLeft: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--warning)', background: 'rgba(240,163,74,0.15)', border: '1px solid rgba(240,163,74,0.4)', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}>
                Configure Key →
              </button>
            </div>
          )}

          <Hero
            onRunDemo={() => { openConsole(); handleRunBatch(); }}
            onExplore={() => {
              const el = document.getElementById('pipeline');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <EditorialTransition />
          <PipelineVisualizer />
          <WhyApex />
          <LandingCTA onOpenConsole={openConsole} />
          <Footer />
        </div>
      )}

      {/* ── SETTINGS MODAL (shared) ── */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveKeys={handleSaveKeys}
        keyStatus={keyStatus}
      />

    </div>
  );
}
