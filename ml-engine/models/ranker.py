import json

# Define learning style preference weights for each resource type
# [Video weight, Blog weight, Notes weight]
STYLE_WEIGHTS = {
    "Practice-Oriented": {"video": 0.2, "blog": 0.3, "notes": 0.5}, # Practice likes short notes/cheat sheets
    "Theory-Oriented":   {"video": 0.1, "blog": 0.6, "notes": 0.3}, # Theory likes detailed blogs
    "Video-Oriented":    {"video": 0.8, "blog": 0.1, "notes": 0.1}, # Video likes videos
    "Example-Oriented":  {"video": 0.3, "blog": 0.4, "notes": 0.3}  # Example likes detailed walkthrough blogs
}

def rank_resources(resources, learning_style, topic_success_rates=None):
    """
    Ranks resources for a given topic using the scoring formula:
      Score = w1 * Quality + w2 * StylePreference + w3 * SuccessRate
    Expects resources: list of dicts, each with keys:
      - id
      - title
      - type (video, blog, notes)
      - quality (1 to 10)
      - url
    learning_style: string (e.g. "Practice-Oriented")
    topic_success_rates: dict of resource_id -> success_rate (0.0 to 1.0)
    """
    if topic_success_rates is None:
        topic_success_rates = {}
        
    weights = STYLE_WEIGHTS.get(learning_style, {"video": 0.33, "blog": 0.33, "notes": 0.34})
    
    # Coefficients for the scoring components
    c_quality = 4.0      # max quality score = 10 * 4 = 40 points
    c_pref = 30.0        # max pref score = 0.8 * 30 = 24 points
    c_success = 36.0     # max success score = 1.0 * 36 = 36 points
    
    ranked_list = []
    
    for res in resources:
        res_id = res.get("id")
        res_type = res.get("type", "blog").lower()
        quality = res.get("quality", 5)
        
        # Get style preference weight
        pref_weight = weights.get(res_type, 0.3)
        
        # Get past success rate (defaults to 0.7 if unknown)
        success_rate = topic_success_rates.get(res_id, 0.7)
        
        # Score calculation
        quality_score = quality * c_quality
        pref_score = pref_weight * c_pref
        success_score = success_rate * c_success
        
        total_score = round(quality_score + pref_score + success_score, 1)
        
        # Add details to output for debugging and transparency
        res_copy = res.copy()
        res_copy["score"] = total_score
        res_copy["breakdown"] = {
            "quality_contribution": round(quality_score, 1),
            "preference_contribution": round(pref_score, 1),
            "success_contribution": round(success_score, 1)
        }
        ranked_list.append(res_copy)
        
    # Sort resources by total score descending
    ranked_list.sort(key=lambda x: x["score"], reverse=True)
    return ranked_list

if __name__ == "__main__":
    # Test ranker
    sample_resources = [
        {"id": "r1", "title": "Advanced Graphs DFS Video Tutorial", "type": "video", "quality": 9, "url": "http://youtube.com/graph-dfs"},
        {"id": "r2", "title": "Graph Traversals Explained Step-by-Step", "type": "blog", "quality": 8, "url": "http://medium.com/graphs-intro"},
        {"id": "r3", "title": "Graph Cheat Sheet & Summary Notes", "type": "notes", "quality": 7, "url": "http://geeksforgeeks.com/graph-notes"},
    ]
    res = rank_resources(sample_resources, "Video-Oriented")
    print(json.dumps(res, indent=2))
