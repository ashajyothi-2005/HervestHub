

import os
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import (
    r2_score,
    mean_absolute_error,
    mean_squared_error
)


# ============================================================
# 1. LOAD DATASET
# ============================================================

print("Loading Wage & Labour Demand dataset...")

df = pd.read_csv(
    "datasets/wage_demand_forecast_data.csv"
)

print(f"Dataset Shape: {df.shape}")


# ============================================================
# 2. SPLIT DATE AND MANDI SEASON
# ============================================================

df[['Date', 'Mandi_Season']] = df[
    'Date / Mandi_Season'
].str.split(
    ' / ',
    expand=True
)

df['Date'] = pd.to_datetime(df['Date'])

df = df.drop(
    columns=['Date / Mandi_Season']
)


# ============================================================
# 3. CREATE FEATURES AND TARGETS
# ============================================================

X = df.drop(
    columns=[
        'Market_Wage_Paid',
        'Total_Jobs_Next_Week'
    ]
)

y_wage = df['Market_Wage_Paid']

y_jobs = df['Total_Jobs_Next_Week']


# ============================================================
# 4. CONVERT DATE TO NUMERIC
# ============================================================

X['Date'] = X['Date'].map(
    pd.Timestamp.toordinal
)


# ============================================================
# 5. DEFINE FEATURE TYPES
# ============================================================

categorical_features = [
    'Mandi_Season',
    'Region_ID / District',
    'Crop_Type',
    'Weather_Condition'
]

numeric_features = [
    'Date',
    'Historical_Labour_Demanded',
    'Historical_Labour_Supplied'
]


# ============================================================
# 6. TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_wage_train, y_wage_test, y_jobs_train, y_jobs_test = train_test_split(
    X,
    y_wage,
    y_jobs,
    test_size=0.2,
    random_state=42
)


# ============================================================
# 7. PREPROCESSING PIPELINE
# ============================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            'num',
            StandardScaler(),
            numeric_features
        ),
        (
            'cat',
            OneHotEncoder(
                handle_unknown='ignore',
                drop='first'
            ),
            categorical_features
        )
    ]
)


# ============================================================
# 8. MARKET WAGE MODEL
# ============================================================

wage_model = Pipeline(
    steps=[
        (
            'preprocessor',
            preprocessor
        ),
        (
            'model',
            GradientBoostingRegressor(
                random_state=42
            )
        )
    ]
)


print("\nTraining Market Wage model...")

wage_model.fit(
    X_train,
    y_wage_train
)


# ============================================================
# 9. LABOUR DEMAND MODEL
# ============================================================

jobs_model = Pipeline(
    steps=[
        (
            'preprocessor',
            preprocessor
        ),
        (
            'model',
            GradientBoostingRegressor(
                random_state=42
            )
        )
    ]
)


print("Training Labour Demand model...")

jobs_model.fit(
    X_train,
    y_jobs_train
)


# ============================================================
# 10. EVALUATE MARKET WAGE MODEL
# ============================================================

wage_pred = wage_model.predict(X_test)

wage_r2 = r2_score(
    y_wage_test,
    wage_pred
)

wage_mae = mean_absolute_error(
    y_wage_test,
    wage_pred
)

wage_rmse = np.sqrt(
    mean_squared_error(
        y_wage_test,
        wage_pred
    )
)


# ============================================================
# 11. EVALUATE LABOUR DEMAND MODEL
# ============================================================

jobs_pred = jobs_model.predict(X_test)

jobs_r2 = r2_score(
    y_jobs_test,
    jobs_pred
)

jobs_mae = mean_absolute_error(
    y_jobs_test,
    jobs_pred
)

jobs_rmse = np.sqrt(
    mean_squared_error(
        y_jobs_test,
        jobs_pred
    )
)


# ============================================================
# 12. PRINT RESULTS
# ============================================================

print("\n======================================")
print("       MODEL PERFORMANCE")
print("======================================")

print("\nMarket Wage Model")
print(f"R²   : {wage_r2:.3f}")
print(f"MAE  : {wage_mae:.2f}")
print(f"RMSE : {wage_rmse:.2f}")

print("\nLabour Demand Model")
print(f"R²   : {jobs_r2:.3f}")
print(f"MAE  : {jobs_mae:.2f}")
print(f"RMSE : {jobs_rmse:.2f}")


# ============================================================
# 13. CREATE MODELS DIRECTORY
# ============================================================

os.makedirs(
    "models",
    exist_ok=True
)


# ============================================================
# 14. SAVE MARKET WAGE MODEL
# ============================================================

wage_model_path = (
    "models/market_wage_model.pkl"
)

joblib.dump(
    wage_model,
    wage_model_path
)

print(
    f"\n✓ Market Wage model saved: "
    f"{wage_model_path}"
)


# ============================================================
# 15. SAVE LABOUR DEMAND MODEL
# ============================================================

jobs_model_path = (
    "models/labour_demand_model.pkl"
)

joblib.dump(
    jobs_model,
    jobs_model_path
)

print(
    f"✓ Labour Demand model saved: "
    f"{jobs_model_path}"
)


print("\n======================================")
print("      TRAINING COMPLETED")
print("======================================")

