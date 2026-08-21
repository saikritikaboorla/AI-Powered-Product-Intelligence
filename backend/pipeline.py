import os
import logging
from typing import Dict, Any, List
from backend.schemas import ProductRecord, PipelineLogEntry, PipelineResponse, BatchResponse
from backend.modules.ingestion import ingest_pdf
from backend.modules.extraction import extract_product
from backend.modules.enrichment import enrich_product
from backend.modules.validation import validate_product
from backend.batch_store import batch_store

logger = logging.getLogger("app.pipeline")

def run_product_pipeline(file_path: str, filename: str = "Spec Sheet PDF") -> PipelineResponse:
    """
    Orchestrates the single product intelligence pipeline:
    Ingestion -> Extraction -> Enrichment -> Validation.
    """
    logs: List[PipelineLogEntry] = []
    
    # STAGE 1: INGESTION
    logs.append(PipelineLogEntry(
        stage="ingestion",
        status="running",
        message="Reading PDF spec sheet and extracting structured tables and text..."
    ))
    
    ingest_result = ingest_pdf(file_path)
    
    if not ingest_result["success"]:
        logs[-1].status = "failed"
        logs[-1].message = f"Ingestion failed: {ingest_result['message']}"
        return PipelineResponse(success=False, logs=logs, error=ingest_result["message"])
        
    if ingest_result.get("scanned", False):
        logs[-1].status = "warning"
        logs[-1].message = "Scanned document warning: No digital text layer detected. OCR fallback activated."
        logs[-1].details = ingest_result["message"]
    else:
        logs[-1].status = "success"
        logs[-1].message = ingest_result["message"]
        logs[-1].details = f"Text length: {len(ingest_result['text'])} chars. Tables: {len(ingest_result['tables'])}"
        
    combined_context = ingest_result["combined_context"]

    # STAGE 2: EXTRACTION
    logs.append(PipelineLogEntry(
        stage="extraction",
        status="running",
        message="Running schema-guided extraction for product SKU, name, and attributes..."
    ))
    
    try:
        record = extract_product(combined_context, filename)
        name_val = record.name.value or "Unknown"
        cat_val = record.category.value or "Unknown"
        
        logs[-1].status = "success"
        logs[-1].message = f"Schema extraction completed successfully."
        logs[-1].details = f"Extracted SKU: '{record.sku}', Name: '{name_val}', Category: '{cat_val}', Attributes Count: {len(record.attributes)}"
    except Exception as e:
        logger.error(f"Extraction stage failed: {str(e)}")
        logs[-1].status = "failed"
        logs[-1].message = f"Extraction failed: {str(e)}"
        return PipelineResponse(success=False, logs=logs, error=f"Extraction failed: {str(e)}")

    # STAGE 3: ENRICHMENT
    logs.append(PipelineLogEntry(
        stage="enrichment",
        status="running",
        message="Identifying missing parameters and querying vector store standards corpus..."
    ))
    
    try:
        empty_fields = [k for k, v in record.attributes.items() if v.value is None or v.value == "insufficient_data"]
        
        record = enrich_product(record)
        
        enriched_fields = [k for k in empty_fields if record.attributes[k].value not in (None, "insufficient_data")]
        insufficient_fields = [k for k in empty_fields if record.attributes[k].value == "insufficient_data"]
        
        logs[-1].status = "success"
        logs[-1].message = "Reference corpus lookup and RAG enrichment completed."
        logs[-1].details = f"Queried: {len(empty_fields)} missing fields. Enriched: {len(enriched_fields)}, Marked insufficient: {len(insufficient_fields)}"
    except Exception as e:
        logger.error(f"Enrichment stage failed: {str(e)}")
        logs[-1].status = "failed"
        logs[-1].message = f"Enrichment failed: {str(e)}"
        return PipelineResponse(success=False, logs=logs, error=f"Enrichment failed: {str(e)}")

    # STAGE 4: VALIDATION
    logs.append(PipelineLogEntry(
        stage="validation",
        status="running",
        message="Verifying physical attribute values against engineering tolerances & LLM-as-judge..."
    ))
    
    try:
        record = validate_product(record)
        conflicts = record.validation.get("conflicts", [])
        
        if conflicts:
            logs[-1].status = "warning"
            logs[-1].message = f"Validation completed with {len(conflicts)} conflict warnings."
            logs[-1].details = "\n".join(conflicts)
        else:
            logs[-1].status = "success"
            logs[-1].message = "Validation completed. No engineering or formatting conflicts found."
            logs[-1].details = "All active attributes passed plausibility and range boundaries."
    except Exception as e:
        logger.error(f"Validation stage failed: {str(e)}")
        logs[-1].status = "failed"
        logs[-1].message = f"Validation failed: {str(e)}"
        return PipelineResponse(success=False, logs=logs, error=f"Validation failed: {str(e)}")

    return PipelineResponse(
        success=True,
        record=record,
        logs=logs
    )

def run_batch_pipeline(samples_dir: str = "data/samples") -> BatchResponse:
    """
    Processes all sample catalog documents through the exact same 5-stage pipeline.
    Saves and updates the batch store.
    """
    abs_samples_dir = os.path.abspath(samples_dir)
    logger.info(f"Starting batch catalog processing for directory: {abs_samples_dir}")

    if not os.path.exists(abs_samples_dir):
        return BatchResponse(success=False, error=f"Samples directory '{samples_dir}' not found.")

    pdf_files = sorted([f for f in os.listdir(abs_samples_dir) if f.endswith(".pdf")])
    if not pdf_files:
        return BatchResponse(success=False, error=f"No PDF sample files found in '{samples_dir}'.")

    processed_records: List[ProductRecord] = []
    logs: List[PipelineLogEntry] = []

    for pdf_name in pdf_files:
        full_path = os.path.join(abs_samples_dir, pdf_name)
        logger.info(f"Batch processing file: {pdf_name}")
        resp = run_product_pipeline(full_path, pdf_name)
        if resp.success and resp.record:
            processed_records.append(resp.record)
            logs.extend(resp.logs)
        else:
            logger.error(f"Failed to process sample PDF {pdf_name}: {resp.error}")

    if not processed_records:
        return BatchResponse(success=False, error="Batch processing produced 0 valid product records.", logs=logs)

    # Save to batch store (calculates catalog summary automatically)
    batch_store.save(processed_records)
    
    return BatchResponse(
        success=True,
        batch_metadata={"count": len(processed_records), "source_dir": samples_dir},
        product_records=processed_records,
        batch_records=batch_store.get_batch_records(),
        catalog_summary=batch_store.summary,
        logs=logs
    )
