import random
import statistics

def monte_carlo(row, iterations=1000):
    marketing_growth = []
    rnd_growth = []
    ops_growth = []

    for i in range(iterations):
        #market noise
        m_rev = row["Marketing_Revenue"] * random.uniform(0.9, 1.15)
        r_rev = row["RnD_Revenue"] * random.uniform(0.85, 1.20)
        o_rev = row["Ops_Revenue"] * random.uniform(0.95, 1.10)

        #multiplier effect from marketing, rnd and operations
        m_effect = (row["Marketing_Spend"] / row["Budget"]) * 0.10
        r_effect = (row["RnD_Spend"] / row["Budget"]) * 0.12
        o_effect = (row["Ops_Spend"] / row["Budget"]) * 0.05

        m_rev *= (1 + m_effect)
        r_rev *= (1 + r_effect)
        o_rev *= (1 + o_effect)

        #growth
        marketing_growth.append((m_rev - row["Marketing_Revenue"]) / row["Marketing_Revenue"])
        rnd_growth.append((r_rev - row["RnD_Revenue"]) / row["RnD_Revenue"])
        ops_growth.append((o_rev - row["Ops_Revenue"]) / row["Ops_Revenue"])

    return { #output
        "expected": {
            "Marketing_Revenue": sum(marketing_growth) / iterations,
            "RnD_Revenue": sum(rnd_growth) / iterations,
            "Ops_Revenue": sum(ops_growth) / iterations,
        },
        "risk": {
            "Marketing_Revenue": statistics.stdev(marketing_growth),
            "RnD_Revenue": statistics.stdev(rnd_growth),
            "Ops_Revenue": statistics.stdev(ops_growth),
        }
    }
