import pandas as pd
from predictor import monte_carlo
from best_choice import dp_best_choice

df = pd.read_csv("data/historical_rupiah.csv")

latest = df.iloc[-1]

#monte carlo simul
mc = monte_carlo(latest)

#DP
best_alloc, best_growth = dp_best_choice(mc)

#output

print("\nExpected Growth:")
for k, v in mc["expected"].items():
    print(f"{k:20} {v:.2f}")

print("\nRisk (Std Dev):")
for k, v in mc["risk"].items():
    print(f"{k:20} {v:.2f}")

print("\nBest Allocation:")
print(f"Marketing:   {best_alloc[0]}%")
print(f"R&D:         {best_alloc[1]}%")
print(f"Operations:  {best_alloc[2]}%")

print(f"\nExpected Growth: {best_growth:.3f} (≈ {best_growth*100:.1f}%)")
