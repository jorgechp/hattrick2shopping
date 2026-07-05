import numpy as np
from scipy.stats import pearsonr

SKILL_LABELS = {
    "keeper": "Portería", "defending": "Defensa", "playmaking": "Jugadas",
    "winger": "Lateral", "passing": "Pases", "scoring": "Anotación", "setpieces": "Balón parado",
}
SPECIALTIES = ["technical", "quick", "powerful", "unpredictable", "head"]
SPECIALTY_LABELS = {
    "technical": "Técnico", "quick": "Rápido", "powerful": "Potente",
    "unpredictable": "Imprevisible", "head": "Cabeceador",
}
CATEGORIES = ["POR", "DC", "DL", "W", "IM", "MC", "EXT", "DEL"]


def analyze_quality(records: list[dict]) -> dict:
    n = len(records)
    if n == 0:
        return {"samples": 0, "error": "No data"}

    prices = [r.get("price") for r in records if r.get("price") is not None]
    ages = [r.get("age") for r in records if r.get("age") is not None]
    tsis = [r.get("tsi") for r in records if r.get("tsi") is not None]

    # --- Category distribution ---
    cat_counts = {}
    for cat in CATEGORIES:
        cat_counts[cat] = sum(1 for r in records if r.get(f"category_{cat}"))
    other_cats = sum(1 for r in records if not any(r.get(f"category_{c}") for c in CATEGORIES))
    if other_cats:
        cat_counts["OTROS"] = other_cats

    # --- Specialty distribution ---
    spec_counts = {}
    for s in SPECIALTIES:
        spec_counts[SPECIALTY_LABELS[s]] = sum(1 for r in records if r.get(f"specialty_{s}"))
    no_spec = sum(1 for r in records if not any(r.get(f"specialty_{s}") for s in SPECIALTIES))
    if no_spec:
        spec_counts["Ninguna"] = no_spec

    # --- Age buckets ---
    age_buckets = {"15-17": 0, "18-20": 0, "21-23": 0, "24-26": 0, "27+": 0}
    for a in ages:
        if a < 18:
            age_buckets["15-17"] += 1
        elif a < 21:
            age_buckets["18-20"] += 1
        elif a < 24:
            age_buckets["21-23"] += 1
        elif a < 27:
            age_buckets["24-26"] += 1
        else:
            age_buckets["27+"] += 1

    # --- Skills stats ---
    skill_stats = {}
    for key, label in SKILL_LABELS.items():
        vals = [r.get(key, 0) for r in records]
        skill_stats[label] = {
            "min": int(np.min(vals)),
            "max": int(np.max(vals)),
            "avg": round(float(np.mean(vals)), 1),
            "median": int(np.median(vals)),
            "std": round(float(np.std(vals)), 1),
        }

    # --- Price stats ---
    price_stats = {}
    if prices:
        price_stats = {
            "min": round(min(prices), 0),
            "max": round(max(prices), 0),
            "avg": round(float(np.mean(prices)), 0),
            "median": round(float(np.median(prices)), 0),
            "std": round(float(np.std(prices)), 0),
        }

    # --- Correlation with price ---
    correlations = {}
    if len(prices) > 5:
        for key, label in SKILL_LABELS.items():
            x = [r.get(key, 0) for r in records]
            try:
                corr, pval = pearsonr(x, prices)
                correlations[label] = {"corr": round(corr, 3), "p_value": round(pval, 4)}
            except Exception:
                pass
        # Age correlation
        if ages:
            try:
                corr, pval = pearsonr(ages, prices)
                correlations["Edad"] = {"corr": round(corr, 3), "p_value": round(pval, 4)}
            except Exception:
                pass
        if tsis:
            try:
                corr, pval = pearsonr(tsis, prices)
                correlations["TSI"] = {"corr": round(corr, 3), "p_value": round(pval, 4)}
            except Exception:
                pass

    # --- Data gaps analysis ---
    gaps = []
    # Check category-skills coverage
    for cat in CATEGORIES:
        cat_records = [r for r in records if r.get(f"category_{cat}")]
        if not cat_records:
            gaps.append(f"No hay jugadores de categoría {cat}")
            continue
        for key, label in SKILL_LABELS.items():
            high = [r.get(key, 0) for r in cat_records if r.get(key, 0) >= 12]
            if len(high) < 3:
                gaps.append(f"Pocos {cat} con {label} ≥ 12 ({len(high)} disponibles)")

    # Check specialty+age coverage
    for s in SPECIALTIES:
        spec_records = [r for r in records if r.get(f"specialty_{s}")]
        if not spec_records:
            gaps.append(f"No hay jugadores con especialidad {SPECIALTY_LABELS[s]}")

    # Check high-price records
    if prices:
        p90 = np.percentile(prices, 90)
        high_price = [r for r in records if r.get("price", 0) >= p90]
        if len(high_price) < 10:
            gaps.append(f"Pocos registros en el percentil 90 de precio (< 10)")

    # Gapas in age ranges for each category
    for cat in CATEGORIES:
        young = [r for r in records if r.get(f"category_{cat}") and r.get("age", 99) < 18]
        if len(young) < 3:
            cat_label = cat
            gaps.append(f"Pocos {cat_label} jóvenes (< 18 años) — solo {len(young)}")

    gaps = gaps[:15]

    # --- Diversity score ---
    def age_bucket_label(a):
        if a < 18: return "15-17"
        if a < 21: return "18-20"
        if a < 24: return "21-23"
        if a < 27: return "24-26"
        return "27+"

    combos = set()
    for r in records:
        cat = next((c for c in CATEGORIES if r.get(f"category_{c}")), "OTROS")
        spec = next((SPECIALTY_LABELS[s] for s in SPECIALTIES if r.get(f"specialty_{s}")), "Ninguna")
        a = r.get("age", 20)
        combos.add((cat, spec, age_bucket_label(a)))
    total_combos_possible = len(CATEGORIES) * (len(SPECIALTIES) + 1) * 5
    diversity_score = round(len(combos) / total_combos_possible * 100, 1) if total_combos_possible > 0 else 0

    return {
        "samples": n,
        "categories": cat_counts,
        "specialties": spec_counts,
        "age_buckets": age_buckets,
        "skills": skill_stats,
        "price": price_stats,
        "correlations": correlations,
        "gaps": gaps,
        "diversity_score": diversity_score,
        "has_data": True,
    }
