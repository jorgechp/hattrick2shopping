import time
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import cross_val_score, KFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.pipeline import Pipeline


MODELS = {
    "Regresión Lineal": LinearRegression(),
    "Random Forest": RandomForestRegressor(
        n_estimators=200, max_depth=12, min_samples_leaf=5, random_state=42, n_jobs=-1
    ),
    "Gradient Boosting": GradientBoostingRegressor(
        n_estimators=200, max_depth=5, learning_rate=0.1, random_state=42
    ),
    "Red Neuronal (MLP)": MLPRegressor(
        hidden_layer_sizes=(64, 32), max_iter=500, random_state=42, early_stopping=True,
    ),
}


def run_benchmark(X, y) -> dict:
    results = []
    cv = KFold(n_splits=5, shuffle=True, random_state=42)

    for name, model in MODELS.items():
        pipeline = Pipeline([("scaler", StandardScaler()), ("model", model)])

        t0 = time.time()
        cv_r2 = cross_val_score(pipeline, X, y, cv=cv, scoring="r2")
        cv_rmse = np.sqrt(-cross_val_score(pipeline, X, y, cv=cv, scoring="neg_mean_squared_error"))
        train_time = time.time() - t0

        pipeline.fit(X, y)
        y_pred = pipeline.predict(X)
        r2 = r2_score(y, y_pred)
        rmse = np.sqrt(mean_squared_error(y, y_pred))
        mae = mean_absolute_error(y, y_pred)

        results.append({
            "name": name,
            "r2": round(float(r2), 4),
            "rmse": round(float(rmse), 2),
            "mae": round(float(mae), 2),
            "cv_r2_mean": round(float(cv_r2.mean()), 4),
            "cv_r2_std": round(float(cv_r2.std()), 4),
            "cv_rmse_mean": round(float(cv_rmse.mean()), 2),
            "train_time_sec": round(train_time, 3),
        })

    results.sort(key=lambda r: r["cv_rmse_mean"])

    best = results[0]["name"]
    return {"results": results, "best_model": best}
