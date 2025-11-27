from flask import Flask, request, jsonify
from flask_cors import CORS
import sys

# Import logic
try:
    from predictor import monte_carlo
    from best_choice import dp_best_choice
except ImportError:
    print("Error: Missing predictor.py or best_choice.py")
    sys.exit(1)

app = Flask(__name__)
CORS(app)


def process_single_row(row_data):
    """Helper function to process one simulation row"""
    # 1. Run Monte Carlo
    mc_results = monte_carlo(row_data)

    # 2. Run DP (Optimization)
    dp_result = dp_best_choice(mc_results)

    # Handle different return signatures for compatibility
    if len(dp_result) == 3:
        best_alloc, best_growth, top_5 = dp_result
    else:
        best_alloc, best_growth = dp_result
        top_5 = []

    return {
        "expected": mc_results["expected"],
        "risk": mc_results["risk"],
        "allocation": {
            "Marketing": best_alloc[0],
            "RnD": best_alloc[1],
            "Operations": best_alloc[2]
        },
        "total_growth": best_growth,
        "inputs": row_data  # Echo back inputs for history tracking
    }


@app.route('/run-optimization', methods=['POST'])
def run_optimization():
    row_data = request.json
    result = process_single_row(row_data)
    return jsonify(result)


@app.route('/run-batch-optimization', methods=['POST'])
def run_batch_optimization():
    data_list = request.json  # Expects a list of rows
    results = []

    for row in data_list:
        try:
            # Basic validation to ensure row has numbers
            if "Budget" in row:
                result = process_single_row(row)
                results.append(result)
        except Exception as e:
            print(f"Skipping row due to error: {e}")
            continue

    return jsonify(results)


if __name__ == '__main__':
    print("Server running on http://127.0.0.1:5000")
    app.run(debug=True)