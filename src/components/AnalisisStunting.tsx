/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Users, Activity, ShieldAlert, Award, FileText, CheckCircle2, 
  ArrowLeft, Download, Plus, CheckSquare, Square, ChevronRight, HelpCircle 
} from 'lucide-react';
import { Toddler, Gender } from '../types';
import { calculateZScores, runXGBoostInference } from '../utils/math';

interface AnalisisStuntingProps {
  toddlers: Toddler[];
  selectedToddlerFromList: Toddler | null;
  clearSelection: () => void;
  onAddToddler: (t: Toddler) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function AnalisisStunting({
  toddlers,
  selectedToddlerFromList,
  clearSelection,
  onAddToddler,
  onNavigateToTab,
}: AnalisisStuntingProps) {
  // Navigation phase: 'FORM' | 'RESULTS'
  const [phase, setPhase] = useState<'FORM' | 'RESULTS'>('FORM');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Form State
  const [selectedToddlerId, setSelectedToddlerId] = useState<string>('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [age, setAge] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');

  // Live calculated Z-Scores & statuses on frontend
  const [zha, setZha] = useState<number>(0);
  const [zwa, setZwa] = useState<number>(0);
  const [zwh, setZwh] = useState<number>(0);
  const [wfaStatus, setWfaStatus] = useState('Normal');
  const [wfhStatus, setWfhStatus] = useState('Normal');

  // Prediction Results State
  const [probValue, setProbValue] = useState<number>(0);
  const [stuntingStatus, setStuntingStatus] = useState<'Normal' | 'Stunted' | 'Severely Stunted'>('Normal');
  const [shaps, setShaps] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [checkedInterventions, setCheckedInterventions] = useState<boolean[]>([]);

  // Monitor toddler dropdown changes to populate fields easily
  useEffect(() => {
    if (selectedToddlerId) {
      const match = toddlers.find((t) => t.balita_id === selectedToddlerId);
      if (match) {
        setName(match.nama_anak);
        setGender(match.gender);
        setAge(match.age_month);
        setWeight(match.weight);
        setHeight(match.height);
      }
    }
  }, [selectedToddlerId, toddlers]);

  // Handle passed trigger from toddler list
  useEffect(() => {
    if (selectedToddlerFromList) {
      setName(selectedToddlerFromTotal().nama_anak);
      setGender(selectedToddlerFromTotal().gender);
      setAge(selectedToddlerFromTotal().age_month);
      setWeight(selectedToddlerFromTotal().weight);
      setHeight(selectedToddlerFromTotal().height);
      setSelectedToddlerId(selectedToddlerFromList.balita_id);
      
      // Auto run prediction
      handleRunPrediction(selectedToddlerFromTotal().nama_anak, selectedToddlerFromTotal().gender, selectedToddlerFromTotal().age_month, selectedToddlerFromTotal().weight, selectedToddlerFromTotal().height);
    }
    
    function selectedToddlerFromTotal() {
      return selectedToddlerFromList!;
    }
  }, [selectedToddlerFromList]);

  // Utility to live calculate Z score values on user keystrokes
  useEffect(() => {
    if (age !== '' && weight !== '' && height !== '') {
      const { zscore_ha, zscore_wa, zscore_wh, weight_for_age_status, weight_for_height_status } =
        calculateZScores(gender, Number(age), Number(weight), Number(height));
      setZha(zscore_ha);
      setZwa(zscore_wa);
      setZwh(zscore_wh);
      setWfaStatus(weight_for_age_status);
      setWfhStatus(weight_for_height_status);
    } else {
      setZha(0);
      setZwa(0);
      setZwh(0);
      setWfaStatus('Harap lengkapi parameter');
      setWfhStatus('Harap lengkapi parameter');
    }
  }, [gender, age, weight, height]);

  const handleRunPrediction = async (
    cName = name,
    cGender = gender,
    cAge = age,
    cWeight = weight,
    cHeight = height
  ) => {
    if (!cName.trim() || cAge === '' || cWeight === '' || cHeight === '') {
      alert('Mohon lengkapi semua isian parameter pertumbuhan terlebih dahulu.');
      return;
    }

    const numericAge = Number(cAge);
    const numericWeight = Number(cWeight);
    const numericHeight = Number(cHeight);

    try {
      setIsAnalyzing(true);

      const res = await fetch('/api/prediksi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama_anak: cName,
          gender: cGender,
          age_month: numericAge,
          weight: numericWeight,
          height: numericHeight,
        }),
      });

      if (!res.ok) {
        throw new Error('API backend returned a non-ok response status');
      }

      const inference = await res.json();

      setProbValue(inference.probabilitas);
      setStuntingStatus(inference.stunting_status as any);
      setShaps(inference.shap_results);
      setRecommendations(inference.rekomendasi);
      setCheckedInterventions(new Array(inference.rekomendasi.length).fill(false));
      
      // Save locally/federated to toddler database if not already saved
      const alreadySaved = toddlers.some((t) => t.nama_anak.toLowerCase() === cName.toLowerCase() && t.age_month === numericAge);
      if (!alreadySaved) {
        const generatedId = `PT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        onAddToddler({
          balita_id: generatedId,
          nama_anak: cName,
          gender: cGender,
          age_month: numericAge,
          weight: numericWeight,
          height: numericHeight,
          weight_for_age_status: wfaStatus,
          zscore_wa: zwa,
          weight_for_height_status: wfhStatus,
          zscore_wh: zwh,
          zscore_ha: zha,
          status_stunting: inference.stunting_status,
          probabilitas: inference.probabilitas,
          created_at: new Date().toISOString(),
        });
      }

      setPhase('RESULTS');
    } catch (err) {
      console.warn('Gagal memproses prediksi via Python backend, menggunakan fallback offline:', err);
      // Fallback local calculations
      const inference = runXGBoostInference(cName, cGender, numericAge, numericWeight, numericHeight);

      setProbValue(inference.probabilitas);
      setStuntingStatus(inference.stunting_status);
      setShaps(inference.shap_results);
      setRecommendations(inference.rekomendasi);
      setCheckedInterventions(new Array(inference.rekomendasi.length).fill(false));
      
      const alreadySaved = toddlers.some((t) => t.nama_anak.toLowerCase() === cName.toLowerCase() && t.age_month === numericAge);
      if (!alreadySaved) {
        const generatedId = `PT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        onAddToddler({
          balita_id: generatedId,
          nama_anak: cName,
          gender: cGender,
          age_month: numericAge,
          weight: numericWeight,
          height: numericHeight,
          weight_for_age_status: wfaStatus,
          zscore_wa: zwa,
          weight_for_height_status: wfhStatus,
          zscore_wh: zwh,
          zscore_ha: zha,
          status_stunting: inference.stunting_status,
          probabilitas: inference.probabilitas,
          created_at: new Date().toISOString(),
        });
      }

      setPhase('RESULTS');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleIntervention = (index: number) => {
    const updated = [...checkedInterventions];
    updated[index] = !updated[index];
    setCheckedInterventions(updated);
  };

  const handleBackToForm = () => {
    clearSelection();
    setPhase('FORM');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {phase === 'FORM' ? (
        <>
          {/* Header Panel */}
          <div>
            <h3 className="text-2xl font-bold text-[#0b1c30]">Input Data Balita</h3>
            <p className="text-sm text-[#3f4850] mt-1">
              Masukkan atau pilih data antropometri balita untuk memicu pengujian performa algoritma XGBoost CDSS.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Selection Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#bfc7d2] p-6 shadow-sm flex flex-col gap-5">
              
              {/* Quick populate option */}
              <div className="pb-4 border-b border-[#e2e8f0] flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                  Muat Cepat dari Database Balita
                </span>
                <select
                  value={selectedToddlerId}
                  onChange={(e) => setSelectedToddlerId(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#bfc7d2] rounded-lg py-2.5 px-3 text-xs font-semibold text-[#3f4850] focus:outline-none focus:border-[#006194]"
                >
                  <option value="">-- Pilih Rekam Medis (Opsional) --</option>
                  {toddlers.map((t) => (
                    <option key={t.balita_id} value={t.balita_id}>
                      {t.nama_anak} ({t.gender === 'Male' ? 'L' : 'P'}, {t.age_month} bln)
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="c-name">
                    Nama Anak
                  </label>
                  <input
                    type="text"
                    id="c-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap anak"
                    className="w-full bg-[#f8f9ff] border border-[#bfc7d2] rounded-lg py-2.5 px-3 text-xs font-semibold text-[#0b1c30] placeholder-slate-400 focus:outline-[#006194]"
                  />
                </div>

                {/* Gender */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                    Jenis Kelamin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`text-xs font-bold py-3 rounded-lg border transition-all ${
                        gender === 'Male'
                          ? 'bg-[#e5eeff] border-[#006194] text-[#006194]'
                          : 'bg-white border-slate-200 text-[#3f4850]'
                      }`}
                    >
                      Laki-Laki (Male)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`text-xs font-bold py-3 rounded-lg border transition-all ${
                        gender === 'Female'
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'bg-white border-slate-200 text-[#3f4850]'
                      }`}
                    >
                      Perempuan (Female)
                    </button>
                  </div>
                </div>

                {/* Age */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="c-age">
                    Umur (Bulan)
                  </label>
                  <input
                    type="number"
                    id="c-age"
                    min={0}
                    max={59}
                    placeholder="Contoh: 24"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#f8f9ff] border border-[#bfc7d2] rounded-lg py-2.5 px-3 text-xs font-semibold text-[#0b1c30] focus:outline-[#006194]"
                  />
                </div>

                {/* Grid Weight & Height */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="c-weight">
                      Berat (kg)
                    </label>
                    <input
                      type="number"
                      id="c-weight"
                      step="0.1"
                      placeholder="0.0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#f8f9ff] border border-[#bfc7d2] rounded-lg py-2.5 px-3 text-xs font-semibold text-[#0b1c30] focus:outline-[#006194]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="c-height">
                      Tinggi (cm)
                    </label>
                    <input
                      type="number"
                      id="c-height"
                      step="0.1"
                      placeholder="0.0"
                      value={height}
                      onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#f8f9ff] border border-[#bfc7d2] rounded-lg py-2.5 px-3 text-xs font-semibold text-[#0b1c30] focus:outline-[#006194]"
                    />
                  </div>
                </div>

              </div>

              {/* Automated Inference button */}
              <div className="border-t border-[#e2e8f0] pt-4 mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRunPrediction()}
                  disabled={isAnalyzing || name === '' || age === '' || weight === '' || height === ''}
                  className="px-6 py-3.5 bg-[#006194] hover:bg-[#004b73] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menjalankan Python Core...</span>
                    </>
                  ) : (
                    <>
                      <Activity size={15} />
                      <span>Jalankan Analisis CDSS</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Calculations preview Sidebar (Matches Screen 3) */}
            <div className="bg-[#e5eeff] rounded-2xl border border-[#93ccff] p-5 flex flex-col gap-4 text-xs select-none">
              <span className="font-bold text-[#006194] border-b border-[#93ccff] pb-2 flex items-center gap-1.5">
                <Activity size={14} className="text-[#006194]" />
                Live WHO Standard Calculator
              </span>

              <div className="flex flex-col gap-3">
                
                {/* W/A status */}
                <div>
                  <span className="text-[10px] font-bold text-[#707881] block uppercase tracking-wider">
                    Status Berat/Usia (WAZ)
                  </span>
                  <span className="text-[#0b1c30] font-bold text-sm block mt-0.5">
                    {wfaStatus}
                  </span>
                </div>

                {/* Z-Score WAZ */}
                <div>
                  <span className="text-[10px] font-bold text-[#707881] block uppercase tracking-wider">
                    Z-Score W/A (Berat/Umur)
                  </span>
                  <span className={`text-sm font-bold block mt-0.5 font-mono ${zwa < -2 ? 'text-rose-600' : 'text-[#0b1c30]'}`}>
                    {zwa !== 0 ? zwa.toFixed(2) : '-'} SD
                  </span>
                </div>

                {/* W/H Status */}
                <div>
                  <span className="text-[10px] font-bold text-[#707881] block uppercase tracking-wider">
                    Status Berat/Tinggi (WHZ)
                  </span>
                  <span className="text-[#0b1c30] font-bold text-sm block mt-0.5">
                    {wfhStatus}
                  </span>
                </div>

                {/* Z-Score WHZ */}
                <div>
                  <span className="text-[10px] font-bold text-[#707881] block uppercase tracking-wider">
                    Z-Score W/H (Berat/Tinggi)
                  </span>
                  <span className={`text-sm font-bold block mt-0.5 font-mono ${zwh < -2 ? 'text-rose-600' : 'text-[#0b1c30]'}`}>
                    {zwh !== 0 ? zwh.toFixed(2) : '-'} SD
                  </span>
                </div>

                {/* HAZ Preview */}
                <div>
                  <span className="text-[10px] font-bold text-[#707881] block uppercase tracking-wider">
                    Z-Score H/A (Tinggi/Umur)
                  </span>
                  <span className={`text-sm font-extrabold block mt-0.5 font-mono ${zha < -2 ? 'text-rose-600 animate-pulse' : 'text-[#0b1c30]'}`}>
                    {zha !== 0 ? zha.toFixed(2) : '-'} SD
                  </span>
                </div>

              </div>

              <div className="mt-4 pt-3 border-t border-[#93ccff]/40 text-[#3f4850] text-[10px] leading-relaxed">
                *Indikator dihitung secara presisi secara real-time berdasarkan Standard Deviasi Tabel Pertumbuhan Anak Organisasi Kesehatan Dunia (WHO).
              </div>
            </div>

          </div>
        </>
      ) : (
        <>
          {/* RESULTS VIEW */}
          {/* Header */}
          <div className="flex flex-col mt-5 sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={handleBackToForm}
              className="px-4 py-2 mt-5 border rounded-lg bg-white font-bold text-xs text-[#006194] hover:bg-slate-50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Ganti Input Parameter</span>
            </button>
            <div className="flex gap-2 w-full sm:w-auto mt-5">
              <button
                onClick={() => window.print()}
                className="flex-1 sm:flex-none px-4 py-2 bg-white border border-[#bfc7d2] rounded-lg text-xs font-bold text-[#0b1c30] hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>Cetak Hasil PDF</span>
              </button>
            </div>
          </div>

          {/* Stunting Alert Warning Banner (Matches Screen 5) */}
          {stuntingStatus !== 'Normal' ? (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-4">
              <span className="p-1 px-2.5 bg-rose-600 text-white rounded-md text-xs font-bold tracking-wider uppercase animate-pulse">
                STUNTED
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-rose-800">
                  Alert Medis: Pasien terklasifikasi sebagai {stuntingStatus === 'Severely Stunted' ? 'Sangat Pendek (Severely Stunted)' : 'Pendek (Stunted)'}
                </h4>
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  Berdasarkan uji klasifikasi XGBoost, nilai tinggi badan anak berada di bawah batas deviasi -2 SD WHO. Mohon tindak lanjuti checklist tindakan klinis di bawah.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start gap-4">
              <span className="p-1 px-2.5 bg-emerald-600 text-white rounded-md text-xs font-bold tracking-wider uppercase">
                NORMAL
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-emerald-800">
                  Alert Medis: Indikator Pertumbuhan Normal
                </h4>
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  Metrik pertumbuhan fisik anak terkonfirmasi normal sesuai jalur target kurva WHO. Dorong orang tua untuk menjaga asupan gizi seimbang.
                </p>
              </div>
            </div>
          )}

          {/* Core Results Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side: Patient metadata & probability circle indicator (Matches Screen 5 columns 1-4) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Profile card */}
              <div className="bg-white border border-[#bfc7d2] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                <div className="w-24 h-24 rounded-full bg-[#f8f9ff] mb-4 flex items-center justify-center border-4 border-white shadow-inner overflow-hidden">
                  <img
                    alt="Toddler Patient Illustration"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcq6y_s8XTTBEnw65bho8IZgrmzCarI6CQ3Xwhuw0dzuBm8hV6YhCo9XUu3B0JOxSQvJoNGvh_10cvR4If7jtJOH2C7MFBE9uGTwjJqYudxUkUKkERHoebekOd_795OqI-KBcpjtdF_I0RtF4oTsTHqldpx2jYQAk66-QAUkiQTMvqLhWTGEguCOcLqIb_TyUoqSsIEYNFkw--s3WseCPdFABYEJe-8FD6dGVitVOHNYJfAUtL4alQyTSC9usppDX7K5EiyHq_fw"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-lg font-extrabold text-[#0b1c30]">{name}</h3>
                <p className="text-xs text-[#707881] font-semibold mt-0.5">
                  {gender === 'Male' ? 'Laki-Laki' : 'Perempuan'} • {age} Bulan
                </p>

                <div className="w-full grid grid-cols-2 gap-3 border-t border-[#e2e8f0] pt-4 mt-5">
                  <div className="bg-[#f8f9ff] p-3 rounded-xl border">
                    <span className="text-[10px] font-bold text-[#707881] block">Tinggi Badan</span>
                    <span className="text-sm font-extrabold text-[#0b1c30] font-mono block mt-1">{height} cm</span>
                  </div>
                  <div className="bg-[#f8f9ff] p-3 rounded-xl border">
                    <span className="text-[10px] font-bold text-[#707881] block">Berat Badan</span>
                    <span className="text-sm font-extrabold text-[#0b1c30] font-mono block mt-1">{weight} kg</span>
                  </div>
                </div>
              </div>

              {/* ML Probability Bar component */}
              <div className="bg-white border border-[#bfc7d2] rounded-2xl p-6 shadow-sm flex flex-col items-center">
                <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-4">
                  Hasil Prediksi Model XGBoost
                </span>

                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-slate-100" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeWidth="8" />
                    <circle
                      className={stuntingStatus !== 'Normal' ? 'text-rose-600' : 'text-emerald-600'}
                      cx="50"
                      cy="50"
                      fill="none"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray="263.8"
                      strokeDashoffset={263.8 - (263.8 * probValue) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-4.5xl font-extrabold tracking-tight font-mono ${stuntingStatus !== 'Normal' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {probValue}%
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-[#707881] font-semibold text-center mt-4">
                  Tingkat Probabilitas Risiko {stuntingStatus === 'Normal' ? 'Rendah (Aman)' : 'Sangat Tinggi (Stunted)'}
                </span>
              </div>

            </div>

            {/* Right side Detailed Analysis factors (TreeSHAP indicators) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* TreeSHAP Explanation Card Panel (Matches Screen 5 right side) */}
              <div className="bg-white border border-[#bfc7d2] rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <div>
                  <h4 className="text-base font-bold text-[#0b1c30]">
                    TreeSHAP Feature Explanation
                  </h4>
                  <p className="text-xs text-[#757881] mt-1 pr-6">
                    Penjelasan model XAI mendistribusikan kontribusi persentase bobot masing-masing fitur antropometri terhadap penetapan probabilitas stunting sebesar {probValue}%.
                  </p>
                </div>

                <div className="flex flex-col gap-5 mt-2">
                  {shaps.map((item, index) => {
                    const isRisk = item.shap_value > 0;
                    const isProtective = item.shap_value < 0;
                    
                    return (
                      <div key={item.feature_name} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
                              <Activity size={14} className={isRisk ? 'text-rose-600' : 'text-emerald-600'} />
                              {item.feature_name}
                            </span>
                            {isRisk && (
                              <span className="inline-flex px-1.5 py-0.5 text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 rounded">
                                Faktor Risiko (Meningkatkan Probabilitas)
                              </span>
                            )}
                            {isProtective && (
                              <span className="inline-flex px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded">
                                Faktor Protektif (Mengurangi Risiko)
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-bold font-mono ${isRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {item.impact_percent}% Kontribusi
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isRisk ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.impact_percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dominant Factors and clinical actionable checklists */}
              <div className="bg-white border border-[#bfc7d2] rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <div>
                  <h4 className="text-base font-bold text-[#0b1c30]">
                    Clinical Decision Support Checklist
                  </h4>
                  <p className="text-xs text-[#757881] mt-1">
                    Berikut intervensi klinis adaptif yang direkomendasikan sistem kepakaran gizi secara otomatis berdasarkan prioritas faktor risiko TreeSHAP:
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {recommendations.map((rec, index) => {
                    const isChecked = checkedInterventions[index];
                    return (
                      <div
                        key={index}
                        onClick={() => toggleIntervention(index)}
                        className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer hover:shadow-inner transition-all flex-row ${
                          isChecked
                            ? 'bg-slate-50 border-slate-200 opacity-60 line-through text-slate-400'
                            : 'bg-[#f8f9ff] border-[#e2e8f0]'
                        }`}
                      >
                        <button
                          type="button"
                          className="pt-0.5 text-[#006194] shrink-0"
                          title="Tandai Tindakan Selesai"
                        >
                          {isChecked ? (
                            <CheckCircle2 className="text-[#0284c7]" size={18} />
                          ) : (
                            <div className="w-[18px] h-[18px] border-2 border-slate-300 rounded" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold leading-relaxed ${isChecked ? 'text-slate-400' : 'text-[#0b1c30]'}`}>
                            {rec}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
