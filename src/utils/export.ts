/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Toddler, KnowledgeRule } from '../types';

/**
 * Downloads clinical stunting records as a CSV spreadsheet
 */
export function exportToddlersToCsv(toddlers: Toddler[]) {
  const headers = [
    'No',
    'Nama Anak',
    'Gender',
    'Usia (Bulan)',
    'Berat Badan (kg)',
    'Tinggi Badan (cm)',
    'Status Berat/Usia (WAZ)',
    'Z-Score WAZ',
    'Status Berat/Tinggi (WHZ)',
    'Z-Score WHZ',
    'Z-Score HAZ',
    'Status Stunting',
    'Tanggal Pendaftaran'
  ];

  const rows = toddlers.map((t, idx) => [
    idx + 1,
    `"${t.nama_anak.replace(/"/g, '""')}"`,
    t.gender === 'Male' ? 'Laki-Laki' : 'Perempuan',
    t.age_month,
    t.weight,
    t.height,
    `"${t.weight_for_age_status || 'Normal'}"`,
    t.zscore_wa,
    `"${t.weight_for_height_status || 'Normal'}"`,
    t.zscore_wh,
    t.zscore_ha || '-',
    `"${t.status_stunting || 'Normal'}"`,
    new Date(t.created_at).toLocaleDateString('id-ID')
  ]);

  const csvContent = '\uFEFF' // adding BOM to preserve Indonesian special symbols in Excel
    + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Data_Balita_CDSS_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports Knowledge Base Rules as a CSV
 */
export function exportRulesToCsv(rules: KnowledgeRule[]) {
  const headers = ['ID', 'Faktor Risiko', 'Rekomendasi Intervensi'];
  const rows = rules.map((r, idx) => [
    r.kb_id,
    `"${r.faktor_risiko.replace(/"/g, '""')}"`,
    `"${r.rekomendasi.replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Sistem_Pakar_Aturan_Intervensi_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
