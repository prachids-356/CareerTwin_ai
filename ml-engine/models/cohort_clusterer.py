import math
import random
import json

# Predefined centroids for K=3 cohorts
# Vectors: [Accuracy (0-100), Practice Ratio (0-1), Theory Ratio (0-1)]
COHORT_DETAILS = {
    0: {
        "name": "Foundations-Focused Grit Learners",
        "description": "Spend substantial time on reading notes and theory, progressing carefully with moderate accuracy. Excellent foundational retention.",
        "baseline": [62.0, 0.25, 0.55]
    },
    1: {
        "name": "Fast-Paced Practical Learners",
        "description": "Dive straight into coding. High practice ratio, high speed, and high accuracy. Highly effective for coding sprints.",
        "baseline": [88.0, 0.75, 0.15]
    },
    2: {
        "name": "Balanced Example Builders",
        "description": "Evenly split time between study blogs and code exercises. Methodical problem solvers who utilize walkthroughs.",
        "baseline": [74.0, 0.45, 0.35]
    }
}

# Simulated dataset of 15 active students for clustering
HISTORICAL_STUDENTS = [
    [58, 0.20, 0.60], [60, 0.30, 0.50], [65, 0.22, 0.58], [63, 0.28, 0.52], [61, 0.24, 0.56], # Cohort 0
    [85, 0.80, 0.10], [90, 0.72, 0.18], [92, 0.78, 0.12], [86, 0.74, 0.16], [89, 0.82, 0.08], # Cohort 1
    [72, 0.40, 0.40], [75, 0.50, 0.30], [78, 0.46, 0.34], [70, 0.42, 0.38], [76, 0.48, 0.32]  # Cohort 2
]

def euclidean_dist(p1, p2):
    # Scale accuracy by 0.01 to match ratios (0-1 scale)
    d0 = (p1[0] - p2[0]) * 0.01
    d1 = p1[1] - p2[1]
    d2 = p1[2] - p2[2]
    return math.sqrt(d0**2 + d1**2 + d2**2)

def cluster_student(user_accuracy, practice_ratio, theory_ratio):
    """
    Appends the user's vector to historical datasets and clusters into K=3 groups.
    Runs K-Means from scratch.
    """
    user_vector = [float(user_accuracy), float(practice_ratio), float(theory_ratio)]
    
    # 1. Prepare data (historical + current user as last element)
    dataset = HISTORICAL_STUDENTS.copy()
    dataset.append(user_vector)
    user_idx = len(dataset) - 1
    
    # 2. Initialize centroids to the baselines of the cohorts
    centroids = [COHORT_DETAILS[0]["baseline"], COHORT_DETAILS[1]["baseline"], COHORT_DETAILS[2]["baseline"]]
    
    max_iter = 15
    assignments = [0] * len(dataset)
    
    for _ in range(max_iter):
        # Assignment step
        for i, point in enumerate(dataset):
            min_dist = float('inf')
            best_cluster = 0
            for c_idx, centroid in enumerate(centroids):
                dist = euclidean_dist(point, centroid)
                if dist < min_dist:
                    min_dist = dist
                    best_cluster = c_idx
            assignments[i] = best_cluster
            
        # Update step
        new_centroids = []
        for c_idx in range(3):
            cluster_points = [dataset[i] for i in range(len(dataset)) if assignments[i] == c_idx]
            if not cluster_points:
                # Keep original if empty
                new_centroids.append(centroids[c_idx])
                continue
                
            avg_acc = sum(p[0] for p in cluster_points) / len(cluster_points)
            avg_prac = sum(p[1] for p in cluster_points) / len(cluster_points)
            avg_theo = sum(p[2] for p in cluster_points) / len(cluster_points)
            new_centroids.append([avg_acc, avg_prac, avg_theo])
            
        centroids = new_centroids

    # 3. Retrieve user cluster and stats
    user_cluster = assignments[user_idx]
    cohort_info = COHORT_DETAILS[user_cluster]
    
    # Get averages for the user's cluster
    assigned_to_user_cohort = [dataset[i] for i in range(len(dataset)) if assignments[i] == user_cluster]
    cohort_avg_acc = sum(p[0] for p in assigned_to_user_cohort) / len(assigned_to_user_cohort)
    cohort_avg_prac = sum(p[1] for p in assigned_to_user_cohort) / len(assigned_to_user_cohort)
    cohort_avg_theo = sum(p[2] for p in assigned_to_user_cohort) / len(assigned_to_user_cohort)
    
    return {
        "cohort_id": user_cluster,
        "cohort_name": cohort_info["name"],
        "cohort_description": cohort_info["description"],
        "user_metrics": {
            "accuracy": user_vector[0],
            "practice_ratio": round(user_vector[1], 3),
            "theory_ratio": round(user_vector[2], 3)
        },
        "cohort_averages": {
            "accuracy": round(cohort_avg_acc, 1),
            "practice_ratio": round(cohort_avg_prac, 3),
            "theory_ratio": round(cohort_avg_theo, 3)
        },
        "cluster_centroids": [
            {"cohort_id": 0, "name": COHORT_DETAILS[0]["name"], "accuracy": round(centroids[0][0], 1), "practice_ratio": round(centroids[0][1], 3)},
            {"cohort_id": 1, "name": COHORT_DETAILS[1]["name"], "accuracy": round(centroids[1][0], 1), "practice_ratio": round(centroids[1][1], 3)},
            {"cohort_id": 2, "name": COHORT_DETAILS[2]["name"], "accuracy": round(centroids[2][0], 1), "practice_ratio": round(centroids[2][1], 3)}
        ]
    }

if __name__ == "__main__":
    # Test clusterer
    res = cluster_student(75.0, 0.60, 0.20)
    print(json.dumps(res, indent=2))
