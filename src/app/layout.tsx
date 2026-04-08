import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ExpenserTracker — Rastrea tus gastos con IA',
  description: 'Escanea recibos, categoriza gastos automáticamente y controla tu presupuesto con inteligencia artificial.',
  keywords: ['gastos', 'presupuesto', 'OCR', 'facturas', 'finanzas personales'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#0a0a14] text-slate-100 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
