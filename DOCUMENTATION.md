# AI-Powered Product Intelligence for Industrial Commerce
### Project Documentation — UniHack

---

## 1. Problem Understanding

Industrial manufacturers publish product information across many disconnected sources — technical spec-sheet PDFs, legacy product websites, printed catalogs, scanned documents, and CAD/technical drawings. This data is inconsistent in format, incomplete relative to what a commerce catalog requires, and expensive to normalize by hand. Today:

- A single product's true attributes (dimensions, materials, certifications, performance specs) are often spread across two or three different documents, none of which is complete on its own.
- The same attribute is expressed differently across sources ("5kg" vs "5000g" vs "11 lbs"), so nothing lines up cleanly in a catalog.
- Filling in missing attributes is done manually today, which does not scale to catalogs with thousands of SKUs.
- Buyers and catalog managers have no way to know *why* a listed attribute has a given value, or whether it can be trusted.

The project must turn fragmented, low-quality product input into **structured, validated, and explainable product intelligence**, without inventing facts that aren't supported by the source material.

---

## 2. Objectives

**Primary Objectives**
1. Generate structured product records from limited or unstructured input documents (PDFs, images, catalogs, web pages).
2. Enrich missing attributes using retrieval-grounded AI reasoning, never free-form guessing.
3. Validate every generated attribute for accuracy and internal consistency.
4. Make every AI-generated field explainable — traceable to the exact source or reference material used, with a confidence score.
5. Scale the same pipeline from a single product to a full catalog without redesign.

**Secondary Objectives**
- Keep the system extensible to new document types, product categories, and languages later.
- Design the schema and pipeline so outputs can be exported directly into a commerce platform.

---

## 3. Functional Requirements

| # | Module | Functional Requirements |
|---|--------|--------------------------|
| FR-1 | Document Ingestion | Accept PDF, image, and text/web input; extract raw text and tables; OCR fallback for scanned documents |
| FR-2 | Structured Extraction | Convert raw input into a fixed product schema (name, category, attributes) using schema-guided AI extraction; normalize units and formats |
| FR-3 | Enrichment (RAG) | For attributes missing from the source document, retrieve supporting evidence from a reference corpus (standards, manuals, past products) and generate the value with a citation; if no evidence exists, mark the field `insufficient_data` instead of guessing |
| FR-4 | Validation & Confidence Scoring | Run deterministic checks (valid ranges, allowed categories, required fields) and an AI plausibility check on every field; assign a confidence score and flag conflicts |
| FR-5 | Explainability | Every field in the output carries its source, method (extracted / inferred / flagged), and confidence score |
| FR-6 | Catalog Engine | Process products in batch across a full catalog; export structured output as JSON / CSV / JSON-LD |
| FR-7 | Review Support (stretch) | Surface only low-confidence or conflicting fields for human review, with approve/edit/reject actions |
| FR-8 | Query/Access | Allow retrieval of a processed product record by SKU or search term |

---

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Single-product processing completes in under 30 seconds |
| **Scalability** | The same pipeline should run unchanged on 1 product or a batch of thousands |
| **Accuracy & Reliability** | The system must never fabricate attribute values; if evidence is insufficient, it must say so rather than guess |
| **Explainability** | Every generated or enriched field must be traceable to a source document or reference chunk |
| **Consistency** | Units and formats must be normalized so the same attribute is comparable across all products |
| **Usability** | Output should be directly consumable by a commerce platform or reviewer without manual reformatting |
| **Extensibility** | New product categories, attributes, or document types should be addable without restructuring the core pipeline |
| **Portability** | The system should run locally for development/demo and be deployable to any standard cloud environment |

---

## 5. Dataset / Input Understanding

The pipeline works against **product source documents**, not a fixed pre-existing database — so "dataset understanding" here means understanding the input material and reference corpus that will drive extraction and enrichment:

- **Primary inputs** — spec-sheet PDFs, product catalog pages, scanned technical documents, product images/diagrams, and (optionally) product web pages.
- **Reference corpus** (used for enrichment, not the primary input) — category standards documents, manufacturer manuals, and previously processed products, indexed for retrieval.
- **Target schema entities** — Product, Category, Attribute (each with value, source, confidence, method), Validation result.

**Key data understanding tasks before building:**
1. Collect and review 5–10 representative sample documents to see which attributes are typically present vs. typically missing.
2. Define the category-specific attribute list (e.g., pumps need `flow_rate`, `max_temperature`; fasteners need `thread_size`, `material_grade`).
3. Identify unit variations that will need normalization (weight, dimensions, temperature, pressure).
4. Decide what reference material is available to seed the enrichment corpus — without it, enrichment has nothing to retrieve from.

---

## 6. System Architecture

A layered architecture keeps ingestion, AI processing, and structured output cleanly separated:

```
┌───────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                     │
│         API endpoint · CLI · (optional) Review UI          │
└───────────────────────────┬─────────────────────────────────┘
                             │ (REST API)
┌───────────────────────────▼─────────────────────────────────┐
│                    APPLICATION / API LAYER                 │
│     Request handling · Pipeline orchestration · Logging     │
└───────────────────────────┬─────────────────────────────────┘
                             │
┌───────────────────────────▼─────────────────────────────────┐
│                      AI / INTELLIGENCE LAYER                │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐ │
│  │ Document       │ │ Schema-Guided │ │ RAG Enrichment    │ │
│  │ Intelligence   │ │ Extraction    │ │ (retrieval + gen) │ │
│  └───────────────┘ └───────────────┘ └───────────────────┘ │
│  ┌───────────────────────────┐ ┌────────────────────────┐  │
│  │ Validation & Confidence   │ │ Explainability /        │  │
│  │ Scoring Engine            │ │ Citation Tracker        │  │
│  └───────────────────────────┘ └────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                             │
┌───────────────────────────▼─────────────────────────────────┐
│                        DATA LAYER                            │
│   Source documents (raw) · Vector store (reference corpus)  │
│   Structured catalog store (processed product records)      │
└───────────────────────────────────────────────────────────┘
```

**How a request flows, end to end:**
1. A document (or batch of documents) is submitted via the API/CLI.
2. The orchestrator runs ingestion, then passes extracted text to the Extraction engine.
3. Any attribute left empty is passed to the Enrichment engine, which retrieves supporting context from the vector store and generates a value with a citation, or marks it `insufficient_data`.
4. The Validation engine checks the full record for plausibility and consistency, assigning confidence scores.
5. The final structured record is written to the catalog store and returned to the caller.

---

## 7. Technology Stack

| Layer | Technology | Why This Choice (in plain terms) |
|-------|-----------|-----------------------------------|
| **Backend / API** | Python (FastAPI) | Nearly the entire AI stack (LLM calls, embeddings, document parsing) is Python-native, so staying in one language keeps the project simple to build and maintain in a short timeframe. |
| **Document Parsing** | pdfplumber, camelot | Reliable, well-documented libraries for extracting text and tables from PDFs without needing a heavier document-AI service. |
| **OCR** | Tesseract | Open-source, runs locally, handles scanned/image-based documents where no digital text layer exists. |
| **LLM (extraction + enrichment + judging)** | Claude / GPT-class API | Strong structured-output and reasoning ability; used with schema-guided prompts so every extraction call returns predictable JSON rather than free text. |
| **Vision-Language capability** | Claude with vision / GPT-4V-class | Needed to read spec sheets, diagrams, and catalog images directly, not just plain text. |
| **Retrieval (RAG)** | LlamaIndex or LangChain | Provides the retrieval scaffolding — chunking, embedding, and querying — needed to ground enrichment in real reference material instead of letting the LLM guess. |
| **Vector Store** | Chroma | Simple to run locally with no separate infrastructure, which matters for a short build cycle; swappable for a hosted vector DB later if needed. |
| **Schema Validation** | Pydantic | Enforces the exact product schema on every AI output, catching malformed responses immediately rather than letting bad data flow downstream. |
| **Data Processing** | Pandas | Handles batch processing and any tabular cleanup across a catalog of products. |
| **Testing** | pytest | Standard Python testing framework for verifying each pipeline stage independently. |
| **Deployment** | Docker | Keeps the environment reproducible and portable across local development, demo, and any future cloud deployment. |

---

## 8. Module Design

**Module 1 — Document Ingestion**
Sub-components: File Loader (PDF/image/text), Table Extractor, OCR Fallback Handler.

**Module 2 — Schema-Guided Extraction**
Sub-components: LLM Extraction Caller, JSON Schema Validator, Unit Normalizer.

**Module 3 — RAG Enrichment**
Sub-components: Reference Corpus Indexer, Retriever, Grounded Generator, Insufficient-Data Fallback Handler.

**Module 4 — Validation & Confidence Scoring**
Sub-components: Deterministic Rule Checker, Cross-Field Conflict Detector, LLM-as-Judge Scorer.

**Module 5 — Explainability & Citation Tracking**
Sub-components: Source Attacher (attaches document/chunk reference to every field), Confidence Aggregator, Reasoning Note Generator.

**Module 6 — Catalog Engine**
Sub-components: Batch Runner, Structured Store Writer, Export Formatter (JSON/CSV/JSON-LD).

**Module 7 — Review Support** *(stretch goal)*
Sub-components: Low-Confidence Field Filter, Review Dashboard, Approve/Edit/Reject Handler.

---

## 9. Data / Schema Design

Three data stores work together, each doing what it's best at:

**A. Source Document Store** — raw uploaded files (PDFs, images) plus metadata (filename, upload time, associated SKU). This is the audit trail for every extraction.

**B. Vector Store (reference corpus)** — embeddings of category standards, manuals, and previously processed products, used only for enrichment retrieval. Not the primary product data — purely supporting evidence.

**C. Structured Catalog Store** — the final output: one record per product, matching this schema:

```python
class FieldValue(BaseModel):
    value: Optional[str | float | int]
    confidence: float
    method: Literal["extracted", "inferred", "flagged"]
    source: Optional[str] = None

class ProductRecord(BaseModel):
    sku: str
    name: FieldValue
    category: FieldValue
    attributes: dict[str, FieldValue]
    validation: dict  # conflicts, review_required
    pipeline_version: str
```

**Sync strategy:** the Source Document Store and Vector Store are populated once (or incrementally as new reference material arrives); the Catalog Store is written to on every pipeline run and is the only store a downstream commerce system needs to read from.

---

## 10. AI Architecture

**10.1 Document Understanding**
Incoming document → text/table extraction → OCR if needed → passed to the extraction model as plain context.

**10.2 Schema-Guided Extraction**
A single LLM call is given the document text and a fixed JSON schema, and instructed to return only fields it can directly support from the text — any attribute not present is left `null`, never guessed.

**10.3 Retrieval-Augmented Enrichment**
For every field left empty after extraction, the system queries the vector store for relevant reference material. If a supporting chunk is found, the LLM generates the value **grounded in that chunk** and cites it. If nothing relevant is found, the field is marked `insufficient_data`. This retrieval-first approach is the core anti-hallucination safeguard.

**10.4 Validation & Confidence**
A second pass runs deterministic checks (unit ranges, allowed categories) and an LLM-as-judge review that scores each field's plausibility and flags any cross-field conflicts.

**10.5 Explainability Layer**
Every field in the final output carries three things: **what** the value is, **where** it came from (document or reference source), and **how confident** the system is — so a reviewer or downstream system can decide how much to trust it without re-deriving it.

---

## 11. Future Scope

- **Knowledge graph layer** — model relationships between products (compatible parts, replacements) for richer catalog queries.
- **Web scraping connectors** — pull product data directly from manufacturer websites, not just uploaded documents.
- **Multi-language catalogs** — extend extraction and enrichment to non-English source documents.
- **Marketing copy generation** — use validated structured attributes to draft product descriptions, clearly separated from factual fields.
- **Drift monitoring** — track how enrichment confidence changes as new reference material is added over time.
- **Image-based attribute extraction** — pull attributes directly from product photos, not just spec sheets.
- **Direct commerce-platform integration** — push the structured catalog store directly into a live storefront via API.

---

## How to Use This Document

Build in roughly this order: **5 (Input Understanding) → 9 (Schema Design) → 6 (Architecture) → 7 (Tech Stack) → 8 (Modules, starting with Ingestion + Extraction) → 10 (AI Architecture) → remaining modules.** Get a single document flowing through Ingestion → Extraction → a valid `ProductRecord` output first — that alone proves the core architecture — before adding enrichment, validation, and batch/catalog-scale processing.
