import urllib.request
import json
import sys

URL = "http://localhost:5005"

def test_endpoint(path, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f"{URL}{path}",
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            res_data = json.loads(res_body)
            print(f"[SUCCESS] {path} returned successfully.")
            return res_data
    except Exception as e:
        print(f"[FAIL] {path} encountered an error: {e}")
        return None

def main():
    print("==========================================================")
    print("Testing New Advanced ML/DL Model Server Endpoints...")
    print("==========================================================")

    # Mock attempts
    mock_attempts = [
        {"topic": "Arrays", "accuracy": 90.0, "time_taken": 400, "questions_attempted": 5, "difficulty": "Easy", "timestamp": "2026-06-12T01:00:00.000Z"},
        {"topic": "Linked List", "accuracy": 50.0, "time_taken": 1200, "questions_attempted": 3, "difficulty": "Medium", "timestamp": "2026-06-12T12:00:00.000Z"}
    ]

    # 1. Test Random Forest Predict Mastery
    print("\n1. Testing Random Forest Regressor (/predict_mastery)...")
    res_mastery = test_endpoint("/predict_mastery", {
        "attempts": mock_attempts
    })
    if res_mastery and "mastery" in res_mastery:
        print("   Predicted masteries:")
        for topic, m in res_mastery["mastery"].items():
            print(f"    - {topic}: {round(m, 1)}%")

    # 2. Test Forgetting Curve & Prerequisites Recommendation Ranking
    print("\n2. Testing Forgetting Curve & Prerequisite Recommendations (/get_recommendations)...")
    res_recs = test_endpoint("/get_recommendations", {
        "attempts": mock_attempts,
        "settings": {"goal": "Amazon SDE Intern", "learning_style": "Practice-Oriented"}
    })
    if res_recs:
        print("   Primary Recommendation:", res_recs.get("primary_recommendation"))
        print("   Recommendation ranking:")
        for r in res_recs.get("recommendation_list", [])[:4]:
            print(f"    - {r['topic']}: Score={r['score']} Mastery={r['mastery']}% Retention={r['retention']}% PrereqsMet={r['prereqs_met']}")

    # 3. Test Vector DB Memory Parser
    print("\n3. Testing Vector DB Memory Parsing (/parse_memory)...")
    res_parse = test_endpoint("/parse_memory", {
        "text": "I really struggle extremely hard with recursion and binary tree traversal",
        "api_key": None
    })
    if res_parse:
        print("   Detected Topic:", res_parse.get("topic"))
        print("   Detected Sentiment:", res_parse.get("sentiment"))
        print("   Calculated Importance:", res_parse.get("importance"))
        print("   Embedding dimensions:", len(res_parse.get("embedding", [])))

    # 4. Test Vector DB Memory Retriever
    print("\n4. Testing Vector DB Memory Retrieval (/retrieve_memory)...")
    saved_memories = [
        {"text": "User finds Hashing concepts challenging.", "topic": "Hashing", "embedding": [0.1] * 34},
        {"text": "User finds recursion concepts challenging.", "topic": "Recursion", "embedding": [0.2] * 34}
    ]
    # Simple query vector (must match vocab dimensionality 34)
    res_retrieve = test_endpoint("/retrieve_memory", {
        "query": "I am struggling with recursion functions",
        "memories": saved_memories,
        "threshold": 0.3
    })
    if res_retrieve:
        print("   Retrieved Memory match:", res_retrieve.get("memory", {}).get("text"))
        print("   Similarity match score:", res_retrieve.get("similarity"), "%")
    else:
        print("   No memory retrieved.")

    # 5. Test Updated K-Means Clustering (4 features)
    print("\n5. Testing Updated K-Means Cohorts (/cluster_cohort)...")
    res_cohort = test_endpoint("/cluster_cohort", {
        "accuracy": 78.0,
        "practice_ratio": 0.55,
        "reading_ratio": 0.25,
        "video_ratio": 0.20
    })
    if res_cohort:
        print("   Assigned Cohort Name:", res_cohort.get("cohort_name"))
        print("   Cluster Stability Metric:", res_cohort.get("cluster_stability"), "%")
        print("   Centroids table sample:")
        for c in res_cohort.get("cluster_centroids", []):
            print(f"    - Centroid {c['cohort_id']} ({c['name']}): Accuracy={c['accuracy']}% Practice={round(c['practice_ratio']*100)}% Reading={round(c['reading_ratio']*100)}%")

    print("\nAdvanced Verification Completed successfully.")
    print("==========================================================")

if __name__ == "__main__":
    main()
