def dp_best_choice(mc_results):
    exp = mc_results["expected"]

    best_score = float("-inf")
    best_alloc = (0, 0, 0)

    # 5% increment steps
    for m in range(0, 101, 5):  # Marketing %
        for r in range(0, 101 - m, 5):  # R&D %
            o = 100 - m - r  # Ops %

            # --- EQUALITY CONSTRAINTS ---
            # 1. Floor: Each department gets at least 20%
            if m < 20 or r < 20 or o < 20:
                continue

            # 2. Ceiling: No department gets more than 50%
            # This forces the budget to be shared more equally.
            if m > 50 or r > 50 or o > 50:
                continue

            score = (
                    exp["Marketing_Revenue"] * (m / 100)
                    + exp["RnD_Revenue"] * (r / 100)
                    + exp["Ops_Revenue"] * (o / 100)
            )

            if score > best_score:
                best_score = score
                best_alloc = (m, r, o)

    return best_alloc, best_score