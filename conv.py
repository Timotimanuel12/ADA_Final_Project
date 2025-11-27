import csv
import random


def generate_csv(filename, rows=12):
    # Added Year and Quarter to headers
    headers = ["Year", "Quarter", "Budget", "Marketing_Spend", "RnD_Spend", "Ops_Spend",
               "Marketing_Revenue", "RnD_Revenue", "Ops_Revenue"]

    with open(filename, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()

        start_year = 2022

        for i in range(rows):
            # Calculate Year and Quarter sequentially
            year = start_year + (i // 4)
            quarter = (i % 4) + 1

            # Realistic IDR Budget: Between 1 Billion and 10 Billion
            budget = random.randint(1_000_000_000, 10_000_000_000)

            # Allocations (must sum to ~budget)
            marketing = budget * random.uniform(0.15, 0.35)
            rnd = budget * random.uniform(0.20, 0.40)
            ops = budget - (marketing + rnd)

            # Revenue Generation
            writer.writerow({
                "Year": year,
                "Quarter": quarter,
                "Budget": budget,
                "Marketing_Spend": round(marketing, 0),
                "RnD_Spend": round(rnd, 0),
                "Ops_Spend": round(ops, 0),
                "Marketing_Revenue": round(marketing * random.uniform(1.1, 1.5), 0),
                "RnD_Revenue": round(rnd * random.uniform(0.8, 2.0), 0),
                "Ops_Revenue": round(ops * random.uniform(1.0, 1.2), 0),
            })


if __name__ == "__main__":
    generate_csv("data/historical_rupiah.csv", rows=12)
    print("Generated historical_rupiah.csv with Year and Quarter data.")