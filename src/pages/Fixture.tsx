import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getActivePredictions, 
  getActiveUsers, 
  saveActivePredictions, 
  isBeforeDeadline,
  calculateMatchPoints,
  getActiveConfig
} from '../lib/firebase';
import { useWorldCupData } from '../hooks/useWorldCupData';
import { Match } from '../data/seedData';
import Avatar from '../components/shared/Avatar';

interface FixtureProps {
  onNavigate: (view: string) => void;
}

export const Fixture: React.FC<FixtureProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { matches, loading, error } = useWorldCupData();
  const [predictions, setPredictions] = useState<any[]>(getActivePredictions());
  const [users, setUsers] = useState<any[]>(getActiveUsers());
  
  // Filtering states
  const [selectedStage, setSelectedStage] = useState<string>("groups");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedMatchday, setSelectedMatchday] = useState<number | string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showRulesInfo, setShowRulesInfo] = useState(false);
  
  // Viewer mode states: lets user audit other players' predictions if deadline passed
  const [viewingUserId, setViewingUserId] = useState<string>(user?.uid || "");
  const [groupDeadlinePassed, setGroupDeadlinePassed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<Record<string, "saved" | "saving" | null>>({});
  
  // Manual save states
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showSaveError, setShowSaveError] = useState(false);

  // Debouncing refs
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    // Check if groupStageDeadline is passed using config-based isBeforeDeadline
    const checkDeadline = () => {
      setGroupDeadlinePassed(!isBeforeDeadline("groups"));
    };
    checkDeadline();
    const interval = setInterval(checkDeadline, 10000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup timers on destruction
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  // Listen to live database synchronization updates
  useEffect(() => {
    const handleSync = () => {
      setHasUnsavedChanges(prev => {
        if (!prev) {
          setPredictions(getActivePredictions());
          setUsers(getActiveUsers());
        }
        return prev;
      });
    };
    window.addEventListener('prode_data_updated', handleSync);
    return () => window.removeEventListener('prode_data_updated', handleSync);
  }, []);

  if (!user) return null;

  // Handles input score updates & debounces the local storage save by 1 second as specified
  const handleScoreChange = (matchId: string, team: "home" | "away", val: string) => {
    // Clear prediction to empty string if input is cleared, otherwise parse and clamp
    const storedValue = val === "" ? "" : Math.max(0, Math.min(20, parseInt(val, 10) || 0));
    
    // 1. Instantly update the visual component state for rapid responsive input
    setPredictions(prevPredictions => {
      const updatedPredictions = [...prevPredictions];
      const predictionId = `${user.uid}_${matchId}`;
      let matchIdx = updatedPredictions.findIndex(p => p.id === predictionId);

      if (matchIdx === -1) {
        updatedPredictions.push({
          id: predictionId,
          userId: user.uid,
          matchId,
          homeScore: team === "home" ? storedValue : "",
          awayScore: team === "away" ? storedValue : "",
          createdAt: new Date().toISOString()
        });
      } else {
        updatedPredictions[matchIdx] = {
          ...updatedPredictions[matchIdx],
          [team === "home" ? "homeScore" : "awayScore"]: storedValue,
          updatedAt: new Date().toISOString()
        };
      }
      return updatedPredictions;
    });
    setHasUnsavedChanges(true);
    setShowSaveError(false); // Clear error status on new interaction
  };

  const handleManualSave = async () => {
    setIsSavingManual(true);
    setShowSaveError(false);
    try {
      await saveActivePredictions(predictions);
      await new Promise(resolve => setTimeout(resolve, 800)); // Smooth UX delay
      setHasUnsavedChanges(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Error manual saving:", e);
      setShowSaveError(true);
    } finally {
      setIsSavingManual(false);
    }
  };

  // Filtering operations
  const filteredMatches = matches.filter(m => {
    // 1. Stage filter (all matches in this edition are Group Stage)
    if (m.stage !== "groups") return false;
    // 2. Group filter
    if (selectedGroup !== "all" && m.group !== selectedGroup) return false;
    // 3. Matchday filter
    if (selectedMatchday !== "all" && m.matchday !== parseInt(selectedMatchday as string, 10)) return false;
    // 4. Team text search query
    if (searchQuery) {
      const queryStr = searchQuery.toLowerCase();
      const matchHome = (m.homeTeam?.name || "").toLowerCase().includes(queryStr);
      const matchAway = (m.awayTeam?.name || "").toLowerCase().includes(queryStr);
      const matchVenue = (m.venue || "").toLowerCase().includes(queryStr);
      const matchGroup = m.group ? `grupo ${m.group}`.toLowerCase().includes(queryStr) : false;
      if (!matchHome && !matchAway && !matchVenue && !matchGroup) return false;
    }
    return true;
  });

  // Calculate points won for a match in historic views
  const getPlayedPointsEarned = (match: Match, pHome: number, pAway: number) => {
    return calculateMatchPoints(pHome, pAway, match.homeScore, match.awayScore, match.stage !== "groups");
  };

  const currentViewingUser = users.find(u => u.uid === viewingUserId) || user;

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col bg-brand-card p-4 rounded-lg retro-border retro-shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-serif text-2xl font-bold text-brand-ink uppercase tracking-tight flex items-center gap-2">
              ⚽ Pronosticar Partidos
            </h2>
            <p className="font-mono text-xs text-brand-ink-muted">
              Arriesgá marcadores exactos. Un marcador exacto otorga 5 pts; diferencia 3 pts; resultado 1 pt. 
              <button 
                onClick={() => setShowRulesInfo(!showRulesInfo)} 
                className="underline cursor-pointer text-brand-accent hover:text-brand-accent/80 font-bold ml-1 font-mono uppercase text-[10px]"
              >
                {showRulesInfo ? "Cerrar" : "Ver más ➕"}
              </button>
            </p>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className="bg-brand-bg text-brand-ink font-mono text-xs font-bold uppercase retro-border px-3 py-1.5 cursor-pointer hover:bg-brand-card shrink-0"
          >
            ← Volver
          </button>
        </div>

        {showRulesInfo && (
          <div className="mt-3 p-3 bg-brand-bg border-2 border-brand-ink text-xs font-mono text-brand-ink space-y-2 select-none rounded-none">
            <p className="font-bold border-b border-brand-ink/15 pb-1 uppercase tracking-tight text-[#c8442f] text-[10px]">
              🏆 TABLA DE PUNTUACIÓN DETALLADA
            </p>
            <ul className="space-y-2.5 leading-relaxed text-[11px]">
              <li>
                🥇 <strong>5 PTS • MARCADOR EXACTO:</strong> Le pegás a la cantidad de goles exacta de ambos equipos. 
                <span className="block text-[10px] text-brand-ink-muted italic pl-4 mt-0.5">Ej: Pronóstico: 2-1 | Resultado: 2-1</span>
              </li>
              <li>
                🥈 <strong>3 PTS • DIFERENCIA EXACTA:</strong> Acertás el ganador (o empate) y la distancia de goles entre ambos, pero con números diferentes.
                <span className="block text-[10px] text-brand-ink-muted italic pl-4 mt-0.5">Ej: Pronóstico: 3-1 | Resultado: 2-0 (Diferencia de exactos +2 goles)</span>
                <span className="block text-[10px] text-brand-ink-muted italic pl-4 mt-0.5">Ej: Pronóstico: 1-1 | Resultado: 2-2 (Empate, diferencia 0 goles)</span>
              </li>
              <li>
                🥉 <strong>1 PT • RESULTADO (SIGNO):</strong> Acertás solo quién gana o que empatan, pero fallando en la diferencia de goles y marcador.
                <span className="block text-[10px] text-brand-ink-muted italic pl-4 mt-0.5">Ej: Pronóstico: 3-1 | Resultado: 1-0 (Acertás ganador, pero fallás diferencia)</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Viewing audited profiles panel */}
      {groupDeadlinePassed ? (
        <div className="bg-brand-blue/10 border-2 border-brand-blue p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="font-mono text-[9px] uppercase font-bold text-brand-blue tracking-wider">🔒 Audición transparente habilitada</span>
            <h4 className="font-serif text-base font-bold text-brand-ink">
              Estás viendo las predicciones de: <span className="text-brand-accent">{currentViewingUser.nickname}</span>
            </h4>
            <p className="text-xs text-brand-ink-muted">El plazo cerró el 10 de junio. Podés seleccionar cualquier participante de la tabla para ver sus apuestas.</p>
          </div>
          
          <select 
            value={viewingUserId}
            onChange={(e) => setViewingUserId(e.target.value)}
            className="border-2 border-brand-ink p-2 font-sans text-sm rounded bg-brand-bg focus:ring-1 focus:ring-brand-accent focus:outline-none cursor-pointer"
          >
            {users.filter(u => u.paymentStatus === "confirmed").map(u => (
              <option key={u.uid} value={u.uid}>
                {u.nickname} ({u.totalPoints} pts)
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="bg-brand-accent/10 border-2 border-brand-accent p-3 rounded-lg text-center font-mono text-xs text-brand-accent">
          🔒 Los pronósticos de los demás participantes se habilitarán el 10 de Junio a las 23:59 UTC para evitar que alguien se copie de tu estrategia.
        </div>
      )}

      {/* Filter Toolbar Container */}
      <div className="bg-brand-card p-4 rounded-lg retro-border retro-shadow space-y-4">
        
        {/* Main Stage Filter Header Label */}
        <div>
          <span className="block text-[10px] font-mono font-bold uppercase mb-1 text-brand-ink">Etapa Activa</span>
          <div className="flex gap-2">
            <span className="py-1.5 px-3 rounded uppercase font-mono text-xs font-bold border-2 bg-brand-accent text-brand-bg border-brand-ink">
              Fase de Grupos (Única Etapa)
            </span>
          </div>
        </div>

        {/* Dynamic subfilters for group match stages directly visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-brand-ink/10">
          {/* Group Letter A-L Select */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase mb-1 text-brand-ink">Grupo:</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full text-xs font-mono border-2 border-brand-ink p-2 rounded bg-brand-bg focus:outline-none"
            >
              <option value="all">TODOS LOS GRUPOS (A-L)</option>
              {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map(letter => (
                <option key={letter} value={letter}>GRUPO {letter}</option>
              ))}
            </select>
          </div>

          {/* Matchday Selector 1, 2, 3 */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase mb-1 text-brand-ink">Jornada:</label>
            <select
              value={selectedMatchday}
              onChange={(e) => setSelectedMatchday(e.target.value)}
              className="w-full text-xs font-mono border-2 border-brand-ink p-2 rounded bg-brand-bg focus:outline-none"
            >
              <option value="all">TODAS LAS JORNADAS (1, 2 y 3)</option>
              <option value={1}>JORNADA 1</option>
              <option value={2}>JORNADA 2</option>
              <option value={3}>JORNADA 3</option>
            </select>
          </div>
        </div>

        {/* Text Search Input bar */}
        <div className="pt-2 border-t border-brand-ink/10 flex items-center">
          <input
            type="text"
            placeholder="🔎 Buscar por selección o estadio... (ej: Argentina, Azteca)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm border-2 border-brand-ink p-2 rounded bg-brand-bg font-sans focus:outline-none"
          />
        </div>
      </div>

      {/* Fixture Status Indicator — non-alarming for end users.
          The remote fetch is best-effort; if it fails we silently use the local fixture
          (public/worldcup.json) which has the same 72 group-stage matches. */}
      <div className="bg-brand-card p-3 rounded-lg retro-border retro-shadow flex items-center justify-between text-xs font-mono">
        {loading && matches.length === 0 ? (
          <span className="text-brand-blue flex items-center gap-2 animate-pulse font-bold">
            🔄 Cargando fixture del Mundial 2026...
          </span>
        ) : (
          <span className="text-brand-win flex items-center gap-2 font-bold">
            ✅ Fixture del Mundial 2026 cargado ({matches.filter(m => m.stage === "groups").length} partidos · Fase de Grupos)
          </span>
        )}
      </div>

      {/* Matches Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMatches.length === 0 ? (
          <div className="col-span-1 md:col-span-2 bg-brand-card retro-border p-8 rounded-lg text-center font-mono text-xs text-brand-ink-muted">
            📭 Ningún partido coincide con los filtros aplicados. Intentá removiendo filtros.
          </div>
        ) : (
          filteredMatches.map(m => {
            const isFinished = m.isFinished;
            const predId = `${viewingUserId}_${m.id}`;
            const pred = predictions.find(p => p.id === predId) || { homeScore: "", awayScore: "" };
            
            // Validate if the match is locked for predictions
            const editOpen = isBeforeDeadline(m.stage);
            const isViewingSelf = viewingUserId === user.uid;
            // Allow editing even if payment is pending, per user request
            const canEdit = editOpen && isViewingSelf && !m.isFinished && !IS_SANDBOX;

            const hasPred = pred.homeScore !== "" && pred.homeScore !== null && pred.awayScore !== "" && pred.awayScore !== null;
            const pointsEarned = isFinished && hasPred ? getPlayedPointsEarned(m, pred.homeScore, pred.awayScore) : 0;

            const saveState = saveStatus[m.id];

            return (
              <div 
                key={m.id} 
                className="bg-brand-card retro-border retro-shadow p-4 rounded-lg flex flex-col justify-between space-y-3 relative overflow-hidden"
              >
                {/* Ribbon details and save labels */}
                <div className="flex justify-between items-center border-b border-brand-ink/15 pb-1 text-xs">
                  <span className="font-mono text-[9px] uppercase font-bold text-brand-blue bg-brand-bg px-1.5 py-0.5 rounded border border-brand-ink/10">
                    M{m.id.split("-")[1]} • {m.stage === "groups" ? `Grupo ${m.group} - jda ${m.matchday}` : m.stage.toUpperCase()}
                  </span>

                  <span className="font-mono text-[9px] text-brand-ink-muted text-right">
                    {new Date(m.date).toLocaleString('es-AR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Main Match Card with input boxes */}
                <div className="flex justify-between items-center gap-2 py-1">
                  
                  {/* Home Team Column */}
                  <div className="flex-1 flex flex-col items-center text-center max-w-[120px]">
                    <span className="text-2xl">{m.homeTeam.flag}</span>
                    <span className="font-sans text-sm font-bold mt-1 text-brand-ink leading-tight truncate w-full">
                      {m.homeTeam.name}
                    </span>
                    <span className="font-mono text-[9px] text-brand-ink-muted bg-brand-bg/50 px-1 rounded uppercase font-semibold">
                      {m.homeTeam.code}
                    </span>
                  </div>

                  {/* Prediction input and real match status */}
                  <div className="flex flex-col items-center gap-1 justify-center shrink-0">
                    
                  <div className="flex items-center gap-1">
                      {canEdit ? (
                        <>
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={pred.homeScore}
                            onChange={(e) => handleScoreChange(m.id, "home", e.target.value)}
                            className="w-11 h-11 border-2 border-brand-ink rounded bg-brand-bg text-center font-mono text-lg font-bold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
                          />
                          <span className="font-mono font-bold text-brand-ink-muted px-1">:</span>
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={pred.awayScore}
                            onChange={(e) => handleScoreChange(m.id, "away", e.target.value)}
                            className="w-11 h-11 border-2 border-brand-ink rounded bg-brand-bg text-center font-mono text-lg font-bold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
                          />
                        </>
                      ) : (
                        <div className="flex items-center gap-1 bg-brand-bg border-2 border-brand-ink px-3 py-1.5 rounded-md text-center">
                          <span className="font-mono text-base font-black text-brand-ink">
                            {hasPred ? pred.homeScore : "-"}
                          </span>
                          <span className="font-mono text-xs font-bold text-brand-ink-muted px-0.5">:</span>
                          <span className="font-mono text-base font-black text-brand-ink">
                            {hasPred ? pred.awayScore : "-"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Auto-saving inline flags */}
                    {canEdit && (
                      <div className="h-3 text-[9px] font-mono">
                        {saveState === "saving" && <span className="text-brand-accent italic animate-pulse">Guardando...</span>}
                        {saveState === "saved" && <span className="text-brand-win font-bold">✓ Guardado</span>}
                        {!saveState && !hasPred && <span className="text-brand-ink-muted italic opacity-60">Sin pronóstico</span>}
                        {!saveState && hasPred && <span className="text-brand-ink-muted/80">✓ Guardado</span>}
                      </div>
                    )}

                    {!canEdit && (
                      <span className="text-[8px] font-mono uppercase bg-brand-bg px-1.5 py-0.5 rounded text-brand-ink-muted tracking-tight text-center max-w-[120px] leading-tight">
                        {m.isFinished ? "🔒 Partido jugado — predicción bloqueada" : "🔒 Cerrado"}
                      </span>
                    )}

                  </div>

                  {/* Away Team Column */}
                  <div className="flex-1 flex flex-col items-center text-center max-w-[120px]">
                    <span className="text-2xl">{m.awayTeam.flag}</span>
                    <span className="font-sans text-sm font-bold mt-1 text-brand-ink leading-tight truncate w-full">
                      {m.awayTeam.name}
                    </span>
                    <span className="font-mono text-[9px] text-brand-ink-muted bg-brand-bg/50 px-1 rounded uppercase font-semibold">
                      {m.awayTeam.code}
                    </span>
                  </div>

                </div>

                {/* Score actual of match & Points won if finished */}
                <div className="border-t border-brand-ink/10 pt-2 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-brand-ink-muted truncate max-w-[150px]">
                    📍 {m.venue}
                  </span>
                  
                  {isFinished ? (
                    <div className="bg-brand-win/10 text-brand-win border border-brand-win/30 px-2 py-0.5 rounded flex items-center gap-1.5">
                      <span>Resultado: <strong>{m.homeScore}-{m.awayScore}</strong></span>
                      {hasPred && (
                        <span className="bg-brand-win text-brand-bg px-1 rounded font-bold">
                          +{pointsEarned} PTS
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-brand-blue font-semibold uppercase italic bg-brand-blue/10 px-1.5 rounded text-[8px]">
                      A jugarse ⏱️
                    </span>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Floating Manual Save Button */}
      {(hasUnsavedChanges || isSavingManual || showSaveSuccess || showSaveError) && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-bottom-8 fade-in duration-300">
          <button
            onClick={handleManualSave}
            disabled={isSavingManual || showSaveSuccess}
            className={`
              font-mono text-xs uppercase tracking-wider font-bold py-3.5 px-8 flex items-center gap-2 transition-all duration-150
              ${showSaveSuccess 
                ? 'bg-brand-win text-white retro-border retro-shadow cursor-default'
                : showSaveError
                  ? 'bg-brand-error text-white retro-border retro-shadow animate-bounce cursor-pointer'
                  : isSavingManual
                    ? 'bg-brand-accent/80 text-white/80 border-3 border-brand-ink cursor-wait shadow-[2px_2px_0px_#2a1f17] translate-y-[4px]'
                    : 'bg-brand-accent text-white retro-border retro-shadow hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#2a1f17] active:translate-y-[2px] active:shadow-[2px_2px_0px_#2a1f17] cursor-pointer'
              }
            `}
          >
            {showSaveSuccess ? (
              <>
                <svg className="w-4 h-4 stroke-[3px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ¡Guardado!
              </>
            ) : showSaveError ? (
              <>
                <svg className="w-4 h-4 stroke-[3px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Error al guardar. Reintentar
              </>
            ) : isSavingManual ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 stroke-[3px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                Guardar mis pronósticos
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
export default Fixture;
