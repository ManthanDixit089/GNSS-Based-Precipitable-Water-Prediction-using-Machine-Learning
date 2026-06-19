/** Interpolate PW at a given lat/lon using KNN */
export async function interpolateKnn(lat: number, lon: number) {
  const res = await fetch(`${BASE_URL}/interpolate_knn/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
/** Get validation metrics for IDW interpolation */
export async function validateIdw() {
  const res = await fetch(`${BASE_URL}/validate_idw/`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
/** Interpolate PW at a given lat/lon using IDW */
export async function interpolateIdw(lat: number, lon: number) {
  const res = await fetch(`${BASE_URL}/interpolate_idw/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
/** Interpolate PW at a given lat/lon using Random Forest */
export async function interpolateRandom(lat: number, lon: number) {
  const res = await fetch(`${BASE_URL}/interpolate_random/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
const BASE_URL = "http://localhost:8000";

/** Helpers */
async function jsonOrThrow(res: Response) {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Upload GNSS station ZWD data */
export async function uploadStations(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/upload_stations/`, {
    method: "POST",
    body: formData,
  });
  return jsonOrThrow(res);
}

/** Upload satellite elevation/azimuth data */
export async function uploadSatellites(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/upload_satellites/`, {
    method: "POST",
    body: formData,
  });
  return jsonOrThrow(res);
}

/** Train the interpolation/model pipeline */
export async function trainModel() {
  const res = await fetch(`${BASE_URL}/train_model/`, { method: "POST" });
  return jsonOrThrow(res);
}

/** Interpolate wet delay/PW at a given lat/lon (backend decides what it returns) */
export async function interpolate(lat: number, lon: number) {
  const url = new URL(`${BASE_URL}/interpolate/`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  const res = await fetch(url);
  return jsonOrThrow(res);
}

/** Predict PW at a location using KNN model */
export async function predictPwKnn(lat: number, lon: number) {
  const res = await fetch(`${BASE_URL}/predict_pw_knn/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon }),
  });
  return jsonOrThrow(res);
}

/** Predict bias using Random Forest model */
export async function predictBiasRf(
  ztd: number,
  lat: number,
  lon: number,
  height: number,
  hour: number,
  day: number,
  month: number,
  season: number
) {
  const res = await fetch(`${BASE_URL}/predict_bias_rf/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ztd, lat, lon, height, hour, day, month, season }),
  });
  return jsonOrThrow(res);
}

/** Validate against third-party observations */
export async function validate(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/validate/`, {
    method: "POST",
    body: formData,
  });
  return jsonOrThrow(res);
}
