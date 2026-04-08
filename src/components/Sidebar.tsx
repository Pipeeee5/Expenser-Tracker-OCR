'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  FileBarChart2,
  Scan,
  TrendingUp,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/expenses', icon: Receipt, label: 'Gastos' },
  { href: '/budget', icon: Wallet, label: 'Presupuesto' },
  { href: '/reports', icon: FileBarChart2, label: 'Reportes' },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full w-64 bg-[#13131f] border-r border-[#2a2a45]">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a45]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Expenser<span className="text-purple-400">Tracker</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-purple-400' : ''} />
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* OCR Quick Action */}
      <div className="p-4 border-t border-[#2a2a45]">
        <Link
          href="/expenses?scan=true"
          onClick={onClose}
          className="flex items-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all duration-150"
        >
          <Scan size={16} />
          Escanear Recibo
        </Link>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <p className="text-xs text-slate-600 text-center">
          Powered by Gemini 2.5 Flash
        </p>
      </div>
    </aside>
  );
}
