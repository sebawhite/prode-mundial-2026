import React from 'react';

interface WelcomeProps {
  onNavigate: (view: string) => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 max-w-lg mx-auto text-center registration-mark">
      
      <div className="bg-brand-card retro-border retro-shadow p-6 rounded-lg text-brand-ink mb-6 relative">
        <h2 className="font-serif text-2xl font-bold text-center border-b-2 border-brand-ink pb-2 mb-4">
          👋 ¡Te damos la bienvenida al PRODE!
        </h2>
        
        <p className="font-sans text-sm md:text-base leading-relaxed mb-4">
          Sumate a la quiniela privada del <strong>Mundial de Fútbol 2026</strong>. 
          Unite a nuestro círculo cerrado de amigos y familiares para predecir los 72 partidos de la fase de grupos del torneo más apasionante del mundo.
        </p>

        <div className="bg-brand-bg/80 border-2 border-brand-ink p-3 rounded-md mb-4 text-left space-y-2">
          <p className="font-sans text-xs md:text-sm text-brand-ink-muted">
            🏆 Organizado por <strong>Felix Blanco</strong> con un fin doble: diversión competitiva y un propósito noble.
          </p>
          <p className="font-sans text-xs md:text-sm italic text-brand-ink-muted border-t border-brand-ink/10 pt-2">
            🌍 <strong>50% Solidario:</strong> De cada inscripción de $6.000, <strong>$3.000 se donan de forma directa</strong> para comprar bancos de madera para la escuela <strong className="text-brand-blue font-bold">Wonderful School</strong> en Zanzíbar, Tanzania 🇹🇿.
          </p>
          <p className="font-sans text-xs md:text-sm italic text-brand-ink-muted border-t border-brand-ink/10 pt-2">
            🎁 <strong>50% Pozo de Premios:</strong> Los restantes $3.000 se acumulan transparentemente para repartirse íntegramente entre el Top 3 final (1°: 60%, 2°: 25%, 3°: 15%).
          </p>
        </div>

        <div className="border-t border-brand-ink/20 pt-3 text-left font-mono text-xs text-brand-ink space-y-2">
          <div className="flex justify-between">
            <span>🎟️ Inscripción Única:</span>
            <span className="font-bold">6.000 Pesos</span>
          </div>
          <div className="flex justify-between">
            <span>🌍 Causa Solidaria:</span>
            <span className="font-bold text-brand-blue">50% Donación Zanzíbar 🇹🇿</span>
          </div>
          <div className="flex justify-between">
            <span>🏆 Reparto del Pozo:</span>
            <span className="font-bold">1°: 60% | 2°: 25% | 3°: 15% del restante 50%</span>
          </div>
          <div className="flex justify-between">
            <span>⏳ Cierre General:</span>
            <span className="font-bold text-brand-accent">10 Jun 2026 23:59 UTC</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <button
          id="btn-join-prode"
          onClick={() => onNavigate('signup')}
          className="bg-brand-accent text-brand-bg retro-border retro-shadow hover:translate-y-[-2px] transition-all font-display uppercase tracking-wider text-lg px-6 py-3 cursor-pointer"
        >
          Crear mi Cuenta 🚀
        </button>
        
        <button
          id="btn-login-prode"
          onClick={() => onNavigate('login')}
          className="bg-brand-bg text-brand-ink retro-border retro-shadow hover:translate-y-[-2px] transition-all font-display uppercase tracking-wider text-lg px-6 py-3 border-brand-ink cursor-pointer hover:bg-brand-card"
        >
          Ya Tengo Cuenta 🔑
        </button>
      </div>

      <p className="text-[10px] text-brand-ink-muted font-mono mt-8">
        PRODE MUNDIAL - HECHO por Felix Blanco  ⊕ 2026
      </p>
    </div>
  );
};
export default Welcome;
