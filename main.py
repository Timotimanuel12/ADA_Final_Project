import pandas as pd
from predictor import monte_carlo
from best_choice import dp_best_choice

# Define Budget
budget = 1_000_000_000

# Load Data
try:
    df = pd.read_csv("data/NVDIA.csv")
    latest = df.iloc[-1]
except Exception as e:
    print(f"Error loading data: {e}")
    exit()

# Monte Carlo Simulation
mc = monte_carlo(latest)

# Dynamic Programming (DP) / Optimization
best_alloc, best_score, total_expected_revenue = dp_best_choice(mc)

# Calculate Dollar Allocation
m_dollars = budget * (best_alloc[0] / 100)
r_dollars = budget * (best_alloc[1] / 100)
o_dollars = budget * (best_alloc[2] / 100)

m_risk = budget * (mc["risk"]["Marketing_Revenue"] / total_expected_revenue)
r_risk = budget * (mc["risk"]["RnD_Revenue"] / total_expected_revenue)
o_risk = budget * (mc["risk"]["Ops_Revenue"] / total_expected_revenue)

# Output
print("\n--- Optimized Allocation ---")

print("Recommended Percentage Split:")
print(f"  Marketing:   {best_alloc[0]}%")
print(f"  R&D:         {best_alloc[1]}%")
print(f"  Operations:  {best_alloc[2]}%")

print("\nFund Allocation:")
print(f"  Marketing:   {m_dollars:,.0f}")
print(f"  R&D:         {r_dollars:,.0f}")
print(f"  Operations:  {o_dollars:,.0f}")

print("\nRisk:")
print(f"  Marketing:   {m_risk:,.0f}")
print(f"  R&D:         {r_risk:,.0f}")
print(f"  Operations:  {o_risk:,.0f}")

print(f"\nOptimization Score: {best_score:.6f}")
print(f"Expected Total Revenue: {total_expected_revenue:,.0f}")