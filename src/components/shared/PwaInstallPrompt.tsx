import React, { useState, useEffect } from 'react';

export const PwaInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isMac, setIsMac] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Detect if the app is already running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Check if the user has previously dismissed the prompt
    const isDismissed = localStorage.getItem('prode_pwa_prompt_dismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // 3. Detect iOS Safari user agent
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|opr|mobilesafari/.test(userAgent);
    const detectedIOS = isAppleDevice && isSafari;
    setIsIOS(detectedIOS);

    // 4. Detect Desktop / Laptop browsers
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    setIsDesktop(!isMobile);
    setIsMac(/macintosh|mac os x/.test(userAgent));

    // 5. Delay showing the prompt by 3.5 seconds for a smoother entrance on all devices
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3500);

    // Listen for the Android native installation prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('prode_pwa_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    
    // Show the native browser install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Reset deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-sm z-50 animate-bounce-once">
      <div className="bg-brand-ink text-brand-bg p-5 border-3 border-brand-bg shadow-[6px_6px_0px_#2a1f17] relative retro-border">
        {/* Registration mark overlays for vintage aesthetics */}
        <div className="absolute top-1 left-2 text-[7px] text-brand-bg/30 font-mono select-none">⊕ PWA_ACCEL</div>
        <div className="absolute top-1 right-2 text-[7px] text-brand-bg/30 font-mono select-none">DISP_OK ⊕</div>
        
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-none border-2 border-brand-ink bg-brand-accent text-white flex items-center justify-center font-mono font-bold hover:bg-brand-accent/90 cursor-pointer shadow-[2px_2px_0px_#2a1f17] select-none text-sm"
          title="Cerrar"
        >
          ✕
        </button>

        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-brand-bg/15 pb-2">
            <span className="text-2xl select-none">📲</span>
            <div>
              <h4 className="font-display text-sm tracking-widest text-brand-gold uppercase leading-none">
                Instalar Aplicación
              </h4>
              <p className="text-[9px] font-mono uppercase tracking-wider text-brand-bg/60 mt-0.5">
                PRODE MUNDIAL 2026 PWA
              </p>
            </div>
          </div>

          <p className="font-sans text-[11px] leading-relaxed text-brand-bg/95">
            ¡Llevá el fixture del mundial en tu pantalla! Instalá la aplicación para acceder de forma inmediata con rendimiento optimizado y persistencia segura.
          </p>

          {isIOS ? (
            /* 1. iOS Mobile Installation Guide */
            <div className="bg-brand-bg/10 border border-brand-bg/15 p-2.5 space-y-2 rounded-none font-mono text-[10px]">
              <p className="text-brand-gold font-bold uppercase text-[9px] tracking-wider">
                👉 Pasos para iPhone / iPad:
              </p>
              <ol className="space-y-1.5 list-decimal list-inside text-brand-bg/90">
                <li>
                  Tocá el botón de <strong className="text-white">Compartir</strong> 
                  <span className="inline-flex items-center mx-1 bg-brand-bg/15 px-1 py-0.5 border border-brand-bg/20 rounded-sm">
                    <svg className="w-3.5 h-3.5 inline text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </span>
                  en tu navegador Safari.
                </li>
                <li>
                  Deslizá y seleccioná <strong className="text-white">"Agregar a pantalla de inicio"</strong>
                  <span className="inline-flex items-center mx-1 bg-brand-bg/15 px-1 py-0.5 border border-brand-bg/20 rounded-sm">
                    <svg className="w-3.5 h-3.5 inline text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>.
                </li>
                <li>
                  ¡Listo! Abrila como una <strong className="text-brand-gold">App Nativa</strong>.
                </li>
              </ol>
            </div>
          ) : isDesktop ? (
            /* 2. Desktop Installation Guide (New Feature!) */
            <div className="bg-brand-bg/10 border border-brand-bg/15 p-2.5 space-y-2 rounded-none font-mono text-[10px]">
              <p className="text-brand-gold font-bold uppercase text-[9px] tracking-wider">
                👉 Pasos para tu Computadora:
              </p>
              <ul className="space-y-2 list-none text-brand-bg/90">
                {isMac && (
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand-gold shrink-0">🍏</span>
                    <span>
                      En <strong className="text-white">Safari de Mac</strong>: Ve al menú superior <strong className="text-white">Archivo ➔ Agregar al Dock... 🖥️</strong> para anclarlo en tu barra de apps.
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-1.5">
                  <span className="text-brand-gold shrink-0">🌐</span>
                  <span>
                    En <strong className="text-white">Chrome / Edge</strong>: Hacé clic en el ícono de <strong className="text-white">Instalar 📥</strong> (un signo <strong className="text-white">⊕</strong> o monitor con flecha) a la derecha en la barra de direcciones URL.
                  </span>
                </li>
                <li className="flex items-start gap-1.5 border-t border-brand-bg/10 pt-1.5 mt-1">
                  <span className="text-brand-gold shrink-0">⚙️</span>
                  <span>
                    En otros navegadores: Abre el menú de opciones <strong className="text-white">(•••)</strong> en la esquina del navegador y selecciona <strong className="text-brand-gold">Instalar Prode</strong>.
                  </span>
                </li>
              </ul>
            </div>
          ) : (
            /* 3. Android / Mobile other Native Prompt */
            <button
              onClick={deferredPrompt ? handleInstallAndroid : handleDismiss}
              className="w-full text-center bg-brand-gold text-brand-ink hover:bg-brand-gold/90 transition-all font-display text-xs uppercase tracking-wider py-2 border-2 border-brand-ink cursor-pointer shadow-[3px_3px_0px_#f4ead5] active:translate-y-0.5 active:shadow-[1px_1px_0px_#f4ead5] block select-none"
            >
              {deferredPrompt ? '📲 Agregar a Pantalla ➔' : '👍 Entendido'}
            </button>
          )}

          <div className="text-center pt-1">
            <button
              onClick={handleDismiss}
              className="text-[9px] font-mono text-brand-bg/50 uppercase tracking-widest hover:text-brand-gold hover:underline cursor-pointer"
            >
              Quizás más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
