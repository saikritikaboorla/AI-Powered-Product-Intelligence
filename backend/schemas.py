from pydantic import BaseModel, Field
from typing import Optional, Literal, Any, Dict, List, Union

class FieldValue(BaseModel):
    value: Optional[Union[str, float, int]] = None
    original_value: Optional[str] = None
    normalized_value: Optional[Union[str, float, int]] = None
    normalized_unit: Optional[str] = None
    confidence: float = 1.0  # 0.0 to 1.0
    method: Literal["extracted", "inferred", "flagged"] = "extracted"
    source: Optional[str] = None
    evidence: Optional[str] = None
    evidence_chunk: Optional[str] = None
    page_number: Optional[int] = None
    validation_status: Optional[str] = "passed"  # "passed", "warning", "conflict"

class ProductRecord(BaseModel):
    sku: str
    name: FieldValue
    category: FieldValue
    attributes: Dict[str, FieldValue] = Field(default_factory=dict)
    validation: Dict[str, Any] = Field(default_factory=lambda: {"conflicts": [], "review_required": False, "field_statuses": {}})
    pipeline_version: str = "1.0.0"

class PipelineLogEntry(BaseModel):
    stage: Literal["ingestion", "extraction", "enrichment", "validation"]
    status: Literal["pending", "running", "success", "failed", "warning"]
    message: str
    details: Optional[str] = None

class PipelineResponse(BaseModel):
    success: bool
    record: Optional[ProductRecord] = None
    logs: List[PipelineLogEntry] = Field(default_factory=list)
    error: Optional[str] = None

class BatchRecord(BaseModel):
    sku: str
    name: str
    category: str
    completion_percentage: float
    average_confidence: float
    enriched_count: int
    flagged_count: int
    review_required: bool

class CatalogSummary(BaseModel):
    products_processed: int = 0
    attributes_extracted: int = 0
    attributes_enriched: int = 0
    attributes_verified: int = 0
    needs_review: int = 0
    average_confidence: float = 0.0
    catalog_completeness: float = 0.0

class BatchResponse(BaseModel):
    success: bool
    batch_metadata: Dict[str, Any] = Field(default_factory=dict)
    product_records: List[ProductRecord] = Field(default_factory=list)
    batch_records: List[BatchRecord] = Field(default_factory=list)
    catalog_summary: CatalogSummary = Field(default_factory=CatalogSummary)
    logs: List[PipelineLogEntry] = Field(default_factory=list)
    error: Optional[str] = None

class ReviewActionRequest(BaseModel):
    sku: str
    field_name: str  # e.g., "max_temperature", "name", "category", or attribute key
    action: Literal["approve", "accept_a", "accept_b", "edit", "reject"]
    new_value: Optional[str] = None
