/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Search, Filter, Download, Edit2, Trash2, X, AlertCircle, Pencil, Activity } from 'lucide-react';
import { Toddler, Gender } from '../types';
import { calculateZScores, runXGBoostInference } from '../utils/math';

interface DataBalitaProps {
  toddlers: Toddler[];
  onAddToddler: (newToddler: Toddler) => void;
  onDeleteToddler: (id: string) => void;
  onEditSelection: (t: Toddler) => void;
  onExportCsv: () => void;
  onUpdateToddler: (updatedToddler: Toddler) => void;
}

export default function DataBalita({
  toddlers,
  onAddToddler,
  onDeleteToddler,
  onEditSelection,
  onExportCsv,
  onUpdateToddler,
}: DataBalitaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modal registration/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingToddler, setEditingToddler] = useState<Toddler | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [age, setAge] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [modalError, setModalError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleOpenAddModal = () => {
    setEditingToddler(null);
    setName('');
    setGender('Male');
    setAge('');
    setWeight('');
    setHeight('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Toddler) => {
    setEditingToddler(t);
    setName(t.nama_anak);
    setGender(t.gender);
    setAge(t.age_month.toString());
    setWeight(t.weight.toString());
    setHeight(t.height.toString());
    setModalError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setName('');
    setGender('Male');
    setAge('');
    setWeight('');
    setHeight('');
    setModalError('');
    setEditingToddler(null);
    setIsModalOpen(false);
  };

  // Search, Gender and status Filtering
  const filteredToddlers = toddlers.filter((t) => {
    const matchesSearch = t.nama_anak.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.balita_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = selectedGender === 'All' || t.gender === selectedGender;
    const matchesStatus = selectedStatus === 'All' || t.status_stunting === selectedStatus;
    return matchesSearch && matchesGender && matchesStatus;
  });

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const numericAge = parseInt(age);
    const numericWeight = parseFloat(weight);
    const numericHeight = parseFloat(height);

    if (!name.trim()) {
      setModalError('Nama anak harus diisi.');
      return;
    }
    if (isNaN(numericAge) || numericAge < 0 || numericAge > 59) {
      setModalError('Usia wajib berupa angka antara 0 hingga 59 bulan.');
      return;
    }
    if (isNaN(numericWeight) || numericWeight <= 0) {
      setModalError('Berat badan wajib bernilai positif.');
      return;
    }
    if (isNaN(numericHeight) || numericHeight <= 0) {
      setModalError('Tinggi badan wajib bernilai positif.');
      return;
    }

    try {
      setIsRegistering(true);

      // Run clinical calculations
      const { zscore_ha, zscore_wa, zscore_wh, weight_for_age_status, weight_for_height_status } =
        calculateZScores(gender, numericAge, numericWeight, numericHeight);

      // Predict status using XGBoost API with Python
      const res = await fetch('/api/prediksi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama_anak: name,
          gender,
          age_month: numericAge,
          weight: numericWeight,
          height: numericHeight,
        }),
      });

      let stunting_status: 'Normal' | 'Stunted' | 'Severely Stunted' = 'Normal';
      let probabilitas = 15;

      if (res.ok) {
        const inference = await res.json();
        stunting_status = inference.stunting_status;
        probabilitas = inference.probabilitas;
      } else {
        throw new Error('API request failed');
      }

      const generatedId = editingToddler
        ? editingToddler.balita_id
        : `PT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const patientData: Toddler = {
        balita_id: generatedId,
        nama_anak: name,
        gender,
        age_month: numericAge,
        weight: numericWeight,
        height: numericHeight,
        weight_for_age_status,
        zscore_wa,
        weight_for_height_status,
        zscore_wh,
        zscore_ha,
        status_stunting: stunting_status,
        probabilitas,
        created_at: editingToddler ? editingToddler.created_at : new Date().toISOString(),
      };

      if (editingToddler) {
        onUpdateToddler(patientData);
      } else {
        onAddToddler(patientData);
      }

      // Reset fields & Close modal
      setName('');
      setAge('');
      setWeight('');
      setHeight('');
      setEditingToddler(null);
      setIsModalOpen(false);
    } catch (err) {
      console.warn("Gagal memproses prediksi via Python backend, menggunakan fallback offline:", err);
      // Run local clinical calculations fallback
      const { zscore_ha, zscore_wa, zscore_wh, weight_for_age_status, weight_for_height_status } =
        calculateZScores(gender, numericAge, numericWeight, numericHeight);

      const inference = runXGBoostInference(name, gender, numericAge, numericWeight, numericHeight);

      const generatedId = editingToddler
        ? editingToddler.balita_id
        : `PT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const patientData: Toddler = {
        balita_id: generatedId,
        nama_anak: name,
        gender,
        age_month: numericAge,
        weight: numericWeight,
        height: numericHeight,
        weight_for_age_status,
        zscore_wa,
        weight_for_height_status,
        zscore_wh,
        zscore_ha,
        status_stunting: inference.stunting_status,
        probabilitas: inference.probabilitas,
        created_at: editingToddler ? editingToddler.created_at : new Date().toISOString(),
      };

      if (editingToddler) {
        onUpdateToddler(patientData);
      } else {
        onAddToddler(patientData);
      }

      // Reset fields & Close modal
      setName('');
      setAge('');
      setWeight('');
      setHeight('');
      setEditingToddler(null);
      setIsModalOpen(false);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Add Data Button panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-5">
        <div>
          <h3 className="text-2xl mt-5 font-bold text-[#0b1c30]">Data Balita</h3>
          <p className="text-sm text-[#3f4850] mt-1">
            Kelola dan evaluasi data rekam medis pertumbuhan anak secara berkala.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold mt-5 text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-sm self-stretch sm:self-auto justify-center cursor-pointer"
        >
          <Plus size={18} />
          <span>Tambah Data Balita</span>
        </button>
      </div>

      {/* Main Table Controls & Filters Container */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Table top control bar (Matches Screen 2) */}
        <div className="p-4 border-b border-[#e2e8f0] flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
          
          {/* Search bar inside list control line */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama atau ID balita..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-lg py-2 pl-10 pr-4 text-xs font-semibold text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#006194] focus:ring-1 focus:ring-[#006194] transition-all"
            />
          </div>

          {/* Filtration dropdown selectors */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            
            {/* Gender Switch */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="bg-white border border-[#cbd5e1] rounded-lg py-1.5 px-3 text-xs font-semibold text-[#3f4850] focus:outline-none focus:border-[#006194]"
            >
              <option value="All">Semua Gender</option>
              <option value="Male">Laki-Laki</option>
              <option value="Female">Perempuan</option>
            </select>

            {/* Status Switch */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-[#cbd5e1] rounded-lg py-1.5 px-3 text-xs font-semibold text-[#3f4850] focus:outline-none focus:border-[#006194]"
            >
              <option value="All">Semua Kategori</option>
              <option value="Normal">Normal</option>
              <option value="Stunted">Stunted</option>
              <option value="Severely Stunted">Severely Stunted</option>
            </select>

            {/* Export Trigger */}
            <button
              onClick={onExportCsv}
              className="px-4 py-2 border border-[#cbd5e1] bg-white rounded-lg text-xs font-bold text-[#006194] hover:bg-slate-50 flex items-center gap-1.5 shadow-sm ml-auto md:ml-0 cursor-pointer"
            >
              <Download size={14} />
              <span>Ekspor CSV</span>
            </button>
          </div>

        </div>

        {/* Dense Patient Table UI */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#e2e8f0] text-[#3f4850] text-xs font-bold uppercase tracking-wider">
                <th className="p-4 w-12 text-center">No</th>
                <th className="p-4">Identitas Balita</th>
                <th className="p-4">Jenis Kelamin</th>
                <th className="p-4 text-right">Usia (Bulan)</th>
                <th className="p-4 text-right">Berat (kg)</th>
                <th className="p-4 text-right">Tinggi (cm)</th>
                <th className="p-4 text-center">Status Gizi</th>
                <th className="p-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#0b1c30]">
              {filteredToddlers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#707881]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={36} className="text-[#bfc7d2]" />
                      <p className="font-semibold">Tidak ada rekam medis medis yang cocok.</p>
                      <p className="text-xs">Ubah filter pencarian Anda atau tambahkan data balita baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredToddlers.map((t, idx) => {
                  const isStunted = t.status_stunting && t.status_stunting !== 'Normal';
                  return (
                    <tr
                      key={t.balita_id}
                      className={`border-b border-[#e2e8f0] transition-colors group hover:bg-slate-50 ${
                        idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      <td className="p-4 text-center font-mono text-xs text-slate-400 font-semibold">
                        {idx + 1}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-[#006194] block truncate">{t.nama_anak}</span>
                        <span className="text-[10px] font-bold text-[#707881] font-mono block uppercase">
                          {t.balita_id}
                        </span>
                      </td>
                      <td className="p-4">
                        {t.gender === 'Male' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold text-xs border border-blue-100">
                            <span>Laki-Laki</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-100">
                            <span>Perempuan</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-semibold font-mono">{t.age_month}</td>
                      <td className="p-4 text-right font-semibold font-mono">{t.weight.toFixed(1)}</td>
                      <td className="p-4 text-right font-semibold font-mono">{t.height.toFixed(1)}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            t.status_stunting === 'Severely Stunted'
                              ? 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6]'
                              : t.status_stunting === 'Stunted'
                              ? 'bg-amber-50 text-[#ac6200] border border-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}
                        >
                          {t.status_stunting || 'Normal'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="p-1.5 text-[#006194] hover:bg-[#e5eeff] rounded-lg transition-colors"
                            title="Edit Data Balita"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => onEditSelection(t)}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Analisis Lebih Jauh"
                          >
                            <Activity size={15} />
                          </button>
                          <button
                            onClick={() => onDeleteToddler(t.balita_id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Data"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination control panel (Matches Screen 2) */}
        <div className="p-4 border-t border-[#e2e8f0] flex items-center justify-between bg-white text-xs text-[#3f4850] font-semibold">
          <div>
            Menampilkan {filteredToddlers.length} dari {toddlers.length} entri rekaman
          </div>
          <div className="flex gap-1.5">
            <button
              disabled
              className="px-2 py-1 bg-slate-100 text-slate-300 rounded border border-slate-200 cursor-not-allowed text-xs font-semibold"
            >
              Populate
            </button>
          </div>
        </div>

      </div>

      {/* Registration Add/Edit Patient Modal popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#bfc7d2] max-w-lg w-full overflow-hidden shadow-xl animate-scaleUp">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#e2e8f0] bg-slate-5 w-full flex items-center justify-between">
              <h4 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
                <span>{editingToddler ? 'Edit Data Balita' : 'Registrasi Balita Baru'}</span>
              </h4>
              <button
                onClick={handleCloseModal}
                className="text-[#707881] hover:text-[#0b1c30] p-1.5 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form content */}
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              
              {modalError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Name input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="m-name">
                  Nama Lengkap Anak
                </label>
                <input
                  type="text"
                  id="m-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Muhammad Ahmad"
                  className="w-full bg-white border border-[#bfc7d2] rounded-lg py-2.5 px-3.5 text-sm font-semibold text-[#0b1c30] focus:border-[#006194] focus:ring-1 focus:ring-[#006194]"
                />
              </div>

              {/* Gender input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                  Jenis Kelamin
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-2 py-3 px-4 border rounded-lg cursor-pointer transition-all hover:bg-slate-50 font-bold text-xs select-none">
                    <input
                      type="radio"
                      name="m-gender"
                      checked={gender === 'Male'}
                      onChange={() => setGender('Male')}
                      className="text-[#006194] focus:ring-[#006194]"
                    />
                    <span>Laki-Laki (M)</span>
                  </label>
                  <label className="flex items-center justify-center gap-2 py-3 px-4 border rounded-lg cursor-pointer transition-all hover:bg-slate-50 font-bold text-xs select-none">
                    <input
                      type="radio"
                      name="m-gender"
                      checked={gender === 'Female'}
                      onChange={() => setGender('Female')}
                      className="text-[#006194] focus:ring-[#006194]"
                    />
                    <span>Perempuan (F)</span>
                  </label>
                </div>
              </div>

              {/* Age, Weight, Height Grid controls */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="m-age">
                    Usia (Bulan)
                  </label>
                  <input
                    type="number"
                    id="m-age"
                    min={0}
                    max={59}
                    placeholder="0-59"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-white border border-[#bfc7d2] rounded-lg py-2.5 px-3.5 text-sm font-semibold text-[#0b1c30] focus:border-[#006194]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="m-weight">
                    Berat (KG)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="m-weight"
                    placeholder="8.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-white border border-[#bfc7d2] rounded-lg py-2.5 px-3.5 text-sm font-semibold text-[#0b1c30] focus:border-[#006194]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="m-height">
                    Tinggi (CM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="m-height"
                    placeholder="75.0"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-white border border-[#bfc7d2] rounded-lg py-2.5 px-3.5 text-sm font-semibold text-[#0b1c30] focus:border-[#006194]"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  disabled={isRegistering}
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-5 py-2.5 bg-[#006194] hover:bg-[#004b73] text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isRegistering ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingToddler ? 'Simpan Perubahan' : 'Simpan Registrasi'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
