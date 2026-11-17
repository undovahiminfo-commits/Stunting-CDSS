/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DataBalita from './components/DataBalita';
import AnalisisStunting from './components/AnalisisStunting';
import KnowledgeBase from './components/KnowledgeBase';
import Laporan from './components/Laporan';

import { Toddler, KnowledgeRule, LogAnalisis } from './types';
import { INITIAL_TODDLERS, INITIAL_KNOWLEDGE_RULES, INITIAL_LOGS } from './data';
import { exportToddlersToCsv } from './utils/export';

// Firebase Integrasi
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function App() {
  // Session Authentication state
  // Auto login dr. Adi with role Petugas in order to show immediate diagnostic readiness
  const [currentUser, setCurrentUser] = useState<{ nama: string; username: string; role: 'Admin' | 'Petugas' } | null>({
    nama: 'dr. Adi Pratama, Sp.A',
    username: 'dr.adi',
    role: 'Petugas',
  });

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Primary persistent datasets
  const [toddlers, setToddlers] = useState<Toddler[]>([]);
  const [rules, setRules] = useState<KnowledgeRule[]>([]);
  const [logs, setLogs] = useState<LogAnalisis[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selection states (for cross-tab navigation, e.g., edit toddler -> trigger Analysis tab)
  const [selectedToddlerForAnalysis, setSelectedToddlerForAnalysis] = useState<Toddler | null>(null);

  // Initialize and synchronise state datasets from Firebase Firestore
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // 1. Load toddlers from Firestore
        const toddlersCol = collection(db, 'toddlers');
        const toddlersSnapshot = await getDocs(toddlersCol);
        let loadedToddlers: Toddler[] = [];
        if (toddlersSnapshot.empty) {
          // Pertama kali: Seed data rekam medis
          for (const toddler of INITIAL_TODDLERS) {
            await setDoc(doc(db, 'toddlers', toddler.balita_id), toddler);
          }
          loadedToddlers = [...INITIAL_TODDLERS];
        } else {
          toddlersSnapshot.forEach((doc) => {
            loadedToddlers.push(doc.data() as Toddler);
          });
          loadedToddlers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        setToddlers(loadedToddlers);

        // 2. Load knowledge base rules
        const rulesCol = collection(db, 'rules');
        const rulesSnapshot = await getDocs(rulesCol);
        let loadedRules: KnowledgeRule[] = [];
        if (rulesSnapshot.empty) {
          // Pertama kali: Seed aturan pakar gizi
          for (const rule of INITIAL_KNOWLEDGE_RULES) {
            await setDoc(doc(db, 'rules', rule.kb_id), rule);
          }
          loadedRules = [...INITIAL_KNOWLEDGE_RULES];
        } else {
          rulesSnapshot.forEach((doc) => {
            loadedRules.push(doc.data() as KnowledgeRule);
          });
        }
        setRules(loadedRules);

        // 3. Load logs
        const logsCol = collection(db, 'logs');
        const logsSnapshot = await getDocs(logsCol);
        let loadedLogs: LogAnalisis[] = [];
        if (logsSnapshot.empty) {
          // Pertama kali: Seed log aktivitas
          for (const log of INITIAL_LOGS) {
            await setDoc(doc(db, 'logs', log.log_id), log);
          }
          loadedLogs = [...INITIAL_LOGS];
        } else {
          logsSnapshot.forEach((doc) => {
            loadedLogs.push(doc.data() as LogAnalisis);
          });
          loadedLogs.sort((a, b) => new Date(b.waktu_analisis).getTime() - new Date(a.waktu_analisis).getTime());
        }
        setLogs(loadedLogs);

      } catch (error) {
        console.error("Gagal menyinkronkan data dengan Firestore:", error);
        // Fallback ke LocalStorage jika offline atau bermasalah
        const cachedToddlers = localStorage.getItem('stunting_toddlers');
        const cachedRules = localStorage.getItem('stunting_rules');
        const cachedLogs = localStorage.getItem('stunting_logs');

        setToddlers(cachedToddlers ? JSON.parse(cachedToddlers) : INITIAL_TODDLERS);
        setRules(cachedRules ? JSON.parse(cachedRules) : INITIAL_KNOWLEDGE_RULES);
        setLogs(cachedLogs ? JSON.parse(cachedLogs) : INITIAL_LOGS);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // CRUD Actions
  const handleAddToddler = async (newToddler: Toddler) => {
    const updated = [newToddler, ...toddlers];
    setToddlers(updated);
    localStorage.setItem('stunting_toddlers', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'toddlers', newToddler.balita_id), newToddler);
    } catch (err) {
      console.error("Gagal menyimpan balita ke Firestore:", err);
    }

    // Automatically append an action log entry for clinical auditing
    if (currentUser) {
      const newLog: LogAnalisis = {
        log_id: `LOG-ADD-${Date.now()}`,
        user_id: currentUser.username,
        username: currentUser.nama,
        balita_id: newToddler.balita_id,
        nama_anak: newToddler.nama_anak,
        waktu_analisis: new Date().toISOString(),
        status_stunting: newToddler.status_stunting || 'Normal',
      };
      
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('stunting_logs', JSON.stringify(updatedLogs));

      try {
        await setDoc(doc(db, 'logs', newLog.log_id), newLog);
      } catch (err) {
        console.error("Gagal menyimpan log ke Firestore:", err);
      }
    }
  };

  const handleUpdateToddler = async (updatedToddler: Toddler) => {
    const updated = toddlers.map((t) => t.balita_id === updatedToddler.balita_id ? updatedToddler : t);
    setToddlers(updated);
    localStorage.setItem('stunting_toddlers', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'toddlers', updatedToddler.balita_id), updatedToddler);
    } catch (err) {
      console.error("Gagal memperbarui balita di Firestore:", err);
    }

    // Automatically append an action log entry for clinical auditing of updates
    if (currentUser) {
      const newLog: LogAnalisis = {
        log_id: `LOG-UPDATE-${Date.now()}`,
        user_id: currentUser.username,
        username: currentUser.nama,
        balita_id: updatedToddler.balita_id,
        nama_anak: updatedToddler.nama_anak,
        waktu_analisis: new Date().toISOString(),
        status_stunting: `Updated: ${updatedToddler.status_stunting || 'Normal'}`,
      };
      
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('stunting_logs', JSON.stringify(updatedLogs));

      try {
        await setDoc(doc(db, 'logs', newLog.log_id), newLog);
      } catch (err) {
        console.error("Gagal menyimpan log ke Firestore:", err);
      }
    }
  };

  const handleDeleteToddler = async (targetId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data balita ini secara permanen dari database?')) {
      const updated = toddlers.filter((t) => t.balita_id !== targetId);
      setToddlers(updated);
      localStorage.setItem('stunting_toddlers', JSON.stringify(updated));

      try {
        await deleteDoc(doc(db, 'toddlers', targetId));
      } catch (err) {
        console.error("Gagal menghapus balita dari Firestore:", err);
      }
    }
  };

  const handleEditSelectionTrigger = (chosenToddler: Toddler) => {
    setSelectedToddlerForAnalysis(chosenToddler);
    setCurrentTab('analisis');
  };

  const handleAddRule = async (newRule: KnowledgeRule) => {
    const updated = [newRule, ...rules];
    setRules(updated);
    localStorage.setItem('stunting_rules', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'rules', newRule.kb_id), newRule);
    } catch (err) {
      console.error("Gagal menyimpan aturan ke Firestore:", err);
    }
  };

  const handleDeleteRule = async (targetId: string) => {
    if (confirm('Hapus kriteria intervensi pakar ini dari knowledge base sistem?')) {
      const updated = rules.filter((r) => r.kb_id !== targetId);
      setRules(updated);
      localStorage.setItem('stunting_rules', JSON.stringify(updated));

      try {
        await deleteDoc(doc(db, 'rules', targetId));
      } catch (err) {
        console.error("Gagal menghapus aturan dari Firestore:", err);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // If loading data from Firestore, show a premium, polished clinical loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-6 text-slate-800 antialiased font-sans">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="relative flex items-center justify-center w-16 h-16">
            {/* Pulsing Backlight */}
            <div className="absolute inset-0 bg-indigo-500 opacity-20 rounded-full blur-xl animate-pulse"></div>
            {/* Spinning Circle */}
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-slate-900">Menghubungkan ke Firebase</h3>
            <p className="text-sm text-slate-500 font-medium">Sinkronisasi data rekam medis balita...</p>
          </div>
        </div>
      </div>
    );
  }

  // If session is unauthenticated, redirect to Login
  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex text-slate-800 antialiased font-sans">
      {/* Clinician Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isMobileSidebarOpen}
        setIsOpen={setIsMobileSidebarOpen}
      />

      {/* Main Clinical View Container */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Sticky top control panel */}
        <Header
          onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          searchQuery={globalSearchQuery}
          setSearchQuery={setGlobalSearchQuery}
          hasSearch={currentTab === 'balita'}
        />

        <main className="flex-grow p-6 md:p-8 pt-24 max-w-[1280px] w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              toddlers={toddlers}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
              onExportCsv={() => exportToddlersToCsv(toddlers)}
            />
          )}

          {currentTab === 'balita' && (
            <DataBalita
              toddlers={toddlers}
              onAddToddler={handleAddToddler}
              onDeleteToddler={handleDeleteToddler}
              onEditSelection={handleEditSelectionTrigger}
              onExportCsv={() => exportToddlersToCsv(toddlers)}
              onUpdateToddler={handleUpdateToddler}
            />
          )}

          {currentTab === 'analisis' && (
            <AnalisisStunting
              toddlers={toddlers}
              selectedToddlerFromList={selectedToddlerForAnalysis}
              clearSelection={() => setSelectedToddlerForAnalysis(null)}
              onAddToddler={handleAddToddler}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'kb' && (
            <KnowledgeBase
              rules={rules}
              onAddRule={handleAddRule}
              onDeleteRule={handleDeleteRule}
            />
          )}

          {currentTab === 'laporan' && (
            <Laporan
              toddlers={toddlers}
              logs={logs}
              onExportCsv={() => exportToddlersToCsv(toddlers)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
