import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set Vercel environment variable
os.environ["VERCEL"] = "1"

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import json
import csv
import io

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("simple_backend")

app = FastAPI(title="Simple Product Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage
class SimpleStorage:
    def __init__(self):
        self.records = []
        self.sample_pdfs = [
            {
                "filename": "aeroflow_af220_pump.pdf",
                "title": "AeroFlow Centrifugal Pump",
                "sku": "AF-220-XP",
                "category": "Pumps",
                "tag": "RAG Enriched Temp",
                "size_bytes": 1771
            },
            {
                "filename": "grade8_screw.pdf",
                "title": "Grade 8 Hex Cap Screw",
                "sku": "SCR-G8-3816",
                "category": "Fasteners",
                "tag": "Grade 8 Standard",
                "size_bytes": 1777
            },
            {
                "filename": "baldor_motor.pdf",
                "title": "Baldor Electric Motor",
                "sku": "VM3613T",
                "category": "Motors",
                "tag": "NEMA Frame Enriched",
                "size_bytes": 1747
            },
            {
                "filename": "parker_valve.pdf",
                "title": "Parker Safety Relief Valve",
                "sku": "PRV-50-SS",
                "category": "Valves",
                "tag": "High Temp 316SS",
                "size_bytes": 1762
            },
            {
                "filename": "milacron_fan.pdf",
                "title": "Milacron Blower Fan",
                "sku": "CF-400-IND",
                "category": "Fans",
                "tag": "4500 CFM Industrial",
                "size_bytes": 1770
            },
            {
                "filename": "teflon_ball_valve_sparse.pdf",
                "title": "Teflon Ball Valve (Sparse)",
                "sku": "TBV-200-SPARSE",
                "category": "Valves",
                "tag": "Insufficient Data Demo",
                "size_bytes": 1670
            }
        ]
    
    def add_record(self, record):
        self.records.append(record)
    
    def get_records(self):
        return self.records

storage = SimpleStorage()

class ApiKeysUpdate(BaseModel):
    gemini_key: Optional[str] = None
    openai_key: Optional[str] = None
    anthropic_key: Optional[str] = None

@app.get("/api/check-keys")
def check_keys():
    return {
        "gemini_configured": False,
        "openai_configured": False,
        "anthropic_configured": False,
        "active_provider": "demo",
        "active_model": "demo-model",
        "is_configured": False
    }

@app.post("/api/save-keys")
def save_keys(keys: ApiKeysUpdate):
    return {
        "success": True,
        "message": "API keys saved (demo mode)",
        "active_provider": "demo",
        "is_configured": False
    }

@app.get("/api/sample-pdfs")
def get_sample_pdfs():
    return {
        "samples": storage.sample_pdfs,
        "count": len(storage.sample_pdfs)
    }

@app.get("/api/batch-status")
def get_batch_status():
    return {
        "success": True,
        "batch_metadata": {"count": len(storage.records)},
        "product_records": storage.records,
        "batch_records": [],
        "catalog_summary": {
            "products_processed": len(storage.records),
            "attributes_extracted": 0,
            "attributes_enriched": 0,
            "attributes_verified": 0,
            "needs_review": 0,
            "average_confidence": 0.0,
            "catalog_completeness": 0.0
        }
    }

@app.post("/api/process-batch")
def process_batch():
    # Simulate batch processing with sample attributes
    sample_attributes = {
        "AF-220-XP": {
            "flow_rate": {"value": "220 GPM", "confidence": 0.92, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"},
            "max_temperature": {"value": "180°F", "confidence": 0.88, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 3"},
            "material": {"value": "316 Stainless Steel", "confidence": 0.95, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "power": {"value": "5 HP", "confidence": 0.85, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"}
        },
        "SCR-G8-3816": {
            "thread_size": {"value": "3/8-16", "confidence": 0.94, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "material": {"value": "Grade 8 Steel", "confidence": 0.91, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "length": {"value": "1.5 inches", "confidence": 0.87, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"}
        },
        "VM3613T": {
            "voltage": {"value": "460V", "confidence": 0.93, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "power": {"value": "3 HP", "confidence": 0.89, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"},
            "rpm": {"value": "1760 RPM", "confidence": 0.86, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "frame": {"value": "NEMA 56", "confidence": 0.92, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 3"}
        },
        "PRV-50-SS": {
            "set_pressure": {"value": "50 PSI", "confidence": 0.91, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "max_temperature": {"value": "350°F", "confidence": 0.88, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"},
            "material": {"value": "316 Stainless Steel", "confidence": 0.94, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "connection_size": {"value": "1/2 inch NPT", "confidence": 0.87, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"}
        },
        "CF-400-IND": {
            "airflow_capacity": {"value": "4500 CFM", "confidence": 0.90, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "power": {"value": "2 HP", "confidence": 0.86, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"},
            "max_temperature": {"value": "140°F", "confidence": 0.85, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 3"}
        },
        "TBV-200-SPARSE": {
            "port_size": {"value": "2 inch", "confidence": 0.72, "method": "extracted", "validation_status": "warning", "source": "Spec Sheet PDF:page 1"},
            "material": {"value": "PTFE", "confidence": 0.68, "method": "inferred", "validation_status": "warning", "source": "RAG Enrichment:reference_corpus"}
        }
    }
    
    for sample in storage.sample_pdfs:
        attrs = sample_attributes.get(sample["sku"], {})
        review_required = any(f.get("validation_status") in ["warning", "conflict"] for f in attrs.values())
        
        storage.add_record({
            "sku": sample["sku"],
            "name": {"value": sample["title"], "confidence": 0.85, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF"},
            "category": {"value": sample["category"], "confidence": 0.90, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF"},
            "attributes": attrs,
            "validation": {"review_required": review_required, "conflicts": []}
        })
    
    return {
        "success": True,
        "batch_metadata": {"count": len(storage.records)},
        "product_records": storage.records,
        "batch_records": [],
        "catalog_summary": {
            "products_processed": len(storage.records),
            "attributes_extracted": sum(len(r["attributes"]) for r in storage.records),
            "attributes_enriched": sum(1 for r in storage.records for f in r["attributes"].values() if f.get("method") == "inferred"),
            "attributes_verified": sum(1 for r in storage.records for f in r["attributes"].values() if f.get("validation_status") == "passed"),
            "needs_review": sum(1 for r in storage.records if r["validation"]["review_required"]),
            "average_confidence": 85.0,
            "catalog_completeness": 95.0
        }
    }

@app.post("/api/process-sample/{filename}")
def process_sample(filename: str):
    # Find the sample
    sample = next((s for s in storage.sample_pdfs if s["filename"] == filename), None)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    # Sample attributes for individual processing
    sample_attributes = {
        "AF-220-XP": {
            "flow_rate": {"value": "220 GPM", "confidence": 0.92, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"},
            "max_temperature": {"value": "180°F", "confidence": 0.88, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 3"},
            "material": {"value": "316 Stainless Steel", "confidence": 0.95, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "power": {"value": "5 HP", "confidence": 0.85, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"}
        },
        "SCR-G8-3816": {
            "thread_size": {"value": "3/8-16", "confidence": 0.94, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "material": {"value": "Grade 8 Steel", "confidence": 0.91, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "length": {"value": "1.5 inches", "confidence": 0.87, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"}
        },
        "VM3613T": {
            "voltage": {"value": "460V", "confidence": 0.93, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "power": {"value": "3 HP", "confidence": 0.89, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"},
            "rpm": {"value": "1760 RPM", "confidence": 0.86, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "frame": {"value": "NEMA 56", "confidence": 0.92, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 3"}
        },
        "PRV-50-SS": {
            "set_pressure": {"value": "50 PSI", "confidence": 0.91, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "max_temperature": {"value": "350°F", "confidence": 0.88, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"},
            "material": {"value": "316 Stainless Steel", "confidence": 0.94, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "connection_size": {"value": "1/2 inch NPT", "confidence": 0.87, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"}
        },
        "CF-400-IND": {
            "airflow_capacity": {"value": "4500 CFM", "confidence": 0.90, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 1"},
            "power": {"value": "2 HP", "confidence": 0.86, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 2"},
            "max_temperature": {"value": "140°F", "confidence": 0.85, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF:page 3"}
        },
        "TBV-200-SPARSE": {
            "port_size": {"value": "2 inch", "confidence": 0.72, "method": "extracted", "validation_status": "warning", "source": "Spec Sheet PDF:page 1"},
            "material": {"value": "PTFE", "confidence": 0.68, "method": "inferred", "validation_status": "warning", "source": "RAG Enrichment:reference_corpus"}
        }
    }
    
    attrs = sample_attributes.get(sample["sku"], {})
    review_required = any(f.get("validation_status") in ["warning", "conflict"] for f in attrs.values())
    
    # Create a mock record with attributes
    record = {
        "sku": sample["sku"],
        "name": {"value": sample["title"], "confidence": 0.85, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF"},
        "category": {"value": sample["category"], "confidence": 0.90, "method": "extracted", "validation_status": "passed", "source": "Spec Sheet PDF"},
        "attributes": attrs,
        "validation": {"review_required": review_required, "conflicts": []}
    }
    
    storage.add_record(record)
    
    return {
        "success": True,
        "record": record,
        "logs": [
            {"stage": "ingestion", "status": "success", "message": "PDF ingested successfully (demo mode)"},
            {"stage": "extraction", "status": "success", "message": "Product data extracted (demo mode)"},
            {"stage": "enrichment", "status": "success", "message": "RAG enrichment completed (demo mode)"},
            {"stage": "validation", "status": "success", "message": "Validation passed (demo mode)"}
        ]
    }

@app.post("/api/process")
async def process_file(file: UploadFile = File(None)):
    if file is None:
        return {
            "success": False,
            "error": "No file uploaded. Please select a PDF file."
        }
    filename = file.filename or "uploaded.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    # Demo mode: return a realistic mock response
    return {
        "success": True,
        "record": {
            "sku": "CUSTOM-UPLOAD-001",
            "name": {"value": filename.replace(".pdf", "").replace("_", " ").title(), "confidence": 0.78, "method": "extracted", "validation_status": "passed", "source": filename},
            "category": {"value": "Industrial Component", "confidence": 0.75, "method": "extracted", "validation_status": "passed", "source": filename},
            "attributes": {
                "product_name": {"value": filename.replace(".pdf", ""), "confidence": 0.78, "method": "extracted", "validation_status": "passed", "source": f"{filename}:page 1", "evidence": "Extracted from document title."},
                "document_type": {"value": "Product Specification Sheet", "confidence": 0.85, "method": "extracted", "validation_status": "passed", "source": f"{filename}:page 1", "evidence": "Document identified as a product specification."},
                "demo_note": {"value": "Demo mode — connect LLM API key for real extraction", "confidence": 0.5, "method": "inferred", "validation_status": "warning", "source": "System", "evidence": "No LLM provider configured. Add a Gemini/OpenAI/Anthropic key to enable full AI pipeline."}
            },
            "validation": {"review_required": True, "conflicts": ["Demo mode: LLM key required for real AI extraction."]}
        },
        "logs": [
            {"stage": "ingestion", "status": "success", "message": f"PDF '{filename}' received ({round(len(await file.read()) / 1024, 1) if False else '~'} KB) — demo mode active"},
            {"stage": "extraction", "status": "demo", "message": "Schema-guided extraction skipped — no LLM provider configured"},
            {"stage": "enrichment", "status": "demo", "message": "RAG enrichment skipped — demo mode"},
            {"stage": "validation", "status": "warning", "message": "Configure a Gemini/OpenAI/Anthropic API key to enable full AI pipeline"}
        ]
    }

class ReviewRequest(BaseModel):
    sku: str
    field_name: str
    action: str
    new_value: Optional[str] = None

@app.post("/api/products/{sku}/review")
def review_product(sku: str, req: ReviewRequest):
    action = req.action
    field_name = req.field_name
    new_value = req.new_value

    # Find the record
    record = next((r for r in storage.records if r["sku"] == sku), None)
    if not record:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update the field based on action
    if field_name == "name":
        field = record["name"]
    elif field_name == "category":
        field = record["category"]
    elif field_name in record["attributes"]:
        field = record["attributes"][field_name]
    else:
        raise HTTPException(status_code=404, detail="Field not found")
    
    if action in ["approve", "accept_a", "accept_b"]:
        if new_value:
            field["value"] = new_value
        field["confidence"] = 1.0
        field["validation_status"] = "passed"
        field["method"] = "extracted"
    elif action == "edit" and new_value is not None:
        field["value"] = new_value
        field["confidence"] = 1.0
        field["validation_status"] = "passed"
        field["method"] = "extracted"
    elif action == "reject":
        field["value"] = "insufficient_data"
        field["confidence"] = 0.0
        field["validation_status"] = "warning"
        field["method"] = "flagged"
    
    # Check if review is still required
    all_fields = [record["name"], record["category"]] + list(record["attributes"].values())
    review_required = any(f.get("validation_status") in ["warning", "conflict"] for f in all_fields)
    record["validation"]["review_required"] = review_required
    
    return {
        "success": True,
        "message": f"Field '{field_name}' updated via action '{action}'",
        "product": record,
        "catalog_summary": {
            "products_processed": len(storage.records),
            "attributes_extracted": sum(len(r["attributes"]) for r in storage.records),
            "attributes_enriched": sum(1 for r in storage.records for f in r["attributes"].values() if f.get("method") == "inferred"),
            "attributes_verified": sum(1 for r in storage.records for f in r["attributes"].values() if f.get("validation_status") == "passed"),
            "needs_review": sum(1 for r in storage.records if r["validation"]["review_required"]),
            "average_confidence": 85.0,
            "catalog_completeness": 95.0
        }
    }

@app.get("/api/export/csv")
def export_csv():
    records = storage.get_records()
    output = io.StringIO()
    writer = csv.writer(output)
    # Header row
    writer.writerow(["SKU", "Product Name", "Category", "Name Confidence", "Attribute", "Value", "Confidence", "Method", "Validation Status", "Source", "Evidence"])
    if not records:
        writer.writerow(["No data", "Run the batch pipeline first", "", "", "", "", "", "", "", "", ""])
    for record in records:
        sku = record.get("sku", "")
        name = record.get("name", {}).get("value", "")
        category = record.get("category", {}).get("value", "")
        name_conf = record.get("name", {}).get("confidence", "")
        for attr_key, attr_val in record.get("attributes", {}).items():
            writer.writerow([
                sku, name, category, name_conf,
                attr_key,
                attr_val.get("value", ""),
                attr_val.get("confidence", ""),
                attr_val.get("method", ""),
                attr_val.get("validation_status", ""),
                attr_val.get("source", ""),
                attr_val.get("evidence", ""),
            ])
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=apex_catalog_export.csv"}
    )

@app.get("/api/export/json")
def export_json():
    records = storage.get_records()
    export_data = {
        "export_version": "1.0",
        "generator": "Apex Intelligence — AI-Powered Product Intelligence",
        "catalog_summary": {
            "products_processed": len(records),
            "attributes_extracted": sum(len(r.get("attributes", {})) for r in records),
            "attributes_enriched": sum(1 for r in records for f in r.get("attributes", {}).values() if f.get("method") == "inferred"),
            "attributes_verified": sum(1 for r in records for f in r.get("attributes", {}).values() if f.get("validation_status") == "passed"),
            "needs_review": sum(1 for r in records if r.get("validation", {}).get("review_required")),
        },
        "product_records": records
    }
    json_content = json.dumps(export_data, indent=2)
    return Response(
        content=json_content,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=apex_catalog_export.json"}
    )

@app.get("/api/sample-pdf/{filename}")
def get_sample_pdf(filename: str):
    """Serve a sample PDF file for viewing in the browser."""
    import base64
    # Security: only allow known sample filenames, no path traversal
    allowed = {s["filename"] for s in storage.sample_pdfs}
    if filename not in allowed:
        raise HTTPException(status_code=404, detail="Sample PDF not found")

    # Try to locate the PDF relative to project root
    search_paths = [
        Path(__file__).parent.parent / "data" / "samples" / filename,
        Path(__file__).parent / "data" / "samples" / filename,
    ]
    pdf_path = None
    for p in search_paths:
        if p.exists():
            pdf_path = p
            break

    if pdf_path is None:
        # Return a minimal valid PDF with info about the demo document
        sample_meta = next((s for s in storage.sample_pdfs if s["filename"] == filename), {})
        title = sample_meta.get("title", filename)
        sku = sample_meta.get("sku", "N/A")
        category = sample_meta.get("category", "N/A")
        tag = sample_meta.get("tag", "")
        # Minimal valid PDF (text-only placeholder)
        pdf_content = f"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 300>>
stream
BT
/F1 18 Tf
50 740 Td
(APEX INTELLIGENCE — DEMO SPEC SHEET) Tj
/F1 12 Tf
0 -30 Td
(Product: {title}) Tj
0 -20 Td
(SKU: {sku}) Tj
0 -20 Td
(Category: {category}) Tj
0 -20 Td
(Tag: {tag}) Tj
0 -40 Td
(This is a synthetic demonstration document.) Tj
0 -20 Td
(Generated for UniHack 2026 — Apex Intelligence prototype.) Tj
ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000618 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
700
%%EOF"""
        return Response(
            content=pdf_content.encode("latin-1"),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename={filename}",
                "Cache-Control": "public, max-age=86400",
            }
        )

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "Cache-Control": "public, max-age=86400",
        }
    )


@app.get("/api/reference-docs")
def get_reference_docs():
    return {
        "documents": ["fastener_standards.txt", "motor_standards.txt", "pump_standards.txt"],
        "count": 3
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "mode": "demo"}

# Vercel handler
from mangum import Mangum
handler = Mangum(app)