<<<<<<< HEAD
# GNSS Tropospheric Precipitable Water Interpolation Dashboard

## Problem Statement

This project addresses the challenge of developing a dashboard using AI/ML techniques to interpolate tropospheric Precipitable Water (PW) content using zenith-wet delay (ZWD) from GNSS (Global Navigation Satellite System) observations.

### Background
The troposphere is the lowest layer of Earth's atmosphere and plays a crucial role in weather patterns. It contains most of the atmospheric water vapor (PW), which significantly affects the transmission of GNSS signals. GNSS reference stations, by capturing signals from multiple satellites, can estimate the tropospheric wet content. If the precise coordinates of both the reference station and satellites are known, the GNSS station can compute the zenith-wet delay (ZWD). The ZWD, measured along the line-of-sight of GNSS signals, provides valuable information about the distribution of PW in a region and can be used for weather forecasting and rainfall alerts.

### Detailed Description
- Zenith-wet delay observations are collected over periods ranging from 24 hours to 7 days at multiple GNSS stations.
- Satellite elevation and azimuth data are also provided.
- The challenge is to develop an AI/ML-powered algorithm to interpolate tropospheric wet delay (and thus PW) across a region covered by the GNSS network.

### Solution Requirements
The software solution must:
- Accept zenith-wet delay observations from multiple stations.
- Compute temporal wet delay between stations using satellite elevation and azimuth data.
- Apply AI/ML techniques (e.g., KNN, Random Forest, Ridge Regression, IDW) to improve interpolation accuracy.
- Display results on an interactive dashboard.

### Expected Features
- A dashboard that visualizes interpolated wet delay (PW) at any point in the region.
- Ability to accept third-party wet-delay observations and compute error/validation metrics for the interpolation.
- Extendable algorithms to extrapolate wet delay in regions beyond the GNSS network coverage.

## Project Structure
- **backend/**: FastAPI server for data ingestion, model inference, and interpolation endpoints.
- **frontend/**: Next.js/React dashboard for data upload, visualization, and user interaction.
- **Data/**: Contains sample and raw GNSS observation data. For longer time series, use `Data/sep_to_oct_sample_2_clean.csv` as the main cleaned sample file.
- **model/**: Stores trained AI/ML models.(Pls find it in Google Drive Link for video)
## How to Run
1. Install backend dependencies:
   ```
   pip install -r backend/requirements.txt
   ```
2. Start the backend server:
   ```
   uvicorn backend.main:app --reload
   ```
3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   npm run dev
   ```
4. Access the dashboard at `http://localhost:3000`.

## Solution Approach

This project solves the problem by combining GNSS data processing, AI/ML modeling, and interactive dashboard visualization:

1. **Data Ingestion & Preprocessing**
   - GNSS stations provide zenith-wet delay (ZWD) and satellite geometry (elevation, azimuth) data.
   - Data is cleaned, checked for outliers, and converted to precipitable water (PW) using the Bevis et al. (1994) formula.

2. **Interpolation & Modeling**
   - Multiple AI/ML models (KNN, Random Forest, Ridge Regression) are trained on historical GNSS data to predict PW at unmeasured locations.
   - Inverse Distance Weighting (IDW) is used as a baseline interpolation method.
   - The backend exposes endpoints for each model and for IDW, allowing flexible prediction and validation.

3. **Validation**
   - The system supports leave-one-out cross-validation and error metrics (RMSE, MAE, bias) to assess interpolation accuracy.
   - Users can upload third-party or withheld station data to validate model predictions.

4. **Dashboard Visualization**
   - The frontend dashboard (built with Next.js/React) allows users to upload data, select interpolation methods, and visualize results on a map.
   - Validation metrics and per-station errors are displayed for transparency and model assessment.

5. **Extensibility**
   - The modular backend and frontend design allows easy addition of new models, data sources, or visualization features.
   - The system can be extended to extrapolate PW in regions beyond the current GNSS network.

This approach ensures accurate, explainable, and interactive interpolation of tropospheric PW using state-of-the-art AI/ML and geospatial techniques.

## Hackathon Notes
- The project is designed for rapid prototyping and experimentation.
---

For questions or contributions, please open an issue or pull request.
=======
# GNSS-Based-Precipitable-Water-Prediction-using-Machine-Learning
Developed a machine learning framework for predicting atmospheric Precipitable Water (PW) using GNSS-derived Zenith Total Delay (ZTD), spatial coordinates, and temporal features. Implemented Random Forest, XGBoost, time-series forecasting, and spatial interpolation techniques for meteorological analysis.
>>>>>>> 79076da75373a4e90106ea2d20822e4084b9daf8
