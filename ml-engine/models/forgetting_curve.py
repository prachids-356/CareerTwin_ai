import math
import time
import json
from models.regressor import get_trained_predictor

# Prerequisite dependency graph
PREREQUISITES = {
    "Strings": ["Arrays"],
    "Linked List": ["Arrays"],
    "Hashing": ["Arrays"],
    "Recursion": ["Arrays"],
    "Trees": ["Linked List", "Recursion"],
    "Graphs": ["Trees", "Recursion"],
    "Dynamic Programming": ["Recursion", "Hashing"]
}

ALL_TOPICS = ["Arrays", "Strings", "Linked List", "Hashing", "Recursion", "Trees", "Graphs", "Dynamic Programming"]

def calculate_retention(last_attempt_timestamp, attempts, avg_accuracy):
    """
    Computes percentage retention using the Ebbinghaus Forgetting Curve formula:
    R = 100 * e^(-t / S)
    where:
    - t is the time elapsed in hours since the last attempt.
    - S is the memory strength factor.
    """
    if last_attempt_timestamp is None or attempts == 0:
        return 0.0, float('inf') # No memory trace, infinite elapsed time
    
    # Calculate elapsed hours
    try:
        if isinstance(last_attempt_timestamp, (int, float)):
            elapsed_seconds = time.time() - last_attempt_timestamp
        else:
            # Parse ISO timestamp
            # Remove Z or replace offset for ISO parsing if needed
            ts_str = str(last_attempt_timestamp).replace('Z', '+00:00')
            # Fallback to simple parse or just mock elapsed time if parsing fails
            # In our backend database we store ISO strings. 
            # To handle parsing robustly:
            import datetime
            dt = datetime.datetime.fromisoformat(ts_str)
            elapsed_seconds = (datetime.datetime.now(datetime.timezone.utc) - dt).total_seconds()
    except Exception as e:
        # Fallback to 24 hours elapsed for safety if parsing fails
        elapsed_seconds = 24 * 3600

    elapsed_hours = max(0.0, elapsed_seconds / 3600.0)
    
    # Calculate memory strength S:
    # S scales with more attempts and higher accuracy
    strength = 12.0 + attempts * (6.0 + (avg_accuracy * 0.12))
    
    # Ebbinghaus calculation
    retention = 100.0 * math.exp(-elapsed_hours / strength)
    return max(0.0, min(100.0, retention)), elapsed_hours

def get_recommendation_ranking(attempts_list, user_settings={}):
    """
    Ranks all topics based on:
    1. Weakness (100 - Mastery)
    2. Retention (100 - Retention%)
    3. Time since revision (rewarding revision gaps)
    4. Prerequisites check (setting heavy penalty if prerequisites are weak or unattempted)
    """
    # 1. Parse attempts to get stats per topic
    topic_attempts = {}
    for att in attempts_list:
        topic = att.get("topic")
        if topic not in ALL_TOPICS:
            continue
        acc = att.get("accuracy", 0)
        time_taken = att.get("time_taken", 0)
        q_count = att.get("questions_attempted", 1)
        diff_str = att.get("difficulty", "Medium")
        ts = att.get("timestamp") or att.get("createdAt")
        
        if topic not in topic_attempts:
            topic_attempts[topic] = {
                "acc_sum": 0, "time_sum": 0, "q_count": 0,
                "diff_list": [], "timestamps": []
            }
        topic_attempts[topic]["acc_sum"] += acc
        topic_attempts[topic]["time_sum"] += time_taken
        topic_attempts[topic]["q_count"] += q_count
        topic_attempts[topic]["diff_list"].append(diff_str)
        if ts:
            topic_attempts[topic]["timestamps"].append(ts)

    # Train Random Forest on current user attempts
    forest = get_trained_predictor(attempts_list)
    
    # Compute mastery for all topics
    mastery = {}
    retentions = {}
    elapsed_times = {}
    
    for topic in ALL_TOPICS:
        if topic in topic_attempts:
            stats = topic_attempts[topic]
            avg_acc = stats["acc_sum"] / max(1, stats["q_count"])
            avg_time = stats["time_sum"]
            total_attempts = stats["q_count"]
            diff_list = stats["diff_list"]
            mode_diff = max(set(diff_list), key=diff_list.count)
            mode_diff_num = {"Easy": 1, "Medium": 2, "Hard": 3}.get(mode_diff, 2)
            
            # Predict mastery using Random Forest
            features = [[ALL_TOPICS.index(topic), total_attempts, avg_acc, avg_time, mode_diff_num]]
            pred_mastery = forest.predict(features)[0]
            mastery[topic] = max(0.0, min(100.0, pred_mastery))
            
            # Calculate retention
            last_ts = sorted(stats["timestamps"])[-1] if stats["timestamps"] else None
            ret, elapsed = calculate_retention(last_ts, total_attempts, avg_acc)
            retentions[topic] = ret
            elapsed_times[topic] = elapsed
        else:
            # Topic has never been attempted
            mastery[topic] = 0.0
            retentions[topic] = 0.0
            elapsed_times[topic] = float('inf')

    # Calculate recommendation scores
    recommendations = []
    
    for topic in ALL_TOPICS:
        m = mastery[topic]
        r = retentions[topic]
        elapsed = elapsed_times[topic]
        
        # Check prerequisites
        prereqs = PREREQUISITES.get(topic, [])
        prereqs_met = True
        prereq_details = []
        
        for prereq in prereqs:
            prereq_mastery = mastery.get(prereq, 0.0)
            if prereq not in topic_attempts:
                prereqs_met = False
                prereq_details.append(f"Prerequisite '{prereq}' is not attempted")
            elif prereq_mastery < 68.0:
                prereqs_met = False
                prereq_details.append(f"Prerequisite '{prereq}' is weak ({round(prereq_mastery, 1)}%)")
        
        # Scoring components
        weakness_comp = 100.0 - m
        forgetting_comp = 100.0 - r
        
        # Time since revision score: caps at 72 hours, scaled to 100 max
        if elapsed == float('inf'):
            time_comp = 100.0
        else:
            time_comp = min(100.0, elapsed * 1.38) # ~72 hours = 100 points
            
        # Core score formula
        # Weights: 40% Weakness, 40% Retention, 20% Time Elapsed
        core_score = (0.40 * weakness_comp) + (0.40 * forgetting_comp) + (0.20 * time_comp)
        
        # Apply massive prerequisite penalty if blocked
        prereq_penalty = 0.0
        if not prereqs_met:
            prereq_penalty = 500.0
            
        final_score = core_score - prereq_penalty
        
        # Revision suggested if mastery was decent (>=60) but retention has decayed (<50)
        revision_suggested = (m >= 60.0 and r < 50.0)
        
        recommendations.append({
            "topic": topic,
            "mastery": round(m, 1),
            "retention": round(r, 1),
            "elapsed_hours": None if elapsed == float('inf') else round(elapsed, 1),
            "prereqs_met": prereqs_met,
            "prereq_issues": prereq_details,
            "score": round(final_score, 1),
            "revision_suggested": revision_suggested
        })

    # Sort topics by score desc
    sorted_recs = sorted(recommendations, key=lambda x: x["score"], reverse=True)
    
    # Primary recommendation is the top topic
    primary_topic = sorted_recs[0]["topic"] if sorted_recs else "Arrays"
    
    return {
        "primary_recommendation": primary_topic,
        "recommendation_list": sorted_recs,
        "all_mastery": {r["topic"]: r["mastery"] for r in sorted_recs}
    }

if __name__ == "__main__":
    # Test Ebbinghaus recommendation logic
    test_attempts = [
        {"topic": "Arrays", "questions_attempted": 5, "accuracy": 80.0, "time_taken": 450, "difficulty": "Easy", "timestamp": "2026-06-12T01:00:00.000Z"},
        {"topic": "Linked List", "questions_attempted": 3, "accuracy": 50.0, "time_taken": 900, "difficulty": "Medium", "timestamp": "2026-06-12T12:00:00.000Z"}
    ]
    res = get_recommendation_ranking(test_attempts)
    print("Primary recommendation:", res["primary_recommendation"])
    print("Recommendation list summary:")
    for item in res["recommendation_list"][:4]:
        print(f" - {item['topic']}: score={item['score']} mastery={item['mastery']}% retention={item['retention']}% prereqs_met={item['prereqs_met']}")
