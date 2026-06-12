import math
import urllib.request
import json
import re

# Fixed vocabulary for custom bag-of-words fallback embeddings
KEYWORDS = [
    "array", "string", "linked", "list", "recursion", "tree", "graph", 
    "hash", "hashing", "dp", "dynamic", "programming", "pointer", 
    "traversal", "search", "bfs", "dfs", "binary", "sort", "sorting", 
    "complexity", "time", "space", "stuck", "struggle", "confused", 
    "hard", "difficulty", "fail", "slow", "understand", "concept", 
    "forgot", "retention"
]
VOCAB = {word: idx for idx, word in enumerate(KEYWORDS)}

TOPICS_LIST = ["Arrays", "Strings", "Linked List", "Hashing", "Recursion", "Trees", "Graphs", "Dynamic Programming"]

def tokenize(text):
    text = text.lower()
    return re.findall(r'\b\w+\b', text)

def get_fallback_embedding(text):
    """
    Generates a normalized bag-of-words vector for local offline similarity.
    """
    words = tokenize(text)
    vector = [0.0] * len(KEYWORDS)
    for w in words:
        if w in VOCAB:
            vector[VOCAB[w]] += 1.0
            
    # L2 Normalization
    mag = math.sqrt(sum(val ** 2 for val in vector))
    if mag > 0:
        vector = [val / mag for val in vector]
    return vector

def get_gemini_embedding(text, api_key):
    """
    Fetches a dense 768-dimensional vector from the Gemini Embeddings API.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
    payload = {
        "model": "models/text-embedding-004",
        "content": {"parts": [{"text": text}]}
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return res_data["embedding"]["values"]
    except Exception as e:
        print(f"Error fetching Gemini embedding, falling back: {e}")
        return None

def parse_user_message(text, api_key=None):
    """
    Parses a user message to detect:
    1. Topic (match from curriculum)
    2. Sentiment (struggle/difficulty classification)
    3. Importance score (0.0 to 1.0 based on lexical stress)
    4. Embedding vector
    """
    words = tokenize(text)
    
    # 1. Topic detection
    detected_topic = "General"
    lowercase_text = text.lower()
    if "tree" in lowercase_text or "binary" in lowercase_text or "bst" in lowercase_text:
        detected_topic = "Trees"
    elif "graph" in lowercase_text or "bfs" in lowercase_text or "dfs" in lowercase_text:
        detected_topic = "Graphs"
    elif "recursion" in lowercase_text or "backtrack" in lowercase_text:
        detected_topic = "Recursion"
    elif "linked list" in lowercase_text or "pointers" in lowercase_text or "node" in lowercase_text:
        detected_topic = "Linked List"
    elif "hash" in lowercase_text or "map" in lowercase_text or "set" in lowercase_text:
        detected_topic = "Hashing"
    elif "string" in lowercase_text or "substring" in lowercase_text:
        detected_topic = "Strings"
    elif "array" in lowercase_text or "vector" in lowercase_text or "matrix" in lowercase_text:
        detected_topic = "Arrays"
    elif "dp" in lowercase_text or "dynamic programming" in lowercase_text or "knapsack" in lowercase_text:
        detected_topic = "Dynamic Programming"
        
    # 2. Sentiment detection
    sentiment = "general"
    struggle_keywords = ["struggle", "stuck", "hard", "difficulty", "fail", "slow", "confused", "forgot", "weak"]
    if any(k in words for k in struggle_keywords) or "don't understand" in lowercase_text or "dont get" in lowercase_text:
        sentiment = "difficulty"
        
    # 3. Importance score
    importance = 0.5
    if sentiment == "difficulty":
        importance = 0.75
        # Scale up if strong qualifiers are used
        intense_qualifiers = ["really", "extremely", "very", "completely", "totally", "impossible", "terrible"]
        if any(q in words for q in intense_qualifiers):
            importance = 0.95
            
    # 4. Generate Embedding
    embedding = None
    if api_key:
        embedding = get_gemini_embedding(text, api_key)
    
    # Fallback to local bag-of-words vector if Gemini is offline/disabled
    is_dense = True
    if embedding is None:
        embedding = get_fallback_embedding(text)
        is_dense = False
        
    return {
        "topic": detected_topic,
        "sentiment": sentiment,
        "importance": importance,
        "is_dense": is_dense,
        "embedding": embedding
    }

def cosine_similarity(v1, v2):
    # Standard dot product / magnitude calculation
    if len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    mag1 = math.sqrt(sum(a**2 for a in v1))
    mag2 = math.sqrt(sum(b**2 for b in v2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)

def retrieve_memories(query_text, saved_memories, api_key=None, threshold=0.45):
    """
    Computes similarity between the query and all saved memories.
    Returns the most relevant memory matching above the similarity threshold.
    """
    if not saved_memories:
        return None
        
    # Generate query embedding
    parsed_query = parse_user_message(query_text, api_key)
    query_emb = parsed_query["embedding"]
    query_is_dense = parsed_query["is_dense"]
    
    best_match = None
    max_sim = -1.0
    
    for memory in saved_memories:
        mem_emb = memory.get("embedding")
        if not mem_emb:
            # Generate fallback on the fly if not present in stored memory
            mem_text = memory.get("text", "")
            mem_emb = get_fallback_embedding(mem_text) if not query_is_dense else get_gemini_embedding(mem_text, api_key)
            if mem_emb is None:
                mem_emb = get_fallback_embedding(mem_text)
                
        # Compare vectors (safeguard: if dimensions mismatch, use fallback)
        if len(query_emb) != len(mem_emb):
            # Regenerate query or memory to fallback representation
            q_fallback = get_fallback_embedding(query_text)
            m_fallback = get_fallback_embedding(memory.get("text", ""))
            sim = cosine_similarity(q_fallback, m_fallback)
        else:
            sim = cosine_similarity(query_emb, mem_emb)
            
        if sim > max_sim:
            max_sim = sim
            best_match = memory
            
    # Scale to percentage
    sim_percent = max_sim * 100.0
    
    if max_sim >= threshold and best_match:
        return {
            "memory": best_match,
            "similarity": round(sim_percent, 1)
        }
        
    return None

if __name__ == "__main__":
    # Test vector retriever
    parsed = parse_user_message("I really struggle with graphs and reversing pointers!")
    print("Parsed Message topic:", parsed["topic"])
    print("Parsed Message sentiment:", parsed["sentiment"])
    print("Parsed Message importance:", parsed["importance"])
    print("Embedding size:", len(parsed["embedding"]))
    
    # Test retrieval matching
    memories = [
        {"text": "User finds recursion concepts challenging.", "embedding": get_fallback_embedding("User finds recursion concepts challenging.")},
        {"text": "User is stuck on graph DFS logic.", "embedding": get_fallback_embedding("User is stuck on graph DFS logic.")}
    ]
    
    match = retrieve_memories("I am completely stuck on graph traversals", memories, threshold=0.3)
    if match:
        print("Best memory match:", match["memory"]["text"], "with similarity:", match["similarity"], "%")
    else:
        print("No match found")
