import json
import math

# Target profiles for different career goals
GOAL_PROFILES = {
    "Amazon SDE Intern": {
        "Arrays": 90,
        "Strings": 85,
        "Linked List": 80,
        "Hashing": 85,
        "Recursion": 80,
        "Trees": 80,
        "Graphs": 75,
        "Dynamic Programming": 70
    },
    "Backend Engineer": {
        "Arrays": 80,
        "Strings": 75,
        "Linked List": 60,
        "Hashing": 90,
        "Recursion": 70,
        "Trees": 70,
        "Graphs": 70,
        "Dynamic Programming": 60
    },
    "Fullstack Developer": {
        "Arrays": 80,
        "Strings": 80,
        "Linked List": 60,
        "Hashing": 80,
        "Recursion": 60,
        "Trees": 50,
        "Graphs": 50,
        "Dynamic Programming": 40
    }
}

# Simulated database of past students for Collaborative Filtering / KNN
# Each student profile has mastery levels across topics and the action that helped them improve
SIMULATED_STUDENTS = [
    {
        "id": "s1",
        "skills": {"Arrays": 85, "Strings": 80, "Linked List": 75, "Hashing": 80, "Recursion": 50, "Trees": 30, "Graphs": 20, "Dynamic Programming": 10},
        "next_successful_action": "Do 10 Recursion Questions (Medium)"
    },
    {
        "id": "s2",
        "skills": {"Arrays": 90, "Strings": 85, "Linked List": 80, "Hashing": 85, "Recursion": 80, "Trees": 40, "Graphs": 30, "Dynamic Programming": 20},
        "next_successful_action": "Practice 8 Binary Tree Questions"
    },
    {
        "id": "s3",
        "skills": {"Arrays": 50, "Strings": 40, "Linked List": 30, "Hashing": 20, "Recursion": 20, "Trees": 10, "Graphs": 10, "Dynamic Programming": 10},
        "next_successful_action": "Review Array Basics & 15 Easy Questions"
    },
    {
        "id": "s4",
        "skills": {"Arrays": 95, "Strings": 90, "Linked List": 85, "Hashing": 90, "Recursion": 85, "Trees": 80, "Graphs": 75, "Dynamic Programming": 40},
        "next_successful_action": "Study Dynamic Programming Knapsack pattern"
    },
    {
        "id": "s5",
        "skills": {"Arrays": 80, "Strings": 80, "Linked List": 70, "Hashing": 50, "Recursion": 60, "Trees": 30, "Graphs": 20, "Dynamic Programming": 10},
        "next_successful_action": "Solve 10 Hashing/HashMap Questions"
    }
]

def dot_product(v1, v2):
    return sum(v1.get(k, 0) * v2.get(k, 0) for k in v1 if k in v2)

def magnitude(v):
    return math.sqrt(sum(val ** 2 for val in v.values()))

def cosine_similarity(v1, v2):
    mag1 = magnitude(v1)
    mag2 = magnitude(v2)
    if mag1 == 0 or mag2 == 0:
        return 0
    return dot_product(v1, v2) / (mag1 * mag2)

def recommend_next(user_skills, goal, learning_style="Practice-Oriented"):
    """
    Combines:
    1. Cosine similarity to the target goal profile to find gaps.
    2. KNN (nearest neighbors) collaborative filtering based on simulated students.
    Returns recommended topics and specific learning actions.
    """
    # 1. Cosine Similarity to Goal Target
    target = GOAL_PROFILES.get(goal, GOAL_PROFILES["Amazon SDE Intern"])
    sim_to_goal = cosine_similarity(user_skills, target)
    
    # Calculate gap score for each topic (Target - User)
    gaps = {}
    for topic, target_val in target.items():
        user_val = user_skills.get(topic, 0)
        gaps[topic] = max(0, target_val - user_val)
        
    # Sort topics by gap size
    sorted_gaps = sorted(gaps.items(), key=lambda x: x[1], reverse=True)
    top_gaps = [topic for topic, gap in sorted_gaps if gap > 0]
    
    # 2. KNN (Collaborative Filtering)
    # Find the most similar student
    best_student = None
    max_sim = -1
    
    for student in SIMULATED_STUDENTS:
        sim = cosine_similarity(user_skills, student["skills"])
        if sim > max_sim:
            max_sim = sim
            best_student = student
            
    knn_recommendation = "Practice Graphs traversal (BFS/DFS)"
    if best_student:
        knn_recommendation = best_student["next_successful_action"]
        
    # Build personalized suggestions based on learning style
    primary_gap_topic = top_gaps[0] if top_gaps else "Arrays"
    
    style_actions = {
        "Practice-Oriented": f"Do 10 {primary_gap_topic} questions of Medium difficulty",
        "Theory-Oriented": f"Read notes and tutorials on the core concepts of {primary_gap_topic}",
        "Video-Oriented": f"Watch top-rated YouTube video tutorials explaining {primary_gap_topic}",
        "Example-Oriented": f"Study 5 step-by-step code walkthroughs for {primary_gap_topic}"
    }
    
    style_recommendation = style_actions.get(learning_style, style_actions["Practice-Oriented"])
    
    return {
        "similarity_to_goal": round(sim_to_goal * 100, 1),
        "gap_analysis": gaps,
        "primary_recommendation": primary_gap_topic,
        "style_recommendation": style_recommendation,
        "collaborative_recommendation": knn_recommendation,
        "priority_list": top_gaps[:3]
    }

if __name__ == "__main__":
    # Test recommender
    skills = {"Arrays": 85, "Strings": 75, "Linked List": 50, "Hashing": 20, "Recursion": 30, "Trees": 10}
    res = recommend_next(skills, "Amazon SDE Intern", "Practice-Oriented")
    print(json.dumps(res, indent=2))
