'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
        <div className="lg:hidden flex items-center px-4 py-3 bg-surface border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-foreground mr-3 transition-colors"
          >
            <Menu size={22} />
          </button>
          <span className="text-lg font-bold text-foreground">
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
