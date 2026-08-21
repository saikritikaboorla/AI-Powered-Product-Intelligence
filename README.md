# APEX INTELLIGENCE — AI-Powered Product Intelligence for Industrial Commerce

> **UniHack 2026 Challenge Prototype**  
> End-to-end industrial product attribute normalization, RAG-grounded enrichment, deterministic validation, per-field evidence traceability, human-in-the-loop review, and catalog-scale batch processing.

---

## 🎯 Executive Summary

Industrial suppliers and distributors manage thousands of fragmented manufacturer datasheets (PDFs) with inconsistent units (e.g. °F vs °C, psi vs bar, HP vs kW), missing technical ratings, and contradictory safety limits.

**Apex Intelligence** transforms raw, incomplete datasheets into validated, normalized, traceable, and commerce-ready structured catalog data.

```
RAW PRODUCT DATA (PDF / Spec Sheet)
       │
       ▼
1. DOCUMENT INGESTION ──▶ Text & table parsing (pdfplumber)
       │
       ▼
2. SCHEMA EXTRACTION ──▶ Strict schema-guided parsing (No guessing!)
       │
       ▼
3. UNIT NORMALIZATION ─▶ Dual original & normalized values (°F/°C, psi/bar, HP/kW)
       │
       ▼
4. RAG ENRICHMENT ─────▶ Vector store lookup (Reference corpus) + evidence quotes
       │                  └─▶ Missing evidence? ──▶ Flag "insufficient_data" (Confidence: 0.0)
       ▼
5. VALIDATION ENGINE ──▶ Deterministic range & material conflict checks + LLM judge
       │                  └─▶ Weighted Confidence: 40% Evidence + 20% Quality + 25% Validation + 15% Consistency
       ▼
6. EXPLAINABILITY ─────▶ Every field exposes: Value, Confidence %, Method, Source, Evidence Quote
       │
       ▼
7. HUMAN-IN-THE-LOOP ─▶ Interactive Review Panel (Approve / Edit / Reject)
       │
       ▼
8. COMMERCE OUTPUT ───▶ Catalog Dashboard + CSV / JSON Export
```

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- **Python**: 3.11+ (Tested on Python 3.14 on Windows)
- **Node.js**: 18+ and `npm`

### 1. Configure Environment / LLM Keys (Optional for Demo Mode)
Copy `.env.example` to `.env` and add your preferred API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
# or
OPENAI_API_KEY=your_openai_api_key_here
# or
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```
> *Note:* Provider priority order: **Gemini > OpenAI > Anthropic**. If no key is set, the API returns a clear configuration error on user requests, while developer unit tests utilize isolated test mocks.

### 2. Start the Application
Run the one-command bootstrap script:
```powershell
python run.py
```
This automatically:
1. Installs Python dependencies (`requirements.txt`).
2. Generates the 6 synthetic demonstration PDFs in `data/samples/`.
3. Indexes the reference standards corpus in `data/reference_corpus/`.
4. Builds the frontend React production bundle (`npm run build`).
5. Launches the FastAPI server at **http://127.0.0.1:8000**.

---

## ⚡ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/process` | Process a single uploaded PDF datasheet |
| `POST` | `/api/process-batch` | Process all sample catalog PDFs in `data/samples/` |
| `GET` | `/api/batch-status` | Get current batch records & catalog quality summary |
| `POST` | `/api/products/{sku}/review` | Submit human review action (`approve`, `edit`, `reject`) |
| `GET` | `/api/export/csv` | Download CSV export of the processed catalog |
| `GET` | `/api/export/json` | Download complete JSON export with full evidence traceability |
| `GET` | `/api/check-keys` | Check configured LLM providers & status |
| `POST` | `/api/save-keys` | Hot-reload LLM API keys without server restart |
| `GET` | `/api/reference-docs` | List indexed reference standards documents |

---

## 🔬 Deterministic Confidence Methodology

Confidence is **not** an arbitrary LLM guess. Apex calculates field confidence using a weighted multi-signal formula:

$$\text{Confidence} = 0.40 \cdot S_{\text{evidence}} + 0.20 \cdot S_{\text{extraction}} + 0.25 \cdot S_{\text{validation}} + 0.15 \cdot S_{\text{consistency}}$$

- **Evidence Support ($S_{\text{evidence}}$ - 40%)**: `1.0` for direct document text match; `0.85` for RAG inferred quote; `0.0` for `insufficient_data`.
- **Extraction Quality ($S_{\text{extraction}}$ - 20%)**: `1.0` for clean normalized value; `0.80` for unformatted string; `0.0` if empty.
- **Validation Result ($S_{\text{validation}}$ - 25%)**: `1.0` for passing range/material tolerance; `0.40` for format warning; `0.0` for material conflict.
- **Consistency & Plausibility ($S_{\text{consistency}}$ - 15%)**: LLM-as-judge audit score (`0.0` to `1.0`), penalized if cross-field conflict is detected.

---

## 🔍 Per-Field Traceability Schema

Every attribute in the catalog store adheres to the `FieldValue` schema:

```json
{
  "value": "220.0 °F (104.4 °C)",
  "original_value": "220 °F",
  "normalized_value": "220.0 °F (104.4 °C)",
  "normalized_unit": "°F",
  "confidence": 0.85,
  "method": "inferred",
  "source": "Reference Corpus: pump_standards.txt",
  "evidence": "Quote: \"Standard Cast Iron centrifugal pumps are rated for a maximum operating temperature of 220°F (104°C).\"",
  "validation_status": "passed"
}
```

---

## 📁 Synthetic Demonstration Catalog Disclosure

The sample catalog under `data/samples/` consists of **6 synthetic demonstration PDFs** generated programmatically via `fpdf2`:

1. `aeroflow_af220_pump.pdf` — AeroFlow Centrifugal Pump (Missing temp -> RAG enriched to 220°F from Cast Iron standards).
2. `grade8_screw.pdf` — Grade 8 Hex Cap Screw 3/8-16 (Fasteners category -> RAG enriched grade).
3. `baldor_motor.pdf` — Baldor VM3613T Electric Motor (Motors category -> RAG enriched NEMA frame).
4. `parker_valve.pdf` — Parker Series 50 Pressure Relief Valve (Valves category -> 400°F 316SS).
5. `milacron_fan.pdf` — Cincinnati Milacron Industrial Blower Fan (Fans category -> 4500 CFM).
6. `teflon_ball_valve_sparse.pdf` — Teflon-Lined Compact Ball Valve (Sparse -> Demonstrates anti-hallucination **`insufficient_data`** fallback).

> ⚠️ *Notice:* These sample spec sheets are synthetic demonstration documents generated for hackathon evaluation and testing. Real manufacturer standards can be dropped into `data/reference_corpus/` at any time.

---

## 🧪 Integration Test Suite

Run the full integration test suite covering all 6 core pipeline scenarios:
```powershell
python backend/test_pipeline.py
```
- **TEST A**: Normal schema-guided extraction & unit normalization.
- **TEST B**: RAG vector store enrichment with exact quote attachment.
- **TEST C**: Anti-hallucination `insufficient_data` fallback with zero confidence.
- **TEST D**: Deterministic & LLM-as-judge conflict detection (Cast Iron at 400°F flagged).
- **TEST E**: Batch catalog processing on 6 synthetic PDFs.
- **TEST F**: Human review action (approve/edit/reject) & state persistence.

---

## 🛡️ Implementation vs. Future Scope

| Feature | Status | Implementation Details |
|---------|--------|------------------------|
| PDF Ingestion & Table Extraction | ✅ Implemented | Uses `pdfplumber` for digital text & structured table parsing |
| Schema-Guided Extraction | ✅ Implemented | Fixed JSON schema with strict non-guessing instruction |
| Unit Normalization | ✅ Implemented | Temp (°F/°C), Pressure (psi/bar), Power (HP/kW), Mass, Dimensions |
| RAG Reference Corpus Enrichment | ✅ Implemented | Pure-Python TF-IDF vector store with exact quote evidence grounding |
| Insufficient Data Fallback | ✅ Implemented | Returns `insufficient_data` + `0.0` confidence when evidence is missing |
| Conflict Detection & Range Validation | ✅ Implemented | Range boundaries, material limit checks, LLM-as-judge audit |
| Weighted Confidence Scoring | ✅ Implemented | 40% Evidence + 20% Extraction + 25% Validation + 15% Consistency |
| Human-in-the-loop Review Panel | ✅ Implemented | Interactive Approve / Edit / Reject UI with batch store updates |
| CSV & JSON Catalog Export | ✅ Implemented | Full downloads containing values, confidence, methods, citations |
| OCR for Scanned PDFs | 🔮 Future Scope | Tesseract / Vision OCR fallback pipeline |
| Image-based CAD Attribute Extraction | 🔮 Future Scope | Multimodal VLM for technical drawings |
| ERP / E-commerce Connectors | 🔮 Future Scope | Direct SAP / Shopify / BigCommerce catalog sync APIs |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
