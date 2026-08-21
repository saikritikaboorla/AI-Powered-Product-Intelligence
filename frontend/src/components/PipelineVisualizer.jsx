import React, { useState } from 'react';

const STAGES = [
  {
    num: '01', name: 'INGEST',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" />
      </svg>
    ),
    desc: 'Extracts digital text layers & structured tables from raw PDF spec sheets via pdfplumber. Handles digital PDFs.',
    tag: 'pdfplumber',
    detail: 'The ingestion stage reads the raw PDF binary, extracts all text layers and tables using pdfplumber, and passes structured text blocks to the extraction stage. It identifies page numbers for evidence citations.',
  },
  {
    num: '02', name: 'EXTRACT',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    desc: 'Schema-guided LLM extraction. Returns null for missing fields — never fabricates values from imagination.',
    tag: 'Fixed JSON Schema',
    detail: 'The LLM receives a strict system prompt with a fixed JSON schema. It is instructed to extract only explicitly stated values. Missing values are returned as null — never guessed. Units are normalized in this stage.',
  },
  {
    num: '03', name: 'ENRICH',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    desc: 'Queries vector store engineering corpus for missing parameters. Grounds values with exact evidence quotes.',
    tag: 'RAG Grounding',
    detail: 'For null fields, a TF-IDF vector store retrieves the most relevant passage from the reference standards corpus. The LLM is given the retrieved chunk and asked to extract a value only if clearly supported. Otherwise: insufficient_data.',
  },
  {
    num: '04', name: 'VALIDATE',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    desc: 'Deterministic range checks + LLM-as-judge audit. Calculates weighted confidence using a documented formula.',
    tag: 'Conflict Engine',
    detail: 'Validation runs two passes: (1) deterministic checks against defined safe ranges and material compatibility rules, (2) LLM-as-judge plausibility audit. Weighted confidence = 40% Evidence + 20% Extraction + 25% Validation + 15% Consistency.',
  },
  {
    num: '05', name: 'OUTPUT',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
      </svg>
    ),
    desc: 'Publishes verified ProductRecord with per-field source citations, exportable as CSV or full JSON.',
    tag: 'Commerce Ready',
    detail: 'The final ProductRecord contains every attribute with its value, original value, normalized value, confidence score, extraction method, source document, evidence quote, and validation status. Ready for direct catalog import.',
  },
];

export default function PipelineVisualizer() {
  const [active, setActive] = useState(2);

  return (
    <section id="pipeline" style={{ padding: '100px 0', background: 'var(--bg)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="eyebrow" style={{ display: 'inline-flex', marginBottom: '20px' }}>
            THE INTELLIGENCE PIPELINE / 03
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            FROM FRAGMENTED DATA<br />TO VERIFIED INTELLIGENCE.
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--muted)', maxWidth: '520px', margin: '16px auto 0', lineHeight: 1.7 }}>
            Click any stage to inspect the transformation pipeline.
          </p>
        </div>

        {/* Stage Row */}
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          {/* Connecting line */}
          <div style={{ position: 'absolute', top: '52px', left: '10%', right: '10%', height: '2px', background: 'var(--border)', zIndex: 0, display: 'none' }} className="pipeline-line-desktop" />
          <div style={{ position: 'absolute', top: '52px', left: '10%', right: '10%', height: '2px', zIndex: 0 }}>
            <div style={{ height: '100%', width: `${(active / (STAGES.length - 1)) * 100}%`, background: 'linear-gradient(90deg, var(--blue), var(--blue-bright))', boxShadow: '0 0 12px rgba(47,128,255,0.5)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0', position: 'relative', zIndex: 1 }}>
            {STAGES.map((s, idx) => {
              const isActive = idx === active;
              const isDone = idx < active;

              return (
                <div
                  key={idx}
                  onClick={() => setActive(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setActive(idx)}
                  aria-pressed={isActive}
                  aria-label={`Stage ${s.num}: ${s.name}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                    padding: '0 12px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    opacity: !isActive && !isDone ? 0.55 : 1,
                  }}
                >
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%', marginBottom: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? 'var(--blue)' : isDone ? 'var(--surface-elevated)' : 'var(--surface-elevated)',
                    border: isActive ? '2px solid var(--blue)' : isDone ? '2px solid rgba(47,128,255,0.4)' : '2px solid var(--border)',
                    color: isActive ? '#fff' : isDone ? 'var(--blue)' : 'var(--muted)',
                    boxShadow: isActive ? '0 0 24px rgba(47,128,255,0.5)' : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: isActive ? 'var(--blue)' : 'var(--muted)', marginBottom: '6px', letterSpacing: '0.1em' }}>
                    STAGE {s.num}
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: isActive ? 'var(--text)' : 'var(--muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, maxWidth: '180px' }}>
                    {s.desc}
                  </div>
                  <div style={{ marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '9px', padding: '3px 8px', borderRadius: '20px', background: isActive ? 'var(--blue-dim)' : 'var(--surface-elevated)', color: isActive ? 'var(--blue)' : 'var(--muted)', border: '1px solid var(--border)' }}>
                    {s.tag}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{
          padding: '28px 32px',
          background: 'var(--surface)',
          border: '1px solid var(--border-bright)',
          borderRadius: '14px',
          boxShadow: '0 0 20px rgba(47,128,255,0.12)',
          animation: 'fadeSlideUp 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', background: 'var(--blue)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(47,128,255,0.4)'
            }}>
              {STAGES[active].icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--blue)', letterSpacing: '0.12em' }}>STAGE {STAGES[active].num}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{STAGES[active].name}</div>
                <span className="badge badge-blue">{STAGES[active].tag}</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--muted-bright)', lineHeight: 1.7, maxWidth: '700px' }}>
                {STAGES[active].detail}
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            #pipeline .container > div:nth-child(2) > div {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }
            #pipeline .container > div:nth-child(2) > div > div {
              flex-direction: row !important;
              text-align: left !important;
              align-items: flex-start !important;
              padding: 16px !important;
              background: var(--surface) !important;
              border: 1px solid var(--border) !important;
              border-radius: 10px !important;
              gap: 16px !important;
            }
            #pipeline .container > div:nth-child(2) > div > div > div:first-child {
              margin-bottom: 0 !important;
              flex-shrink: 0 !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
