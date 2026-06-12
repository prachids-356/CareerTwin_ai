import json

# Define the topic dependency graph (prerequisites)
PREREQUISITES = {
    "Strings": ["Arrays"],
    "Linked List": ["Arrays"],
    "Hashing": ["Arrays"],
    "Recursion": ["Arrays"],
    "Trees": ["Linked List", "Recursion"],
    "Graphs": ["Trees", "Recursion"],
    "Dynamic Programming": ["Recursion", "Hashing"]
}

# Standard expected time per question in seconds by difficulty
TIME_THRESHOLDS = {
    "Easy": 90,     # 1.5 mins
    "Medium": 180,  # 3 mins
    "Hard": 300     # 5 mins
}

def analyze_gaps(attempts, current_skills=None):
    """
    Analyzes attempts and returns:
    1. Calculated mastery for each topic (0 to 100)
    2. Active weak areas (where attempts exist but mastery is low or time is high)
    3. Predicted weak areas (where prerequisites are weak)
    """
    topic_stats = {}
    
    # Process attempts to compute stats per topic
    for attempt in attempts:
        topic = attempt.get("topic")
        accuracy = attempt.get("accuracy", 0)
        time_taken = attempt.get("time_taken", 0)
        questions = attempt.get("questions_attempted", 1)
        difficulty = attempt.get("difficulty", "Medium")
        
        if questions <= 0:
            questions = 1
            
        time_per_q = time_taken / questions
        
        if topic not in topic_stats:
            topic_stats[topic] = {
                "total_accuracy": 0,
                "total_time_per_q": 0,
                "count": 0,
                "difficulties": []
            }
            
        topic_stats[topic]["total_accuracy"] += accuracy
        topic_stats[topic]["total_time_per_q"] += time_per_q
        topic_stats[topic]["count"] += 1
        topic_stats[topic]["difficulties"].append(difficulty)

    mastery = {}
    active_weak_areas = []
    
    # If custom current_skills are provided as base, start with those
    if current_skills:
        for topic, skill_val in current_skills.items():
            mastery[topic] = skill_val
            
    # Calculate actual mastery from attempts
    for topic, stats in topic_stats.items():
        count = stats["count"]
        avg_accuracy = stats["total_accuracy"] / count
        avg_time = stats["total_time_per_q"] / count
        
        # Determine average difficulty
        diff_list = stats["difficulties"]
        mode_diff = max(set(diff_list), key=diff_list.count)
        threshold_time = TIME_THRESHOLDS.get(mode_diff, 180)
        
        # Mastery is primarily accuracy, but penalized slightly if taking too long
        time_penalty = 0
        if avg_time > threshold_time:
            # Penalize up to 15% for taking double the expected time
            ratio = min(avg_time / threshold_time, 2.0) - 1.0
            time_penalty = ratio * 15
            
        topic_mastery = max(0, min(100, int(avg_accuracy - time_penalty)))
        mastery[topic] = topic_mastery
        
        # Weak if mastery is low
        if topic_mastery < 65:
            active_weak_areas.append({
                "topic": topic,
                "mastery": topic_mastery,
                "reason": "Low accuracy/performance"
            })
        elif avg_time > threshold_time * 1.5:
            active_weak_areas.append({
                "topic": topic,
                "mastery": topic_mastery,
                "reason": "Speed issue (taking too long)"
            })

    # Predict downstream gaps based on prerequisites
    predicted_gaps = []
    all_topics = ["Arrays", "Strings", "Linked List", "Hashing", "Recursion", "Trees", "Graphs", "Dynamic Programming"]
    
    for topic in all_topics:
        # Check prerequisites
        prereqs = PREREQUISITES.get(topic, [])
        for prereq in prereqs:
            prereq_mastery = mastery.get(prereq, 0)
            # If prerequisite is not attempted or mastery is weak
            if prereq not in topic_stats:
                # Prerequisite has never been attempted
                pass 
            elif prereq_mastery < 70:
                predicted_gaps.append({
                    "topic": topic,
                    "reason": f"Prerequisite '{prereq}' is weak ({prereq_mastery}%)",
                    "source_weakness": prereq
                })
                break

    return {
        "mastery": mastery,
        "active_weak_areas": active_weak_areas,
        "predicted_gaps": predicted_gaps
    }

if __name__ == "__main__":
    # Test gap predictor
    test_attempts = [
        {"topic": "Arrays", "questions_attempted": 10, "accuracy": 90, "time_taken": 400, "difficulty": "Easy"},
        {"topic": "Linked List", "questions_attempted": 5, "accuracy": 50, "time_taken": 1200, "difficulty": "Medium"},
    ]
    res = analyze_gaps(test_attempts)
    print(json.dumps(res, indent=2))
