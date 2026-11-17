/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, KeyRound } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { nama: string; username: string; role: 'Admin' | 'Petugas' }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('dr. Adi');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState<'Admin' | 'Petugas'>('Petugas');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('ID dan Password wajib diisi.');
      return;
    }

    // Accepting clinical test logins automatically
    setError('');
    onLoginSuccess({
      nama: username === 'dr. Adi' ? 'dr. Adi Pratama, Sp.A' : username,
      username: username.toLowerCase().replace(/\s+/g, '.'),
      role: role,
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-6 antialiased">
      <main className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl border border-[#bfc7d2] p-8 shadow-sm flex flex-col gap-6">
          
          {/* Logo & Clinical Title block */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#e5eeff] flex items-center justify-center mb-4 border border-[#93ccff]">
              <ShieldCheck className="text-[#006194]" size={36} />
            </div>
            <h1 className="text-lg font-bold text-[#006194] leading-tight tracking-tight uppercase">
              Stunting Clinical Decision Support
            </h1>
            <p className="text-xs text-[#3f4850] font-semibold flex items-center gap-1.5 mt-2">
              <KeyRound size={13} className="text-[#006194]" />
              Explainable AI - TreeSHAP Modeler
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          {/* Form Credentials content */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Role select tag */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#0b1c30] uppercase tracking-wider">
                Peran Pengguna (Role)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('Petugas')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    role === 'Petugas'
                      ? 'bg-[#e5eeff] border-[#006194] text-[#006194]'
                      : 'bg-white border-slate-200 text-[#3f4850] hover:bg-slate-50'
                  }`}
                >
                  Petugas Gizi
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Admin')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    role === 'Admin'
                      ? 'bg-[#e5eeff] border-[#006194] text-[#006194]'
                      : 'bg-white border-slate-200 text-[#3f4850] hover:bg-slate-50'
                  }`}
                >
                  Admin CDSS
                </button>
              </div>
            </div>

            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="username">
                Username / Clinician ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707881]" size={16} />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: dr. Adi"
                  required
                  className="w-full bg-white border border-[#bfc7d2] rounded-lg py-3.5 pl-10 pr-4 text-sm font-semibold text-[#0b1c30] focus:outline-none focus:border-[#006194] focus:ring-1 focus:ring-[#006194] transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#0b1c30] uppercase tracking-wider" htmlFor="password">
                Password PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707881]" size={16} />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-[#bfc7d2] rounded-lg py-3.5 pl-10 pr-4 text-sm font-semibold text-[#0b1c30] focus:outline-none focus:border-[#006194] focus:ring-1 focus:ring-[#006194] transition-all"
                />
              </div>
            </div>

            {/* Action Trigger button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#006194] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-lg hover:bg-[#004b73] focus:ring-2 focus:ring-offset-2 focus:ring-[#006194] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Masuk Sistem</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>

          {/* Secure watermark bottom panel */}
          <div className="pt-4 border-t border-[#e2e8f0] text-center">
            <p className="text-[10px] font-bold text-[#707881] flex items-center justify-center gap-1">
              <ShieldCheck size={14} className="text-[#707881]" />
              Secure Clinical Authentication System
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
