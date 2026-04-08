'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a14]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center px-4 py-3 bg-[#13131f] border-b border-[#2a2a45]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white mr-3"
          >
            <Menu size={22} />
          </button>
          <span className="text-lg font-bold text-white">
            Expenser<span className="text-purple-400">Tracker</span>
          </span>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-grid">
          {children}
        </main>
      </div>
    </div>
  );
}
