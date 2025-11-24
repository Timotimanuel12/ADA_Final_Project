def dp_best_choice(mc_results):
    exp = mc_results["expected"]

    best_score = float("-inf")
    best_alloc = (0, 0, 0)

    #5% increment
    for m in range(0, 101, 5):          #marketing %
        for r in range(0, 101 - m, 5):  #R&D %
            o = 100 - m - r             #ops %

            score = (
                exp["Marketing_Revenue"] * (m / 100)
                + exp["RnD_Revenue"] * (r / 100)
                + exp["Ops_Revenue"] * (o / 100)
            )

            if score > best_score:
                best_score = score
                best_alloc = (m, r, o)

    return best_alloc, best_score
