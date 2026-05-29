import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Welcome from './pages/Welcome';
import Signup from './pages/Signup';
import Login from './pages/Login';
import PendingPayment from './pages/PendingPayment';
import Dashboard from './pages/Dashboard';
import Fixture from './pages/Fixture';
import Ranking from './pages/Ranking';
import Prizes from './pages/Prizes';
import AdminPanel from './pages/AdminPanel';
import PwaInstallPrompt from './components/shared/PwaInstallPrompt';

export function NavigationContainer() {
  const { user, loading } = useAuth();
  
  // Navigation view tracker
  const [currentView, setCurrentView] = useState<string>("welcome");
  
  // Auditable target player uid tracker
  const [auditUserId, setAuditUserId] = useState<string>("");

  // Gateway route controller checking payment authorization
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // If unauthenticated, restrict to guest screens
      if (!["welcome", "signup", "login"].includes(currentView)) {
        setCurrentView("welcome");
      }
    } else {
      // If authenticated, check payment permissions
      const isAuthorized = user.paymentStatus === "confirmed" || user.isAdmin;
      
      if (!isAuthorized) {
        // Force pending payment lock if not approved
        setCurrentView("pending-payment");
      } else {
        // If authorized but still stuck in guest panels, push to gameplay home screen
        if (["welcome", "signup", "login", "pending-payment"].includes(currentView)) {
          setCurrentView("home");
        }
      }
    }
  }, [user, loading]);

  const handleNavigate = (viewName: string) => {
    setCurrentView(viewName);
    // Automatically reset viewing targets to current user unless explicitly selected otherwise
    if (viewName !== 'fixture' && user) {
      setAuditUserId(user.uid);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSetAuditUser = (uid: string) => {
    setAuditUserId(uid);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center font-mono text-sm uppercase text-brand-ink-muted grain-overlay">
        <span className="animate-spin text-2xl mb-2">⚽</span>
        <span>Cargando vestuarios...</span>
      </div>
    );
  }

  const isAuthorizedScreen = !["welcome", "signup", "login", "pending-payment"].includes(currentView);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink relative grain-overlay flex flex-col justify-between">
      
      {/* PWA Floating Install Prompt */}
      <PwaInstallPrompt />
      
      <div>
        {/* Decorative Stamp Registration crossmarks at corners of outer body */}
        <div className="absolute top-2 left-2 text-[10px] select-none text-brand-ink-muted/30 font-mono">⊕ REG_MARK</div>
        <div className="absolute top-2 right-2 text-[10px] select-none text-brand-ink-muted/30 font-mono">REG_MARK ⊕</div>
        
        {/* Bento Grid Persistent Header */}
        {user && (
          <header className="border-b-4 border-brand-ink bg-brand-card py-4 px-4 sm:px-6 sticky top-0 z-40 shadow-sm">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => isAuthorizedScreen && handleNavigate('home')}
                  className={`w-9 h-9 sm:w-10 sm:h-10 border-2 border-brand-ink flex items-center justify-center bg-[#c8442f] shadow-[2px_2px_0px_#2a1f17] select-none ${isAuthorizedScreen ? 'cursor-pointer' : ''}`}
                >
                  <span className="text-white font-black text-lg sm:text-xl font-mono">P</span>
                </div>
                <div>
                  <h1 
                    onClick={() => isAuthorizedScreen && handleNavigate('home')}
                    className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tighter leading-none uppercase font-display select-none flex items-center gap-1 ${isAuthorizedScreen ? 'cursor-pointer' : ''}`}
                  >
                    PRODE <span className="text-[#c89832]">2026</span>
                  </h1>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink/70 hidden sm:block">
                    Mundial USA • MÉXICO • CANADÁ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold uppercase text-brand-ink/65">Crack: {user.nickname}</p>
                  <p className="text-sm font-mono font-bold text-brand-gold bg-brand-ink text-brand-bg px-2 py-0.5 border border-brand-ink shadow-[2px_2px_0px_#2a1f17] inline-block">
                    {user.totalPoints || 0} PTS / #{user.rank || "-"}
                  </p>
                </div>
                
                {/* Bento Avatar wrapper */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-brand-ink bg-[#ede0c8] overflow-hidden shadow-[2px_2px_0px_#2a1f17] rounded-none">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.nickname} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs sm:text-sm font-bold bg-[#2d4a6f] text-white">
                      {(user.nickname || "P").substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="container mx-auto max-w-5xl px-3 sm:px-4 py-6">
          {currentView === 'welcome' && <Welcome onNavigate={handleNavigate} />}
          {currentView === 'signup' && <Signup onNavigate={handleNavigate} />}
          {currentView === 'login' && <Login onNavigate={handleNavigate} />}
          {currentView === 'pending-payment' && <PendingPayment onNavigate={handleNavigate} />}
          
          {/* Core Authorized Gameplay Views */}
          {currentView === 'home' && <Dashboard onNavigate={handleNavigate} />}
          {currentView === 'fixture' && <Fixture onNavigate={handleNavigate} />}
          
          {currentView === 'ranking' && (
            <Ranking 
              onNavigate={handleNavigate} 
              onSetAuditUser={handleSetAuditUser} 
            />
          )}
          
          {currentView === 'prizes' && <Prizes onNavigate={handleNavigate} />}
          {currentView === 'admin' && <AdminPanel onNavigate={handleNavigate} />}
        </main>
      </div>

      <div>
        {/* Bottom Navigation Tab Bar for authorized screens */}
        {user && isAuthorizedScreen && (
          <nav className="border-t-4 border-brand-ink bg-brand-card flex items-stretch mt-8 sticky bottom-0 z-40 max-w-5xl mx-auto w-full shadow-[0px_-4px_12px_rgba(42,31,23,0.1)]">
            <button 
              onClick={() => handleNavigate('home')} 
              className={`flex-1 py-3 flex flex-col items-center justify-center gap-0.5 border-r border-brand-ink/40 transition-all cursor-pointer ${currentView === 'home' ? 'bg-[#f4ead5] font-black scale-102 text-[#c8442f]' : 'opacity-70 hover:opacity-100 hover:bg-brand-bg/30'}`}
            >
              <span className="text-lg">🏠</span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-tight">Inicio</span>
            </button>
            <button 
              onClick={() => handleNavigate('fixture')} 
              className={`flex-1 py-3 flex flex-col items-center justify-center gap-0.5 border-r border-brand-ink/40 transition-all cursor-pointer ${currentView === 'fixture' ? 'bg-[#f4ead5] font-black scale-102 text-[#c8442f]' : 'opacity-70 hover:opacity-100 hover:bg-brand-bg/30'}`}
            >
              <span className="text-lg">📅</span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-tight">Fixture</span>
            </button>
            <button 
              onClick={() => handleNavigate('ranking')} 
              className={`flex-1 py-3 flex flex-col items-center justify-center gap-0.5 border-r border-brand-ink/40 transition-all cursor-pointer ${currentView === 'ranking' ? 'bg-[#f4ead5] font-black scale-102 text-[#c8442f]' : 'opacity-70 hover:opacity-100 hover:bg-brand-bg/30'}`}
            >
              <span className="text-lg">🏅</span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-tight">Ranking</span>
            </button>
            <button 
              onClick={() => handleNavigate('prizes')} 
              className={`flex-1 py-3 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${currentView === 'prizes' ? 'bg-[#f4ead5] font-black scale-102 text-[#c8442f]' : 'opacity-70 hover:opacity-100 hover:bg-brand-bg/30'} ${user.isAdmin ? 'border-r border-brand-ink/40' : ''}`}
            >
              <span className="text-lg">💰</span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-tight">Premios</span>
            </button>
            {user.isAdmin && (
              <button 
                onClick={() => handleNavigate('admin')} 
                className={`flex-1 py-3 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${currentView === 'admin' ? 'bg-[#f4ead5] font-black scale-102 text-[#c8442f]' : 'opacity-70 hover:opacity-100 hover:bg-brand-bg/30'}`}
              >
                <span className="text-lg">⚙️</span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-tight">Admin</span>
              </button>
            )}
          </nav>
        )}

        {/* Floating Retro Credits overlay banner */}
        <footer className="w-full text-center py-4 text-[9px] sm:text-[10px] font-mono text-brand-ink-muted border-t border-brand-ink/10 select-none bg-[#ede0c8]/40">
          <span>© 2026 PRODE ORGANIZADO POR FELIX BLANCO • DONANDO EL 50% A WONDERFUL SCHOOL (ZANZÍBAR) 🇹🇿</span>
        </footer>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer />
    </AuthProvider>
  );
}
