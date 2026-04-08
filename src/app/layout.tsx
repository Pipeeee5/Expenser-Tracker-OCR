import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'ExpenserTracker — Rastrea tus gastos con IA',
  description: 'Escanea recibos, categoriza gastos automáticamente y controla tu presupuesto con inteligencia artificial.',
  keywords: ['gastos', 'presupuesto', 'OCR', 'facturas', 'finanzas personales'],
};

import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased text-sm" suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
