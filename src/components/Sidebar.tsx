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
  LogOut,
  User,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useSession, signOut } from 'next-auth/react';

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
  const { data: session } = useSession();

  return (
    <aside className="flex flex-col h-full w-64 bg-surface border-r border-border">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">
            Expenser<span className="text-purple-400">Tracker</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-muted hover:text-foreground">
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
                  ? 'bg-purple-600/20 text-purple-600 dark:text-purple-300 border border-purple-500/30'
                  : 'text-muted hover:text-foreground hover:bg-hover-overlay'
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
      <div className="p-4 border-t border-border">
        <Link
          href="/expenses?scan=true"
          onClick={onClose}
          className="flex items-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all duration-150"
        >
          <Scan size={16} />
          Escanear Recibo
        </Link>
      </div>

      {/* User Info & Footer */}
      <div className="px-4 py-3 border-t border-border flex flex-col gap-3">
        {session?.user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center flex-shrink-0">
                {session.user.name?.charAt(0).toUpperCase() || <User size={16} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{session.user.name}</p>
                <p className="text-[10px] text-muted truncate">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="text-muted hover:text-red-500 p-1.5 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted/60">
            Powered by Gemini
          </p>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
