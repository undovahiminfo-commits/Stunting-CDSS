/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Users, HeartPulse, BookOpen, FileSpreadsheet, LogOut } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: { nama: string; role: string; username: string } | null;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentUser,
  onLogout,
  isOpen,
  setIsOpen,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'balita', name: 'Data Balita', icon: Users },
    { id: 'analisis', name: 'Analisis Stunting', icon: HeartPulse },
    { id: 'kb', name: 'Knowledge Base', icon: BookOpen },
    { id: 'laporan', name: 'Laporan', icon: FileSpreadsheet },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-[#e2e8f0] flex flex-col z-40 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Clinician Branding Section */}
        <div className="p-6 border-b border-[#e2e8f0] flex flex-col items-center justify-center pt-8 pb-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 mb-4 overflow-hidden border-2 border-[#e5eeff] flex items-center justify-center shadow-inner">
            <img
              alt="Medical Professional Avatar"
              className="w-full h-full object-cover"
              src="https://www.pngitem.com/pimgs/m/130-1300253_female-user-icon-png-download-user-image-color.png"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#006194]">
            Stunting CDSS
          </h1>
          <p className="text-xs text-[#3f4850] font-medium uppercase tracking-wider mt-0.5">
            {currentUser?.role || 'Clinical Support'}
          </p>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <ul className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setCurrentTab(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all group ${
                      isActive
                        ? 'bg-[#e5eeff] text-[#006194] border-r-4 border-[#006194]'
                        : 'text-[#3f4850] hover:bg-slate-50 hover:text-[#0b1c30]'
                    }`}
                  >
                    <Icon
                      size={19}
                      className={`transition-colors ${
                        isActive ? 'text-[#006194]' : 'text-[#707881] group-hover:text-[#0b1c30]'
                      }`}
                    />
                    <span>{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout Anchors */}
        <div className="p-4 border-t border-[#e2e8f0]">
          <div className="px-4 py-2.5 mb-2 rounded-lg bg-slate-50 text-xs text-[#3f4850] mb-3">
            <span className="block font-bold text-[#0b1c30] truncate">
              {currentUser?.nama || 'Healthcare Worker'}
            </span>
            <span className="block font-medium text-[10px] truncate">
              ID: {currentUser?.username || 'CLINICIAN-02'}
            </span>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all"
          >
            <LogOut size={19} />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
}
