/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Gender = 'Male' | 'Female';

export interface User {
  user_id: string;
  nama: string;
  username: string;
  role: 'Admin' | 'Petugas';
  created_at: string;
}

export interface Toddler {
  balita_id: string; // matches balita_id or UUID
  nama_anak: string;
  gender: Gender;
  age_month: number; // 0 - 59
  weight: number; // kg
  height: number; // cm
  weight_for_age_status: string; // Underweight / Normal / etc.
  zscore_wa: number; // Z-Score W/A
  weight_for_height_status: string; // Normal / Wasted / Severely Wasted
  zscore_wh: number; // Z-Score W/H
  zscore_ha?: number; // Z-Score H/A (Height-for-Age)
  status_stunting?: 'Normal' | 'Stunted' | 'Severely Stunted';
  probabilitas?: number; // XGBoost probability (%)
  created_by?: string;
  created_at: string;
}

export interface PredictionResult {
  prediksi_id: string;
  balita_id: string;
  probabilitas: number; // 0 - 100%
  status_stunting: 'Normal' | 'Stunted' | 'Severely Stunted';
  tanggal_prediksi: string;
  shap_results: ShapResult[];
  rekomendasi: string[];
}

export interface ShapResult {
  shap_id: string;
  prediksi_id: string;
  feature_name: string;
  shap_value: number; // relative impact contribution
  impact_percent: number; // 0 - 100 %
  ranking: number;
}

export interface KnowledgeRule {
  kb_id: string;
  faktor_risiko: string;
  rekomendasi: string;
  notes_keterangan?: string;
}

export interface LogAnalisis {
  log_id: string;
  user_id: string;
  username: string;
  balita_id: string;
  nama_anak: string;
  waktu_analisis: string;
  status_stunting: string;
}
