import Link from 'next/link';
import { TrendingUp, Scan, BarChart2, Bell, FileText, ArrowRight, CheckCircle, Star } from 'lucide-react';

const features = [
  {
    icon: Scan,
    title: 'Escaneo OCR con IA',
    description: 'Fotografía tus tickets y facturas. Gemini 2.5 Flash extrae automáticamente comercio, monto, fecha y artículos.',
    color: 'from-purple-500 to-indigo-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: BarChart2,
    title: 'Categorización Automática',
    description: 'Cada gasto se clasifica inteligentemente en categorías: alimentos, transporte, salud, entretenimiento y más.',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Bell,
    title: 'Alertas de Presupuesto',
    description: 'Define límites por categoría y recibe alertas visuales cuando te acercas o superas tu presupuesto mensual.',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: FileText,
    title: 'Reportes Fiscales',
    description: 'Exporta informes detallados en PDF y CSV para tu declaración de impuestos, con resumen por categoría y período.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
  },
];

const steps = [
  { step: '01', title: 'Escanea tu recibo', desc: 'Sube una foto de tu ticket o factura.' },
  { step: '02', title: 'IA extrae los datos', desc: 'Gemini 2.5 Flash identifica monto, comercio y artículos.' },
  { step: '03', title: 'Controla tus finanzas', desc: 'Visualiza tendencias y recibe alertas de presupuesto.' },
];

const stats = [
  { value: 'Gemini 2.5', label: 'Flash OCR Engine' },
  { value: '10+', label: 'Categorías automáticas' },
  { value: 'PDF + CSV', label: 'Formatos de exportación' },
  { value: '100%', label: 'Privado y local' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#0a0a14]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold">
            Expenser<span className="text-purple-400">Tracker</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-purple-600/30"
          >
            Abrir App <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-600/15 border border-purple-500/30 rounded-full text-sm text-purple-300 mb-8">
            <Star size={12} className="text-yellow-400" />
            Powered by Gemini 2.5 Flash
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            Rastrea tus gastos
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              con Inteligencia Artificial
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Escanea recibos, categoriza gastos automáticamente y controla tu presupuesto.
            Todo con el poder del OCR de IA más avanzado.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-purple-600/40 text-lg"
            >
              Comenzar gratis <ArrowRight size={18} />
            </Link>
            <Link
              href="/expenses?scan=true"
              className="flex items-center gap-2 px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all text-lg"
            >
              <Scan size={18} />
              Escanear recibo
            </Link>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="bg-[#13131f] border border-[#2a2a45] rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/20">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a2e] border-b border-[#2a2a45]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-3 bg-[#0a0a14] rounded px-3 py-1 text-xs text-slate-500">
                localhost:3000/dashboard
              </div>
            </div>
            {/* Dashboard preview content */}
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Gastos del mes', value: '$12,450', icon: '💰', color: 'from-purple-600/30 to-indigo-600/30' },
                { label: 'Presupuesto usado', value: '68%', icon: '📊', color: 'from-emerald-600/30 to-teal-600/30' },
                { label: 'Transacciones', value: '34', icon: '🧾', color: 'from-blue-600/30 to-cyan-600/30' },
                { label: 'Ahorros estimados', value: '$5,550', icon: '🏦', color: 'from-amber-600/30 to-orange-600/30' },
              ].map((card) => (
                <div key={card.label} className={`bg-gradient-to-br ${card.color} border border-white/5 rounded-xl p-3`}>
                  <p className="text-2xl mb-2">{card.icon}</p>
                  <p className="text-xl font-bold text-white">{card.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.label}</p>
                </div>
              ))}
            </div>
            {/* Category bars */}
            <div className="px-6 pb-6 space-y-2">
              {[
                { label: '🍽️ Alimentos', pct: 72, color: 'bg-orange-500' },
                { label: '🚗 Transporte', pct: 45, color: 'bg-blue-500' },
                { label: '🛍️ Compras', pct: 60, color: 'bg-pink-500' },
                { label: '🎬 Entretenimiento', pct: 30, color: 'bg-purple-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-36 text-left">{item.label}</span>
                  <div className="flex-1 bg-[#2a2a45] rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* Glow under preview */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-purple-600/20 blur-2xl rounded-full" />
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-white/5 bg-white/2">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-gradient">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">Todo lo que necesitas</h2>
            <p className="text-slate-400 text-lg">Herramientas poderosas para gestionar tus finanzas personales</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className={`${f.bg} border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group`}>
                <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white/1">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">Cómo funciona</h2>
            <p className="text-slate-400 text-lg">Tres pasos simples para controlar tus gastos</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-600/30">
                  <span className="text-2xl font-black text-white">{s.step}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits list */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">¿Por qué ExpenserTracker?</h2>
            <ul className="space-y-4">
              {[
                'OCR con Gemini 2.5 Flash — el modelo más preciso',
                'Categorización automática inteligente',
                'Alertas en tiempo real al superar presupuesto',
                'Reportes fiscales listos para tu declaración',
                'Exportación en PDF y CSV profesional',
                'Interfaz moderna y fácil de usar',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-semibold text-lg">Ejemplo de OCR</h3>
            <div className="bg-[#13131f] rounded-xl p-4 font-mono text-sm space-y-2">
              <p className="text-slate-500">// Imagen escaneada →</p>
              <p className="text-emerald-400">merchant: &quot;WALMART SUPERCENTER&quot;</p>
              <p className="text-blue-400">date: &quot;2026-04-08&quot;</p>
              <p className="text-amber-400">total: 847.50</p>
              <p className="text-pink-400">category: &quot;food&quot;</p>
              <p className="text-purple-400">confidence: 0.97</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-purple-600/10 rounded-3xl blur-3xl" />
          <div className="relative bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-3xl p-12">
            <h2 className="text-4xl font-bold mb-4">Comienza a ahorrar hoy</h2>
            <p className="text-slate-400 mb-8 text-lg">
              Toma el control total de tus gastos con la tecnología de IA más avanzada.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-purple-600/40 text-lg"
            >
              Ir al Dashboard <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-sm text-slate-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded flex items-center justify-center">
            <TrendingUp size={10} className="text-white" />
          </div>
          <span className="text-slate-400 font-medium">ExpenserTracker</span>
        </div>
        <p>Construido con Next.js · Prisma · Gemini 2.5 Flash · Tailwind CSS</p>
      </footer>
    </div>
  );
}
