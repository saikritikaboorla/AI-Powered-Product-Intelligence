import os
import shutil
import io
import csv
import json
import logging
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from backend.schemas import PipelineResponse, BatchResponse, ReviewActionRequest
from backend.pipeline import run_product_pipeline, run_batch_pipeline
from backend.batch_store import batch_store
from backend.services.vector_store import load_reference_corpus
from backend.services.llm_service import llm_service
from backend.config import REFERENCE_CORPUS_DIR, UPLOADS_DIR
from scripts.generate_samples import generate_all_samples

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("app.main")

# Ensure synthetic sample PDFs exist (only if not in Vercel environment)
if os.getenv("VERCEL") != "1":
    try:
        generate_all_samples()
        # Load vector store corpus
        load_reference_corpus(REFERENCE_CORPUS_DIR)
    except Exception as e:
        logger.warning(f"Failed to initialize data during startup: {e}")

app = FastAPI(
    title="APEX INTELLIGENCE — Product Intelligence API",
    description="Backend API for Industrial Product Data Normalization, RAG Enrichment, and Validation.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ApiKeysUpdate(BaseModel):
    gemini_key: Optional[str] = None
    openai_key: Optional[str] = None
    anthropic_key: Optional[str] = None

@app.get("/api/check-keys")
def check_keys():
    load_dotenv(override=True)
    llm_service.detect_provider()
    
    # Initialize data on first API call in Vercel environment
    if os.getenv("VERCEL") == "1":
        try:
            from backend.config import REFERENCE_CORPUS_DIR
            from backend.services.vector_store import load_reference_corpus
            from scripts.generate_samples import generate_all_samples
            
            # Create necessary directories
            os.makedirs("/tmp/uploads", exist_ok=True)
            os.makedirs("/tmp/samples", exist_ok=True)
            os.makedirs(REFERENCE_CORPUS_DIR, exist_ok=True)
            
            # Generate sample PDFs
            generate_all_samples()
            
            # Load reference corpus
            load_reference_corpus(REFERENCE_CORPUS_DIR)
            
            logger.info("Vercel data initialization complete")
        except Exception as e:
            logger.warning(f"Vercel data initialization failed: {e}")
    
    return {
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "active_provider": llm_service.provider,
        "active_model": llm_service.model_name,
        "is_configured": llm_service.is_configured()
    }

@app.post("/api/save-keys")
def save_keys(keys: ApiKeysUpdate):
    env_path = ".env"
    lines = []
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
    updates = {}
    if keys.gemini_key is not None:
        updates["GEMINI_API_KEY"] = keys.gemini_key.strip()
    if keys.openai_key is not None:
        updates["OPENAI_API_KEY"] = keys.openai_key.strip()
    if keys.anthropic_key is not None:
        updates["ANTHROPIC_API_KEY"] = keys.anthropic_key.strip()

    new_lines = []
    keys_written = set()
    for line in lines:
        matched = False
        for k in updates.keys():
            if line.startswith(f"{k}="):
                new_lines.append(f"{k}={updates[k]}\n")
                keys_written.add(k)
                matched = True
                break
        if not matched:
            new_lines.append(line)
            
    for k, val in updates.items():
        if k not in keys_written:
            new_lines.append(f"{k}={val}\n")
            
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
        
    load_dotenv(override=True)
    llm_service.detect_provider()
    load_reference_corpus(REFERENCE_CORPUS_DIR)

    return {
        "success": True,
        "message": "API keys updated successfully.",
        "active_provider": llm_service.provider,
        "is_configured": llm_service.is_configured()
    }

@app.post("/api/process", response_model=PipelineResponse)
async def process_spec_sheet(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF spec sheet uploads are supported in v1.")
        
    upload_dir = UPLOADS_DIR
    os.makedirs(upload_dir, exist_ok=True)
    local_file_path = os.path.join(upload_dir, file.filename)
    
    try:
        with open(local_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")
        
    try:
        response = run_product_pipeline(local_file_path, file.filename)
        if response.success and response.record:
            # Add to batch store
            batch_store.records.append(response.record)
            batch_store.save(batch_store.records)
        return response
    except Exception as e:
        logger.exception("Pipeline run crash")
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")

@app.post("/api/process-batch", response_model=BatchResponse)
def process_batch():
    """Runs the 5-stage pipeline on all bundled sample PDFs in data/samples/."""
    try:
        # Handle Vercel serverless environment
        if os.getenv("VERCEL") == "1":
            samples_dir = "/tmp/samples"
        else:
            samples_dir = "data/samples"
        response = run_batch_pipeline(samples_dir)
        return response
    except Exception as e:
        logger.exception("Batch processing crash")
        raise HTTPException(status_code=500, detail=f"Batch pipeline error: {str(e)}")

@app.get("/api/sample-pdfs")
def get_sample_pdfs():
    """Returns list of bundled sample PDFs available for selection."""
    # Handle Vercel serverless environment
    if os.getenv("VERCEL") == "1":
        samples_dir = "/tmp/samples"
        if not os.path.exists(samples_dir):
            os.makedirs(samples_dir, exist_ok=True)
            generate_all_samples()
    else:
        samples_dir = os.path.abspath("data/samples")
        if not os.path.exists(samples_dir):
            generate_all_samples()
        
    pdf_list = []
    sample_meta = {
        "aeroflow_af220_pump.pdf": {"title": "AeroFlow Centrifugal Pump", "sku": "AF-220-XP", "category": "Pumps", "tag": "RAG Enriched Temp"},
        "grade8_screw.pdf": {"title": "Grade 8 Hex Cap Screw", "sku": "SCR-G8-3816", "category": "Fasteners", "tag": "Grade 8 Standard"},
        "baldor_motor.pdf": {"title": "Baldor Electric Motor", "sku": "VM3613T", "category": "Motors", "tag": "NEMA Frame Enriched"},
        "parker_valve.pdf": {"title": "Parker Safety Relief Valve", "sku": "PRV-50-SS", "category": "Valves", "tag": "High Temp 316SS"},
        "milacron_fan.pdf": {"title": "Milacron Blower Fan", "sku": "CF-400-IND", "category": "Fans", "tag": "4500 CFM Industrial"},
        "teflon_ball_valve_sparse.pdf": {"title": "Teflon Ball Valve (Sparse)", "sku": "TBV-200-SPARSE", "category": "Valves", "tag": "Insufficient Data Demo"}
    }
    
    for filename in sorted(os.listdir(samples_dir)):
        if filename.endswith(".pdf"):
            filepath = os.path.join(samples_dir, filename)
            meta = sample_meta.get(filename, {"title": filename.replace(".pdf", "").replace("_", " ").title(), "sku": "DEMO", "category": "General", "tag": "Sample"})
            pdf_list.append({
                "filename": filename,
                "title": meta["title"],
                "sku": meta["sku"],
                "category": meta["category"],
                "tag": meta["tag"],
                "size_bytes": os.path.getsize(filepath)
            })
    return {"samples": pdf_list, "count": len(pdf_list)}

@app.post("/api/process-sample/{filename}", response_model=PipelineResponse)
def process_sample_by_filename(filename: str):
    """Processes a specific chosen sample PDF by filename."""
    # Handle Vercel serverless environment
    if os.getenv("VERCEL") == "1":
        samples_dir = "/tmp/samples"
    else:
        samples_dir = os.path.abspath("data/samples")
        
    file_path = os.path.join(samples_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Sample PDF '{filename}' not found.")
        
    try:
        response = run_product_pipeline(file_path, filename)
        if response.success and response.record:
            # Check if already in batch_store (update or append)
            existing_idx = next((i for i, r in enumerate(batch_store.records) if r.sku == response.record.sku), None)
            if existing_idx is not None:
                batch_store.records[existing_idx] = response.record
            else:
                batch_store.records.append(response.record)
            batch_store.save(batch_store.records)
        return response
    except Exception as e:
        logger.exception("Sample pipeline run crash")
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


@app.get("/api/sample-pdf/{filename}")
def serve_sample_pdf(filename: str):
    """Serves raw sample PDF for browser inline viewing or download."""
    # Handle Vercel serverless environment
    if os.getenv("VERCEL") == "1":
        samples_dir = "/tmp/samples"
    else:
        samples_dir = os.path.abspath("data/samples")
        
    filepath = os.path.join(samples_dir, filename)
    if not os.path.exists(filepath) or not filename.endswith(".pdf"):
        raise HTTPException(status_code=404, detail=f"Sample PDF '{filename}' not found.")
    return FileResponse(
        filepath,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=\"{filename}\""}
    )

@app.get("/api/batch-status", response_model=BatchResponse)
def get_batch_status():

    """Returns current batch store records and catalog summary."""
    return BatchResponse(
        success=True,
        batch_metadata={"count": len(batch_store.records)},
        product_records=batch_store.records,
        batch_records=batch_store.get_batch_records(),
        catalog_summary=batch_store.summary
    )

@app.post("/api/products/{sku}/review")
def review_field(sku: str, req: ReviewActionRequest):
    """Applies human review decision (approve/edit/reject) to a product field."""
    updated_rec = batch_store.update_field(sku, req.field_name, req.action, req.new_value)
    if not updated_rec:
        raise HTTPException(status_code=404, detail=f"Product with SKU '{sku}' not found.")
    return {
        "success": True,
        "message": f"Field '{req.field_name}' updated via action '{req.action}'.",
        "product": updated_rec,
        "catalog_summary": batch_store.summary
    }

@app.get("/api/export/json")
def export_json():
    """Downloads full JSON of the latest catalog batch run."""
    data = {
        "export_timestamp": os.path.abspath(batch_store.filepath),
        "catalog_summary": batch_store.summary.model_dump(),
        "records": [r.model_dump() for r in batch_store.records]
    }
    json_bytes = json.dumps(data, indent=2, default=str).encode("utf-8")
    return StreamingResponse(
        io.BytesIO(json_bytes),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=apex_catalog_export.json"}
    )

@app.get("/api/export/csv")
def export_csv():
    """Downloads CSV summary of the latest catalog batch run."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "SKU",
        "Product Name",
        "Category",
        "Name Confidence %",
        "Category Confidence %",
        "Flow Rate",
        "Max Temperature",
        "Material",
        "Power / Rating",
        "Thread / Voltage / Pressure",
        "Conflicts",
        "Review Required"
    ])

    for r in batch_store.records:
        attrs = r.attributes
        flow = attrs.get("flow_rate").value if "flow_rate" in attrs else None
        temp = attrs.get("max_temperature").value if "max_temperature" in attrs else None
        mat = attrs.get("material").value if "material" in attrs else None
        power = attrs.get("power").value if "power" in attrs else None
        other = (
            attrs.get("thread_size").value if "thread_size" in attrs else
            attrs.get("voltage").value if "voltage" in attrs else
            attrs.get("set_pressure").value if "set_pressure" in attrs else
            attrs.get("airflow_capacity").value if "airflow_capacity" in attrs else ""
        )
        conflicts_str = "; ".join(r.validation.get("conflicts", []))

        writer.writerow([
            r.sku,
            r.name.value or "N/A",
            r.category.value or "N/A",
            round(r.name.confidence * 100, 1),
            round(r.category.confidence * 100, 1),
            flow or "N/A",
            temp or "N/A",
            mat or "N/A",
            power or "N/A",
            other or "N/A",
            conflicts_str or "None",
            "YES" if r.validation.get("review_required") else "NO"
        ])

    csv_bytes = output.getvalue().encode("utf-8")
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=apex_catalog_export.csv"}
    )

@app.get("/api/reference-docs")
def get_reference_docs():
    corpus_dir = REFERENCE_CORPUS_DIR
    if not os.path.exists(corpus_dir):
        return {"documents": []}
    files = [f for f in os.listdir(corpus_dir) if f.endswith((".txt", ".md"))]
    return {"documents": files, "count": len(files)}

# --- STATIC FILES SERVING ---
frontend_dist_path = os.path.abspath("frontend/dist")
if os.path.exists(frontend_dist_path):
    logger.info(f"Mounting static files from {frontend_dist_path}")
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")
    
    @app.get("/{rest_of_path:path}")
    async def serve_frontend(rest_of_path: str):
        if rest_of_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        public_file = os.path.join(frontend_dist_path, rest_of_path)
        if os.path.exists(public_file) and os.path.isfile(public_file):
            return FileResponse(public_file)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
