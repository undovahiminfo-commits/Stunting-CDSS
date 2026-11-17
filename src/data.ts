/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Toddler, KnowledgeRule, LogAnalisis } from './types';

// Matching screen 1 and report stats
export const CLINICAL_STATS_OVERVIEW = {
  totalBalita: 40071,
  totalStunted: 16204,
  totalNotStunted: 23867,
  stuntedRate: 40.44, // 16204 / 40071 * 100
};

// Seeding 4 default knowledge base rules (matches Screen 4 & Report Table 3.3)
export const INITIAL_KNOWLEDGE_RULES: KnowledgeRule[] = [
  {
    kb_id: 'KB-01',
    faktor_risiko: 'Height Rendah (< -2 SD)',
    rekomendasi: 'Monitoring Pertumbuhan Intensif (Jadwalkan kunjungan rutin setiap 2 minggu untuk memantau tren TB/BB secara presisi. Gunakan grafik pertumbuhan WHO secara konsisten).',
    notes_keterangan: 'Rujuk ke program gizi puskesmas'
  },
  {
    kb_id: 'KB-02',
    faktor_risiko: 'Weight Rendah (< -2 SD)',
    rekomendasi: 'Konseling Gizi kepada Orang Tua (Edukasi PMBA, tekankan pentingnya protein hewani seperti telur, ikan, daging dalam menu harian).',
    notes_keterangan: 'Konseling gizi terpadu'
  },
  {
    kb_id: 'KB-03',
    faktor_risiko: 'Gizi Buruk / Wasted',
    rekomendasi: 'Evaluasi Nutrisi (Medis) / Rujukan (Pertimbangkan rujukan ke dokter spesialis anak (Sp.A) untuk skrining kondisi penyerta, infeksi kronis, TB, anemia).',
    notes_keterangan: 'Rujukan dokter spesialis anak'
  },
  {
    kb_id: 'KB-04',
    faktor_risiko: 'Fase Emas 1000 HPK (< 24 Mo)',
    rekomendasi: 'Prioritaskan dalam Program Penanganan Stunting (Bantuan makanan tambahan PMT, stimulasi perkembangan psikomotorik, edukasi sanitasi).',
    notes_keterangan: 'Prioritas PMT desa'
  }
];

// Seeding initial patient database records (matches Screen 2 & 5)
export const INITIAL_TODDLERS: Toddler[] = [
  {
    balita_id: 'PT-2023-8942',
    nama_anak: 'Ahmad',
    gender: 'Male',
    age_month: 24,
    weight: 10.2,
    height: 81.5,
    weight_for_age_status: 'Underweight',
    zscore_wa: -2.31,
    weight_for_height_status: 'Normal',
    zscore_wh: -0.88,
    zscore_ha: -2.30,
    status_stunting: 'Stunted',
    probabilitas: 89,
    created_at: '2026-03-12T09:30:00.000Z'
  },
  {
    balita_id: 'PT-2024-1102',
    nama_anak: 'Rina',
    gender: 'Female',
    age_month: 18,
    weight: 10.0,
    height: 82.0,
    weight_for_age_status: 'Normal',
    zscore_wa: 0.12,
    weight_for_height_status: 'Normal',
    zscore_wh: -0.22,
    zscore_ha: 0.10,
    status_stunting: 'Normal',
    probabilitas: 15,
    created_at: '2026-04-18T10:15:00.000Z'
  },
  {
    balita_id: 'PT-2024-4061',
    nama_anak: 'Fadhil',
    gender: 'Male',
    age_month: 36,
    weight: 11.2,
    height: 88.0,
    weight_for_age_status: 'Underweight',
    zscore_wa: -2.10,
    weight_for_height_status: 'Normal',
    zscore_wh: -1.13,
    zscore_ha: -3.20,
    status_stunting: 'Severely Stunted',
    probabilitas: 96,
    created_at: '2026-05-10T14:40:00.000Z'
  },
  {
    balita_id: 'PT-2025-0520',
    nama_anak: 'Siti Nurhaliza',
    gender: 'Female',
    age_month: 12,
    weight: 7.1,
    height: 69.5,
    weight_for_age_status: 'Underweight',
    zscore_wa: -2.05,
    weight_for_height_status: 'Normal',
    zscore_wh: -0.92,
    zscore_ha: -2.15,
    status_stunting: 'Stunted',
    probabilitas: 65,
    created_at: '2026-06-01T08:20:00.000Z'
  },
  {
    balita_id: 'PT-2025-0915',
    nama_anak: 'Zaky Pratama',
    gender: 'Male',
    age_month: 8,
    weight: 8.5,
    height: 72.0,
    weight_for_age_status: 'Normal',
    zscore_wa: 0.50,
    weight_for_height_status: 'Normal',
    zscore_wh: 0.35,
    zscore_ha: 0.40,
    status_stunting: 'Normal',
    probabilitas: 8,
    created_at: '2026-06-15T11:00:00.000Z'
  }
];

// Report data seed for Laporan view (matches Screen 6)
export const CLINICAL_REPORTS = {
  totalAnalyzed: 1520,
  totalStuntedCases: 800,
  historicalTrends: [
    { month: 'Jan', total: 110, stunted: 45 },
    { month: 'Feb', total: 125, stunted: 52 },
    { month: 'Mar', total: 118, stunted: 58 },
    { month: 'Apr', total: 130, stunted: 69 },
    { month: 'May', total: 135, stunted: 72 },
    { month: 'Jun', total: 140, stunted: 80 },
    { month: 'Jul', total: 120, stunted: 62 },
    { month: 'Aug', total: 115, stunted: 53 },
    { month: 'Sep', total: 118, stunted: 55 },
    { month: 'Oct', total: 132, stunted: 68 },
    { month: 'Nov', total: 135, stunted: 70 },
    { month: 'Dec', total: 142, stunted: 80 }
  ]
};

// Activity log tracking elements
export const INITIAL_LOGS: LogAnalisis[] = [
  {
    log_id: 'LOG-001',
    user_id: 'USR-02',
    username: 'dr. Adi',
    balita_id: 'PT-2023-8942',
    nama_anak: 'Ahmad',
    waktu_analisis: '2026-06-22T08:34:11.000Z',
    status_stunting: 'Stunted'
  },
  {
    log_id: 'LOG-002',
    user_id: 'USR-02',
    username: 'dr. Adi',
    balita_id: 'PT-2024-1102',
    nama_anak: 'Rina',
    waktu_analisis: '2026-06-22T09:12:44.000Z',
    status_stunting: 'Normal'
  }
];
