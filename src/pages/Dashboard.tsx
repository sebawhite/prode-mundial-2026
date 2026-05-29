import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getActivePredictions, 
  getActiveUsers, 
  getActiveConfig,
  isBeforeDeadline,
  saveActivePredictions
} from '../lib/firebase';
import { useWorldCupData } from '../hooks/useWorldCupData';
import Avatar from '../components/shared/Avatar';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { matches, loading } = useWorldCupData();
  const [predictions, setPredictions] = useState(() => getActivePredictions());
  const [users, setUsers] = useState(() => getActiveUsers());
  const [config, setConfig] = useState(getActiveConfig());
  const [countdownString, setCountdownString] = useState('');
  const [heroSaveStatus, setHeroSaveStatus] = useState<"saving" | "saved" | null>(null);

  // Listen to live database synchronization updates
  useEffect(() => {
    const handleSync = () => {
      setPredictions(getActivePredictions());
      setUsers(getActiveUsers());
      setConfig(getActiveConfig());
    };
    window.addEventListener('prode_data_updated', handleSync);
    return () => window.removeEventListener('prode_data_updated', handleSync);
  }, []);

  // Sync predictions and users state once the World Cup API matches load complete
  useEffect(() => {
    if (!loading) {
      setPredictions(getActivePredictions());
      setUsers(getActiveUsers());
    }
  }, [loading, matches]);

  // Real-time ticking down to active closest deadlines
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const groupDeadline = new Date(config.groupStageDeadline).getTime();
      
      const targetTime = groupDeadline;
      const label = "Cierre de Predicciones:";
      
      const diff = targetTime - now;
      if (diff <= 0) {
        setCountdownString("🏆 Predicciones de Grupos cerradas");
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdownString(`${label} ${days}d ${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [config]);

  if (!user) return null;

  // Recalculate statistics for current user session
  const userPredictions = predictions.filter(p => p.userId === user.uid);
  const totalPredicted = userPredictions.length;
  const completionPercent = matches.length > 0 ? Math.round((totalPredicted / matches.length) * 100) : 0;

  // Find next upcoming unplayed match
  const nextMatch = matches.find(m => m.homeScore === null && m.awayScore === null) || matches[0];
  const nextPred = nextMatch 
    ? predictions.find(p => p.userId === user.uid && p.matchId === nextMatch.id) 
    : null;

  const isEditable = nextMatch ? isBeforeDeadline(nextMatch.stage) : false;

  const handleHeroScoreChange = (team: "home" | "away", val: string) => {
    if (!nextMatch) return;
    const numericValue = val === "" ? 0 : Math.max(0, Math.min(20, parseInt(val, 10) || 0));
    
    const updatedPredictions = [...predictions];
    const predictionId = `${user.uid}_${nextMatch.id}`;
    let matchIdx = updatedPredictions.findIndex(p => p.id === predictionId);

    if (matchIdx === -1) {
      updatedPredictions.push({
        id: predictionId,
        userId: user.uid,
        matchId: nextMatch.id,
        homeScore: team === "home" ? numericValue : 0,
        awayScore: team === "away" ? numericValue : 0,
        createdAt: new Date().toISOString()
      });
    } else {
      updatedPredictions[matchIdx] = {
        ...updatedPredictions[matchIdx],
        [team === "home" ? "homeScore" : "awayScore"]: numericValue,
        updatedAt: new Date().toISOString()
      };
    }
    setPredictions(updatedPredictions);
    setHeroSaveStatus("saving");

    // Debounce/simulated persist delay
    setTimeout(() => {
      saveActivePredictions(updatedPredictions);
      setHeroSaveStatus("saved");
      setTimeout(() => setHeroSaveStatus(null), 2500);
    }, 800);
  };

  // Mini-ranking extraction (top 5 confirmed players sorted by points)
  const confirmedUsers = users.filter(u => u.paymentStatus === "confirmed");
  const sortedUsers = [...confirmedUsers].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      
      {/* Top Welcome & Sub-Header row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-ink text-brand-bg p-4 rounded-none retro-border retro-shadow">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-brand-gold bg-brand-bg/15 px-2 py-0.5 rounded-none font-bold">
            ⭐️ PANEL DE SEGUIMIENTO GENERAL
          </span>
          <h2 className="font-sans text-xl sm:text-2xl font-black tracking-tight uppercase mt-1 leading-none">
            ¡Hola, {user.nickname}!
          </h2>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {user.isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="flex-1 sm:flex-none text-center bg-brand-gold text-brand-ink font-mono text-xs font-bold uppercase retro-border px-3 py-1.5 hover:bg-brand-gold/90 cursor-pointer shadow-sm transition-all"
            >
              🛠️ Panel Admin
            </button>
          )}
          <button
            onClick={logout}
            className="flex-1 sm:flex-none text-center bg-brand-accent text-white font-mono text-xs font-bold uppercase retro-border px-3 py-1.5 hover:bg-brand-accent/90 cursor-pointer shadow-sm transition-all"
          >
            🔌 Salir
          </button>
        </div>
      </div>

      {/* Main Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Next Match Prediction (Large Hero Card - col-span-8) */}
        {nextMatch ? (
          <section className="col-span-1 md:col-span-8 bg-brand-card border-2 border-brand-ink shadow-[6px_6px_0px_#2a1f17] p-5 relative flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-2 left-2 text-[10px] font-mono text-brand-ink-muted/40">⊕ DESAFÍO_PRÓXIMO</div>
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black italic uppercase leading-none tracking-tight">Próximo Desafío</h3>
              <span className="px-2.5 py-0.5 bg-brand-ink text-brand-bg text-[10px] font-mono font-bold uppercase">
                GRUPO {nextMatch.group || "A"} • J.{nextMatch.matchday || 1}
              </span>
            </div>

            <div className="flex items-center justify-around py-4">
              <div className="text-center flex-1 px-1">
                <span className="text-4xl sm:text-6xl block mb-2 transition-transform hover:scale-110">{nextMatch.homeTeam?.flag || "🏳️"}</span>
                <p className="font-sans font-black text-sm sm:text-base uppercase tracking-tight block truncate sm:max-w-none">
                  {nextMatch.homeTeam?.name}
                </p>
              </div>

              <div className="flex flex-col items-center gap-2 px-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <input 
                    type="text" 
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={nextPred ? nextPred.homeScore : ""} 
                    onChange={(e) => handleHeroScoreChange("home", e.target.value)}
                    disabled={!isEditable}
                    placeholder="-"
                    className="w-14 h-18 sm:w-20 sm:h-24 border-3 border-brand-ink bg-brand-bg text-center text-3xl sm:text-5xl font-mono font-black shadow-[3px_3px_0px_#2a1f17] focus:outline-none focus:ring-0 disabled:opacity-85 text-brand-ink"
                  />
                  <span className="text-3xl font-black self-center text-brand-ink select-none">:</span>
                  <input 
                    type="text" 
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={nextPred ? nextPred.awayScore : ""} 
                    onChange={(e) => handleHeroScoreChange("away", e.target.value)}
                    disabled={!isEditable}
                    placeholder="-"
                    className="w-14 h-18 sm:w-20 sm:h-24 border-3 border-brand-ink bg-brand-bg text-center text-3xl sm:text-5xl font-mono font-black shadow-[3px_3px_0px_#2a1f17] focus:outline-none focus:ring-0 disabled:opacity-85 text-brand-ink"
                  />
                </div>
                
                {/* Save Feedback Alerts */}
                {isEditable ? (
                  <div className="h-5 flex items-center">
                    {heroSaveStatus === "saving" && (
                      <p className="text-[10px] font-bold font-mono uppercase text-brand-blue animate-pulse">⏰ auto-guardando...</p>
                    )}
                    {heroSaveStatus === "saved" && (
                      <p className="text-[10px] font-bold uppercase text-brand-win">✓ Guardado en tu planilla</p>
                    )}
                    {!heroSaveStatus && nextPred && (
                      <p className="text-[10px] font-bold uppercase text-brand-win/80 font-mono">✓ Tu pronóstico está guardado</p>
                    )}
                    {!heroSaveStatus && !nextPred && (
                      <p className="text-[10px] font-bold uppercase text-brand-accent/80 font-mono animate-bounce">⚠️ Completar marcador</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] font-bold uppercase text-brand-accent font-mono">🔒 Predicciones cerradas</p>
                )}
              </div>

              <div className="text-center flex-1 px-1">
                <span className="text-4xl sm:text-6xl block mb-2 transition-transform hover:scale-110">{nextMatch.awayTeam?.flag || "🏳️"}</span>
                <p className="font-sans font-black text-sm sm:text-base uppercase tracking-tight block truncate sm:max-w-none">
                  {nextMatch.awayTeam?.name}
                </p>
              </div>
            </div>

            <div className="flex border-t border-brand-ink/10 pt-3 justify-between items-center text-xs mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-brand-accent rounded-full animate-ping"></span>
                <p className="font-mono text-[10px] sm:text-xs">
                  {countdownString}
                </p>
              </div>
              <button 
                onClick={() => onNavigate('fixture')}
                className="font-mono text-[10px] sm:text-xs uppercase font-bold text-brand-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                Cargar fixture completo ➔
              </button>
            </div>
          </section>
        ) : null}

        {/* Completeness / Progress Stats Card (col-span-4) */}
        <section className="col-span-1 md:col-span-4 bg-brand-bg border-2 border-brand-ink shadow-[6px_6px_0px_#2a1f17] p-5 flex flex-col justify-between min-h-[300px]">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-brand-ink-muted/50 block">⊕ REGISTRO_ESTADÍSTICO</span>
            <p className="text-xs font-black uppercase text-brand-ink-muted mt-2 tracking-tight leading-none">Mi Completitud</p>
            
            <div className="flex items-end gap-2 my-5">
              <span className="text-5xl sm:text-6xl font-black font-mono leading-none tracking-tighter text-brand-ink">{completionPercent}%</span>
              <span className="text-sm font-bold font-mono pb-1 text-brand-ink-muted">({totalPredicted}/{matches.length})</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="w-full h-5 border-2 border-brand-ink bg-white rounded-none p-0.5 overflow-hidden">
              <div 
                className="h-full bg-brand-gold border border-brand-ink/10 transition-all duration-500" 
                style={{ width: `${completionPercent}%` }}
              ></div>
            </div>
            
            <div className="bg-[#ede0c8] p-3 border border-brand-ink/20 font-mono text-[10px] text-brand-ink-muted select-none rounded-sm">
              💡 ¡Rellenar fixture antes de que expire el plazo! Cada pronóstico guardado suma puntaje para el pozo.
            </div>
          </div>
        </section>

        {/* Mini Ranking Top 5 (col-span-4) */}
        <section className="col-span-1 md:col-span-4 bg-brand-ink text-brand-bg border-2 border-brand-ink shadow-[6px_6px_0px_#2a1f17] p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-brand-bg/10 pb-2">
              <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                <span>Top Participantes</span>
              </h3>
              <button 
                onClick={() => onNavigate('ranking')}
                className="text-brand-gold text-[10px] font-mono font-bold uppercase tracking-widest hover:underline cursor-pointer"
              >
                VER COMPLETO
              </button>
            </div>

            <div className="space-y-3">
              {sortedUsers.map((u, i) => (
                <div 
                  key={u.uid}
                  className="flex items-center justify-between border-b border-brand-bg/15 pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-mono text-xs w-4 font-bold text-brand-gold">
                      0{i + 1}
                    </span>
                    <div className="w-6 h-6 border border-brand-bg/20 overflow-hidden shrink-0 rounded-none bg-brand-card">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.nickname} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-bold bg-[#c8442f] text-white">
                          {(u.nickname || "P").substring(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className={`font-sans text-xs font-black truncate uppercase ${u.uid === user.uid ? 'text-brand-gold font-black' : 'text-brand-bg/90'}`}>
                      {u.nickname} {u.uid === user.uid && "(Vos)"}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-brand-gold">
                    {u.totalPoints} <span className="text-[8px] opacity-75 font-normal">PTS</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-brand-bg/10 pt-3 mt-4 text-center">
            <button 
              onClick={() => onNavigate('ranking')}
              className="w-full text-center font-mono text-[10px] uppercase font-bold text-brand-gold hover:underline cursor-pointer"
            >
              Ver todos los participantes ➔
            </button>
          </div>
        </section>

        {/* Prize Pool "El Pozo" (col-span-8) */}
        <section className="col-span-1 md:col-span-8 bg-[#c89832] border-2 border-brand-ink shadow-[6px_6px_0px_#2a1f17] p-5 flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex justify-between items-start">
              <span className="font-mono text-[9px] uppercase tracking-wider text-brand-ink/40 block">⊕ REGLAMENTO_FINANZAS • SOLIDARIO</span>
              <span className="bg-brand-ink text-brand-bg text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                🇹🇿 Zanzibar 50/50
              </span>
            </div>
            <p className="text-xl font-black uppercase text-brand-ink leading-none tracking-tight mt-2">El Pozo Acumulado</p>
            <p className="text-[10px] font-bold uppercase text-brand-ink/80 mt-1">Pozo neto para ganadores (50% de lo Recaudado)</p>
          </div>

          <div className="my-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <div>
              <p className="text-4xl sm:text-5xl font-black font-mono text-brand-ink tracking-tighter leading-none">
                ${(users.filter(u => u.paymentStatus === "confirmed").length * config.buyInAmount * 0.50).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[9px] font-mono font-bold text-brand-ink/70 mt-1">
                ARS TOTAL (El restante 50% se dona a Wonderful School Zanzíbar)
              </p>
            </div>
            
            <button 
              onClick={() => onNavigate('prizes')}
              className="bg-brand-ink text-brand-bg hover:bg-brand-ink/95 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider self-start sm:self-auto cursor-pointer"
            >
              Ver Finanzas Completas ➔
            </button>
          </div>

          <div className="bg-brand-ink text-brand-bg p-2.5 text-[9px] font-mono font-bold uppercase leading-tight select-none rounded-none space-y-1">
            <div>
              🏆 1° PUESTO: ${(users.filter(u => u.paymentStatus === "confirmed").length * config.buyInAmount * 0.50 * 0.60).toLocaleString('es-AR', { maximumFractionDigits: 0 })} (60%) <br />
              🥈 2° PUESTO: ${(users.filter(u => u.paymentStatus === "confirmed").length * config.buyInAmount * 0.50 * 0.25).toLocaleString('es-AR', { maximumFractionDigits: 0 })} (25%) <br />
              🥉 3° PUESTO: ${(users.filter(u => u.paymentStatus === "confirmed").length * config.buyInAmount * 0.50 * 0.15).toLocaleString('es-AR', { maximumFractionDigits: 0 })} (15%)
            </div>
            <div className="border-t border-brand-bg/20 pt-1 mt-1 text-brand-gold text-[8.5px] font-sans">
              🌍 Donación acumulada actual Wonderful School (Zanzíbar) para bancos: ${(users.filter(u => u.paymentStatus === "confirmed").length * config.buyInAmount * 0.50).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS / $300.000 ARS meta.
            </div>
          </div>
        </section>

      </div>

      {/* Nav Link Bento Action Panels Header */}
      <div className="border-b-2 border-brand-ink pt-2">
        <h4 className="font-sans text-transform uppercase font-black text-xs tracking-widest text-brand-ink">
          🧭 Acceso Rápido
        </h4>
      </div>

      {/* Navigation Buttons Row - 3 beautiful Bento items */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Nav item 1: Fixture */}
        <div 
          onClick={() => onNavigate('fixture')}
          className="bg-brand-card hover:-translate-y-1 hover:translate-x-0.5 hover:shadow-[3px_3px_0px_#2a1f17] transition-all duration-200 border-2 border-brand-ink shadow-[5px_5px_0px_#2a1f17] p-4 flex flex-col justify-between min-h-[140px] cursor-pointer group"
        >
          <div>
            <span className="text-2xl block mb-2 transition-transform group-hover:scale-120 group-hover:rotate-6 inline-block">📅</span>
            <h5 className="font-sans text-sm font-black uppercase tracking-tight group-hover:text-brand-accent">
              Planilla Fixture
            </h5>
            <p className="font-sans text-[10px] text-brand-ink-muted leading-tight mt-1">
              Volcá tus predicciones para los 72 partidos de la fase de grupos del mundial USA/MEX/CAN.
            </p>
          </div>
          <span className="font-mono text-[9px] font-bold text-brand-accent uppercase underline tracking-tight block mt-2">
            Ingresar planilla ➔
          </span>
        </div>

        {/* Nav item 2: Ranking */}
        <div 
          onClick={() => onNavigate('ranking')}
          className="bg-brand-card hover:-translate-y-1 hover:translate-x-0.5 hover:shadow-[3px_3px_0px_#2a1f17] transition-all duration-200 border-2 border-brand-ink shadow-[5px_5px_0px_#2a1f17] p-4 flex flex-col justify-between min-h-[140px] cursor-pointer group"
        >
          <div>
            <span className="text-2xl block mb-2 transition-transform group-hover:scale-120 group-hover:rotate-6 inline-block">🗣️</span>
            <h5 className="font-sans text-sm font-black uppercase tracking-tight group-hover:text-brand-accent">
              Tabla Completa
            </h5>
            <p className="font-sans text-[10px] text-brand-ink-muted leading-tight mt-1">
              Mirá las posiciones completas del PRODE y auditá las planillas ajenas.
            </p>
          </div>
          <span className="font-mono text-[9px] font-bold text-brand-accent uppercase underline tracking-tight block mt-2">
            Cruzar planillas ➔
          </span>
        </div>

        {/* Nav item 3: Prizes */}
        <div 
          onClick={() => onNavigate('prizes')}
          className="bg-brand-card hover:-translate-y-1 hover:translate-x-0.5 hover:shadow-[3px_3px_0px_#2a1f17] transition-all duration-200 border-2 border-brand-ink shadow-[5px_5px_0px_#2a1f17] p-4 flex flex-col justify-between min-h-[140px] cursor-pointer group"
        >
          <div>
            <span className="text-2xl block mb-2 transition-transform group-hover:scale-120 group-hover:rotate-6 inline-block">💰</span>
            <h5 className="font-sans text-sm font-black uppercase tracking-tight group-hover:text-brand-accent">
              Premios y Alias MP
            </h5>
            <p className="font-sans text-[10px] text-brand-ink-muted leading-tight mt-1">
              Consultá las reglas del juego, alias de pago y cómo Felix Blanco distribuye fondos.
            </p>
          </div>
          <span className="font-mono text-[9px] font-bold text-brand-accent uppercase underline tracking-tight block mt-2">
            Revisar premios ➔
          </span>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
