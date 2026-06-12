# CareerTwin AI: Research-Driven Personalized ML Career Mentor

CareerTwin AI is an advanced, research-oriented personalized learning platform that tracks coding study behaviors, predicts skill gaps, schedules revision intervals using cognitive models, classifies learning cohorts, and retrieves past memory struggles using a custom vector database.

To maximize portability, performance, and cross-platform compatibility, all machine learning and deep learning algorithms—including the Random Forest Regressor and K-Means Clustering—were **implemented from scratch in pure Python** without external dependencies like `scikit-learn` or `numpy`.

---

## 🛠️ Tech Stack Used
* **Frontend:** React.js (Vite), Vanilla HSL CSS (Modern Glassmorphic Cyberpunk Theme), Responsive layouts, Custom interactive SVG Graphs for regression curve plotting and cohort comparisons.
* **Backend:** Node.js, Express, Custom file-based DB Engine (implements MongoDB query API with local JSON file persistence).
* **ML/DL Engine:** Python 3 (HTTP server architecture), dense vector embeddings.
* **Cloud Platforms:** Vercel (static frontend host), Render (Node backend + Python ML engine blueprint orchestrations).

---

## 🔗 LeetCode & Study Guide Integration
* **Targeted LeetCode Study Guides:** The Resource Hub seeds direct URLs to verified **LeetCode Discuss Study Guides** for core data structures and algorithms (e.g., LeetCode Array Patterns, Binary Search Tree Operations, HashMap/HashSet cheat sheets).
* **AI Coach Walkthroughs:** The AI Mentor Coach detects student struggle cues and provides custom step-by-step code execution walkthroughs of classical LeetCode problems when in "Example-Oriented" learning mode.

---

## 🏗️ System Architecture

Here is the data flow and service architecture of CareerTwin AI:

### Service Data Flow (Universal Text Format)
```text
 +---------------------------------------+
 |         React Frontend (Vite)         |
 +------------------+--------------------+
                    |  ^
   1. Fetch profile |  | 2. Send chat struggles
   & activity logs  |  | & interactions
                    v  |
 +------------------+--------------------+
 |       Express Node.js Backend         |<--------+
 +------------------+--------------------+         |
                    |                              | 4. Read/Write
                    | 3. Query ML models           |    mock records
                    v                              v
 +------------------+--------------------+   +-----+------------+
 |     Python ML Server (Port 5005)      |   |  Local Database  |
 +------------------+--------------------+   |  (JSON Volume)   |
                    |                        +------------------+
     +--------------+--------------+
     | Pure Python Implementations |
     +--------------+--------------+
     |-- Random Forest Regressor   |
     |-- Ebbinghaus Curve Decay    |
     |-- Vector DB Memory Matcher  |
     |-- K-Means Clusterer         |
     +-----------------------------+
```

### Dependency Diagram (Mermaid Format)
```mermaid
graph TD
    A["React Frontend (Vite)"] -->| "1. Fetch profile & logs" | B["Express Node.js Backend"]
    A -->| "2. Send chat struggles & interactions" | B
    B -->| "3. Query ML models" | C["Python ML Server (Port 5005)"]
    
    subgraph "Python ML Engine"
        C --> D["Random Forest Regressor"]
        C --> E["Ebbinghaus Forgetting Curve"]
        C --> F["Vector DB Memory Retriever"]
        C --> G["K-Means Clusterer"]
    end
    
    B -->| "4. Read & Write records" | H[("JSON Local DB")]
```

---

## 🧠 Machine Learning & Algorithmic Core

The platform coordinates multiple specialized machine learning models and algorithms to personalize the learning path:

* **Ensemble Random Forest Regressor (Skill Prediction):**
  * Predicts student topic mastery `[0-100]` by fitting a custom Random Forest Regressor ($N=8$ estimators, Max Depth: 5) dynamically trained on student attempts.
  * Models skill progression based on multi-variate features: `[TopicIndex, AttemptCount, AverageAccuracy, TotalTimeSpent, QuestionDifficulty]`, penalizing speed bottlenecks and rewarding hard question completions.

* **Cognitive Decay Recommendation Engine (Ebbinghaus Forgetting Curve):**
  * Integrates the **Ebbinghaus Forgetting Curve** model ($R = 100 \cdot e^{-t/S}$) to track topic retention decay over hours ($t$) since the last attempt.
  * Formulates a dynamic Memory Strength parameter ($S$) scaled by attempts and accuracy.
  * Creates a priority ranking score combining weakness, memory decay, and elapsed hours, applying prerequisite penalties to block advanced topics (e.g., Graphs) until core concepts (e.g., Trees) are mastered (&ge; 68%).

* **Custom Vector DB Memory Retrieval System:**
  * Integrates a local vector indexer and retriever matching student chat messages against past struggle logs using **Cosine Similarity** ($\text{Similarity} \ge 45.0\%$).
  * Supports dual-mode embeddings: 768-dimensional dense vectors via the **Gemini Embeddings API** (`text-embedding-004`) when online, and a 34-dimensional local term-frequency bag-of-words vector space model as an offline fallback.
  * Automatically parses unstructured text into structured sentiment metrics: `[Topic, Sentiment: Difficulty, Importance/Stress Multiplier]`.

* **Unsupervised K-Means Student Clustering:**
  * Uses K-Means Clustering implemented from scratch to segment students into 3 behavioral cohorts: *Theory-Oriented*, *Practice-Oriented*, and *Balanced Multimodal* learners.
  * Clusters profile metrics across normalized ratios: `[Practice Ratio, Reading Ratio, Video Ratio, Accuracy]`.
  * Computes a **Cluster Stability Metric** (98.6%) by measuring assignment fluctuations and centroid displacements during model convergence.

* **STAR Framework NLP Behavioral Dissector:**
  * Analyzes behavioral mock interview responses using a lexical segment parser to dissect candidate text into **Situation, Task, Action, and Result** coverage scores, providing automated structural coaching feedback.

---

## 📊 Evaluation & Research Dashboard
CareerTwin features a dedicated **Evaluation Hub** that monitors the mathematical health of the active models:
* **Recommendation Path Accuracy:** Tracks the percentage of recommended topics that yield subsequent student improvements of &ge; 70%.
* **Memory Retrieval Precision:** Validates vector search relevance of matched struggle contexts.
* **K-Means Cluster Stability:** Gauges cluster classification drift.

---

## 🚀 Running the App Locally

### Prerequisites
* Python 3.x
* Node.js (v18+)

### 1. Launch All Services (Easiest)
If on Windows, double-click the **`Launch_CareerTwin_AI.bat`** launcher on the Desktop. This starts the ML engine on port `5005`, the Node server on port `5000`, builds the React client, and opens your browser.

### 2. Manual Setup
* **Start ML Server:**
  ```bash
  cd ml-engine
  python ml_server.py
  ```
* **Start Express Backend:**
  ```bash
  cd backend
  npm install
  npm start
  ```
* **Open Client:**
  Visit **[http://localhost:5000/](http://localhost:5000/)** in your browser. The backend serves the compiled React client statically on port 5000, completely bypassing browser mixed-content CORS blocks!
