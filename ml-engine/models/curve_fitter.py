import math
import json

def fit_learning_curve(attempts):
    """
    Fits student attempts to an exponential learning curve:
      Mastery(t) = 100 - (100 - M_0) * e^(-k * t)
    Using log-linearized Least Squares regression.
    
    attempts: list of dicts with key 'accuracy' (0 to 100).
    Returns fit parameters, R-squared, and forecast coordinates.
    """
    n = len(attempts)
    
    # If insufficient attempts, return a healthy default baseline projection
    if n < 3:
        # Default starting mastery based on first attempt or 50%
        m0 = attempts[0].get("accuracy", 50.0) if n > 0 else 50.0
        k = 0.15 # Default moderate learning rate
        
        forecast = []
        for t in range(12):
            val = 100.0 - (100.0 - m0) * math.exp(-k * t)
            forecast.append({"attempt_num": t + 1, "accuracy": round(val, 1)})
            
        # Solves for 90% target: 90 = 100 - (100-m0)*e^(-k*t)
        questions_needed = max(0, math.ceil((math.log(100.0 - m0) - math.log(10.0)) / k)) if m0 < 90 else 0
        
        return {
            "initial_mastery": round(m0, 1),
            "learning_rate": k,
            "r_squared": 1.0,
            "questions_to_target": questions_needed,
            "forecast": forecast,
            "is_default": True
        }

    # Extract x (attempt index starting at 0) and y (accuracy)
    x_coords = list(range(n))
    y_coords = [a.get("accuracy", 50.0) for a in attempts]
    
    # Transform y to linear space: ln(100 - y + epsilon)
    # Epsilon = 1.0 to avoid ln(0) if accuracy is 100%
    eps = 1.0
    y_trans = []
    for y in y_coords:
        diff = 100.0 - y
        if diff < 0:
            diff = 0
        y_trans.append(math.log(diff + eps))

    # Standard Linear Regression variables: y_trans = a + b * x
    sum_x = sum(x_coords)
    sum_y = sum(y_trans)
    sum_xx = sum(x ** 2 for x in x_coords)
    sum_xy = sum(x * y for x, y in zip(x_coords, y_trans))
    
    denominator = (n * sum_xx) - (sum_x ** 2)
    
    # Check for flat line accuracy (denominator is 0 or all accuracy identical)
    if denominator == 0 or len(set(y_coords)) == 1:
        m0 = y_coords[0]
        k = 0.08 if m0 < 90 else 0.02
        r2 = 1.0
    else:
        # Slope (b) and intercept (a)
        b = (n * sum_xy - sum_x * sum_y) / denominator
        a = (sum_y - b * sum_x) / n
        
        # Convert back to exponential terms
        # y_trans = a + b * x  ===>  100 - Y + eps = e^(a + b*x)
        # Therefore: M0 = 100 - e^a, and k = -b
        m0 = max(0.0, min(99.0, 100.0 - math.exp(a)))
        
        # Constraint: k must be positive (accuracy increases over time)
        # If b is positive (accuracy decreasing), set a small positive default learning rate
        k = max(0.01, -b)
        
        # Calculate R-squared (coefficient of determination)
        y_mean = sum(y_trans) / n
        total_ss = sum((y - y_mean) ** 2 for y in y_trans)
        residual_ss = sum((y - (a + b * x)) ** 2 for x, y in zip(x_coords, y_trans))
        r2 = round(1.0 - (residual_ss / total_ss), 3) if total_ss > 0 else 1.0

    # Generate forecast coordinates up to index n + 5 (minimum 10 points)
    max_forecast_pts = max(10, n + 5)
    forecast = []
    for t in range(max_forecast_pts):
        val = 100.0 - (100.0 - m0) * math.exp(-k * t)
        forecast.append({"attempt_num": t + 1, "accuracy": round(val, 1)})

    # Calculate steps needed to reach 90% accuracy
    if m0 >= 90:
        questions_needed = 0
    else:
        try:
            questions_needed = max(0, math.ceil((math.log(100.0 - m0) - math.log(10.0)) / k))
            # Subtract steps already completed
            questions_needed = max(0, questions_needed - n)
        except Exception:
            questions_needed = 0

    return {
        "initial_mastery": round(m0, 1),
        "learning_rate": round(k, 4),
        "r_squared": r2,
        "questions_to_target": questions_needed,
        "forecast": forecast,
        "is_default": False
    }

if __name__ == "__main__":
    # Test curve fitting
    test_attempts = [
        {"accuracy": 40.0},
        {"accuracy": 55.0},
        {"accuracy": 68.0},
        {"accuracy": 76.0},
        {"accuracy": 82.0}
    ]
    res = fit_learning_curve(test_attempts)
    print(json.dumps(res, indent=2))
