import math
import random

class Node:
    def __init__(self, feature=None, threshold=None, left=None, right=None, value=None):
        self.feature = feature       # index of feature to split on
        self.threshold = threshold   # threshold value for split
        self.left = left             # left child node
        self.right = right           # right child node
        self.value = value           # value if it is a leaf node

class DecisionTreeRegressor:
    def __init__(self, max_depth=5, min_samples_split=2):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.root = None

    def fit(self, X, y):
        self.root = self._build_tree(X, y, depth=0)

    def _build_tree(self, X, y, depth):
        num_samples = len(X)
        if num_samples == 0:
            return Node(value=0.0)

        mean_val = sum(y) / num_samples

        # Stop splitting if depth limit reached, sample count is too low, or y has no variance
        if depth >= self.max_depth or num_samples < self.min_samples_split or len(set(y)) == 1:
            return Node(value=mean_val)

        best_feat, best_thresh = None, None
        best_variance = float('inf')

        num_features = len(X[0])

        for feat in range(num_features):
            # Sort feature values to evaluate splits
            values = sorted(list(set(row[feat] for row in X)))
            # Try midpoints between successive values as split candidates
            split_candidates = []
            if len(values) > 1:
                for i in range(len(values) - 1):
                    split_candidates.append((values[i] + values[i+1]) / 2.0)
            else:
                split_candidates = values

            for thresh in split_candidates:
                left_idx = [i for i in range(num_samples) if X[i][feat] <= thresh]
                right_idx = [i for i in range(num_samples) if X[i][feat] > thresh]

                if len(left_idx) < 1 or len(right_idx) < 1:
                    continue

                y_left = [y[i] for i in left_idx]
                y_right = [y[i] for i in right_idx]

                mean_l = sum(y_left) / len(y_left)
                mean_r = sum(y_right) / len(y_right)

                var_l = sum((val - mean_l) ** 2 for val in y_left)
                var_r = sum((val - mean_r) ** 2 for val in y_right)
                total_var = var_l + var_r

                if total_var < best_variance:
                    best_variance = total_var
                    best_feat = feat
                    best_thresh = thresh

        # If no split gives reduction, return leaf
        if best_feat is None:
            return Node(value=mean_val)

        left_idx = [i for i in range(num_samples) if X[i][best_feat] <= best_thresh]
        right_idx = [i for i in range(num_samples) if X[i][best_feat] > best_thresh]

        left_child = self._build_tree([X[i] for i in left_idx], [y[i] for i in left_idx], depth + 1)
        right_child = self._build_tree([X[i] for i in right_idx], [y[i] for i in right_idx], depth + 1)

        return Node(feature=best_feat, threshold=best_thresh, left=left_child, right=right_child)

    def predict(self, X):
        return [self._predict_one(row, self.root) for row in X]

    def _predict_one(self, row, node):
        if node.value is not None:
            return node.value
        if row[node.feature] <= node.threshold:
            return self._predict_one(row, node.left)
        else:
            return self._predict_one(row, node.right)

class RandomForestRegressor:
    def __init__(self, n_estimators=10, max_depth=5, min_samples_split=2):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.trees = []

    def fit(self, X, y):
        self.trees = []
        n_samples = len(X)
        if n_samples == 0:
            return
        
        for _ in range(self.n_estimators):
            # Bootstrapped indices
            boot_idx = [random.randint(0, n_samples - 1) for _ in range(n_samples)]
            X_boot = [X[i] for i in boot_idx]
            y_boot = [y[i] for i in boot_idx]

            tree = DecisionTreeRegressor(max_depth=self.max_depth, min_samples_split=self.min_samples_split)
            tree.fit(X_boot, y_boot)
            self.trees.append(tree)

    def predict(self, X):
        if not self.trees:
            return [0.0] * len(X)
            
        predictions = [tree.predict(X) for tree in self.trees]
        num_samples = len(X)
        avg_predictions = []
        
        for i in range(num_samples):
            val_sum = sum(predictions[t][i] for t in range(self.n_estimators))
            avg_predictions.append(val_sum / self.n_estimators)
            
        return avg_predictions

# Global singleton or generator for model training
_global_forest = None

def get_trained_predictor(user_attempts=[]):
    """
    Generates synthetic training dataset, appends user attempts to dynamically train a Random Forest,
    and returns the trained model.
    """
    global _global_forest
    
    # 1. Generate synthetic dataset
    # Features: [TopicIndex, Attempts, Accuracy, TimeTaken, Difficulty]
    # Topic index mapping: 0=Arrays, 1=Strings, 2=Linked List, 3=Hashing, 4=Recursion, 5=Trees, 6=Graphs, 7=Dynamic Programming
    topics_map = {
        "Arrays": 0, "Strings": 1, "Linked List": 2, "Hashing": 3,
        "Recursion": 4, "Trees": 5, "Graphs": 6, "Dynamic Programming": 7
    }
    
    X_train = []
    y_train = []

    # Generate 400 base profiles with normal variance
    random.seed(42) # Deterministic base training
    for _ in range(400):
        topic_idx = random.randint(0, 7)
        attempts = random.randint(1, 20)
        accuracy = random.randint(15, 100)
        difficulty = random.randint(1, 3) # 1: Easy, 2: Medium, 3: Hard
        
        # Expected time thresholds
        expected_time_per_q = {1: 90, 2: 180, 3: 300}[difficulty]
        # Actual time taken with noise
        time_per_q = expected_time_per_q * random.uniform(0.6, 2.0)
        time_taken = time_per_q * attempts
        
        # Mastery heuristic formula for synthetic data
        base_mastery = accuracy
        
        # Penalize speed if taking longer than expected
        if time_per_q > expected_time_per_q:
            penalty = min(20.0, ((time_per_q / expected_time_per_q) - 1.0) * 15.0)
            base_mastery -= penalty
            
        # Reward difficulty
        base_mastery += (difficulty - 1) * 8.0
        
        # Small boost for multiple attempts (practice effect)
        base_mastery += min(12.0, attempts * 0.7)
        
        mastery = max(0.0, min(100.0, base_mastery + random.gauss(0, 3)))
        
        X_train.append([topic_idx, attempts, accuracy, time_taken, difficulty])
        y_train.append(mastery)

    # 2. Append actual user attempts to bias training towards real behavior
    # Process user attempts
    user_agg = {}
    for att in user_attempts:
        t = att.get("topic")
        if t not in topics_map:
            continue
        topic_idx = topics_map[t]
        acc = att.get("accuracy", 0)
        time_taken = att.get("time_taken", 0)
        q_count = att.get("questions_attempted", 1)
        diff_str = att.get("difficulty", "Medium")
        diff_num = {"Easy": 1, "Medium": 2, "Hard": 3}.get(diff_str, 2)
        
        if topic_idx not in user_agg:
            user_agg[topic_idx] = {"acc_sum": 0, "time_sum": 0, "count": 0, "diff_list": []}
            
        user_agg[topic_idx]["acc_sum"] += acc
        user_agg[topic_idx]["time_sum"] += time_taken
        user_agg[topic_idx]["count"] += q_count
        user_agg[topic_idx]["diff_list"].append(diff_num)

    for topic_idx, agg in user_agg.items():
        avg_acc = agg["acc_sum"] / max(1, agg["count"])
        avg_time = agg["time_sum"]
        attempts = agg["count"]
        mode_diff = max(set(agg["diff_list"]), key=agg["diff_list"].count)
        
        # Calculate actual target mastery to insert
        expected_time_per_q = {1: 90, 2: 180, 3: 300}[mode_diff]
        time_per_q = avg_time / max(1, attempts)
        
        target_mastery = avg_acc
        if time_per_q > expected_time_per_q:
            penalty = min(20.0, ((time_per_q / expected_time_per_q) - 1.0) * 15.0)
            target_mastery -= penalty
        target_mastery += (mode_diff - 1) * 8.0
        target_mastery += min(12.0, attempts * 0.7)
        target_mastery = max(0.0, min(100.0, target_mastery))
        
        # Inject user data multiple times to give weight in bootstrapping
        for _ in range(5):
            X_train.append([topic_idx, attempts, avg_acc, avg_time, mode_diff])
            y_train.append(target_mastery)

    # 3. Train Random Forest model
    forest = RandomForestRegressor(n_estimators=8, max_depth=5)
    forest.fit(X_train, y_train)
    _global_forest = forest
    return forest

if __name__ == "__main__":
    # Self-test code
    forest = get_trained_predictor([])
    # Predict mastery for Arrays (index 0), 5 attempts, 80% accuracy, 600s total time, Medium diff (2)
    pred = forest.predict([[0, 5, 80.0, 600.0, 2]])
    print("Self-test prediction for Arrays (80% accuracy, 5 attempts):", pred[0])
