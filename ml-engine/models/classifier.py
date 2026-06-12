import json

# Predefined learning style profiles representing the centroid of each class
# Vector order: [Theory Ratio, Practice Ratio, Video Ratio, Example Ratio]
STYLE_CENTROIDS = {
    "Practice-Oriented": [0.15, 0.60, 0.10, 0.15],
    "Theory-Oriented":   [0.55, 0.15, 0.10, 0.20],
    "Video-Oriented":    [0.10, 0.15, 0.60, 0.15],
    "Example-Oriented":  [0.15, 0.15, 0.15, 0.55]
}

def euclidean_distance(v1, v2):
    return sum((x - y) ** 2 for x, y in zip(v1, v2)) ** 0.5

def classify_style(learning_logs):
    """
    Classifies the user's learning style using a KNN-like centroid distance approach.
    Expects learning_logs: dict with keys:
      - time_spent_theory (seconds)
      - time_spent_practice (seconds)
      - time_spent_videos (seconds)
      - time_spent_examples (seconds)
      - accuracy (0-100)
    """
    t_theory = learning_logs.get("time_spent_theory", 0)
    t_practice = learning_logs.get("time_spent_practice", 0)
    t_video = learning_logs.get("time_spent_videos", 0)
    t_example = learning_logs.get("time_spent_examples", 0)
    
    total_time = t_theory + t_practice + t_video + t_example
    
    # Default to equal distribution if no time recorded yet
    if total_time <= 0:
        return {
            "learning_style": "Practice-Oriented", # default
            "confidence": 0.5,
            "distribution": {
                "Theory-Oriented": 25.0,
                "Practice-Oriented": 25.0,
                "Video-Oriented": 25.0,
                "Example-Oriented": 25.0
            }
        }
        
    # Calculate ratios
    r_theory = t_theory / total_time
    r_practice = t_practice / total_time
    r_video = t_video / total_time
    r_example = t_example / total_time
    
    user_vector = [r_theory, r_practice, r_video, r_example]
    
    # Calculate distances to centroids
    distances = {}
    for style, centroid in STYLE_CENTROIDS.items():
        distances[style] = euclidean_distance(user_vector, centroid)
        
    # Convert distances to similarity scores (inverse of distance)
    # Avoid division by zero
    similarities = {}
    for style, dist in distances.items():
        similarities[style] = 1.0 / (dist + 0.01)
        
    sum_sims = sum(similarities.values())
    
    # Calculate percentage breakdown
    distribution = {}
    for style, sim in similarities.items():
        distribution[style] = round((sim / sum_sims) * 100, 1)
        
    # Classify as the style with the highest similarity (minimum distance)
    classified_style = max(distribution, key=distribution.get)
    confidence = round(distribution[classified_style] / 100.0, 2)
    
    return {
        "learning_style": classified_style,
        "confidence": confidence,
        "distribution": distribution
    }

if __name__ == "__main__":
    # Test classifier
    logs = {
        "time_spent_theory": 200,
        "time_spent_practice": 1200,
        "time_spent_videos": 100,
        "time_spent_examples": 150,
        "accuracy": 80
    }
    res = classify_style(logs)
    print(json.dumps(res, indent=2))
