/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Users, AlertTriangle, CheckCircle, ArrowDown, Scale, Calendar, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CLINICAL_STATS_OVERVIEW, CLINICAL_REPORTS } from '../data';
import { Toddler } from '../types';

interface DashboardProps {
  toddlers: Toddler[];
  onNavigateToTab: (tab: string) => void;
  onExportCsv: () => void;
}

export default function Dashboard({ toddlers, onNavigateToTab, onExportCsv }: DashboardProps) {
  // Compute metrics dynamically from the live toddlers list if any, but reference seeded large population stats too
  const liveCount = toddlers.length;
  const liveStunted = toddlers.filter((t) => t.status_stunting && t.status_stunting !== 'Normal').length;
  const liveNormal = toddlers.filter((t) => t.status_stunting === 'Normal').length;

  // Let's mix our local records gracefully into the big Jeneponto population overview statistics
  const bigTotal = CLINICAL_STATS_OVERVIEW.totalBalita + liveCount;
  const bigStunted = CLINICAL_STATS_OVERVIEW.totalStunted + liveStunted;
  const bigNormal = CLINICAL_STATS_OVERVIEW.totalNotStunted + liveNormal;

  // Formatting large numbers with Indonesian format (dots as thousand separators)
  const formatNum = (num: number) => num.toLocaleString('id-ID');

  // Chart data from report (normal vs stunted across months)
  const chartData = CLINICAL_REPORTS.historicalTrends;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Tab intro header */}
      <div className="flex flex-col sm:flex-row mt-5 justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="mt-5 text-2xl font-bold text-[#0b1c30] tracking-tight">
            Population Overview
          </h3>
          <p className="text-sm text-[#3f4850] mt-4">
            Current screening metrics and analytical insights.
          </p>
        </div>
        
        {/* Quick redirect triggers */}
        <div className="flex gap-2">
          <button
            onClick={() => onNavigateToTab('analisis')}
            className="px-4 py-2 text-xs font-bold text-white bg-[#006194] rounded-lg hover:bg-[#004b73] transition-all"
          >
            Mulai Analisis Baru
          </button>
        </div>
      </div>

      {/* Summary Cards Bento Grid (Matches Screen 1 Bento layout) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Balita Card */}
        <div className="bg-white border border-[#bfc7d2] rounded-xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#3f4850] uppercase tracking-wider">
              Total Balita
            </span>
            <span className="p-2.5 bg-[#cce5ff] text-[#006194] rounded-full">
              <Users size={18} />
            </span>
          </div>
          <div>
            <span className="text-4xl font-extrabold text-[#0b1c30] tracking-tight font-mono">
              {formatNum(bigTotal)}
            </span>
            <span className="text-xs text-[#707881] block mt-1 hover:underline cursor-pointer" onClick={() => onNavigateToTab('balita')}>
              {formatNum(liveCount)} data terdaftar secara lokal
            </span>
          </div>
        </div>

        {/* Total Stunted Card */}
        <div className="bg-white border border-rose-500 rounded-xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-bl-full opacity-60 -z-10" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#3f4850] uppercase tracking-wider">
              Total Stunted
            </span>
            <span className="p-2.5 bg-[#ffdad6] text-rose-600 rounded-full animate-pulse">
              <AlertTriangle size={18} />
            </span>
          </div>
          <div>
            <span className="text-4xl font-extrabold text-rose-600 tracking-tight font-mono">
              {formatNum(bigStunted)}
            </span>
            <span className="text-xs text-rose-700/80 font-semibold block mt-1">
              Rasio stunting {((bigStunted / bigTotal) * 100).toFixed(1)}% dari populasi
            </span>
          </div>
        </div>

        {/* Total Not Stunted Card */}
        <div className="bg-white border border-[#bfc7d2] rounded-xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#3f4850] uppercase tracking-wider">
              Total Not Stunted
            </span>
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full">
              <CheckCircle size={18} />
            </span>
          </div>
          <div>
            <span className="text-4xl font-extrabold text-[#0b1c30] tracking-tight font-mono">
              {formatNum(bigNormal)}
            </span>
            <span className="text-xs text-[#707881] block mt-1">
              {formatNum(bigNormal - CLINICAL_STATS_OVERVIEW.totalNotStunted)} kasus normal lokal dikonfirmasi
            </span>
          </div>
        </div>

      </div>

      {/* Analytical Section Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-white border border-[#bfc7d2] rounded-xl p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#e2e8f0]">
            <div>
              <h4 className="text-base font-bold text-[#0b1c30]">
                Tren Bulanan Kasus Stunting
              </h4>
              <p className="text-xs text-[#707881] mt-0.5">
                Jumlah analisis klinis kumulatif vs kasus yang terklasifikasi sebagai Stunting.
              </p>
            </div>
            <button 
              onClick={onExportCsv}
              className="text-[#006194] hover:bg-[#e5eeff] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> 
              Ekspor CSV
            </button>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#707881" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#707881" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip
                  cursor={{ fill: '#f8f9ff' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-md border border-slate-700 min-w-[120px]">
                          <p className="font-bold border-b border-slate-700 pb-1 mb-1.5 text-center">
                            {payload[0].payload.month} 2024
                          </p>
                          <p className="flex justify-between items-center gap-3">
                            <span className="text-slate-300">Total Analisis:</span>
                            <span className="font-bold">{payload[0].value}</span>
                          </p>
                          <p className="flex justify-between items-center gap-3 text-rose-300">
                            <span>Stunting:</span>
                            <span className="font-bold">{payload[1].value}</span>
                          </p>
                          <p className="flex justify-between items-center gap-3 text-emerald-300 border-t border-slate-700/60 pt-1 mt-1">
                            <span>Rasio Stunting:</span>
                            <span className="font-bold">
                              {(((payload[1].value as number) / (payload[0].value as number)) * 100).toFixed(0)}%
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" name="Total Analisis" fill="#006194" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="stunted" name="Stunting" fill="#ba1a1a" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Factors List Sidebar Card (Matches Screen 1 layout) */}
        <div className="bg-white border border-[#bfc7d2] rounded-xl p-6 flex flex-col shadow-sm">
          <div className="mb-6 pb-4 border-b border-[#e2e8f0]">
            <h4 className="text-base font-bold text-[#0b1c30]">
              Top Risk Factors (Xpath Model)
            </h4>
            <p className="text-xs text-[#757881] mt-0.5">
              Identified determinants from XGBoost TreeSHAP predictions.
            </p>
          </div>

          <div className="flex flex-col gap-4 flex-grow">
            
            {/* Risk Factor 1: Height */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-[#bfc7d2]/60 hover:shadow-inner transition-all duration-200">
              <div className="w-9 h-9 rounded-full bg-[#ffdad6] text-rose-700 flex items-center justify-center font-bold font-mono">
                1
              </div>
              <div className="flex-grow">
                <span className="text-sm font-bold text-[#0b1c30] block">
                  Tinggi Badan (Height)
                </span>
                <span className="text-xs text-[#707881]">
                  Indeks HAZ (TB/U) adalah indikator utama model
                </span>
              </div>
              <span className="text-rose-500 bg-rose-50 p-1.5 rounded-lg">
                <ArrowDown size={16} />
              </span>
            </div>

            {/* Risk Factor 2: Weight */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-[#bfc7d2]/60 hover:shadow-inner transition-all duration-200">
              <div className="w-9 h-9 rounded-full bg-[#ffdcc0] text-[#ac6200] flex items-center justify-center font-bold font-mono">
                2
              </div>
              <div className="flex-grow">
                <span className="text-sm font-bold text-[#0b1c30] block">
                  Berat Badan (Weight)
                </span>
                <span className="text-xs text-[#707881]">
                  Berat/Usia (WAZ) menceritakan riwayat asupan gizi
                </span>
              </div>
              <span className="text-[#ac6200] bg-orange-50 p-1.5 rounded-lg">
                <Scale size={16} />
              </span>
            </div>

            {/* Risk Factor 3: Age */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-[#bfc7d2]/60 hover:shadow-inner transition-all duration-200">
              <div className="w-9 h-9 rounded-full bg-[#e0e3e5] text-[#191c1e] flex items-center justify-center font-bold font-mono">
                3
              </div>
              <div className="flex-grow">
                <span className="text-sm font-bold text-[#0b1c30] block">
                  Usia Anak (Age Month)
                </span>
                <span className="text-xs text-[#707881]">
                  Stunting sangat krusial pada 1000 HPK (0-24 bln)
                </span>
              </div>
              <span className="text-slate-600 bg-slate-100 p-1.5 rounded-lg">
                <Calendar size={16} />
              </span>
            </div>

          </div>

          <button 
            onClick={() => onNavigateToTab('kb')}
            className="w-full mt-6 py-2.5 text-xs font-bold text-[#006194] hover:bg-[#e5eeff] rounded-lg border border-[#bfc7d2] transition-colors"
          >
            Lihat Aturan Intervensi (KB)
          </button>
        </div>

      </div>
    </div>
  );
}
