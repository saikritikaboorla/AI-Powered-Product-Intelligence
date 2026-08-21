import re
import logging
from typing import Dict, Any, List, Optional
from backend.schemas import ProductRecord, FieldValue
from backend.services.llm_service import llm_service

logger = logging.getLogger("app.validation")

def extract_number(value_str: str) -> Optional[float]:
    """Extracts the first numerical value from a string (e.g., '150 F' -> 150.0)."""
    if not value_str or value_str == "insufficient_data":
        return None
    match = re.search(r'([0-9]+(?:\.[0-9]+)?)', str(value_str))
    if match:
        return float(match.group(1))
    return None

def run_deterministic_checks(record: ProductRecord) -> List[str]:
    """Runs hardcoded domain validation checks and returns a list of found conflicts."""
    conflicts = []
    category = record.category.value
    attrs = record.attributes
    
    if not category:
        return conflicts
        
    if category == "Pumps":
        flow_field = attrs.get("flow_rate")
        if flow_field and flow_field.value and flow_field.value != "insufficient_data":
            flow_num = extract_number(str(flow_field.value))
            if flow_num is not None:
                if flow_num < 0 or flow_num > 1500:
                    conflicts.append(f"Out of Range: Flow rate of {flow_field.value} exceeds typical limits (0-1500 GPM).")
            else:
                conflicts.append(f"Format Warning: Could not parse numerical flow rate from '{flow_field.value}'.")
                
        temp_field = attrs.get("max_temperature")
        mat_field = attrs.get("material")
        
        if temp_field and temp_field.value and temp_field.value != "insufficient_data" and mat_field and mat_field.value:
            temp_num = extract_number(str(temp_field.value))
            mat_str = str(mat_field.value).lower()
            
            if temp_num is not None:
                if "cast iron" in mat_str and temp_num > 220:
                    conflicts.append(
                        f"Material vs Temp Conflict: Cast Iron pump rated at {temp_field.value} exceeds standard safety limit (220°F)."
                    )
                elif "carbon steel" in mat_str and temp_num > 250:
                    conflicts.append(
                        f"Material vs Temp Conflict: Carbon Steel pump rated at {temp_field.value} exceeds standard safety limit (250°F)."
                    )
                elif temp_num > 650:
                    conflicts.append(
                        f"Material vs Temp Conflict: Operating temperature {temp_field.value} exceeds absolute maximum industrial pump limits (650°F)."
                    )

    elif category == "Fasteners":
        thread_field = attrs.get("thread_size")
        if thread_field and thread_field.value and thread_field.value != "insufficient_data":
            thread_str = str(thread_field.value)
            is_valid_pattern = (
                re.search(r'\d+/\d+-\d+', thread_str) or
                re.search(r'M\d+', thread_str, re.IGNORECASE) or
                re.search(r'#\d+-\d+', thread_str)
            )
            if not is_valid_pattern:
                conflicts.append(f"Format Warning: Thread size '{thread_str}' does not match standard fastener sizing patterns.")

    elif category == "Motors":
        volt_field = attrs.get("voltage")
        if volt_field and volt_field.value and volt_field.value != "insufficient_data":
            volt_str = str(volt_field.value)
            common_volts = ["115", "208", "230", "400", "460", "575"]
            has_common = any(v in volt_str for v in common_volts)
            if not has_common:
                conflicts.append(f"Format Warning: Operating voltage '{volt_str}' is unusual for standard industrial applications.")

    return conflicts

def calculate_weighted_confidence(
    field_val: FieldValue,
    plausibility_score: float,
    is_conflict: bool,
    is_format_warning: bool
) -> float:
    """
    SECTION 5: Documented Deterministic Weighted Confidence Formula:
    Confidence = 0.40 * EvidenceSupport + 0.20 * ExtractionQuality + 0.25 * ValidationResult + 0.15 * ConsistencyStatus
    """
    if not field_val.value or field_val.value == "insufficient_data":
        return 0.0

    # 1. Evidence Support (40%)
    if field_val.method == "extracted" and field_val.evidence:
        s_evidence = 1.0
    elif field_val.method == "inferred" and field_val.evidence:
        s_evidence = 0.85
    elif field_val.evidence:
        s_evidence = 0.70
    else:
        s_evidence = 0.40

    # 2. Extraction Quality (20%)
    if field_val.original_value and field_val.normalized_value:
        s_extraction = 1.0
    elif field_val.value:
        s_extraction = 0.80
    else:
        s_extraction = 0.0

    # 3. Validation Result (25%)
    if is_conflict:
        s_validation = 0.0
    elif is_format_warning:
        s_validation = 0.40
    else:
        s_validation = 1.0

    # 4. Consistency & Plausibility Status (15%)
    s_consistency = max(0.0, min(1.0, plausibility_score))
    if is_conflict:
        s_consistency = min(s_consistency, 0.2)

    total_conf = (0.40 * s_evidence) + (0.20 * s_extraction) + (0.25 * s_validation) + (0.15 * s_consistency)
    return round(max(0.0, min(1.0, total_conf)), 2)

def validate_product(record: ProductRecord) -> ProductRecord:
    """
    Main validation function.
    Runs deterministic checks, queries LLM-as-judge, and calculates final weighted confidence.
    """
    logger.info("Starting validation and confidence scoring engine...")
    
    serialized_record = {
        "sku": record.sku,
        "name": record.name.value,
        "category": record.category.value,
        "attributes": {k: v.value for k, v in record.attributes.items()}
    }
    
    judge_results = llm_service.validate_product_record(serialized_record)
    plausibility = judge_results.get("plausibility_scores", {})
    llm_conflicts = judge_results.get("conflicts", [])
    
    deterministic_conflicts = run_deterministic_checks(record)
    all_conflicts = list(set(deterministic_conflicts + llm_conflicts))
    
    def get_plausibility(key: str, subkey: str = None) -> float:
        if subkey is None:
            return plausibility.get(key, 0.95)
        return plausibility.get(key, {}).get(subkey, 0.95)

    field_statuses = {}
    review_required = False

    # Name & Category validation
    name_conf = calculate_weighted_confidence(record.name, get_plausibility("name"), False, False)
    record.name.confidence = name_conf if record.name.value else 0.0
    record.name.validation_status = "passed" if record.name.value else "warning"

    cat_conf = calculate_weighted_confidence(record.category, get_plausibility("category"), False, False)
    record.category.confidence = cat_conf if record.category.value else 0.0
    record.category.validation_status = "passed" if record.category.value else "warning"

    # Attributes validation
    for key, field_val in record.attributes.items():
        plaus_score = get_plausibility("attributes", key)
        is_conflict = any(key in c or "Conflict" in c for c in all_conflicts) and ("temp" in key or "material" in key or "pressure" in key)
        is_warning = any(key in c for c in deterministic_conflicts if "Format Warning" in c or "Out of Range" in c)

        final_conf = calculate_weighted_confidence(field_val, plaus_score, is_conflict, is_warning)
        field_val.confidence = final_conf

        if is_conflict:
            field_val.validation_status = "conflict"
            field_val.method = "flagged"
            field_val.source = "Validation Engine (Conflict Detected)"
            field_statuses[key] = "conflict"
            review_required = True
        elif is_warning or final_conf < 0.6 or field_val.value == "insufficient_data":
            field_val.validation_status = "warning"
            if field_val.value == "insufficient_data":
                field_val.method = "flagged"
            field_statuses[key] = "warning"
            review_required = True
        else:
            field_val.validation_status = "passed"
            field_statuses[key] = "passed"

    record.validation = {
        "conflicts": all_conflicts,
        "review_required": review_required or len(all_conflicts) > 0,
        "field_statuses": field_statuses
    }
    
    logger.info(f"Validation complete. Conflicts found: {len(all_conflicts)}, Human Review Required: {record.validation['review_required']}")
    return record
