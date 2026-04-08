'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, TrendingUp, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
      
      <Link href="/" className="mb-8 flex items-center justify-center gap-2 group z-10">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
          <TrendingUp size={20} className="text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">
          Expenser<span className="text-primary">Tracker</span>
        </span>
      </Link>

      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl p-8 z-10 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-2">Bienvenido de vuelta</h1>
        <p className="text-muted text-sm mb-6">Ingresa tus credenciales para acceder a tu cuenta.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
              title="Debe incluir un '@' y un dominio válido"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-input-bg border border-border focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-foreground text-sm outline-none transition-all"
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-input-bg border border-border focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 pr-10 text-foreground text-sm outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-purple-600/30 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? 'Iniciando sesión...' : 'Ingresar a mi cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-8">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
