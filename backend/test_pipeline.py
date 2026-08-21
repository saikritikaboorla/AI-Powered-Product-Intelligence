import os
import sys
import logging
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")
load_dotenv()

# Enable test fallback mode for unit test run
os.environ["ALLOW_TEST_MOCKS"] = "true"

from backend.services.vector_store import load_reference_corpus
from backend.modules.extraction import extract_product
from backend.modules.enrichment import enrich_product
from backend.modules.validation import validate_product
from backend.pipeline import run_batch_pipeline
from backend.batch_store import batch_store
from scripts.generate_samples import generate_all_samples

def test_a_normal_extraction():
    print("\n--- TEST A: Normal Product Extraction & Normalization ---")
    text = """
    AeroFlow Industrial Centrifugal Pump
    Model: AF-220-XP
    - Flow rate: 150 GPM
    - Body Material: Cast Iron
    - Power Rating: 7.5 HP
    """
    record = extract_product(text, "aeroflow_af220_pump.pdf")
    assert record.sku == "AF-220-XP"
    assert record.category.value == "Pumps"
    assert "150" in str(record.attributes["flow_rate"].value)
    assert record.attributes["flow_rate"].method == "extracted"
    assert record.attributes["flow_rate"].evidence is not None
    print("[PASS] TEST A: SKU, category, normalized flow rate, and evidence snippet extracted successfully.")

def test_b_rag_enrichment():
    print("\n--- TEST B: RAG Enrichment for Missing Field ---")
    load_reference_corpus("data/reference_corpus")
    text = """
    AeroFlow Heavy-Duty Centrifugal Pump
    Model: AF-220-XP
    - Flow rate: 150 GPM
    - Material: Cast Iron
    - Power: 7.5 HP
    """
    record = extract_product(text, "aeroflow_af220_pump.pdf")
    # max_temperature is missing -> triggers RAG
    record = enrich_product(record)
    temp_val = record.attributes["max_temperature"].value
    print(f"Enriched max_temperature: {temp_val}")
    assert temp_val is not None
    assert "220" in str(temp_val)
    assert record.attributes["max_temperature"].method == "inferred"
    assert "Quote:" in str(record.attributes["max_temperature"].evidence)
    print("[PASS] TEST B: RAG correctly retrieved 220°F limit from reference standards with citation and evidence quote.")

def test_c_insufficient_data():
    print("\n--- TEST C: Insufficient Data Fallback (Anti-Hallucination) ---")
    load_reference_corpus("data/reference_corpus")
    text = """
    Teflon-Lined Compact Ball Valve
    Model: TBV-200-SPARSE
    - Nominal Size: 2.0 in NPT
    - Handle Type: Lever Handle
    """
    record = extract_product(text, "teflon_ball_valve_sparse.pdf")
    record = enrich_product(record)
    mat_val = record.attributes["material"].value
    print(f"Sparse valve material value: {mat_val}")
    assert mat_val == "insufficient_data"
    assert record.attributes["material"].confidence == 0.0
    assert record.attributes["material"].method == "flagged"
    print("[PASS] TEST C: Sparse product attribute cleanly returned 'insufficient_data' with zero confidence.")

def test_d_conflict_detection():
    print("\n--- TEST D: Deterministic & LLM Conflict Detection ---")
    text = """
    Centrifugal Chemical Pump
    Model: PUMP-CONFL-01
    - Material: Cast Iron
    - Max Operating Temperature: 400 °F
    - Flow rate: 80 GPM
    """
    record = extract_product(text, "pump_confl_spec.pdf")
    record = validate_product(record)
    conflicts = record.validation.get("conflicts", [])
    print(f"Detected Conflicts: {conflicts}")
    assert len(conflicts) > 0
    assert any("Conflict" in c for c in conflicts)
    assert record.validation["review_required"] is True
    print("[PASS] TEST D: High temperature Cast Iron pump flagged conflict and marked review_required=True.")

def test_e_batch_processing():
    print("\n--- TEST E: Batch Catalog Processing ---")
    generate_all_samples()
    resp = run_batch_pipeline("data/samples")
    assert resp.success is True
    assert len(resp.product_records) == 6
    summary = resp.catalog_summary
    print(f"Catalog Summary: Processed={summary.products_processed}, Extracted={summary.attributes_extracted}, Enriched={summary.attributes_enriched}, Review={summary.needs_review}, Completeness={summary.catalog_completeness}%")
    assert summary.products_processed == 6
    assert summary.attributes_extracted > 0
    print("[PASS] TEST E: Batch processing completed on 6 synthetic sample PDFs with full catalog summary metrics.")

def test_f_human_review_and_persistence():
    print("\n--- TEST F: Human Review Action & Batch Persistence ---")
    res = batch_store.update_field("AF-220-XP", "max_temperature", "approve", "220 °F")
    assert res is not None
    assert batch_store.records[0].attributes["max_temperature"].validation_status == "passed"
    print("[PASS] TEST F: Human review approval updated field status and persisted batch state.")

def main():
    try:
        test_a_normal_extraction()
        test_b_rag_enrichment()
        test_c_insufficient_data()
        test_d_conflict_detection()
        test_e_batch_processing()
        test_f_human_review_and_persistence()
        print("\n=============================================")
        print(" ALL 6 INTEGRATION & PIPELINE TESTS PASSED!  ")
        print("=============================================")
    except AssertionError as e:
        print(f"\nAssertion error: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"\nTest run crashed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
