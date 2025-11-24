import csv
import random

def generate_csv(filename, rows=10):
    headers = ["Budget", "Marketing_Spend", "RnD_Spend", "Ops_Spend",
               "Marketing_Revenue", "RnD_Revenue", "Ops_Revenue"]

    with open(filename, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()

        for _ in range(rows):
            budget = random.randint(100000, 500000)

            marketing = budget * random.uniform(0.2, 0.4)
            rnd = budget * random.uniform(0.3, 0.5)
            ops = budget - (marketing + rnd)

            writer.writerow({
                "Budget": budget,
                "Marketing_Spend": round(marketing, 2),
                "RnD_Spend": round(rnd, 2),
                "Ops_Spend": round(ops, 2),
                "Marketing_Revenue": round(marketing * random.uniform(0.9, 1.3), 2),
                "RnD_Revenue": round(rnd * random.uniform(0.9, 1.4), 2),
                "Ops_Revenue": round(ops * random.uniform(0.9, 1.2), 2),
            })

