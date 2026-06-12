import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getActiveMatches, 
  saveActiveMatches, 
  getActiveUsers, 
  saveActiveUsers, 
  getActiveConfig, 
  saveActiveConfig,
  deleteUserDoc
} from '../lib/firebase';
import { Match } from '../data/seedData';
import Avatar from '../components/shared/Avatar';

interface AdminPanelProps {
  onNavigate: (view: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>(getActiveMatches());
  const [users, setUsers] = useState<any[]>(getActiveUsers());
  const [config, setConfig] = useState(getActiveConfig());

  // Listen to live database synchronization updates
  useEffect(() => {
    const handleSync = () => {
      setMatches(getActiveMatches());
      setUsers(getActiveUsers());
      setConfig(getActiveConfig());
    };
    window.addEventListener('prode_data_updated', handleSync);
    return () => window.removeEventListener('prode_data_updated', handleSync);
  }, []);

  // Scoring filters/state
  const [selectedMatchStage, setSelectedMatchStage] = useState<string>("groups");
  const [tempScores, setTempScores] = useState<Record<string, { home: string; away: string }>>({});

  if (!user || !user.isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold text-brand-error">⛔ ACCESO RESTRINGIDO</h2>
        <p className="font-sans text-sm">Solo cuentas administrativas autorizadas pueden auditar este panel.</p>
        <button 
          onClick={() => onNavigate('home')} 
          className="bg-brand-accent text-brand-bg retro-border retro-shadow px-4 py-2 uppercase font-mono font-bold"
        >
          Volver al Home
        </button>
      </div>
    );
  }

  // 1. Confirm User Deposit and Update rankings cascade
  const handleVerifyPayment = async (uid: string, status: "confirmed" | "rejected" | "pending") => {
    const updatedUsers = users.map(u => {
      if (u.uid === uid) {
        return {
          ...u,
          paymentStatus: status,
          paymentConfirmedBy: user?.uid,
          paymentConfirmedAt: new Date().toISOString()
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    try {
      await saveActiveUsers(updatedUsers);
      // Trigger points recalculation block in firebase.ts by saving empty update
      await saveActiveMatches([...matches]);
    } catch (e) {
      alert("Error al actualizar el pago en la base de datos.");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    const confirmDelete = window.confirm("¿Estás seguro de que querés ELIMINAR a este usuario de la base de datos de forma permanente?");
    if (!confirmDelete) return;

    const remainingUsers = users.filter(u => u.uid !== uid);
    setUsers(remainingUsers);
    try {
      await saveActiveUsers(remainingUsers);
      await deleteUserDoc(uid);
    } catch (e) {
      alert("Error al eliminar el usuario.");
    }
  };

  // 3. Save Finished Match Score & Recalculate standings points in the network
  const handleSaveMatchScore = async (matchId: string) => {
    const scoreState = tempScores[matchId];
    if (!scoreState) {
      alert("Ingrese marcadores primero.");
      return;
    }

    const homeScore = parseInt(scoreState.home, 10);
    const awayScore = parseInt(scoreState.away, 10);

    if (isNaN(homeScore) || isNaN(awayScore)) {
      alert("Debe ingresar valores numéricos válidos en los goles.");
      return;
    }

    const updatedMatches = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          homeScore,
          awayScore,
          isFinished: true
        };
      }
      return m;
    });

    setMatches(updatedMatches);
    try {
      await saveActiveMatches(updatedMatches); // This triggers scores-recalculations in all matches predictions!
      setUsers(getActiveUsers()); // reload points state
      alert("Marcador oficial guardado. Puntos de los usuarios recalculados correctamente.");
    } catch (e) {
      alert("Error al guardar marcador oficial en la base de datos.");
    }
  };

  // 4. Cancel/Clear Match Score
  const handleClearMatchScore = async (matchId: string) => {
    const updatedMatches = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          homeScore: null,
          awayScore: null,
          isFinished: false
        };
      }
      return m;
    });

    setMatches(updatedMatches);
    try {
      await saveActiveMatches(updatedMatches);
      setUsers(getActiveUsers());
      alert("Marcador cancelado.");
    } catch (e) {
      alert("Error al cancelar marcador en la base de datos.");
    }
  };

  const handleTempScoreChange = (matchId: string, team: "home" | "away", val: string) => {
    setTempScores(prev => ({
      ...prev,
      [matchId]: {
        home: team === "home" ? val : (prev[matchId]?.home || "0"),
        away: team === "away" ? val : (prev[matchId]?.away || "0")
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 space-y-8">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card p-4 rounded-lg retro-border retro-shadow">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-ink uppercase tracking-tight flex items-center gap-2">
            🛠️ Panel del Administrador (Felix Blanco)
          </h2>
          <p className="font-mono text-xs text-brand-ink-muted">
            Gestioná registros, aprobá transferencias de ARS {config.buyInAmount.toLocaleString('es-AR')} e ingresá los marcadores oficiales.
          </p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="bg-brand-bg text-brand-ink font-mono text-xs font-bold uppercase retro-border px-3 py-1.5 cursor-pointer hover:bg-brand-card"
        >
          ← Volver al Home
        </button>
      </div>

      <div className="space-y-6">
          
          <div className="bg-brand-card retro-border retro-shadow p-5 rounded-lg space-y-4">
            <h3 className="font-serif text-lg font-bold border-b border-brand-ink/15 pb-1">
              👥 Gestión de Participantes ({users.length})
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {users.map(u => {
                const whatsappMsgUrl = `https://wa.me/${u.whatsapp.replace('+', '')}?text=Hola%20${encodeURIComponent(u.fullName)},%20te%20contacto%20sobre%20tu%20inscripció%20para%20el%20Prode%20Mundial.`;
                
                return (
                  <div 
                    key={u.uid} 
                    className="bg-brand-bg border-2 border-brand-ink p-3 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs relative"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Avatar photoURL={u.photoURL} name={u.nickname} size="sm" border={false} />
                        <div>
                          {/* Private full name shown ONLY to administration */}
                          <span className="font-sans font-bold text-sm block">
                            {u.fullName} <span className="text-brand-ink-muted font-normal">({u.nickname})</span>
                          </span>
                          <span className="font-mono text-[10px] text-brand-ink-muted block">
                            Email: {u.email}
                          </span>
                          {u.paymentStatus === "pending" && u.paymentNotified === true && (
                            <span className="inline-block bg-[#c8442f] text-white px-2 py-0.5 mt-1 rounded text-[8px] font-mono font-bold uppercase animate-pulse shadow-sm">
                              🔔 RECLAMA TRANSFERENCIA
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs font-mono flex items-center justify-between">
                        <span>📞 Cel: <a href={whatsappMsgUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline text-brand-win hover:text-brand-win/80">{u.whatsapp}</a></span>
                        {u.paymentNotified === true && u.paymentNotifiedAt && (
                          <span className="text-[9px] font-mono text-brand-ink-muted opacity-80 pl-2">
                            ⏱️ Avisó: {new Date(u.paymentNotifiedAt).toLocaleDateString('es-AR', {day: 'numeric', month: 'short'})} a las {new Date(u.paymentNotifiedAt).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {u.paymentStatus === "rejected" && (
                        <button
                          onClick={() => handleDeleteUser(u.uid)}
                          className="font-mono text-[10px] font-bold uppercase rounded border-2 border-brand-error p-1 bg-brand-bg text-brand-error hover:bg-brand-error hover:text-brand-bg transition-colors"
                          title="Eliminar permanentemente"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                      <select
                        value={u.paymentStatus}
                        onChange={(e) => handleVerifyPayment(u.uid, e.target.value as any)}
                        className={`font-mono text-[11px] font-bold uppercase rounded border-2 p-1 bg-brand-bg text-brand-ink cursor-pointer ${
                          u.paymentStatus === "confirmed" ? "border-brand-win text-brand-win" : 
                          u.paymentStatus === "rejected" ? "border-brand-error text-brand-error" : 
                          "border-brand-gold text-brand-gold"
                        }`}
                      >
                        <option value="pending">⏳ Pendiente</option>
                        <option value="confirmed">✅ Confirmado</option>
                        <option value="rejected">❌ Rechazado</option>
                      </select>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Core Score injector form for Group matches */}
          <div className="bg-brand-card retro-border retro-shadow p-5 rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-brand-ink/15 pb-1">
              <h3 className="font-serif text-lg font-bold">
                ⚽ Inyección de Marcadores Oficiales
              </h3>
              <span className="font-mono text-xs text-brand-accent font-bold uppercase bg-brand-accent/10 px-2 py-0.5 rounded border border-brand-accent/20">
                Fase de Grupos
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {matches
                .filter(m => m.stage === "groups")
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(m => {
                  const temp = tempScores[m.id] || { home: m.homeScore?.toString() || "", away: m.awayScore?.toString() || "" };
                  return (
                    <div 
                      key={m.id} 
                      className="bg-brand-bg border-2 border-brand-ink p-3 rounded-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
                    >
                      <div className="text-left font-mono shrink-0">
                        <span className="font-bold">M{m.id.split("-")[1]} • {m.stage.toUpperCase()} {m.group ? `(Grupo ${m.group})` : ""}</span>
                        <span className="block text-[10px] text-brand-ink-muted">{new Date(m.date).toLocaleString()}</span>
                      </div>

                      {/* Score actual inputs */}
                      <div className="flex items-center gap-1.5 justify-center">
                        <span className="font-sans font-bold truncate max-w-[80px]">{m.homeTeam.name}</span>
                        <input
                          type="number"
                          value={temp.home}
                          onChange={(e) => handleTempScoreChange(m.id, "home", e.target.value)}
                          className="w-10 h-8 text-center border font-mono font-bold text-sm bg-brand-card"
                          placeholder="-"
                        />
                        <span className="font-bold">:</span>
                        <input
                          type="number"
                          value={temp.away}
                          onChange={(e) => handleTempScoreChange(m.id, "away", e.target.value)}
                          className="w-10 h-8 text-center border font-mono font-bold text-sm bg-brand-card"
                          placeholder="-"
                        />
                        <span className="font-sans font-bold truncate max-w-[80px]">{m.awayTeam.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSaveMatchScore(m.id)}
                          className="bg-brand-win text-brand-bg font-mono font-bold text-[10px] uppercase border px-2 py-1 rounded cursor-pointer hover:bg-brand-win/90"
                        >
                          Guardar Score
                        </button>
                        {m.isFinished && (
                          <button
                            onClick={() => handleClearMatchScore(m.id)}
                            className="bg-brand-error text-brand-bg font-mono font-bold text-[10px] uppercase border px-2 py-1 rounded cursor-pointer hover:bg-brand-error/90"
                          >
                            Anular
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
            </div>
          </div>

        </div>
      </div>
    );
};
export default AdminPanel;
