import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "127.0.0.1")
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "")
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "")

# Handle Vercel serverless environment
if os.getenv("VERCEL") == "1":
    REFERENCE_CORPUS_DIR = "/tmp/reference_corpus"
    UPLOADS_DIR = "/tmp/uploads"
else:
    REFERENCE_CORPUS_DIR = os.path.abspath("data/reference_corpus")
    UPLOADS_DIR = os.path.abspath("data/uploads")
    
PIPELINE_VERSION = "1.0.0"
