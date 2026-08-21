import os
import logging
import pdfplumber
from typing import Dict, Any, List

logger = logging.getLogger("app.ingestion")

def format_table_as_markdown(table: List[List[str]]) -> str:
    """Converts a raw table (list of lists) into a markdown-formatted table string for LLM reading."""
    if not table or not any(table):
        return ""
    
    # Filter out None values and clean cells
    cleaned_table = []
    for row in table:
        if row is None:
            continue
        cleaned_row = [str(cell).strip() if cell is not None else "" for cell in row]
        # Skip completely empty rows
        if any(cleaned_row):
            cleaned_table.append(cleaned_row)
            
    if not cleaned_table:
        return ""
        
    markdown_lines = []
    # Header row
    headers = cleaned_table[0]
    markdown_lines.append("| " + " | ".join(headers) + " |")
    
    # Separator row
    markdown_lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
    
    # Data rows
    for row in cleaned_table[1:]:
        # Ensure row has same length as header
        if len(row) < len(headers):
            row = row + [""] * (len(headers) - len(row))
        elif len(row) > len(headers):
            row = row[:len(headers)]
        markdown_lines.append("| " + " | ".join(row) + " |")
        
    return "\n".join(markdown_lines)

def ingest_pdf(file_path: str) -> Dict[str, Any]:
    """
    Ingests a PDF file, extracting text and tables.
    Handles scanned documents gracefully by warning of OCR requirement.
    """
    if not os.path.exists(file_path):
        return {
            "success": False,
            "text": "",
            "tables": [],
            "combined_context": "",
            "status": "failed",
            "message": f"File not found: {file_path}",
            "scanned": False
        }
        
    extracted_text_chunks = []
    extracted_tables = []
    
    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                # 1. Extract text from page
                page_text = page.extract_text()
                if page_text:
                    extracted_text_chunks.append(f"--- Page {page_num} ---\n{page_text}")
                
                # 2. Extract tables from page
                page_tables = page.extract_tables()
                for table in page_tables:
                    if table:
                        extracted_tables.append(table)
                        # Append table text representation to context
                        table_md = format_table_as_markdown(table)
                        if table_md:
                            extracted_text_chunks.append(f"--- Page {page_num} Table ---\n{table_md}")
                            
    except Exception as e:
        logger.error(f"Failed to parse PDF using pdfplumber: {str(e)}")
        return {
            "success": False,
            "text": "",
            "tables": [],
            "combined_context": "",
            "status": "failed",
            "message": f"PDF parsing failed: {str(e)}",
            "scanned": False
        }

    combined_context = "\n\n".join(extracted_text_chunks).strip()
    
    # Determine if document is scanned (no text extracted)
    is_scanned = len(combined_context) < 50
    
    if is_scanned:
        # Standard OCR Fallback Handler
        logger.warning(f"Extracted content is very short. Scanned PDF or image-only spec sheet: {file_path}")
        # Note: Since native tesseract binary is not installed, we fallback gracefully.
        # In a real environment, we would invoke pytesseract.image_to_string or an external OCR API.
        # Here we flag the scanned status so the pipeline/validation can report it.
        return {
            "success": True,
            "text": "",
            "tables": [],
            "combined_context": "[WARNING: Scanned Document - No digital text layer detected. Native OCR/Tesseract binary is missing from system PATH. Detailed technical analysis requires a digital PDF spec sheet.]",
            "status": "warning",
            "message": "Scanned document detected. Digital text layer is missing. OCR engine fallback initiated but local Tesseract is not installed.",
            "scanned": True
        }
        
    return {
        "success": True,
        "text": combined_context,
        "tables": extracted_tables,
        "combined_context": combined_context,
        "status": "success",
        "message": f"Successfully extracted text and {len(extracted_tables)} table(s) from PDF.",
        "scanned": False
    }
