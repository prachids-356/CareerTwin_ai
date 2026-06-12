import re
import json

# Define semantic lexicons for the STAR phases
LEXICONS = {
    "Situation": [
        r"\b(when|during|while|project|team|company|background|context|scenario|situation|time|startup|client|customer)\b",
        r"\b(built|designed|working|developing|assigned|encountered)\b"
      ],
    "Task": [
        r"\b(task|responsibility|goal|objective|target|required|challenge|problem|issue|need|needed|assigned|had to)\b",
        r"\b(solve|fix|resolve|improve|reduce|increase|optimize)\b"
      ],
    "Action": [
        r"\b(implemented|built|wrote|created|designed|coded|refactored|optimized|debugged|analyzed|investigated|led|conducted)\b",
        r"\b(collaborated|discussed|proposed|tested|integrated|deployed|setup|configured)\b"
      ],
    "Result": [
        r"\b(result|outcome|metric|improved|saved|reduced|increased|optimized|percent|%|hours|seconds|latency|throughput)\b",
        r"\b(delivered|completed|successful|feedback|ratings|metrics|impact|consequence)\b"
      ]
}

def analyze_star_framework(text):
    """
    Parses behavioral interview answers to extract coverage of the STAR phases.
    Splits text into sentences and checks dictionary weights for S, T, A, R.
    """
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if not sentences:
        return {
            "score": 0,
            "breakdown": {"Situation": 0, "Task": 0, "Action": 0, "Result": 0},
            "suggestions": ["Please write a detailed behavioral response to analyze."]
        }
        
    # Count matches per sentence for each phase
    scores = {"Situation": 0, "Task": 0, "Action": 0, "Result": 0}
    
    for sentence in sentences:
        sentence_lower = sentence.toLowerCase() if hasattr(sentence, 'toLowerCase') else sentence.lower()
        
        # Check matches for each phase
        for phase, patterns in LEXICONS.items():
            matched = False
            for pattern in patterns:
                if re.search(pattern, sentence_lower):
                    matched = True
                    break
            if matched:
                scores[phase] += 1

    # Scale scores into percentages of total sentence coverage
    # Ensure at least 1 to avoid division by zero
    total_sentences = len(sentences)
    
    breakdown = {}
    for phase, count in scores.items():
        # Coverage percentage: cap at 100%
        pct = min(100.0, round((count / total_sentences) * 100.0, 1))
        # Ensure a minimum base if there's any match at all
        if count > 0 and pct < 20.0:
            pct = 20.0
        breakdown[phase] = pct

    # Custom NLP Suggestions
    suggestions = []
    if breakdown["Situation"] < 25:
        suggestions.append("Clarify the Situation: Detail the project context, your team role, and the scenario background.")
    if breakdown["Task"] < 20:
        suggestions.append("Define the Task: Clearly state the specific challenge, requirements, and targets you were assigned.")
    if breakdown["Action"] < 35:
        suggestions.append("Elaborate on Actions: Explain *how* you solved it—discuss specific tools, coding, refactoring, or team collaborations.")
    if breakdown["Result"] < 20:
        suggestions.append("Quantify the Result: Include concrete metrics (e.g. 'reduced latency by 30%', 'saved 10 hours of build time', 'improved test coverage to 90%').")

    if not suggestions:
        suggestions.append("Excellent structural balance! Your STAR representation is optimal.")

    # Framework Completeness Index (weighted average of coverage)
    # Action (30%), Result (30%), Situation (20%), Task (20%)
    weighted_score = (
        (breakdown["Situation"] * 0.20) + 
        (breakdown["Task"] * 0.20) + 
        (breakdown["Action"] * 0.30) + 
        (breakdown["Result"] * 0.30)
    )
    
    # Adjust score slightly based on word count
    words = len(text.split())
    length_penalty = 0
    if words < 60:
        length_penalty = 20
    elif words < 120:
        length_penalty = 10
        
    final_score = max(5, min(100, int(weighted_score - length_penalty)))

    return {
        "score": final_score,
        "breakdown": breakdown,
        "suggestions": suggestions,
        "word_count": words
    }

if __name__ == "__main__":
    # Test STAR analyzer
    test_ans = "During my last internship, our backend API was suffering from high latency. My task was to optimize the SQL queries. I implemented an indexing strategy on the user_id column and cached product tables. As a result, database response times improved by 45% and reduced CPU usage."
    res = analyze_star_framework(test_ans)
    print(json.dumps(res, indent=2))
