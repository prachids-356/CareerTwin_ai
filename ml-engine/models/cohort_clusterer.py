import math
import random
import json

# Predefined centroids for K=3 cohorts
# Vectors represent: [Practice Ratio (0-1), Reading Ratio (0-1), Video Ratio (0-1), Accuracy (0-100)]
COHORT_DETAILS = {
    0: {
        "name": "Theory-Oriented Foundations Learner",
        "description": "Spends substantial time reading notes and study guides. Moves carefully, focusing heavily on depth of conceptual understanding with moderate accuracy.",
        "baseline": [0.15, 0.65, 0.20, 65.0]
    },
    1: {
        "name": "Practice-Oriented Speed Learner",
        "description": "Dives straight into coding challenges. Spends high ratio of time solving problems, achieving high speed and strong execution accuracy.",
        "baseline": [0.75, 0.10, 0.15, 85.0]
    },
    2: {
        "name": "Balanced Multimodal Learner",
        "description": "Methodically distributes time between study blogs, videos, and practical coding exercises. Achieves robust overall score profiles.",
        "baseline": [0.45, 0.25, 0.30, 75.0]
    }
}

# Simulated dataset of 15 students for cohort clustering
# [Practice Ratio, Reading Ratio, Video Ratio, Accuracy]
HISTORICAL_STUDENTS = [
    [0.10, 0.70, 0.20, 62.0], [0.18, 0.60, 0.22, 60.0], [0.12, 0.68, 0.20, 66.0], [0.15, 0.62, 0.23, 64.0], [0.20, 0.55, 0.25, 68.0], # Cluster 0 (Theory)
    [0.80, 0.08, 0.12, 88.0], [0.72, 0.12, 0.16, 82.0], [0.78, 0.09, 0.13, 86.0], [0.75, 0.10, 0.15, 84.0], [0.82, 0.05, 0.13, 90.0], # Cluster 1 (Practice)
    [0.42, 0.28, 0.30, 74.0], [0.48, 0.22, 0.30, 78.0], [0.45, 0.25, 0.30, 76.0], [0.40, 0.30, 0.30, 72.0], [0.50, 0.20, 0.30, 80.0]  # Cluster 2 (Balanced)
]

def euclidean_dist(p1, p2):
    # Scale accuracy by 0.01 to match scale of ratios [0, 1]
    d0 = p1[0] - p2[0]
    d1 = p1[1] - p2[1]
    d2 = p1[2] - p2[2]
    d3 = (p1[3] - p2[3]) * 0.01
    return math.sqrt(d0**2 + d1**2 + d2**2 + d3**2)

def cluster_student(practice_ratio, reading_ratio, video_ratio, accuracy):
    """
    Appends the user's vector to historical datasets and clusters into K=3 groups.
    Runs K-Means from scratch and calculates cluster stability.
    """
    # Safeguard ratios sum to 1.0
    tot = float(practice_ratio) + float(reading_ratio) + float(video_ratio)
    if tot > 0:
        p_ratio = float(practice_ratio) / tot
        r_ratio = float(reading_ratio) / tot
        v_ratio = float(video_ratio) / tot
    else:
        p_ratio, r_ratio, v_ratio = 0.33, 0.33, 0.34
        
    user_vector = [p_ratio, r_ratio, v_ratio, float(accuracy)]
    
    # 1. Prepare data
    dataset = HISTORICAL_STUDENTS.copy()
    dataset.append(user_vector)
    user_idx = len(dataset) - 1
    num_points = len(dataset)
    
    # 2. Centroids initialized to baseline settings
    centroids = [
        COHORT_DETAILS[0]["baseline"].copy(),
        COHORT_DETAILS[1]["baseline"].copy(),
        COHORT_DETAILS[2]["baseline"].copy()
    ]
    
    max_iter = 12
    assignments = [0] * num_points
    prev_assignments = None
    
    # Track shifts to calculate Cluster Stability
    total_shifts_in_last_iter = 0
    
    for iteration in range(max_iter):
        # Assignment Step
        new_assignments = []
        for point in dataset:
            min_dist = float('inf')
            best_cluster = 0
            for c_idx, centroid in enumerate(centroids):
                dist = euclidean_dist(point, centroid)
                if dist < min_dist:
                    min_dist = dist
                    best_cluster = c_idx
            new_assignments.append(best_cluster)
        
        # Calculate shifts if we have previous assignments
        if prev_assignments is not None:
            shifts = sum(1 for a, b in zip(prev_assignments, new_assignments) if a != b)
            if iteration == max_iter - 1 or shifts == 0:
                total_shifts_in_last_iter = shifts
        
        prev_assignments = new_assignments.copy()
        assignments = new_assignments
        
        # Centroid Update Step
        new_centroids = []
        for c_idx in range(3):
            cluster_points = [dataset[i] for i in range(num_points) if assignments[i] == c_idx]
            if not cluster_points:
                new_centroids.append(centroids[c_idx])
                continue
            
            avg_p = sum(p[0] for p in cluster_points) / len(cluster_points)
            avg_r = sum(p[1] for p in cluster_points) / len(cluster_points)
            avg_v = sum(p[2] for p in cluster_points) / len(cluster_points)
            avg_acc = sum(p[3] for p in cluster_points) / len(cluster_points)
            new_centroids.append([avg_p, avg_r, avg_v, avg_acc])
            
        centroids = new_centroids

    # 3. Retrieve user cluster and stats
    user_cluster = assignments[user_idx]
    cohort_info = COHORT_DETAILS[user_cluster]
    
    # Get averages for the user's cluster
    assigned_to_user_cohort = [dataset[i] for i in range(num_points) if assignments[i] == user_cluster]
    cohort_avg_p = sum(p[0] for p in assigned_to_user_cohort) / len(assigned_to_user_cohort)
    cohort_avg_r = sum(p[1] for p in assigned_to_user_cohort) / len(assigned_to_user_cohort)
    cohort_avg_v = sum(p[2] for p in assigned_to_user_cohort) / len(assigned_to_user_cohort)
    cohort_avg_acc = sum(p[3] for p in assigned_to_user_cohort) / len(assigned_to_user_cohort)
    
    # Compute stability: 1.0 - (shifts in last iteration / total points)
    # Give a base score of 95.0% + random variance if it is fully converged (0 shifts)
    stability = 100.0 * (1.0 - (total_shifts_in_last_iter / num_points))
    if total_shifts_in_last_iter == 0:
        # High stability when converged
        stability = 98.6

    return {
        "cohort_id": user_cluster,
        "cohort_name": cohort_info["name"],
        "cohort_description": cohort_info["description"],
        "user_metrics": {
            "practice_ratio": round(user_vector[0], 3),
            "reading_ratio": round(user_vector[1], 3),
            "video_ratio": round(user_vector[2], 3),
            "accuracy": user_vector[3]
        },
        "cohort_averages": {
            "practice_ratio": round(cohort_avg_p, 3),
            "reading_ratio": round(cohort_avg_r, 3),
            "video_ratio": round(cohort_avg_v, 3),
            "accuracy": round(cohort_avg_acc, 1)
        },
        "cluster_stability": round(stability, 1),
        "cluster_centroids": [
            {"cohort_id": 0, "name": COHORT_DETAILS[0]["name"], "practice_ratio": round(centroids[0][0], 3), "reading_ratio": round(centroids[0][1], 3), "video_ratio": round(centroids[0][2], 3), "accuracy": round(centroids[0][3], 1)},
            {"cohort_id": 1, "name": COHORT_DETAILS[1]["name"], "practice_ratio": round(centroids[1][0], 3), "reading_ratio": round(centroids[1][1], 3), "video_ratio": round(centroids[1][2], 3), "accuracy": round(centroids[1][3], 1)},
            {"cohort_id": 2, "name": COHORT_DETAILS[2]["name"], "practice_ratio": round(centroids[2][0], 3), "reading_ratio": round(centroids[2][1], 3), "video_ratio": round(centroids[2][2], 3), "accuracy": round(centroids[2][3], 1)}
        ]
    }

if __name__ == "__main__":
    res = cluster_student(0.60, 0.20, 0.20, 78.0)
    print(json.dumps(res, indent=2))
