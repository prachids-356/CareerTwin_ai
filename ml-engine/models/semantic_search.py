import math
import urllib.request
import json
import re

# Helper to compute dot product of two dict-represented sparse vectors (TF-IDF)
def dot_product(v1, v2):
    return sum(v1.get(k, 0) * v2.get(k, 0) for k in v1 if k in v2)

# Helper to compute magnitude of a sparse vector
def magnitude(v):
    return math.sqrt(sum(val ** 2 for val in v.values()))

# Cosine similarity between two vectors
def cosine_sim(v1, v2):
    mag1 = magnitude(v1)
    mag2 = magnitude(v2)
    if mag1 == 0 or mag2 == 0:
        return 0
    return dot_product(v1, v2) / (mag1 * mag2)

# Simple English stop words to filter out in TF-IDF
STOP_WORDS = {"the", "a", "an", "and", "or", "but", "if", "then", "of", "to", "in", "on", "at", "for", "with", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "this", "that", "these", "those"}

def tokenize(text):
    # Lowercase and extract alphanumeric terms
    text = text.lower()
    words = re.findall(r'\b\w+\b', text)
    return [w for w in words if w not in STOP_WORDS]

class TFIDFEngine:
    def __init__(self, documents):
        """
        documents: list of dicts, each having 'id' and 'text_to_index' (e.g. title + topic + type)
        """
        self.docs = documents
        self.n_docs = len(documents)
        
        # 1. Compute Document Frequencies (DF)
        self.df = {}
        self.doc_tokens = []
        for doc in documents:
            tokens = tokenize(doc.get("text_to_index", ""))
            self.doc_tokens.append(tokens)
            unique_tokens = set(tokens)
            for t in unique_tokens:
                self.df[t] = self.df.get(t, 0) + 1
                
        # 2. Compute IDF for each term
        self.idf = {}
        for term, df_val in self.df.items():
            # Standard smoothed IDF formula
            self.idf[term] = math.log(1.0 + (1.0 + self.n_docs) / (1.0 + df_val))
            
        # 3. Compute TF-IDF vectors for all documents
        self.doc_vectors = []
        for tokens in self.doc_tokens:
            vec = {}
            # Compute TF
            tf = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
            
            # Compute TF-IDF
            total_tokens = len(tokens) if len(tokens) > 0 else 1
            for t, count in tf.items():
                term_tf = count / total_tokens
                vec[t] = term_tf * self.idf.get(t, 0)
            self.doc_vectors.append(vec)

    def search(self, query, top_n=5):
        query_tokens = tokenize(query)
        if not query_tokens:
            return []
            
        # Compute TF-IDF vector for the query
        q_tf = {}
        for t in query_tokens:
            q_tf[t] = q_tf.get(t, 0) + 1
            
        q_vec = {}
        total_q_tokens = len(query_tokens)
        for t, count in q_tf.items():
            term_tf = count / total_q_tokens
            # Only use terms that exist in the document index
            q_vec[t] = term_tf * self.idf.get(t, 0)

        # Compute cosine similarity with all documents
        scores = []
        for idx, doc_vec in enumerate(self.doc_vectors):
            similarity = cosine_sim(q_vec, doc_vec)
            scores.append({
                "doc_idx": idx,
                "score": round(similarity * 100, 1) # similarity as percentage
            })
            
        # Sort by score descending
        scores.sort(key=lambda x: x["score"], reverse=True)
        return scores[:top_n]


# Deep Learning Vector Embeddings Client using Gemini
def get_gemini_embedding(text, api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
    payload = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{"text": text}]
        }
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            res_data = json.loads(res_body)
            # Extracted dense embedding vector (list of 768 floats)
            return res_data["embedding"]["values"]
    except Exception as e:
        print(f"Error fetching Gemini Embeddings: {e}")
        return None

def cosine_sim_dense(v1, v2):
    dot = sum(x * y for x, y in zip(v1, v2))
    mag1 = math.sqrt(sum(x**2 for x in v1))
    mag2 = math.sqrt(sum(y**2 for y in v2))
    if mag1 == 0 or mag2 == 0:
        return 0
    return dot / (mag1 * mag2)

def semantic_search_resources(resources, query, api_key=None):
    """
    Ranks resources by semantic similarity to search query.
    If api_key is present, uses deep learning dense embeddings.
    Otherwise, falls back to sparse TF-IDF matching.
    """
    if not query.strip():
        return [{"resource": res, "score": 100.0} for res in resources]

    # Prepare document texts for indexing
    docs_to_index = []
    for res in resources:
        text = f"{res.get('title', '')} {res.get('topic', '')} {res.get('type', '')}"
        docs_to_index.append({
            "id": res.get("id", ""),
            "text_to_index": text,
            "resource": res
        })

    # Mode 1: DL Neural Vector Search
    if api_key:
        print("Using Deep Learning Gemini Vector Embeddings for search...")
        query_emb = get_gemini_embedding(query, api_key)
        if query_emb:
            ranked = []
            for doc in docs_to_index:
                doc_text = doc["text_to_index"]
                doc_emb = get_gemini_embedding(doc_text, api_key)
                if doc_emb:
                    sim = cosine_sim_dense(query_emb, doc_emb)
                    # Scale to 0-100 percentage
                    score = round((sim + 1.0) / 2.0 * 100.0, 1) # similarity scaled
                    ranked.append({"resource": doc["resource"], "score": score})
                else:
                    ranked.append({"resource": doc["resource"], "score": 0.0})
            ranked.sort(key=lambda x: x["score"], reverse=True)
            return ranked

    # Mode 2: Fallback TF-IDF Sparse Vector Matcher
    print("Using Local TF-IDF Search Engine...")
    engine = TFIDFEngine(docs_to_index)
    matches = engine.search(query, top_n=len(resources))
    
    ranked = []
    matched_indices = set()
    for m in matches:
        idx = m["doc_idx"]
        matched_indices.add(idx)
        ranked.append({
            "resource": docs_to_index[idx]["resource"],
            "score": m["score"]
        })
        
    # Append any document that scored 0
    for idx, doc in enumerate(docs_to_index):
        if idx not in matched_indices:
            ranked.append({
                "resource": doc["resource"],
                "score": 0.0
            })
            
    return ranked

if __name__ == "__main__":
    # Test local semantic TF-IDF
    sample_res = [
        {"id": "r1", "title": "Advanced Graphs DFS Video Guide", "topic": "Graphs", "type": "video"},
        {"id": "r2", "title": "Reverse a Linked List Recursively", "topic": "Linked List", "type": "blog"},
        {"id": "r3", "title": "Dynamic Programming Coin Change memoization", "topic": "Dynamic Programming", "type": "notes"}
    ]
    res = semantic_search_resources(sample_res, "linked list node reverse")
    print(json.dumps(res, indent=2))
