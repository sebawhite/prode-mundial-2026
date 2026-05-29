import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getActiveUsers, getActiveConfig } from '../lib/firebase';

interface PrizesProps {
  onNavigate: (view: string) => void;
}

export const Prizes: React.FC<PrizesProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>(getActiveUsers());
  const [config, setConfig] = useState(getActiveConfig());
  const [copied, setCopied] = useState(false);

  // Listen to live database synchronization updates
  useEffect(() => {
    const handleSync = () => {
      setUsers(getActiveUsers());
      setConfig(getActiveConfig());
    };
    window.addEventListener('prode_data_updated', handleSync);
    return () => window.removeEventListener('prode_data_updated', handleSync);
  }, []);

  if (!user) return null;

  // Calculate dynamic economic metrics based on actual approved users list
  const confirmedCount = users.filter(u => u.paymentStatus === "confirmed").length;
  const pendingCount = users.filter(u => u.paymentStatus === "pending").length;
  
  const totalCollected = confirmedCount * config.buyInAmount;
  const donationAmount = totalCollected * (1 - config.poolPercent);
  const netPrizePool = totalCollected * config.poolPercent;

  const schoolGoal = 300000;
  const schoolProgressPercent = Math.min(100, Math.round((donationAmount / schoolGoal) * 100));

  const prizes = {
    first: netPrizePool * config.prizeDistribution.first,
    second: netPrizePool * config.prizeDistribution.second,
    third: netPrizePool * config.prizeDistribution.third,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(config.paymentAlias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-4 space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card p-4 rounded-lg retro-border retro-shadow">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-ink uppercase tracking-tight flex items-center gap-2">
            💰 Tabla de Premios & Pozo
          </h2>
          <p className="font-mono text-xs text-brand-ink-muted">
            Repaso de las finanzas y distribución oficial del pozo. Todo se recalcula de forma transparente según las inscripciones aprobadas.
          </p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="bg-brand-bg text-brand-ink font-mono text-xs font-bold uppercase retro-border px-3 py-1.5 cursor-pointer hover:bg-brand-card"
        >
          ← Volver
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Dynamic economic status board */}
        <div className="md:col-span-2 bg-brand-card retro-border retro-shadow p-6 rounded-lg relative registration-mark space-y-5">
          <h3 className="font-serif text-xl font-bold text-brand-ink border-b-2 border-brand-ink pb-2">
            📊 Estado del Pozo en Vivo
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-bg p-3 rounded-md border-2 border-brand-ink text-center">
              <span className="block text-[10px] font-mono text-brand-ink-muted uppercase font-bold">Participantes Habilitados</span>
              <span className="font-mono text-2xl font-bold text-brand-ink">
                {confirmedCount}
              </span>
            </div>

            <div className="bg-brand-bg p-3 rounded-md border-2 border-brand-ink text-center">
              <span className="block text-[10px] font-mono text-brand-ink-muted uppercase font-bold">Cobros Pendientes</span>
              <span className="font-mono text-2xl font-bold text-brand-ink-muted">
                {pendingCount}
              </span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs text-brand-ink divide-y divide-brand-ink/10">
            <div className="flex justify-between py-2">
              <span>🎟️ Recaudación Total ({confirmedCount} × ${config.buyInAmount.toLocaleString('es-AR')}):</span>
              <span className="font-bold">${totalCollected.toLocaleString('es-AR')} ARS</span>
            </div>
            
            <div className="flex justify-between py-2 text-brand-blue font-bold">
              <span>🌍 Donación Solidaria Wonderful School ({Math.round((1 - config.poolPercent) * 100)}%):</span>
              <span>${donationAmount.toLocaleString('es-AR')} ARS</span>
            </div>

            <div className="flex justify-between py-2 font-bold text-sm text-brand-accent border-t-2 border-brand-ink">
              <span>🏆 Pozo Neto Final de Premios Ganadores ({Math.round(config.poolPercent * 100)}%):</span>
              <span>${netPrizePool.toLocaleString('es-AR')} ARS</span>
            </div>
          </div>

          {/* Zanzibar Wonderful School Thermometer/Progress Bar */}
          <div className="bg-brand-bg/60 border-2 border-brand-ink p-4 rounded-md space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-sans font-black text-sm text-brand-ink uppercase tracking-tight flex items-center gap-1.5">
                  🇹🇿 Proyecto Solidario Zanzíbar
                </h4>
                <p className="font-sans text-[11px] text-brand-ink-muted mt-0.5 leading-snug">
                  Destinado a la escuela <strong className="text-brand-ink">Wonderful School</strong> para la compra de <strong>Bancos de Madera</strong>.
                </p>
              </div>
              <span className="font-mono text-xs font-black bg-brand-blue text-brand-bg px-2 py-0.5 rounded">
                {schoolProgressPercent}%
              </span>
            </div>

            {/* Visual Progress Bar Wrapper */}
            <div className="space-y-1.5">
              <div className="w-full bg-brand-bg border-2 border-brand-ink h-5 rounded-none overflow-hidden relative p-[2px]">
                <div 
                  className="bg-gradient-to-r from-brand-blue to-brand-accent h-full transition-all duration-500 rounded-none"
                  style={{ width: `${schoolProgressPercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between font-mono text-[10px] font-bold text-brand-ink">
                <span>Recaudado: ${donationAmount.toLocaleString('es-AR')} ARS</span>
                <span>Meta: $300.000 ARS</span>
              </div>
            </div>

            <p className="font-sans text-[10px] text-brand-ink-muted italic leading-normal">
              💡 De cada inscripción de ${config.buyInAmount.toLocaleString('es-AR')}, <strong>${(config.buyInAmount * (1 - config.poolPercent)).toLocaleString('es-AR')} ({Math.round((1 - config.poolPercent) * 100)}%)</strong> se reservan para esta causa escolar. ¡Con las firmas de todos ayudamos a equipar las aulas de los niños en Zanzíbar!
            </p>
          </div>

          {/* Golden distribution breakdown podium */}
          <div className="pt-4 border-t border-brand-ink/10 space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase text-brand-gold tracking-wider">
              🏆 Distribución de Premios
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-brand-bg/50 p-2.5 rounded border border-brand-ink">
                <span className="font-sans font-bold flex items-center gap-1.5">
                  🥇 Puesto 1 (60%)
                </span>
                <span className="font-mono text-base font-bold text-brand-accent">
                  ${prizes.first.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                </span>
              </div>

              <div className="flex items-center justify-between bg-brand-bg/50 p-2.5 rounded border border-brand-ink">
                <span className="font-sans font-bold flex items-center gap-1.5">
                  🥈 Puesto 2 (25%)
                </span>
                <span className="font-mono text-base font-bold text-brand-blue">
                  ${prizes.second.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                </span>
              </div>

              <div className="flex items-center justify-between bg-brand-bg/50 p-2.5 rounded border border-brand-ink">
                <span className="font-sans font-bold flex items-center gap-1.5">
                  🥉 Puesto 3 (15%)
                </span>
                <span className="font-mono text-base font-bold text-brand-ink">
                  ${prizes.third.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar with MP transfer info */}
        <div className="bg-brand-card retro-border retro-shadow p-5 rounded-lg space-y-4">
          <h4 className="font-serif text-base font-bold text-brand-accent border-b border-brand-ink/10 pb-1">
            🏦 Datos MercadoPago
          </h4>
          
          <p className="font-sans text-xs text-brand-ink-muted leading-relaxed">
            Si todavía no transferiste o necesitás pagar la cuenta de algún familiar que inscribiste, podés hacerlo al alias de Felix Blanco:
          </p>

          <div className="bg-brand-bg p-3 border-2 border-brand-ink rounded text-center">
            <span className="block text-[8px] font-mono text-brand-ink-muted uppercase">Alias MercadoPago</span>
            <span className="font-mono font-bold text-sm text-brand-blue break-all">
              {config.paymentAlias}
            </span>
            <button
              onClick={handleCopy}
              className="block mx-auto text-[10px] font-mono font-bold text-brand-accent uppercase underline mt-2 cursor-pointer"
            >
              {copied ? "¡Copiado! ✓" : "Copiar Alias"}
            </button>
          </div>

          <div className="bg-brand-bg p-3 rounded text-[11px] font-sans text-brand-ink-muted italic border-l-4 border-brand-gold space-y-2">
            <p>
              💡 <strong>Aviso:</strong> Enviá el comprobante de pago por WhatsApp para que Felix Blanco apruebe la inscripción de forma inmediata en el sistema.
            </p>
            <div>
              <a 
                href="https://wa.me/5491158730193?text=Hola%20Felix,%20acá%20te%20envío%20el%20comprobante%20del%20Prode."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-brand-win text-brand-bg text-[10px] font-display font-bold uppercase tracking-wider px-2.5 py-1.5 shadow-sm hover:translate-y-[-1px] transition-transform"
              >
                Enviar Comprobante por WhatsApp 💬
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Prizes;
