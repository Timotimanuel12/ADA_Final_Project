# best_choice.py
import math

def dp_best_choice(mc_results):
    """
    Uses per-unit ROI and per-unit risk (stdev per unit spend) to produce
    an allocation that is invariant to budget scaling.
    Returns (best_alloc, best_score, total_expected_revenue) for compatibility.
    """

    exp = mc_results.get("expected", {})
    risk = mc_results.get("risk", {})
    spend = mc_results.get("spend", {})

    # safe spends (fallback to 1.0)
    m_spend = spend.get("Marketing_Spend", 1.0) or 1.0
    r_spend = spend.get("RnD_Spend", 1.0) or 1.0
    o_spend = spend.get("Ops_Spend", 1.0) or 1.0

    # convert expected absolute revenue -> ROI per unit spend (dimensionless)
    # and risk in absolute revenue -> risk per unit spend
    roi_m = exp.get("Marketing_Revenue", 0.0) / m_spend
    roi_r = exp.get("RnD_Revenue", 0.0) / r_spend
    roi_o = exp.get("Ops_Revenue", 0.0) / o_spend

    risk_m_per_unit = risk.get("Marketing_Revenue", 0.0) / m_spend if m_spend else 0.0
    risk_r_per_unit = risk.get("RnD_Revenue", 0.0) / r_spend if r_spend else 0.0
    risk_o_per_unit = risk.get("Ops_Revenue", 0.0) / o_spend if o_spend else 0.0

    best_score = -1e18
    best_alloc = (0, 0, 0)

    # tuneable risk_weight: gives the penalty magnitude vs ROI (kept conservative)
    risk_weight = 1.0

    for m in range(0, 101):
        for r in range(0, 101 - m):
            o = 100 - m - r

            # Capital absorption / diminishing returns (dimensionless)
            m_eff = math.log(1 + m / 12.0)
            r_eff = math.log(1 + r / 12.0)
            o_eff = math.log(1 + o / 12.0)

            # Use per-unit ROI * effective factor -> dimensionless score contribution
            # (this makes score independent of absolute currency scale)
            m_contrib = roi_m * m_eff
            r_contrib = roi_r * r_eff
            o_contrib = roi_o * o_eff

            # Risk penalty uses per-unit risk and allocation share squared (non-linear penalty)
            m_pen = (risk_m_per_unit * (m / 100.0)**2) * risk_weight
            r_pen = (risk_r_per_unit * (r / 100.0)**2) * risk_weight
            o_pen = (risk_o_per_unit * (o / 100.0)**2) * risk_weight

            score = (m_contrib + r_contrib + o_contrib) - (m_pen + r_pen + o_pen)

            # Synergy penalties (same as before)
            synergy_penalty = 0.0
            if m > 60 and o < 20:
                synergy_penalty += 0.15 * score
            if r > 50 and m < 20:
                synergy_penalty += 0.15 * score
            if o > 70 and r < 15:
                synergy_penalty += 0.15 * score

            score -= synergy_penalty

            if score > best_score:
                best_score = score
                best_alloc = (m, r, o)

    # For compatibility return total_expected_revenue as the sum of absolute expected revenues
    total_expected_revenue = (
        exp.get("Marketing_Revenue", 0.0)
      + exp.get("RnD_Revenue", 0.0)
      + exp.get("Ops_Revenue", 0.0)
    )

    return best_alloc, best_score, total_expected_revenue
