"""
Habulator FastAPI backend
=========================
Serves phytoplankton biovolume predictions via XGBoost + Conformal Prediction.

Startup artifacts (loaded once):
  ediat_model.json              — XGBoost booster (saved with model.save_model())
  ediat_conformal_scores.json   — list of calibration nonconformity scores
  ediat_webapp_config.json      — smearing_factor + feature stats

Expected JSON keys in ediat_webapp_config.json:
  {
    "smearing_factor": <float>,   // Duan smearing estimate (mean(exp(residuals)))
    "alpha": 0.10                 // target miscoverage rate (default 10% → 90% CI)
  }
"""

from __future__ import annotations

import json
import logging
import math
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import numpy as np
import shap
import xgboost as xgb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
log = logging.getLogger("habulator")

# ─── Constants ────────────────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).parent

FEATURES = [
    "TEMP",
    "TP",
    "SI",
    "NO23",
    "Secchi_m",
    "STN_DEPTH_M",
    "DOY_sin",
    "DOY_cos",
    "NP_ratio",
]

FEAT_LABELS: dict[str, str] = {
    "TEMP": "Temperature",
    "TP": "Total Phosphorus",
    "SI": "Silica",
    "NO23": "Nitrate + Nitrite",
    "Secchi_m": "Secchi Depth",
    "STN_DEPTH_M": "Station Depth",
    "DOY_sin": "Seasonality (sin)",
    "DOY_cos": "Seasonality (cos)",
    "NP_ratio": "N:P Ratio",
}

# Input validation bounds (same as frontend)
INPUT_BOUNDS: dict[str, tuple[float, float]] = {
    "TEMP": (0.0, 30.0),
    "TP": (0.1, 200.0),
    "SI": (0.0, 5.0),
    "NO23": (0.0, 3.0),
    "Secchi_m": (0.1, 40.0),
    "STN_DEPTH_M": (1.0, 400.0),
    "DOY": (1.0, 365.0),
}

# ─── Global model state ───────────────────────────────────────────────────────
class ModelState:
    booster: xgb.Booster | None = None
    explainer: shap.TreeExplainer | None = None
    conformal_quantile: float = 0.5  # log-scale symmetric quantile
    smearing_factor: float = 1.0
    alpha: float = 0.10


_state = ModelState()


def _load_artifacts() -> None:
    """Load all model artifacts from disk. Called once at startup."""
    model_path = MODEL_DIR / "ediat_model.json"
    scores_path = MODEL_DIR / "ediat_conformal_scores.json"
    config_path = MODEL_DIR / "ediat_webapp_config.json"

    # ── XGBoost model ──
    if not model_path.exists():
        log.warning(
            "ediat_model.json not found — running in DEMO mode with random weights"
        )
        _state.booster = _build_demo_booster()
    else:
        booster = xgb.Booster()
        booster.load_model(str(model_path))
        _state.booster = booster
        log.info("Loaded XGBoost model from %s", model_path)

    # ── SHAP explainer ──
    _state.explainer = shap.TreeExplainer(_state.booster)
    log.info("SHAP TreeExplainer ready")

    # ── Conformal scores ──
    if scores_path.exists():
        with scores_path.open() as f:
            raw_scores: list[float] = json.load(f)
        scores_arr = np.array(raw_scores, dtype=float)
        alpha = _state.alpha
        # Conformal quantile: ceil((n+1)(1−α)) / n — use numpy percentile approx
        n = len(scores_arr)
        q_level = np.ceil((n + 1) * (1 - alpha)) / n * 100
        q_level = float(np.clip(q_level, 0, 100))
        _state.conformal_quantile = float(np.percentile(scores_arr, q_level))
        log.info(
            "Conformal quantile (α=%.2f): %.4f  (n=%d scores)",
            alpha,
            _state.conformal_quantile,
            n,
        )
    else:
        log.warning(
            "ediat_conformal_scores.json not found — using fallback quantile 0.5"
        )
        _state.conformal_quantile = 0.5

    # ── Webapp config ──
    if config_path.exists():
        with config_path.open() as f:
            cfg: dict[str, Any] = json.load(f)
        _state.smearing_factor = float(cfg.get("smearing_factor", 1.0))
        _state.alpha = float(cfg.get("alpha", 0.10))
        log.info(
            "Config loaded — smearing_factor=%.4f  alpha=%.2f",
            _state.smearing_factor,
            _state.alpha,
        )
    else:
        log.warning("ediat_webapp_config.json not found — using defaults")


def _build_demo_booster() -> xgb.Booster:
    """
    Build a minimal XGBoost booster trained on synthetic data for demo/dev mode.
    This is only used when ediat_model.json is absent.
    """
    rng = np.random.default_rng(42)
    n = 500
    X = rng.uniform(
        low=[0, 0.1, 0, 0, 0.1, 1, -1, -1, 0],
        high=[30, 200, 5, 3, 40, 400, 1, 1, 30],
        size=(n, len(FEATURES)),
    )
    # Synthetic log-biovolume: roughly correlated with TEMP and TP
    y = (
        0.04 * X[:, 0]          # TEMP
        + 0.008 * X[:, 1]       # TP
        - 0.05 * X[:, 4]        # Secchi (negative — clearer → less)
        + 0.5
        + rng.normal(0, 0.4, n)
    )
    dtrain = xgb.DMatrix(X, label=y, feature_names=FEATURES)
    params = {
        "max_depth": 4,
        "eta": 0.1,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "seed": 42,
        "verbosity": 0,
    }
    booster = xgb.train(params, dtrain, num_boost_round=80, verbose_eval=False)
    log.info("Demo booster trained on synthetic data (%d samples)", n)
    return booster


# ─── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_artifacts()
    yield
    log.info("Habulator API shutting down")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Habulator API",
    description="Great Lakes phytoplankton biovolume prediction — XGBoost + Conformal Prediction",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Vercel frontend + local dev
_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://habulator.vercel.app",
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_origin_regex=r"https://habulator.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Accept"],
)


# ─── Schemas ──────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    group: str = Field(default="EDIAT", description="Phytoplankton group ID")
    TEMP: float = Field(..., description="Water temperature (°C)")
    TP: float = Field(..., description="Total phosphorus (µg/L)")
    SI: float = Field(..., description="Silica (mg/L)")
    NO23: float = Field(..., description="Nitrate + nitrite (mg/L)")
    Secchi_m: float = Field(..., description="Secchi depth (m)")
    STN_DEPTH_M: float = Field(..., description="Station depth (m)")
    DOY: int = Field(..., description="Day of year (1–365)")

    @field_validator("TEMP")
    @classmethod
    def val_temp(cls, v: float) -> float:
        lo, hi = INPUT_BOUNDS["TEMP"]
        if not (lo <= v <= hi):
            raise ValueError(f"TEMP must be between {lo} and {hi} °C")
        return v

    @field_validator("TP")
    @classmethod
    def val_tp(cls, v: float) -> float:
        lo, hi = INPUT_BOUNDS["TP"]
        if not (lo <= v <= hi):
            raise ValueError(f"TP must be between {lo} and {hi} µg/L")
        return v

    @field_validator("SI")
    @classmethod
    def val_si(cls, v: float) -> float:
        lo, hi = INPUT_BOUNDS["SI"]
        if not (lo <= v <= hi):
            raise ValueError(f"SI must be between {lo} and {hi} mg/L")
        return v

    @field_validator("NO23")
    @classmethod
    def val_no23(cls, v: float) -> float:
        lo, hi = INPUT_BOUNDS["NO23"]
        if not (lo <= v <= hi):
            raise ValueError(f"NO23 must be between {lo} and {hi} mg/L")
        return v

    @field_validator("Secchi_m")
    @classmethod
    def val_secchi(cls, v: float) -> float:
        lo, hi = INPUT_BOUNDS["Secchi_m"]
        if not (lo <= v <= hi):
            raise ValueError(f"Secchi_m must be between {lo} and {hi} m")
        return v

    @field_validator("STN_DEPTH_M")
    @classmethod
    def val_depth(cls, v: float) -> float:
        lo, hi = INPUT_BOUNDS["STN_DEPTH_M"]
        if not (lo <= v <= hi):
            raise ValueError(f"STN_DEPTH_M must be between {lo} and {hi} m")
        return v

    @field_validator("DOY")
    @classmethod
    def val_doy(cls, v: int) -> int:
        if not (1 <= v <= 365):
            raise ValueError("DOY must be between 1 and 365")
        return v


class ShapEntry(BaseModel):
    feature: str
    value: float
    shap: float


class PredictResponse(BaseModel):
    pred_mgL: float
    lower_mgL: float
    upper_mgL: float
    base_val: float
    shap: list[ShapEntry]
    coverage: float
    group: str


class HealthResponse(BaseModel):
    status: str
    model: str
    version: str
    demo_mode: bool


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["meta"])
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model="EDIAT",
        version="1.0.0",
        demo_mode=not (MODEL_DIR / "ediat_model.json").exists(),
    )


@app.post("/predict", response_model=PredictResponse, tags=["prediction"])
async def predict(req: PredictRequest) -> PredictResponse:
    if _state.booster is None or _state.explainer is None:
        raise HTTPException(status_code=503, detail="Model not loaded — try again shortly")

    # ── Derive engineered features ──
    doy_rad = 2 * math.pi * req.DOY / 365.0
    doy_sin = math.sin(doy_rad)
    doy_cos = math.cos(doy_rad)
    np_ratio = req.NO23 / req.TP if req.TP > 0 else 0.0

    raw_values: dict[str, float] = {
        "TEMP": req.TEMP,
        "TP": req.TP,
        "SI": req.SI,
        "NO23": req.NO23,
        "Secchi_m": req.Secchi_m,
        "STN_DEPTH_M": req.STN_DEPTH_M,
        "DOY_sin": doy_sin,
        "DOY_cos": doy_cos,
        "NP_ratio": np_ratio,
    }

    X = np.array([[raw_values[f] for f in FEATURES]], dtype=np.float32)
    dmat = xgb.DMatrix(X, feature_names=FEATURES)

    # ── Point prediction (log scale) ──
    log_hat: float = float(_state.booster.predict(dmat)[0])

    # ── Duan smearing back-transform ──
    # E[Y] ≈ smearing_factor * exp(log_hat)
    # Subtract 1 because the model was trained on log(Y+1) or similar delta-lognormal
    smear = _state.smearing_factor
    pred_raw = smear * math.exp(log_hat)
    pred_mgL = max(0.0, pred_raw - 1.0)  # undo the +1 offset

    # ── Conformal prediction interval ──
    q = _state.conformal_quantile
    lower_raw = smear * math.exp(log_hat - q)
    upper_raw = smear * math.exp(log_hat + q)
    lower_mgL = max(0.0, lower_raw - 1.0)
    upper_mgL = max(0.0, upper_raw - 1.0)

    # Guarantee ordering (numerical safety)
    lower_mgL = min(lower_mgL, pred_mgL)
    upper_mgL = max(upper_mgL, pred_mgL)

    # ── SHAP values ──
    shap_matrix = _state.explainer.shap_values(X)
    # shap_matrix shape: (1, n_features)
    shap_vals: np.ndarray = shap_matrix[0] if shap_matrix.ndim == 2 else shap_matrix
    base_val: float = float(_state.explainer.expected_value)

    shap_entries: list[ShapEntry] = [
        ShapEntry(
            feature=feat,
            value=float(raw_values[feat]),
            shap=float(shap_vals[i]),
        )
        for i, feat in enumerate(FEATURES)
    ]

    # Sort by |shap| descending for nicer display
    shap_entries.sort(key=lambda e: abs(e.shap), reverse=True)

    return PredictResponse(
        pred_mgL=round(pred_mgL, 6),
        lower_mgL=round(lower_mgL, 6),
        upper_mgL=round(upper_mgL, 6),
        base_val=round(base_val, 6),
        shap=shap_entries,
        coverage=round(1.0 - _state.alpha, 2),
        group=req.group,
    )
