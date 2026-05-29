import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/shared/Avatar';

interface PendingPaymentProps {
  onNavigate: (view: string) => void;
}

export const PendingPayment: React.FC<PendingPaymentProps> = ({ onNavigate }) => {
  const { user, logout, updateLocalUserProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [notified, setNotified] = useState(false);

  if (!user) return null;

  const handleCopyAlias = () => {
    navigator.clipboard.writeText("yelcho.prode.mp");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmNotification = () => {
    // Simulated background notification to admin. In local, we set a flag.
    updateLocalUserProfile({
      whatsapp: user.whatsapp // ensures we persist local state
    });
    setNotified(true);
  };

  // WhatsApp helper link
  const whatsappUrl = `https://wa.me/5491158730193?text=Hola%20Felix,%20ya%20te%20transferí%20los%206.000%20Pesos%20para%20el%20Prode.%20Mi%20email%20de%20usuario%20es%20${encodeURIComponent(user.email)}`;

  return (
    <div className="max-w-md mx-auto py-6 px-4">
      
      <div className="bg-brand-card retro-border retro-shadow p-6 rounded-lg relative registration-mark">
        <div className="flex items-center gap-4 border-b-2 border-brand-ink pb-4 mb-4">
          <Avatar photoURL={user.photoURL} name={user.nickname} size="md" />
          <div>
            <h3 className="font-serif text-lg font-bold">¡Hola, {user.nickname}!</h3>
            <span className="inline-block bg-brand-accent/20 text-brand-accent border border-brand-accent px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
              ⏳ Pago Pendiente de Confirmación
            </span>
          </div>
        </div>

        <p className="font-sans text-sm mb-4 leading-normal">
          Para habilitar tu acceso al fixture de predicciones y al pozo del torneo, tenés que realizar la transferencia única de inscripción:
        </p>

        {/* MP Details cards */}
        <div className="bg-brand-bg border-2 border-brand-ink p-4 rounded-md mb-4 space-y-3">
          <div className="flex justify-between items-center text-xs font-mono text-brand-ink">
            <span>Monto del Buy-in:</span>
            <span className="font-bold text-sm text-brand-accent">6.000 Pesos</span>
          </div>
          
          <div className="flex justify-between items-center text-xs font-mono text-brand-ink border-t border-brand-ink/10 pt-2">
            <span>Alias MercadoPago:</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-brand-blue bg-brand-card px-2 py-0.5 rounded border border-brand-ink/20">
                yelcho.prode.mp
              </span>
              <button 
                onClick={handleCopyAlias}
                className="text-brand-accent text-xs font-bold underline cursor-pointer hover:text-brand-accent/80 ml-1"
              >
                {copied ? "¡Copiado! ✓" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="text-[11px] text-brand-ink-muted leading-tight italic pt-2 border-t border-brand-ink/10">
            📌 Beneficiario de la cuenta de MercadoPago: <strong>Felix Blanco</strong>. Por favor poné en el motivo "PRODE MUNDIAL".
          </div>
        </div>

        {/* Multi-step action guides */}
        <div className="space-y-3 mb-6">
          <h4 className="font-mono text-xs font-bold uppercase text-brand-ink border-b border-brand-ink/10 pb-0.5">
            ¿Cómo sigo una vez transferido?
          </h4>
          <ol className="list-decimal list-inside text-xs space-y-2 font-sans pl-1">
            <li>
              Hacé clic en el botón de abajo para notificar a Felix Blanco en Buenos Aires.
            </li>
            <li>
              Mandale tu comprobante por <strong>WhatsApp</strong> para agilizar la habilitación.
            </li>
            <li>
              Una vez que Felix verifique la acreditación de los 6.000 Pesos, se te desbloqueará tu dashboard automáticamente. No necesitás volver a registrarte.
            </li>
          </ol>
        </div>

        <div className="space-y-3">
          {notified ? (
            <div className="bg-brand-win/10 border border-brand-win text-brand-win font-mono text-xs text-center p-3 rounded progress-bar font-bold">
              💪 Notificación enviada. Mandá el comprobante a Felix por WhatsApp para confirmar al instante.
            </div>
          ) : (
            <button
              onClick={handleConfirmNotification}
              className="w-full bg-brand-accent text-brand-bg retro-border retro-shadow py-3 font-display uppercase tracking-wider text-base cursor-pointer hover:translate-y-[-1px] transition-transform"
            >
              Ya transferí, notificar al admin 🚀
            </button>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-brand-win text-brand-bg retro-border retro-shadow py-3 font-display uppercase tracking-wider text-sm cursor-pointer hover:bg-brand-win/90 hover:translate-y-[-1px] transition-transform text-center"
          >
            Enviar Comprobante por WhatsApp 💬
          </a>
        </div>

        <div className="mt-6 pt-4 border-t border-brand-ink/10 flex justify-between items-center">
          <button
            onClick={logout}
            className="text-xs font-mono font-bold text-brand-ink-muted hover:text-brand-ink underline uppercase"
          >
            ← Salir / Cerrar Sesión
          </button>

          {user.isAdmin && (
            <button
              onClick={() => onNavigate('home')}
              className="text-xs font-mono font-bold text-brand-blue hover:text-brand-blue/80 underline uppercase"
            >
              Ir como Admin →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default PendingPayment;
