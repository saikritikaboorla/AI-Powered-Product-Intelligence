import os
import json
import logging
from typing import List, Optional, Dict, Any
from backend.schemas import ProductRecord, CatalogSummary, BatchRecord, FieldValue

logger = logging.getLogger("app.batch_store")

# Use /tmp directory in Vercel serverless environment
if os.getenv("VERCEL") == "1":
    STORE_PATH = "/tmp/last_batch.json"
else:
    STORE_PATH = os.path.abspath("data/last_batch.json")

class BatchStore:
    def __init__(self, filepath: str = STORE_PATH):
        self.filepath = filepath
        self.records: List[ProductRecord] = []
        self.summary: CatalogSummary = CatalogSummary()
        self.load()

    def save(self, records: List[ProductRecord], summary: Optional[CatalogSummary] = None) -> None:
        self.records = records
        if summary:
            self.summary = summary
        else:
            self.summary = self.calculate_summary(records)

        # Handle directory creation for both local and Vercel environments
        dir_path = os.path.dirname(self.filepath)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
            
        data = {
            "records": [r.model_dump() for r in records],
            "summary": self.summary.model_dump()
        }
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
        logger.info(f"Saved batch store with {len(records)} records to {self.filepath}")

    def load(self) -> None:
        if not os.path.exists(self.filepath):
            logger.info("No existing batch store file found.")
            return
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.records = [ProductRecord.model_validate(r) for r in data.get("records", [])]
            if "summary" in data:
                self.summary = CatalogSummary.model_validate(data["summary"])
            else:
                self.summary = self.calculate_summary(self.records)
            logger.info(f"Loaded batch store with {len(self.records)} records.")
        except Exception as e:
            logger.error(f"Failed to load batch store: {str(e)}")
            self.records = []
            self.summary = CatalogSummary()

    def calculate_summary(self, records: List[ProductRecord]) -> CatalogSummary:
        if not records:
            return CatalogSummary()

        total_extracted = 0
        total_enriched = 0
        total_verified = 0
        total_review = 0
        conf_sum = 0.0
        comp_sum = 0.0
        field_count = 0

        for r in records:
            # Attributes + name + category
            fields = [r.name, r.category] + list(r.attributes.values())
            record_field_count = len(fields)
            non_empty = 0
            rec_conf_sum = 0.0

            for f in fields:
                field_count += 1
                rec_conf_sum += f.confidence
                
                if f.value and f.value != "insufficient_data":
                    non_empty += 1

                if f.method == "extracted":
                    total_extracted += 1
                elif f.method == "inferred":
                    total_enriched += 1

                if f.validation_status == "passed":
                    total_verified += 1
                elif f.validation_status in ("warning", "conflict") or f.method == "flagged" or f.value == "insufficient_data":
                    total_review += 1

            avg_rec_conf = (rec_conf_sum / record_field_count) if record_field_count else 1.0
            conf_sum += avg_rec_conf
            completeness = (non_empty / record_field_count * 100.0) if record_field_count else 0.0
            comp_sum += completeness

        total_procs = len(records)
        return CatalogSummary(
            products_processed=total_procs,
            attributes_extracted=total_extracted,
            attributes_enriched=total_enriched,
            attributes_verified=total_verified,
            needs_review=total_review,
            average_confidence=round(conf_sum / total_procs * 100.0, 1) if total_procs else 0.0,
            catalog_completeness=round(comp_sum / total_procs, 1) if total_procs else 0.0
        )

    def get_batch_records(self) -> List[BatchRecord]:
        batch_recs = []
        for r in self.records:
            fields = [r.name, r.category] + list(r.attributes.values())
            field_cnt = len(fields)
            non_empty = sum(1 for f in fields if f.value and f.value != "insufficient_data")
            enriched = sum(1 for f in fields if f.method == "inferred")
            flagged = sum(1 for f in fields if f.method == "flagged" or f.value == "insufficient_data" or f.validation_status in ("warning", "conflict"))
            avg_conf = sum(f.confidence for f in fields) / field_cnt if field_cnt else 1.0

            batch_recs.append(BatchRecord(
                sku=r.sku,
                name=str(r.name.value) if r.name.value else r.sku,
                category=str(r.category.value) if r.category.value else "Uncategorized",
                completion_percentage=round((non_empty / field_cnt * 100.0), 1) if field_cnt else 0.0,
                average_confidence=round(avg_conf * 100.0, 1),
                enriched_count=enriched,
                flagged_count=flagged,
                review_required=r.validation.get("review_required", False) or flagged > 0
            ))
        return batch_recs

    def update_field(self, sku: str, field_name: str, action: str, new_value: Optional[str] = None) -> Optional[ProductRecord]:
        for r in self.records:
            if r.sku == sku:
                target_field: Optional[FieldValue] = None
                if field_name == "name":
                    target_field = r.name
                elif field_name == "category":
                    target_field = r.category
                elif field_name in r.attributes:
                    target_field = r.attributes[field_name]

                if target_field:
                    if action in ("approve", "accept_a", "accept_b"):
                        if new_value:
                            target_field.value = new_value
                        target_field.confidence = 1.0
                        target_field.validation_status = "passed"
                        target_field.method = "extracted"
                    elif action == "edit" and new_value is not None:
                        target_field.value = new_value
                        target_field.confidence = 1.0
                        target_field.validation_status = "passed"
                        target_field.method = "extracted"
                    elif action == "reject":
                        target_field.value = "insufficient_data"
                        target_field.confidence = 0.0
                        target_field.validation_status = "warning"
                        target_field.method = "flagged"

                # Check remaining conflicts for this product
                fields = [r.name, r.category] + list(r.attributes.values())
                any_review = any(f.validation_status in ("warning", "conflict") or f.method == "flagged" or f.value == "insufficient_data" for f in fields)
                r.validation["review_required"] = any_review

                # Re-calculate catalog summary and save
                self.summary = self.calculate_summary(self.records)
                self.save(self.records, self.summary)
                return r

        return None

batch_store = BatchStore()
