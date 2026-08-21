import logging
from backend.schemas import ProductRecord, FieldValue
from backend.services.vector_store import query_reference_corpus
from backend.services.llm_service import llm_service
from backend.modules.normalization import normalize_attribute_value

logger = logging.getLogger("app.enrichment")

def enrich_product(record: ProductRecord) -> ProductRecord:
    """
    Scans the ProductRecord for missing attributes and performs RAG-based enrichment.
    Grounds values in reference corpus or falls back to 'insufficient_data'.
    """
    product_name = record.name.value or "Unknown Product"
    category = record.category.value or "General Equipment"
    
    logger.info(f"Starting RAG enrichment for product '{product_name}' (Category: '{category}')...")
    
    enriched_count = 0
    insufficient_count = 0
    
    for key, field_val in list(record.attributes.items()):
        if field_val.value is None or str(field_val.value).strip() == "" or field_val.value == "insufficient_data":
            logger.info(f"Missing attribute detected: '{key}'. Initiating RAG retrieval...")
            
            query = f"standard typical values ratings specifications for {key} of {product_name} in {category}"
            matches = query_reference_corpus(query, top_k=2)
            valid_matches = [m for m in matches if m["score"] > 0.05]
            
            if not valid_matches:
                logger.warning(f"No reference context found for '{key}'. Flagging insufficient_data.")
                record.attributes[key] = FieldValue(
                    value="insufficient_data",
                    original_value="insufficient_data",
                    normalized_value="insufficient_data",
                    confidence=0.0,
                    method="flagged",
                    source=None,
                    evidence="No supporting evidence found in document or reference corpus.",
                    validation_status="warning"
                )
                insufficient_count += 1
                continue
                
            context_blocks = []
            for m in valid_matches:
                context_blocks.append(f"Source: {m['source']}\nContent: {m['text']}")
            combined_context = "\n\n".join(context_blocks)
            
            enrich_result = llm_service.enrich_attribute(
                attribute_name=key,
                product_name=product_name,
                category=category,
                context=combined_context
            )
            
            if enrich_result.get("found") and enrich_result.get("value") and enrich_result.get("value") != "insufficient_data":
                raw_val = enrich_result["value"]
                source_doc = enrich_result.get("source_citation") or valid_matches[0]["source"]
                ev_quote = enrich_result.get("evidence_quote") or valid_matches[0]["text"][:200]
                
                norm = normalize_attribute_value(raw_val, key)
                logger.info(f"Successfully enriched '{key}' with value: '{norm['normalized_value']}' from source '{source_doc}'")
                
                record.attributes[key] = FieldValue(
                    value=norm["normalized_value"],
                    original_value=norm["original_value"],
                    normalized_value=norm["normalized_value"],
                    normalized_unit=norm["normalized_unit"],
                    confidence=0.85,
                    method="inferred",
                    source=f"Reference Corpus: {source_doc}",
                    evidence=f"Quote: \"{ev_quote}\"",
                    validation_status="passed"
                )
                enriched_count += 1
            else:
                logger.warning(f"LLM could not resolve '{key}' from context. Flagging insufficient_data.")
                record.attributes[key] = FieldValue(
                    value="insufficient_data",
                    original_value="insufficient_data",
                    normalized_value="insufficient_data",
                    confidence=0.0,
                    method="flagged",
                    source=None,
                    evidence="No supporting evidence found in document or reference corpus.",
                    validation_status="warning"
                )
                insufficient_count += 1
                
    logger.info(f"RAG enrichment complete. Enriched: {enriched_count}, Insufficient Data: {insufficient_count}")
    return record
