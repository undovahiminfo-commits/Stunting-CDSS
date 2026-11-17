/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Menu, Search, Bell, Settings } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hasSearch?: boolean;
}

export default function Header({
  onMenuToggle,
  searchQuery,
  setSearchQuery,
  hasSearch = true,
}: HeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-6 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button Tag */}
        <button
          onClick={onMenuToggle}
          className="md:hidden text-[#3f4850] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Toggle Navigation"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-lg md:text-xl font-extrabold text-[#006194] tracking-tight truncate">
          Stunting Analysis System
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Responsive Search Input field on the right */}
        {hasSearch && (
          <div className="relative w-48 sm:w-60 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707881]" size={16} />
            <input
              type="text"
              placeholder="Cari data klinis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8f9ff] border border-[#bfc7d2] rounded-full py-1.5 pl-10 pr-4 text-xs font-semibold text-[#0b1c30] placeholder-[#707881] focus:outline-none focus:border-[#006194] focus:ring-1 focus:ring-[#006194] transition-all"
            />
          </div>
        )}

        {/* Action button triggers */}
        <div className="flex items-center gap-1.5 border-l border-[#e2e8f0] pl-4">
          <button
            className="p-2 rounded-full text-[#3f4850] hover:bg-slate-50 transition-colors relative"
            title="Notification Centers"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping" />
          </button>
          
          <button
            className="p-2 rounded-full text-[#3f4850] hover:bg-slate-50 transition-colors"
            title="Settings Management"
          >
            <Settings size={18} />
          </button>

          {/* Quick Doctor Profile Card */}
          <div className="w-8 h-8 rounded-full bg-[#cce5ff] text-[#001d31] font-bold text-xs flex items-center justify-center border border-[#bfc7d2] ml-2 shrink-0">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
