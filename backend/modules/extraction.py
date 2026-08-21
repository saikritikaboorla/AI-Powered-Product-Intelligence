import logging
from typing import Dict, Any
from backend.schemas import ProductRecord, FieldValue
from backend.services.llm_service import llm_service
from backend.modules.normalization import normalize_attribute_value

logger = logging.getLogger("app.extraction")

CATEGORY_EXPECTED_ATTRIBUTES = {
    "Pumps": ["flow_rate", "max_temperature", "material", "power"],
    "Fasteners": ["thread_size", "material_grade", "tensile_strength", "plating"],
    "Motors": ["voltage", "frame_size", "power", "speed"],
    "Valves": ["set_pressure", "material", "max_temperature", "flow_rate"],
    "Fans": ["airflow_capacity", "power", "noise_level", "material"]
}

def extract_product(text: str, filename: str = "Spec Sheet PDF") -> ProductRecord:
    """
    Extracts product info from ingested text using LLM schema generation.
    Constructs the initial ProductRecord with unit normalization and evidence tracking.
    """
    logger.info(f"Extracting product information from context source: {filename}...")
    
    raw_data = llm_service.extract_product_info(text, doc_name=filename)
    evidence_snippets = raw_data.get("evidence_snippets", {})
    
    sku = raw_data.get("sku") or "SKU-PENDING"
    
    name_val = raw_data.get("name")
    name_snippet = evidence_snippets.get("name") or (f"Product Title: {name_val}" if name_val else None)
    name_field = FieldValue(
        value=name_val,
        original_value=str(name_val) if name_val else None,
        normalized_value=name_val,
        confidence=0.95 if name_val else 0.0,
        method="extracted",
        source=filename if name_val else None,
        evidence=name_snippet,
        validation_status="passed" if name_val else "warning"
    )
    
    cat_val = raw_data.get("category")
    cat_snippet = evidence_snippets.get("category") or (f"Category: {cat_val}" if cat_val else None)
    cat_field = FieldValue(
        value=cat_val,
        original_value=str(cat_val) if cat_val else None,
        normalized_value=cat_val,
        confidence=0.95 if cat_val else 0.0,
        method="extracted",
        source=filename if cat_val else None,
        evidence=cat_snippet,
        validation_status="passed" if cat_val else "warning"
    )
    
    attributes: Dict[str, FieldValue] = {}
    extracted_attrs = raw_data.get("attributes") or {}
    attr_snippets = evidence_snippets.get("attributes") or {}
    
    for key, val in extracted_attrs.items():
        if val is not None and str(val).strip() != "" and str(val).lower() != "null":
            norm = normalize_attribute_value(val, key)
            snip = attr_snippets.get(key) or f"{key.replace('_', ' ').title()}: {val}"
            attributes[key] = FieldValue(
                value=norm["normalized_value"],
                original_value=norm["original_value"],
                normalized_value=norm["normalized_value"],
                normalized_unit=norm["normalized_unit"],
                confidence=0.95,
                method="extracted",
                source=filename,
                evidence=snip,
                validation_status="passed"
            )
            
    # Seed expected category attributes for RAG enrichment if missing
    if cat_val in CATEGORY_EXPECTED_ATTRIBUTES:
        expected = CATEGORY_EXPECTED_ATTRIBUTES[cat_val]
        for attr in expected:
            if attr not in attributes or attributes[attr].value is None:
                attributes[attr] = FieldValue(
                    value=None,
                    original_value=None,
                    normalized_value=None,
                    confidence=0.0,
                    method="extracted",
                    source=None,
                    evidence=None,
                    validation_status="warning"
                )
                
    record = ProductRecord(
        sku=sku,
        name=name_field,
        category=cat_field,
        attributes=attributes,
        validation={"conflicts": [], "review_required": False, "field_statuses": {}},
        pipeline_version="1.0.0"
    )
    
    logger.info(f"Initial extraction complete. SKU: '{sku}', Name: '{name_val}', Category: '{cat_val}', Attributes: {list(attributes.keys())}")
    return record
