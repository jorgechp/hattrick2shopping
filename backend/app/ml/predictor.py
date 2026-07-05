import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from typing import Optional, TypedDict
import joblib
from pathlib import Path

from app.config import settings


SKILL_KEYS = ["keeper", "defending", "playmaking", "winger", "passing", "scoring", "setpieces"]
SPECIALTIES = ["technical", "quick", "powerful", "unpredictable", "head"]
CATEGORIES = ["POR", "DC", "DL", "W", "IM", "MC", "EXT", "DEL"]

ALL_FEATURES = (
    SKILL_KEYS
    + ["age", "tsi", "bids", "hours_until_deadline"]
    + [f"specialty_{s}" for s in SPECIALTIES]
    + [f"category_{c}" for c in CATEGORIES]
)


def encode_features(
    skills: dict,
    age: Optional[float] = None,
    tsi: Optional[int] = None,
    specialty: Optional[str] = None,
    category: Optional[str] = None,
    bids: Optional[int] = None,
    hours_until_deadline: Optional[float] = None,
) -> dict:
    row = {}
    row["age"] = age if age is not None else 20
    row["tsi"] = tsi if tsi is not None else 0
    row["bids"] = bids if bids is not None else 0
    row["hours_until_deadline"] = hours_until_deadline if hours_until_deadline is not None else 0
    for k in SKILL_KEYS:
        row[k] = skills.get(k, 0)
    for s in SPECIALTIES:
        row[f"specialty_{s}"] = 1 if specialty == s else 0
    for c in CATEGORIES:
        row[f"category_{c}"] = 1 if category == c else 0
    return row


class PredictionResult(TypedDict):
    price: float
    ci_lower: float
    ci_upper: float


class ProjectionPoint(TypedDict):
    age: float
    price: float
    ci_lower: float
    ci_upper: float


class PricePredictor:
    def __init__(self):
        self.model: Optional[RandomForestRegressor] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: list[str] = []
        self.training_info: Optional[dict] = None
        self._load_model()

    def _load_model(self):
        model_path = Path(settings.ml_model_path) / "price_model.joblib"
        scaler_path = Path(settings.ml_model_path) / "scaler.joblib"
        meta_path = Path(settings.ml_model_path) / "metadata.joblib"
        if model_path.exists() and scaler_path.exists():
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            if meta_path.exists():
                meta = joblib.load(meta_path)
                self.feature_names = meta.get("feature_names", [])
                self.training_info = meta.get("training_info")

    def is_trained(self) -> bool:
        return self.model is not None and self.scaler is not None

    def train(self, records: list[dict]) -> dict:
        import pandas as pd
        df = pd.DataFrame(records)
        if df.empty:
            return {"error": "No training data"}
        if "price" not in df.columns or df["price"].isna().all():
            return {"error": "No prices in training data"}

        df = df.dropna(subset=["price"])
        df["price"] = df["price"].clip(lower=1000)
        log_price = np.log(df["price"])

        feature_cols = [c for c in ALL_FEATURES if c in df.columns]
        if not feature_cols:
            return {"error": "No feature columns found in data"}

        X = df[feature_cols].fillna(0)
        y = log_price

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.model = RandomForestRegressor(
            n_estimators=200, max_depth=12, min_samples_leaf=5, random_state=42, n_jobs=-1
        )
        self.model.fit(X_scaled, y)

        train_pred = self.model.predict(X_scaled)
        residuals = y - train_pred

        self.feature_names = feature_cols
        self.training_info = {
            "samples": len(df),
            "features": feature_cols,
            "rmse_log": float(np.sqrt(np.mean(residuals ** 2))),
            "rmse_euro": float(np.exp(np.sqrt(np.mean(residuals ** 2))) * np.mean(y)),
            "trained_at": __import__("datetime").datetime.utcnow().isoformat(),
        }
        self._save()
        return dict(self.training_info)

    def predict(self, features: dict) -> PredictionResult:
        if not self.is_trained():
            raise RuntimeError("Model not trained yet")

        import pandas as pd
        feature_cols = [c for c in self.feature_names]
        df = pd.DataFrame([{k: features.get(k, 0) for k in feature_cols}])
        X_scaled = self.scaler.transform(df[feature_cols])

        tree_preds = np.array([tree.predict(X_scaled)[0] for tree in self.model.estimators_])
        log_pred = float(self.model.predict(X_scaled)[0])

        price = float(np.exp(log_pred))
        ci_lower = float(np.exp(np.percentile(tree_preds, 10)))
        ci_upper = float(np.exp(np.percentile(tree_preds, 90)))

        return {"price": price, "ci_lower": ci_lower, "ci_upper": ci_upper}

    def project_over_age(
        self,
        base_features: dict,
        from_age: int,
        to_age: int = 22,
        age_days: int = 0,
    ) -> list[ProjectionPoint]:
        import pandas as pd
        feature_cols = [c for c in self.feature_names]

        points = []
        for age_y in range(from_age, to_age + 1):
            age_float = age_y + age_days / 365.0
            row = dict(base_features)
            row["age"] = age_float

            df = pd.DataFrame([{k: row.get(k, 0) for k in feature_cols}])
            X_scaled = self.scaler.transform(df[feature_cols])

            tree_preds = np.array([tree.predict(X_scaled)[0] for tree in self.model.estimators_])
            log_pred = float(self.model.predict(X_scaled)[0])

            points.append({
                "age": age_float,
                "price": float(np.exp(log_pred)),
                "ci_lower": float(np.exp(np.percentile(tree_preds, 10))),
                "ci_upper": float(np.exp(np.percentile(tree_preds, 90))),
            })

        return points

    def project_with_training(
        self,
        base_features: dict,
        from_age: int,
        trained_skill: str,
        growth_per_year: float,
        to_age: int = 22,
        age_days: int = 0,
    ) -> list[dict]:
        import pandas as pd
        import numpy as np
        feature_cols = [c for c in self.feature_names]

        current_skill_val = base_features.get(trained_skill, 5)
        total_other = sum(base_features.get(k, 0) for k in SKILL_KEYS if k != trained_skill)

        points = []
        skill_val = current_skill_val

        for age_y in range(from_age, to_age + 1):
            age_float = age_y + age_days / 365.0

            if age_y > from_age:
                skill_val = min(20, skill_val + growth_per_year)

            total_before = current_skill_val + total_other
            total_after = skill_val + total_other
            tsi_mult = total_after / total_before if total_before > 0 else 1.0
            new_tsi = base_features.get("tsi", 0) * tsi_mult

            row = dict(base_features)
            row["age"] = age_float
            row["tsi"] = new_tsi
            row[trained_skill] = skill_val

            df = pd.DataFrame([{k: row.get(k, 0) for k in feature_cols}])
            X_scaled = self.scaler.transform(df[feature_cols])

            tree_preds = np.array([tree.predict(X_scaled)[0] for tree in self.model.estimators_])
            log_pred = float(self.model.predict(X_scaled)[0])

            points.append({
                "age": age_float,
                "price": float(np.exp(log_pred)),
                "ci_lower": float(np.exp(np.percentile(tree_preds, 10))),
                "ci_upper": float(np.exp(np.percentile(tree_preds, 90))),
            })

        return [{
            "scenario": "training",
            "label": f"+{growth_per_year}/año",
            "color": "#f97316",
            "points": points,
        }]

    def _save(self):
        model_dir = Path(settings.ml_model_path)
        model_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, model_dir / "price_model.joblib")
        joblib.dump(self.scaler, model_dir / "scaler.joblib")
        joblib.dump({
            "feature_names": self.feature_names,
            "training_info": self.training_info,
        }, model_dir / "metadata.joblib")

    def get_info(self) -> dict:
        if not self.is_trained() or not self.training_info:
            return {"trained": False}
        importances = {}
        if self.model and self.feature_names:
            for name, imp in zip(self.feature_names, self.model.feature_importances_):
                importances[name] = round(float(imp), 4)
            sorted_imp = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))
        else:
            sorted_imp = {}

        return {
            "trained": True,
            "algorithm": "RandomForestRegressor",
            "n_estimators": self.model.n_estimators if self.model else None,
            "max_depth": self.model.max_depth if self.model else None,
            "feature_importance": sorted_imp,
            **self.training_info,
        }


predictor = PricePredictor()
