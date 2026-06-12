import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys
import os

# Adjust path to find the models directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.gap_predictor import analyze_gaps
from models.classifier import classify_style
from models.recommender import recommend_next
from models.ranker import rank_resources
from models.curve_fitter import fit_learning_curve
from models.cohort_clusterer import cluster_student
from models.semantic_search import semantic_search_resources
from models.star_analyzer import analyze_star_framework

class MLRequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        # Enable CORS for communication from the Node backend
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        # Handle preflight CORS request
        self._set_headers(200)

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except Exception as e:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "Invalid JSON format"}).encode('utf-8'))
            return

        # Route matching
        path = self.path
        response_data = {}

        if path == "/predict_gaps":
            attempts = data.get("attempts", [])
            current_skills = data.get("current_skills", {})
            response_data = analyze_gaps(attempts, current_skills)
            
        elif path == "/classify_learning_style":
            learning_logs = data.get("learning_logs", {})
            response_data = classify_style(learning_logs)
            
        elif path == "/recommend":
            user_skills = data.get("user_skills", {})
            goal = data.get("goal", "Amazon SDE Intern")
            learning_style = data.get("learning_style", "Practice-Oriented")
            response_data = recommend_next(user_skills, goal, learning_style)
            
        elif path == "/rank_resources":
            resources = data.get("resources", [])
            learning_style = data.get("learning_style", "Practice-Oriented")
            success_rates = data.get("success_rates", {})
            response_data = rank_resources(resources, learning_style, success_rates)

        elif path == "/fit_learning_curve":
            attempts = data.get("attempts", [])
            response_data = fit_learning_curve(attempts)

        elif path == "/cluster_cohort":
            accuracy = data.get("accuracy", 70.0)
            practice_ratio = data.get("practice_ratio", 0.5)
            theory_ratio = data.get("theory_ratio", 0.3)
            response_data = cluster_student(accuracy, practice_ratio, theory_ratio)

        elif path == "/semantic_search":
            resources = data.get("resources", [])
            query = data.get("query", "")
            api_key = data.get("api_key", None)
            response_data = semantic_search_resources(resources, query, api_key)

        elif path == "/analyze_star":
            text = data.get("text", "")
            response_data = analyze_star_framework(text)
            
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": f"Endpoint {path} not found"}).encode('utf-8'))
            return

        self._set_headers(200)
        self.wfile.write(json.dumps(response_data).encode('utf-8'))

def run(port=5005):
    server_address = ('', port)
    httpd = HTTPServer(server_address, MLRequestHandler)
    print(f"CareerTwin ML Server running on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    print("Stopping ML Server...")
    httpd.server_close()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5005))
    run(port=port)
