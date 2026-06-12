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
    print("Starting Advanced ML Server Verification Tests...")
    
    # 1. Test Learning Curve fitting
    attempts = [
        {"accuracy": 45.0},
        {"accuracy": 58.0},
        {"accuracy": 70.0},
        {"accuracy": 78.0},
        {"accuracy": 85.0}
    ]
    curve = test_endpoint("/fit_learning_curve", {"attempts": attempts})
    if curve:
        print("  Initial Mastery fit:", curve.get("initial_mastery"))
        print("  Learning Rate:", curve.get("learning_rate"))
        print("  R-squared correlation:", curve.get("r_squared"))
        print("  Questions to target 90%:", curve.get("questions_to_target"))
        print("  Forecast coords count:", len(curve.get("forecast", [])))
        
    # 2. Test Cohort Clustering
    cohort = test_endpoint("/cluster_cohort", {
        "accuracy": 76.0,
        "practice_ratio": 0.58,
        "theory_ratio": 0.32
    })
    if cohort:
        print("  Cohort ID:", cohort.get("cohort_id"))
        print("  Cohort Name:", cohort.get("cohort_name"))
        print("  User vs Cohort Acc:", cohort["user_metrics"]["accuracy"], "vs", cohort["cohort_averages"]["accuracy"])
        print("  Centroids count:", len(cohort.get("cluster_centroids", [])))

    # 3. Test Semantic Search (Fallback mode)
    resources = [
        {"id": "r1", "title": "Advanced Graphs DFS Video Guide", "topic": "Graphs", "type": "video"},
        {"id": "r2", "title": "Reverse a Linked List Recursively", "topic": "Linked List", "type": "blog"},
        {"id": "r3", "title": "Dynamic Programming Coin Change memoization", "topic": "Dynamic Programming", "type": "notes"}
    ]
    search_res = test_endpoint("/semantic_search", {
        "resources": resources,
        "query": "recursive nodes reverse list",
        "api_key": None
    })
    if search_res:
        print("  Top semantic search match:", search_res[0]["resource"]["title"], "Score:", search_res[0]["score"])

    # 4. Test STAR NLP Parser
    behavioral_text = "When I was leading our SDE project, our server crashed under high load. I was responsible for fixing the query bottlenecks. I refactored the SQL table indices and implemented redis cache structures. The latency dropped by 60% and restored operation."
    star_res = test_endpoint("/analyze_star", {"text": behavioral_text})
    if star_res:
        print("  STAR score:", star_res.get("score"))
        print("  STAR Breakdown:", star_res.get("breakdown"))
        print("  STAR Suggestions:", star_res.get("suggestions"))
        
    print("Advanced Verification completed.")

if __name__ == "__main__":
    main()
