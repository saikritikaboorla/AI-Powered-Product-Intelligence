import os
import re
import math
import logging
from typing import List, Dict, Any, Tuple, Set
from collections import Counter

logger = logging.getLogger("app.vector_store")

def clean_text(text: str) -> str:
    """Lowercase text and remove non-alphanumeric characters."""
    return re.sub(r'[^a-zA-Z0-9\s]', '', text.lower())

def tokenize(text: str) -> List[str]:
    """Cleans text and splits into words."""
    return clean_text(text).split()

class LocalVectorStore:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.chunks: List[Dict[str, Any]] = []  # List of {"text": str, "source": str, "tokens": List[str]}
        self.idf: Dict[str, float] = {}
        self.vocabulary: Set[str] = set()
        self.is_indexed = False

    def chunk_text(self, text: str, source: str) -> None:
        """Splits a document's text into overlapping chunks and stores them."""
        # Simple character-based chunking
        i = 0
        text_len = len(text)
        if text_len == 0:
            return
            
        while i < text_len:
            end = min(i + self.chunk_size, text_len)
            chunk = text[i:end].strip()
            if chunk:
                self.chunks.append({
                    "text": chunk,
                    "source": source,
                    "tokens": tokenize(chunk)
                })
            # If we've reached the end of the text, break
            if end == text_len:
                break
            i += (self.chunk_size - self.chunk_overlap)

    def fit_tfidf(self) -> None:
        """Computes IDF values for all terms in the vocabulary across all chunks."""
        total_docs = len(self.chunks)
        if total_docs == 0:
            logger.warning("No chunks to fit TF-IDF.")
            return

        # Count document frequency for each word
        doc_frequencies: Counter = Counter()
        for chunk in self.chunks:
            unique_tokens = set(chunk["tokens"])
            for token in unique_tokens:
                doc_frequencies[token] += 1
                self.vocabulary.add(token)

        # Compute IDF: log(N / DF)
        for term, df in doc_frequencies.items():
            self.idf[term] = math.log((total_docs) / (df))

        # Compute TF-IDF vector for each chunk
        for chunk in self.chunks:
            tf = Counter(chunk["tokens"])
            tfidf = {}
            for term, count in tf.items():
                if term in self.idf:
                    tfidf[term] = count * self.idf[term]
            chunk["tfidf"] = tfidf
            
        self.is_indexed = True
        logger.info(f"TF-IDF index built successfully with {total_docs} chunks and a vocabulary of {len(self.vocabulary)} terms.")

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Searches the indexed chunks for the top_k closest matches to the query.
        Returns a list of dicts with keys: 'text', 'source', 'score'.
        """
        if not self.is_indexed or not self.chunks:
            return []

        query_tokens = tokenize(query)
        query_tf = Counter(query_tokens)
        query_tfidf = {}
        for term, count in query_tf.items():
            if term in self.idf:
                query_tfidf[term] = count * self.idf[term]

        # Calculate cosine similarity for each chunk
        results = []
        query_norm = math.sqrt(sum(val ** 2 for val in query_tfidf.values()))
        
        if query_norm == 0:
            # Query is empty or has no words in the vocabulary
            return [{"text": c["text"], "source": c["source"], "score": 0.0} for c in self.chunks[:top_k]]

        for chunk in self.chunks:
            chunk_tfidf = chunk["tfidf"]
            dot_product = sum(query_tfidf.get(term, 0) * chunk_tfidf.get(term, 0) for term in query_tfidf)
            
            chunk_norm = math.sqrt(sum(val ** 2 for val in chunk_tfidf.values()))
            
            if chunk_norm == 0:
                similarity = 0.0
            else:
                similarity = dot_product / (query_norm * chunk_norm)
                
            results.append({
                "text": chunk["text"],
                "source": chunk["source"],
                "score": similarity
            })

        # Sort by similarity score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

# Global vector store instance
_vector_store = LocalVectorStore()

def load_reference_corpus(corpus_dir: str) -> None:
    """Reads all txt/md files from corpus_dir and indexes them."""
    global _vector_store
    _vector_store = LocalVectorStore()  # Reset
    
    if not os.path.exists(corpus_dir):
        logger.warning(f"Reference corpus directory does not exist: {corpus_dir}")
        return

    logger.info(f"Loading reference corpus from {corpus_dir}...")
    file_count = 0
    for filename in os.listdir(corpus_dir):
        if filename.endswith(".txt") or filename.endswith(".md"):
            file_path = os.path.join(corpus_dir, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
                    _vector_store.chunk_text(text, filename)
                    file_count += 1
            except Exception as e:
                logger.error(f"Error reading {filename}: {str(e)}")

    if file_count > 0:
        _vector_store.fit_tfidf()
    else:
        logger.warning("No files found in reference corpus directory to index.")

def query_reference_corpus(query: str, top_k: int = 2) -> List[Dict[str, Any]]:
    """Helper function to run search queries on the global vector store."""
    return _vector_store.search(query, top_k=top_k)
