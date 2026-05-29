import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginProps {
  onNavigate: (view: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg("Debe ingresar correo y contraseña válidos.");
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login(cleanEmail, password);
      setSuccessMsg("¡Ingreso correcto! Cargando tu dashboard...");
      
      setTimeout(() => {
        if (user.paymentStatus === "confirmed") {
          onNavigate('home');
        } else {
          onNavigate('pending-payment');
        }
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Email o contraseña incorrectos. Verificá los datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      
      <div className="bg-brand-card retro-border retro-shadow p-6 rounded-lg relative registration-mark">
        <h2 className="font-serif text-2xl font-bold border-b-2 border-brand-ink pb-2 mb-4 text-center">
          🔑 Ingresar al PRODE
        </h2>

        {errorMsg && (
          <div className="bg-brand-error/20 border-2 border-brand-error text-brand-error font-mono p-3 rounded mb-4 text-xs">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-brand-win/20 border-2 border-brand-win text-brand-win font-mono p-3 rounded mb-4 text-xs">
            🎉 {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase mb-1 text-brand-ink">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-base border-2 border-brand-ink p-2 rounded bg-brand-bg font-sans focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-brand-bg"
              placeholder="ejemplo@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase mb-1 text-brand-ink">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-base border-2 border-brand-ink p-2 rounded bg-brand-bg font-sans focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-brand-bg"
              placeholder="******"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-accent text-brand-bg retro-border retro-shadow py-3 font-display uppercase tracking-wider text-base cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "Ingresando... ⏳" : "Iniciar Sesión 🚀"}
          </button>

          <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-brand-ink/10 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('welcome')}
              className="font-mono font-bold uppercase underline text-brand-ink-muted hover:text-brand-ink"
            >
              ← Volver
            </button>
            
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="font-mono font-bold uppercase underline text-brand-accent hover:text-brand-accent/80"
            >
              ¿No tenés cuenta? Registrate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Login;
