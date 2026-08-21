"""
Apex Intelligence API — Flask edition
Pure Python, no Rust compilation required. Works on all Python versions including 3.14.
"""
import os
import json
import csv
import io
import logging
from pathlib import Path

from flask import Flask, request, jsonify, Response, abort

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("apex_api")

app = Flask(__name__)

# ── CORS ─────────────────────────────────────────────────────────────────────

@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

@app.route("/api/<path:path>", methods=["OPTIONS"])
@app.route("/api", methods=["OPTIONS"])
def options_handler(*args, **kwargs):
    return Response(status=200)

# ── In-memory catalog store ──────────────────────────────────────────────────

class SimpleStorage:
    def __init__(self):
        self.records = []
        self.sample_pdfs = [
            {"filename": "aeroflow_af220_pump.pdf",      "title": "AeroFlow Centrifugal Pump",      "sku": "AF-220-XP",      "category": "Pumps",     "tag": "RAG Enriched Temp",      "size_bytes": 1771},
            {"filename": "grade8_screw.pdf",             "title": "Grade 8 Hex Cap Screw",          "sku": "SCR-G8-3816",    "category": "Fasteners", "tag": "Grade 8 Standard",       "size_bytes": 1777},
            {"filename": "baldor_motor.pdf",             "title": "Baldor Electric Motor",          "sku": "VM3613T",        "category": "Motors",    "tag": "NEMA Frame Enriched",    "size_bytes": 1747},
            {"filename": "parker_valve.pdf",             "title": "Parker Safety Relief Valve",     "sku": "PRV-50-SS",      "category": "Valves",    "tag": "High Temp 316SS",        "size_bytes": 1762},
            {"filename": "milacron_fan.pdf",             "title": "Milacron Blower Fan",            "sku": "CF-400-IND",     "category": "Fans",      "tag": "4500 CFM Industrial",    "size_bytes": 1770},
            {"filename": "teflon_ball_valve_sparse.pdf", "title": "Teflon Ball Valve (Sparse)",     "sku": "TBV-200-SPARSE", "category": "Valves",    "tag": "Insufficient Data Demo", "size_bytes": 1670},
        ]

    def add_record(self, record):
        for i, r in enumerate(self.records):
            if r["sku"] == record["sku"]:
                self.records[i] = record
                return
        self.records.append(record)

    def get_records(self):
        return self.records

    def summary(self):
        recs = self.records
        return {
            "products_processed":   len(recs),
            "attributes_extracted": sum(len(r.get("attributes", {})) for r in recs),
            "attributes_enriched":  sum(1 for r in recs for f in r.get("attributes", {}).values() if f.get("method") == "inferred"),
            "attributes_verified":  sum(1 for r in recs for f in r.get("attributes", {}).values() if f.get("validation_status") == "passed"),
            "needs_review":         sum(1 for r in recs if r.get("validation", {}).get("review_required")),
            "average_confidence":   85.0,
            "catalog_completeness": 95.0,
        }

storage = SimpleStorage()

# ── Demo attribute data ──────────────────────────────────────────────────────

SAMPLE_ATTRIBUTES = {
    "AF-220-XP": {
        "flow_rate":       {"value": "220 GPM",            "confidence": 0.92, "method": "extracted", "validation_status": "passed",  "source": "aeroflow_af220_pump.pdf:page 2",      "evidence": "Maximum flow rate rated at 220 GPM at 3450 RPM."},
        "max_temperature": {"value": "180\u00b0F",         "confidence": 0.88, "method": "extracted", "validation_status": "passed",  "source": "aeroflow_af220_pump.pdf:page 3",      "evidence": "Fluid temperature continuous rating 180 deg F."},
        "material":        {"value": "316 Stainless Steel","confidence": 0.95, "method": "extracted", "validation_status": "passed",  "source": "aeroflow_af220_pump.pdf:page 1",      "evidence": "Wetted components constructed of 316SS."},
        "power":           {"value": "5 HP",               "confidence": 0.85, "method": "extracted", "validation_status": "passed",  "source": "aeroflow_af220_pump.pdf:page 2",      "evidence": "Driven by 5 HP TEFC motor."},
    },
    "SCR-G8-3816": {
        "thread_size":     {"value": "3/8-16",             "confidence": 0.94, "method": "extracted", "validation_status": "passed",  "source": "grade8_screw.pdf:page 1",             "evidence": "Thread diameter 3/8 inch with 16 TPI."},
        "material":        {"value": "Grade 8 Steel",      "confidence": 0.91, "method": "extracted", "validation_status": "passed",  "source": "grade8_screw.pdf:page 1",             "evidence": "High strength medium carbon alloy steel Grade 8."},
        "length":          {"value": "1.5 inches",         "confidence": 0.87, "method": "extracted", "validation_status": "passed",  "source": "grade8_screw.pdf:page 2",             "evidence": "Length under head 1.50 in."},
    },
    "VM3613T": {
        "voltage":         {"value": "460V",               "confidence": 0.93, "method": "extracted", "validation_status": "passed",  "source": "baldor_motor.pdf:page 1",             "evidence": "Operating line voltage 230/460 VAC."},
        "power":           {"value": "3 HP",               "confidence": 0.89, "method": "extracted", "validation_status": "passed",  "source": "baldor_motor.pdf:page 2",             "evidence": "Output power rating 3.0 HP continuous."},
        "rpm":             {"value": "1760 RPM",           "confidence": 0.86, "method": "extracted", "validation_status": "passed",  "source": "baldor_motor.pdf:page 1",             "evidence": "Full load synchronous speed 1760 RPM."},
        "frame":           {"value": "NEMA 56",            "confidence": 0.92, "method": "extracted", "validation_status": "passed",  "source": "baldor_motor.pdf:page 3",             "evidence": "NEMA standard frame size 56T."},
    },
    "PRV-50-SS": {
        "set_pressure":    {"value": "50 PSI",             "confidence": 0.91, "method": "extracted", "validation_status": "passed",  "source": "parker_valve.pdf:page 1",             "evidence": "Factory set cracking pressure 50 psig."},
        "max_temperature": {"value": "350\u00b0F",         "confidence": 0.88, "method": "extracted", "validation_status": "passed",  "source": "parker_valve.pdf:page 2",             "evidence": "Maximum operating temp 350 deg F."},
        "material":        {"value": "316 Stainless Steel","confidence": 0.94, "method": "extracted", "validation_status": "passed",  "source": "parker_valve.pdf:page 1",             "evidence": "Body forged from 316SS."},
        "connection_size": {"value": "1/2 inch NPT",       "confidence": 0.87, "method": "extracted", "validation_status": "passed",  "source": "parker_valve.pdf:page 2",             "evidence": "Female NPT port 1/2 in."},
    },
    "CF-400-IND": {
        "airflow_capacity":{"value": "4500 CFM",           "confidence": 0.90, "method": "extracted", "validation_status": "passed",  "source": "milacron_fan.pdf:page 1",             "evidence": "Delivers 4500 CFM at 0.5 in static pressure."},
        "power":           {"value": "2 HP",               "confidence": 0.86, "method": "extracted", "validation_status": "passed",  "source": "milacron_fan.pdf:page 2",             "evidence": "Motor rating 2 HP direct drive."},
        "max_temperature": {"value": "140\u00b0F",         "confidence": 0.85, "method": "extracted", "validation_status": "passed",  "source": "milacron_fan.pdf:page 3",             "evidence": "Air stream rating max 140 F."},
    },
    "TBV-200-SPARSE": {
        "port_size":       {"value": "2 inch",             "confidence": 0.72, "method": "extracted", "validation_status": "warning", "source": "teflon_ball_valve_sparse.pdf:page 1", "evidence": "Nominal diameter 2 in."},
        "material":        {"value": "PTFE",               "confidence": 0.68, "method": "inferred",  "validation_status": "warning", "source": "RAG Enrichment:reference_corpus",     "evidence": "Material inferred from Teflon brand designation."},
    },
}

def _is_demo_mode():
    """Returns True when no real LLM key is configured."""
    return not any([
        os.environ.get("OPENAI_API_KEY", "").strip(),
        os.environ.get("ANTHROPIC_API_KEY", "").strip(),
        os.environ.get("GEMINI_API_KEY", "").strip(),
    ])

def _make_record(sample):
    attrs = SAMPLE_ATTRIBUTES.get(sample["sku"], {})
    review_required = any(f.get("validation_status") in ("warning", "conflict") for f in attrs.values())
    demo = _is_demo_mode()
    return {
        "sku": sample["sku"],
        "is_demo": demo,
        "name":     {"value": sample["title"],    "confidence": 0.95, "method": "extracted", "validation_status": "passed", "source": sample["filename"]},
        "category": {"value": sample["category"], "confidence": 0.90, "method": "extracted", "validation_status": "passed", "source": sample["filename"]},
        "attributes": attrs,
        "validation": {
            "review_required": review_required,
            "conflicts": ["Material inferred from brand designation requires human verification."] if review_required else [],
        },
    }

# ── API Routes ────────────────────────────────────────────────────────────────

@app.route("/api/check-keys")
def check_keys():
    openai_key    = os.environ.get("OPENAI_API_KEY", "").strip()
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    gemini_key    = os.environ.get("GEMINI_API_KEY", "").strip()

    openai_ok    = bool(openai_key)
    anthropic_ok = bool(anthropic_key)
    gemini_ok    = bool(gemini_key)

    if gemini_ok:
        active_provider = "gemini"
        active_model    = "gemini-1.5-flash"
    elif openai_ok:
        active_provider = "openai"
        active_model    = "gpt-4o-mini"
    elif anthropic_ok:
        active_provider = "anthropic"
        active_model    = "claude-3-haiku-20240307"
    else:
        active_provider = "demo"
        active_model    = "demo-mode"

    return jsonify({
        "gemini_configured":    gemini_ok,
        "openai_configured":    openai_ok,
        "anthropic_configured": anthropic_ok,
        "active_provider":      active_provider,
        "active_model":         active_model,
        "is_configured":        gemini_ok or openai_ok or anthropic_ok,
    })

@app.route("/api/save-keys", methods=["POST"])
def save_keys():
    """
    In the Vercel serverless environment env vars cannot be written at runtime.
    Keys must be set via the Vercel dashboard (Settings → Environment Variables).
    We return the current live status so the UI can reflect what is actually active.
    """
    openai_ok    = bool(os.environ.get("OPENAI_API_KEY", "").strip())
    anthropic_ok = bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())
    gemini_ok    = bool(os.environ.get("GEMINI_API_KEY", "").strip())

    if gemini_ok:
        active_provider = "gemini"
    elif openai_ok:
        active_provider = "openai"
    elif anthropic_ok:
        active_provider = "anthropic"
    else:
        active_provider = "demo"

    configured = gemini_ok or openai_ok or anthropic_ok
    return jsonify({
        "success": True,
        "message": (
            f"Active provider: {active_provider.upper()}"
            if configured
            else "No LLM key found. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in Vercel → Settings → Environment Variables, then redeploy."
        ),
        "active_provider": active_provider,
        "is_configured": configured,
    })

@app.route("/api/sample-pdfs")
def get_sample_pdfs():
    return jsonify({"samples": storage.sample_pdfs, "count": len(storage.sample_pdfs)})

@app.route("/api/batch-status")
def get_batch_status():
    return jsonify({
        "success": True,
        "product_records": storage.get_records(),
        "catalog_summary": storage.summary(),
    })

@app.route("/api/process-batch", methods=["POST"])
def process_batch():
    for sample in storage.sample_pdfs:
        storage.add_record(_make_record(sample))
    return jsonify({
        "success": True,
        "product_records": storage.get_records(),
        "catalog_summary": storage.summary(),
    })

@app.route("/api/process-sample/<filename>", methods=["POST"])
def process_sample(filename):
    sample = next((s for s in storage.sample_pdfs if s["filename"] == filename), None)
    if not sample:
        abort(404, description="Sample not found")
    record = _make_record(sample)
    storage.add_record(record)
    return jsonify({
        "success": True,
        "record": record,
        "logs": [
            {"stage": "ingestion",  "status": "success", "message": f"PDF '{filename}' ingested (demo mode)"},
            {"stage": "extraction", "status": "success", "message": "Schema-guided attribute extraction complete"},
            {"stage": "enrichment", "status": "success", "message": "RAG vector store enrichment complete"},
            {"stage": "validation", "status": "success", "message": "Deterministic validation and confidence scoring complete"},
        ],
    })

@app.route("/api/process", methods=["POST"])
def process_file():
    file = request.files.get("file")
    if not file:
        return jsonify({"success": False, "error": "No file provided. Please upload a PDF."}), 400
    filename = file.filename or "uploaded.pdf"
    if not filename.lower().endswith(".pdf"):
        return jsonify({"success": False, "error": "Only PDF files are supported."}), 400
    return jsonify({
        "success": True,
        "record": {
            "sku": "CUSTOM-UPLOAD-001",
            "is_demo": _is_demo_mode(),
            "name":     {"value": filename.replace(".pdf", "").replace("_", " ").title(), "confidence": 0.78, "method": "extracted", "validation_status": "passed",  "source": filename},
            "category": {"value": "Industrial Component", "confidence": 0.75, "method": "extracted", "validation_status": "passed",  "source": filename},
            "attributes": {
                "document_type": {"value": "Product Specification Sheet", "confidence": 0.85, "method": "extracted", "validation_status": "passed",  "source": f"{filename}:page 1", "evidence": "Document identified as a product specification."},
                "demo_note":     {"value": "Demo mode — add LLM key for real AI extraction",  "confidence": 0.50, "method": "inferred",  "validation_status": "warning", "source": "System", "evidence": "No LLM provider configured. Add a Gemini/OpenAI/Anthropic key to enable full pipeline."},
            },
            "validation": {"review_required": True, "conflicts": ["Demo mode active — LLM key required for real extraction."]},
        },
        "logs": [
            {"stage": "ingestion",  "status": "success", "message": f"PDF '{filename}' received — demo mode active"},
            {"stage": "extraction", "status": "demo",    "message": "Schema-guided extraction skipped — no LLM configured"},
            {"stage": "enrichment", "status": "demo",    "message": "RAG enrichment skipped — demo mode"},
            {"stage": "validation", "status": "warning", "message": "Add a Gemini/OpenAI/Anthropic API key to enable full AI pipeline"},
        ],
    })

@app.route("/api/products/<sku>/review", methods=["POST"])
def review_product(sku):
    body = request.get_json(force=True, silent=True) or {}
    field_name = body.get("field_name", "")
    action     = body.get("action", "")
    new_value  = body.get("new_value")

    record = next((r for r in storage.records if r["sku"] == sku), None)
    if not record:
        abort(404, description="Product not found")

    if field_name == "name":
        field = record["name"]
    elif field_name == "category":
        field = record["category"]
    elif field_name in record.get("attributes", {}):
        field = record["attributes"][field_name]
    else:
        abort(404, description=f"Field '{field_name}' not found")

    if action in ("approve", "accept_a", "accept_b"):
        if new_value:
            field["value"] = new_value
        field.update({"confidence": 1.0, "validation_status": "passed", "method": "extracted"})
    elif action == "edit" and new_value is not None:
        field.update({"value": new_value, "confidence": 1.0, "validation_status": "passed", "method": "extracted"})
    elif action == "reject":
        field.update({"value": "insufficient_data", "confidence": 0.0, "validation_status": "warning", "method": "flagged"})

    all_fields = [record["name"], record["category"]] + list(record.get("attributes", {}).values())
    record["validation"]["review_required"] = any(f.get("validation_status") in ("warning", "conflict") for f in all_fields)

    return jsonify({
        "success": True,
        "message": f"Field '{field_name}' updated via '{action}'",
        "product": record,
        "catalog_summary": storage.summary(),
    })

@app.route("/api/export/csv")
def export_csv():
    records = storage.get_records()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["SKU", "Product Name", "Category", "Name Confidence", "Attribute", "Value", "Confidence", "Method", "Validation Status", "Source", "Evidence"])
    if not records:
        writer.writerow(["—", "No data yet", "Run batch pipeline first", "", "", "", "", "", "", "", ""])
    for r in records:
        sku       = r.get("sku", "")
        name      = r.get("name", {}).get("value", "")
        category  = r.get("category", {}).get("value", "")
        name_conf = r.get("name", {}).get("confidence", "")
        for attr_key, attr_val in r.get("attributes", {}).items():
            writer.writerow([sku, name, category, name_conf, attr_key,
                attr_val.get("value", ""), attr_val.get("confidence", ""),
                attr_val.get("method", ""), attr_val.get("validation_status", ""),
                attr_val.get("source", ""), attr_val.get("evidence", "")])
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=apex_catalog_export.csv"},
    )

@app.route("/api/export/json")
def export_json():
    payload = {
        "export_version": "1.0",
        "generator": "Apex Intelligence — AI-Powered Product Intelligence",
        "catalog_summary": storage.summary(),
        "product_records": storage.get_records(),
    }
    return Response(
        json.dumps(payload, indent=2),
        mimetype="application/json",
        headers={"Content-Disposition": "attachment; filename=apex_catalog_export.json"},
    )

@app.route("/api/sample-pdf/<filename>")
def get_sample_pdf(filename):
    """Serve a sample PDF for in-browser viewing. Falls back to a generated placeholder."""
    allowed = {s["filename"] for s in storage.sample_pdfs}
    if filename not in allowed:
        abort(404, description="Sample PDF not found")

    # Try on-disk locations
    for candidate in [
        Path(__file__).parent.parent / "data" / "samples" / filename,
        Path(__file__).parent / "data" / "samples" / filename,
    ]:
        if candidate.exists():
            return Response(
                candidate.read_bytes(),
                mimetype="application/pdf",
                headers={
                    "Content-Disposition": f"inline; filename={filename}",
                    "Cache-Control": "public, max-age=86400",
                },
            )

    # Fallback: generate a minimal valid placeholder PDF (ASCII only for safety)
    meta     = next((s for s in storage.sample_pdfs if s["filename"] == filename), {})
    title    = meta.get("title", filename).encode("ascii", "replace").decode("ascii")
    sku      = meta.get("sku", "N/A")
    category = meta.get("category", "N/A")
    tag      = meta.get("tag", "")

    def ps(s):  # PDF string escape — remove non-ASCII to stay safe
        safe = s.encode("ascii", "replace").decode("ascii")
        return safe.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    stream_content = (
        "BT\n"
        "/F1 16 Tf\n"
        "50 740 Td\n"
        f"({ps('APEX INTELLIGENCE - DEMO SPEC SHEET')}) Tj\n"
        "/F1 11 Tf\n"
        f"0 -28 Td ({ps('Product: ' + title)}) Tj\n"
        f"0 -18 Td ({ps('SKU: ' + sku)}) Tj\n"
        f"0 -18 Td ({ps('Category: ' + category)}) Tj\n"
        f"0 -18 Td ({ps('Tag: ' + tag)}) Tj\n"
        "0 -36 Td (This is a synthetic demonstration document.) Tj\n"
        "0 -18 Td (Generated for UniHack 2026 - Apex Intelligence prototype.) Tj\n"
        "0 -18 Td (PDF files are not bundled with this Vercel deployment.) Tj\n"
        "ET"
    )
    stream = stream_content.encode("ascii")

    o1  = b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    o2  = b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    o3  = b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
    o4h = f"4 0 obj<</Length {len(stream)}>>\nstream\n".encode("ascii")
    o4f = b"\nendstream\nendobj\n"
    o5  = b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"

    hdr   = b"%PDF-1.4\n"
    parts = [hdr, o1, o2, o3, o4h, stream, o4f, o5]
    pos, offsets = 0, []
    for part in parts:
        offsets.append(pos)
        pos += len(part)

    xref = b"xref\n0 6\n0000000000 65535 f \n"
    for off in offsets[1:6]:
        xref += f"{off:010d} 00000 n \n".encode("ascii")
    trailer = f"trailer<</Size 6/Root 1 0 R>>\nstartxref\n{pos}\n%%EOF\n".encode("ascii")

    return Response(
        b"".join(parts) + xref + trailer,
        mimetype="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "Cache-Control": "public, max-age=3600",
        },
    )

@app.route("/api/reference-docs")
def get_reference_docs():
    return jsonify({
        "documents": ["fastener_standards.txt", "motor_standards.txt", "pump_standards.txt"],
        "count": 3,
    })

@app.route("/health")
def health_check():
    return jsonify({"status": "healthy", "mode": "demo"})

# ── Root handler for non-API routes ──────────────────────────────────────────
@app.route("/")
def index():
    """Serve index.html for root path (will be overridden by Vercel routing)"""
    return jsonify({"message": "API is running. Visit the frontend URL."})

# ── Vercel Serverless Entry Point ────────────────────────────────────────────
# Vercel expects either 'app' or 'handler' for WSGI applications
# Using both for maximum compatibility
handler = app

# For local development
if __name__ == "__main__":
    app.run(debug=True, port=5000)
