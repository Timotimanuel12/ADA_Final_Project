# predictor.py
import random
import statistics

def monte_carlo(row, iterations=3000):
    """
    Follows test.py sampling logic but returns:
    - expected: absolute revenue expectation (keeps frontend charts working)
    - risk: absolute revenue stdevs (keeps frontend charts working)
    - raw_data: absolute revenue samples (for histograms)
    - spend: department spends so optimizer can compute ROI per unit spend
    """

    # ensure safe denominators
    m_spend = max(1.0, row.get("Marketing_Spend", 1.0))
    r_spend = max(1.0, row.get("RnD_Spend", 1.0))
    o_spend = max(1.0, row.get("Ops_Spend", 1.0))

    # base ROI per 1 unit spend (revenue / spend)
    m_base = row.get("Marketing_Revenue", 0.0) / m_spend
    r_base = row.get("RnD_Revenue", 0.0) / r_spend
    o_base = row.get("Ops_Revenue", 0.0) / o_spend

    marketing_rev_samples = []
    rnd_rev_samples = []
    ops_rev_samples = []

    for _ in range(iterations):
        # sample ROI per unit spend around base (same stochastic model you used)
        m_roi = random.gauss(m_base, 0.08 * m_base)
        r_roi = random.gauss(r_base, 0.12 * r_base)
        o_roi = random.gauss(o_base, 0.04 * o_base)

        # clamp to avoid negative/zero ROI
        m_roi = max(0.01, m_roi)
        r_roi = max(0.01, r_roi)
        o_roi = max(0.01, o_roi)

        # convert to absolute revenue samples by multiplying by department spend
        m_rev = m_roi * m_spend
        r_rev = r_roi * r_spend
        o_rev = o_roi * o_spend

        marketing_rev_samples.append(m_rev)
        rnd_rev_samples.append(r_rev)
        ops_rev_samples.append(o_rev)

    return {
        "expected": {
            "Marketing_Revenue": sum(marketing_rev_samples) / iterations,
            "RnD_Revenue":      sum(rnd_rev_samples) / iterations,
            "Ops_Revenue":      sum(ops_rev_samples) / iterations,
        },
        "risk": {
            # keep returning absolute revenue stdevs for compatibility/visualization
            "Marketing_Revenue": statistics.stdev(marketing_rev_samples) if len(marketing_rev_samples) > 1 else 0.0,
            "RnD_Revenue":      statistics.stdev(rnd_rev_samples) if len(rnd_rev_samples) > 1 else 0.0,
            "Ops_Revenue":      statistics.stdev(ops_rev_samples) if len(ops_rev_samples) > 1 else 0.0,
        },
        # keep key name compatible with older predictor for frontend histograms
        "raw_data": {
            "Marketing": marketing_rev_samples,
            "RnD":       rnd_rev_samples,
            "Ops":       ops_rev_samples
        },
        # NEW: expose spends so optimizer can compute per-unit ROI/risk
        "spend": {
            "Marketing_Spend": m_spend,
            "RnD_Spend": r_spend,
            "Ops_Spend": o_spend
        }
    }
