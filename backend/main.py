from __future__ import annotations

# --- Std/3p imports ---
import os
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import Body, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- App & CORS ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # lock down later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model paths & globals ---
MODEL_DIR = os.path.join(os.path.dirname(__file__), "../model")
KNN_PW_MODEL_PATH = os.path.abspath(os.path.join(MODEL_DIR, "knn_pw_model.joblib"))
RF_BIAS_MODEL_PATH = os.path.abspath(os.path.join(MODEL_DIR, "rf_bias_model.joblib"))
RIDGE_PW_MODEL_PATH = os.path.abspath(os.path.join(MODEL_DIR, "ridge_pw_model.joblib"))

knn_pw_model = None
rf_bias_model = None
ridge_pw_model = None

stations_df: Optional[pd.DataFrame] = None
satellites_df: Optional[pd.DataFrame] = None
gpr_model = None  # you reference this in /validate

# --- Schemas ---
class LatLonRequest(BaseModel):
    lat: float
    lon: float

# --- Utilities ---
def zwd_to_pw(zwd: float, Tm: float = 293.15) -> float:
    """
    Bevis et al. (1994) quick conversion. 1 kg/m^2 = 1 mm.
    Uses PI ≈ 0.15 for mid-latitudes by default.
    """
    PI = 0.15
    return PI * zwd * 1000.0

# --- Startup: load models ---
@app.on_event("startup")
def load_models() -> None:
    global knn_pw_model, rf_bias_model, ridge_pw_model
    try:
        if os.path.exists(KNN_PW_MODEL_PATH):
            knn_pw_model = joblib.load(KNN_PW_MODEL_PATH)
        if os.path.exists(RF_BIAS_MODEL_PATH):
            rf_bias_model = joblib.load(RF_BIAS_MODEL_PATH)
        if os.path.exists(RIDGE_PW_MODEL_PATH):
            ridge_pw_model = joblib.load(RIDGE_PW_MODEL_PATH)
    except Exception as e:
        print(f"Error loading models: {e}")

# --- Endpoints ---

# IDW interpolation
@app.post("/interpolate_idw/")
def interpolate_idw(req: LatLonRequest = Body(...)):
    global stations_df
    if stations_df is None:
        raise HTTPException(status_code=400, detail="No station data uploaded.")
    df = stations_df.dropna(subset=["lat", "lon", "pw"])
    lats = df["lat"].values
    lons = df["lon"].values
    pws = df["pw"].values
    dists = np.sqrt((lats - req.lat) ** 2 + (lons - req.lon) ** 2)
    if np.any(dists == 0):
        pw_pred = pws[dists == 0][0]
    else:
        weights = 1.0 / dists
        pw_pred = float(np.sum(weights * pws) / np.sum(weights))
    return {"lat": req.lat, "lon": req.lon, "pw_pred": float(pw_pred)}


# KNN interpolation endpoint
@app.post("/interpolate_knn/")
def interpolate_knn(req: LatLonRequest = Body(...)):
    global knn_pw_model
    if knn_pw_model is None:
        raise HTTPException(status_code=500, detail="KNN PW model not loaded.")
    X = np.array([[req.lat, req.lon]], dtype=float)
    pw_pred = knn_pw_model.predict(X)
    return {"lat": req.lat, "lon": req.lon, "pw_pred": float(pw_pred[0])}

# Random Forest interpolation endpoint
@app.post("/interpolate_random/")
def interpolate_random(req: LatLonRequest = Body(...)):
    global rf_bias_model
    if rf_bias_model is None:
        raise HTTPException(status_code=500, detail="Random Forest model not loaded.")
    X = np.array([[0, req.lat, req.lon, 0, 12, 1, 1, 1]], dtype=float)
    pw_pred = rf_bias_model.predict(X)
    return {"lat": req.lat, "lon": req.lon, "pw_pred": float(pw_pred[0])}

# KNN PW prediction
@app.post("/predict_pw_knn/")
def predict_pw_knn(req: LatLonRequest = Body(...)):
    global knn_pw_model
    if knn_pw_model is None:
        raise HTTPException(status_code=500, detail="KNN PW model not loaded.")
    X = np.array([[req.lat, req.lon]], dtype=float)
    pw_pred = knn_pw_model.predict(X)
    return {"lat": req.lat, "lon": req.lon, "pw_pred": float(pw_pred[0])}

# RF bias prediction
@app.post("/predict_bias_rf/")
def predict_bias_rf(
    ztd: float,
    lat: float,
    lon: float,
    height: float,
    hour: int,
    day: int,
    month: int,
    season: int,
):
    global rf_bias_model
    if rf_bias_model is None:
        raise HTTPException(status_code=500, detail="RF bias model not loaded.")
    X = np.array([[ztd, lat, lon, height, hour, day, month, season]], dtype=float)
    bias_pred = rf_bias_model.predict(X)
    return {"bias_pred": float(bias_pred[0])}

# Ridge PW prediction
@app.post("/predict_pw_ridge/")
def predict_pw_ridge(
    pw_lag1: float,
    pw_lag2: float,
    pw_lag3: float,
    ztd_lag1: float,
    pw_era5_lag1: float,
    hour: int,
    day: int,
    month: int,
):
    global ridge_pw_model
    if ridge_pw_model is None:
        raise HTTPException(status_code=500, detail="Ridge PW model not loaded.")
    X = np.array([[pw_lag1, pw_lag2, pw_lag3, ztd_lag1, pw_era5_lag1, hour, day, month]], dtype=float)
    pw_pred = ridge_pw_model.predict(X)
    return {"pw_pred": float(pw_pred[0])}


# Upload stations
@app.post("/upload_stations/")
def upload_stations(file: UploadFile = File(...)):
    global stations_df
    try:
        if file.filename.endswith(".csv"):
            stations_df = pd.read_csv(file.file)
        elif file.filename.endswith(".json"):
            stations_df = pd.read_json(file.file)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")

        if "precipitable_water_column" in stations_df.columns:
            outliers = stations_df[stations_df["precipitable_water_column"] > 100]
            if not outliers.empty:
                stations_df = stations_df[stations_df["precipitable_water_column"] <= 100]
                return {
                    "status": "warning",
                    "message": f"Removed {len(outliers)} rows with unrealistic PW values (>100 kg/m^2)",
                    "columns": list(stations_df.columns),
                }
        return {"status": "success", "columns": list(stations_df.columns)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Upload satellites
@app.post("/upload_satellites/")
def upload_satellites(file: UploadFile = File(...)):
    global satellites_df
    try:
        if file.filename.endswith(".csv"):
            satellites_df = pd.read_csv(file.file)
        elif file.filename.endswith(".json"):
            satellites_df = pd.read_json(file.file)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")
        return {"status": "success", "columns": list(satellites_df.columns)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Satellite geometry
@app.get("/sat_geometry/")
def get_sat_geometry(station_id: str, time: str):
    global satellites_df
    if satellites_df is None:
        raise HTTPException(status_code=400, detail="No satellite geometry uploaded.")
    df = satellites_df[(satellites_df["station_id"] == station_id) & (satellites_df["time"] == time)]
    if df.empty:
        return []
    return df[["sat_id", "elevation_deg", "azimuth_deg"]].to_dict(orient="records")

# Validate (uses gpr_model)
@app.post("/validate/")
def validate(file: UploadFile = File(...)):
    global gpr_model
    if gpr_model is None:
        raise HTTPException(status_code=400, detail="Model not trained.")
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file.file)
        elif file.filename.endswith(".json"):
            df = pd.read_json(file.file)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")

        X = df[["lat", "lon"]].values
        y_true = df["latestZwd"].values
        y_pred = gpr_model.predict(X)
        rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
        mae = float(np.mean(np.abs(y_true - y_pred)))
        bias = float(np.mean(y_pred - y_true))
        n = int(len(y_true))

        per_station = []
        for i, row in df.iterrows():
            zwd_true = float(row["latestZwd"])
            zwd_pred = float(y_pred[i])
            pw_true = float(zwd_to_pw(zwd_true))
            pw_pred = float(zwd_to_pw(zwd_pred))
            per_station.append(
                {
                    "id": row.get("id", str(i)),
                    "lat": float(row["lat"]),
                    "lon": float(row["lon"]),
                    "true_zwd": zwd_true,
                    "pred_zwd": zwd_pred,
                    "error_zwd": zwd_pred - zwd_true,
                    "true_pw": pw_true,
                    "pred_pw": pw_pred,
                    "error_pw": pw_pred - pw_true,
                }
            )

        return {"rmse": rmse, "mae": mae, "bias": bias, "n": n, "per_station": per_station}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
