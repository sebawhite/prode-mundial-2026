import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getActivePredictions, 
  getActiveUsers, 
  saveActivePredictions, 
  isBeforeDeadline,
  calculateMatchPoints
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

  // Debouncing refs
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    // Check if groupStageDeadline is passed (June 10th 2026 23:59 UTC)
    // For manual local time tests, we evaluate real time
    const checkDeadline = () => {
      const now = new Date().getTime();
      const groupDeadline = new Date("2026-06-10T23:59:00Z").getTime();
      setGroupDeadlinePassed(now > groupDeadline);
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
      setPredictions(getActivePredictions());
      setUsers(getActiveUsers());
    };
    window.addEventListener('prode_data_updated', handleSync);
    return () => window.removeEventListener('prode_data_updated', handleSync);
  }, []);

  if (!user) return null;

  // Handles input score updates & debounces the local storage save by 1 second as specified
  const handleScoreChange = (matchId: string, team: "home" | "away", val: string) => {
    const numericValue = val === "" ? null : Math.max(0, Math.min(20, parseInt(val, 10) || 0));
    
    // 1. Instantly update the visual component state for rapid responsive input
    const updatedPredictions = [...predictions];
    const predictionId = `${user.uid}_${matchId}`;
    let matchIdx = updatedPredictions.findIndex(p => p.id === predictionId);

    if (matchIdx === -1) {
      matchIdx = updatedPredictions.push({
        id: predictionId,
        userId: user.uid,
        matchId,
        homeScore: team === "home" ? (numericValue ?? 0) : 0,
        awayScore: team === "away" ? (numericValue ?? 0) : 0,
        createdAt: new Date().toISOString()
      }) - 1;
    } else {
      updatedPredictions[matchIdx] = {
        ...updatedPredictions[matchIdx],
        [team === "home" ? "homeScore" : "awayScore"]: numericValue ?? 0,
        updatedAt: new Date().toISOString()
      };
    }
    setPredictions(updatedPredictions);

    // 2. Clear pre-existing save debounce timers for this match
    if (timeoutsRef.current[matchId]) {
      clearTimeout(timeoutsRef.current[matchId]);
    }

    setSaveStatus(prev => ({ ...prev, [matchId]: "saving" }));

    // 3. Queue the persistence write in exactly 1000ms
    timeoutsRef.current[matchId] = setTimeout(() => {
      saveActivePredictions(updatedPredictions);
      setSaveStatus(prev => ({ ...prev, [matchId]: "saved" }));
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setSaveStatus(prev => {
          const dict = { ...prev };
          if (dict[matchId] === "saved") {
            dict[matchId] = null;
          }
          return dict;
        });
      }, 3000);
    }, 1000);
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

      {/* Real-time Sync Status Indicator */}
      <div className="bg-brand-card p-3 rounded-lg retro-border retro-shadow flex items-center justify-between text-xs font-mono">
        {loading ? (
          <span className="text-brand-blue flex items-center gap-2 animate-pulse font-bold">
            🔄 Sincronizando con fixture oficial de la FIFA 2026 en tiempo real...
          </span>
        ) : error ? (
          <span className="text-brand-accent flex items-center gap-2 font-medium">
            ⚠️ No se pudo conectar al servidor oficial del Mundial. Usando fixture local de respaldo.
          </span>
        ) : (
          <span className="text-brand-win flex items-center gap-2 font-bold">
            ✅ Conectado a openfootball/worldcup.json (Fixture Real Mundial 2026)
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
            const canEdit = editOpen && isViewingSelf;

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
                      <span className="text-[8px] font-mono uppercase bg-brand-bg px-1.5 py-0.2 rounded text-brand-ink-muted tracking-tight">
                        🔒 Cerrado
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

    </div>
  );
};
export default Fixture;
