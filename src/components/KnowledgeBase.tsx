/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Search, Plus, Trash2, Edit2, X, AlertCircle } from 'lucide-react';
import { KnowledgeRule } from '../types';

interface KnowledgeBaseProps {
  rules: KnowledgeRule[];
  onAddRule: (newRule: KnowledgeRule) => void;
  onDeleteRule: (id: string) => void;
}

export default function KnowledgeBase({ rules, onAddRule, onDeleteRule }: KnowledgeBaseProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Rules creation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [factor, setFactor] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const filteredRules = rules.filter((r) => {
    return (
      r.faktor_risiko.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rekomendasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.kb_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!factor.trim() || !recommendation.trim()) {
      setFormError('Semua isian kriteria wajib dilengkapi.');
      return;
    }

    const newId = `KB-${String(rules.length + 1).padStart(2, '0')}`;
    const newRuleObj: KnowledgeRule = {
      kb_id: newId,
      faktor_risiko: factor,
      rekomendasi: recommendation,
      notes_keterangan: notes || undefined,
    };

    onAddRule(newRuleObj);

    // Reset and close
    setFactor('');
    setRecommendation('');
    setNotes('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Add Rule button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-5">
        <div>
          <h3 className="text-2xl font-bold mt-5 text-[#0b1c30]">Knowledge Base</h3>
          <p className="text-sm text-[#3f4850] mt-3">
            Manajemen basis aturan pengambilan keputusan klinis (CDSS Knowledge) berdasarkan penafsiran antropometri anak-anak.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0284c7] hover:bg-[#0369a1] text-white mt-5 font-semibold text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-sm self-stretch sm:self-auto justify-center cursor-pointer"
        >
          <Plus size={18} />
          <span>Tambah Aturan Baru</span>
        </button>
      </div>

      {/* Main Content Card Panel */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Top filter toolbar */}
        <div className="p-4 border-b border-[#e2e8f0] bg-slate-50 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari indikator risiko atau rekomendasi intervensi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-lg py-2 pl-10 pr-4 text-xs font-semibold text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#006194]"
            />
          </div>
          <span className="text-xs text-[#707881] font-bold hidden sm:block">
            {filteredRules.length} aturan terdaftar
          </span>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#e2e8f0] text-[#3f4850] text-xs font-bold uppercase tracking-wider">
                <th className="p-4 w-20 text-center">ID</th>
                <th className="p-4 w-60">Indikator Faktor Risiko</th>
                <th className="p-4">Rekomendasi Tindakan / Rujukan Intervensi</th>
                <th className="p-4 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#0b1c30]">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[#707881]">
                    <p className="font-semibold">Aturan sistem pakar tidak ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, idx) => (
                  <tr
                    key={rule.kb_id}
                    className={`border-b border-[#e2e8f0] transition-colors hover:bg-slate-50 ${
                      idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                    }`}
                  >
                    <td className="p-4 text-center font-mono text-xs text-slate-400 font-bold">
                      {rule.kb_id}
                    </td>
                    <td className="p-4 font-bold text-[#006194]">
                      {rule.faktor_risiko}
                      {rule.notes_keterangan && (
                        <span className="block text-[10px] text-emerald-600 font-semibold mt-0.5">
                          {rule.notes_keterangan}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold text-[#3f4850] leading-relaxed">
                      {rule.rekomendasi}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onDeleteRule(rule.kb_id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Aturan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Adding Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#bfc7d2] max-w-lg w-full overflow-hidden shadow-xl animate-scaleUp">
            
            <div className="px-6 py-5 border-b border-[#e2e8f0] bg-slate-5 w-full flex items-center justify-between">
              <h4 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
                <span>Registrasi Aturan Baru</span>
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#707881] hover:text-[#0b1c30] p-1.5 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 animate-shake">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Factor Indicator Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="f-ind">
                  Indikator Faktor Risiko
                </label>
                <input
                  type="text"
                  id="f-ind"
                  value={factor}
                  onChange={(e) => setFactor(e.target.value)}
                  placeholder="Contoh: Height Rendah (< -2 SD)"
                  className="w-full bg-white border border-[#bfc7d2] rounded-lg py-2.5 px-3.5 text-xs font-semibold text-[#0b1c30] focus:border-[#006194]"
                />
              </div>

              {/* Action Recommendation Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="rec-int">
                  Rekomendasi Intervensi
                </label>
                <textarea
                  id="rec-int"
                  rows={4}
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="Deskripsikan saran klinis bagi puskesmas atau orang tua anak..."
                  className="w-full bg-white border border-[#bfc7d2] rounded-lg py-2.5 px-3.5 text-xs font-semibold text-[#0b1c30] focus:border-[#006194]"
                />
              </div>

              {/* Short subtext label */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="sc-lbl">
                  Label Singkat Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  id="sc-lbl"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Bantuan protein hewani"
                  className="w-full bg-white border border-[#bfc7d2] rounded-lg py-2.5 px-3.5 text-xs font-semibold text-[#0b1c30] focus:border-[#006194]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors border"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#006194] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  Simpan Aturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
