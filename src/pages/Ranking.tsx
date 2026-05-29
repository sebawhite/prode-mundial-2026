import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getActiveUsers } from '../lib/firebase';
import Avatar from '../components/shared/Avatar';

interface RankingProps {
  onNavigate: (view: string) => void;
  onSetAuditUser: (uid: string) => void;
}

export const Ranking: React.FC<RankingProps> = ({ onNavigate, onSetAuditUser }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>(getActiveUsers());

  // Listen to live database synchronization updates
  useEffect(() => {
    const handleSync = () => {
      setUsers(getActiveUsers());
    };
    window.addEventListener('prode_data_updated', handleSync);
    return () => window.removeEventListener('prode_data_updated', handleSync);
  }, []);

  if (!user) return null;

  // Filter to only display users who have paid and are confirmed.
  // This avoids cluttering table with unapproved troll signups.
  const confirmedUsers = users
    .filter(u => u.paymentStatus === "confirmed")
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const handleInspectUser = (inspectUid: string) => {
    // Save audit target user and switch to fixture to audit their predictions
    onSetAuditUser(inspectUid);
    onNavigate('fixture');
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-4 space-y-6">
      
      {/* Header Board */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card p-4 rounded-lg retro-border retro-shadow">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-ink uppercase tracking-tight flex items-center gap-2">
            🏆 Tabla de Posiciones
          </h2>
          <p className="font-mono text-xs text-brand-ink-muted">
            Solo se muestran los participantes habilitados que pagaron su inscripción. Hacé clic en un participante para auditar sus pronósticos.
          </p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="bg-brand-bg text-brand-ink font-mono text-xs font-bold uppercase retro-border px-3 py-1.5 cursor-pointer hover:bg-brand-card"
        >
          ← Volver
        </button>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-brand-card retro-border retro-shadow rounded-lg overflow-hidden relative registration-mark p-1">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-brand-ink">
            <thead>
              <tr className="bg-brand-ink text-brand-bg text-[10px] font-mono uppercase tracking-wider border-b-2 border-brand-ink">
                <th className="py-3 px-4 text-center w-14">Pos</th>
                <th className="py-3 px-4">Participante</th>
                <th className="py-3 px-4 text-center hidden sm:table-cell">Completado %</th>
                <th className="py-3 px-4 text-right pr-6">Puntos Totales</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-brand-ink/10 text-sm">
              {confirmedUsers.map((u, i) => {
                const isSelf = u.uid === user.uid;
                const pos = i + 1;
                
                return (
                  <tr 
                    key={u.uid} 
                    className={`hover:bg-brand-bg/60 transition-colors ${
                      isSelf ? "bg-brand-gold/15 font-bold" : ""
                    }`}
                  >
                    {/* Rank Position */}
                    <td className="py-4 px-4 text-center font-mono font-bold text-base">
                      {pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `${pos}`}
                    </td>

                    {/* Participant Details with actions */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar photoURL={u.photoURL} name={u.nickname} size="sm" border={false} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleInspectUser(u.uid)}
                              className="font-sans font-bold text-left hover:text-brand-accent hover:underline cursor-pointer transition-colors"
                              title="Hacer clic para ver sus predicciones"
                            >
                              {u.nickname}
                            </button>
                            {isSelf && (
                              <span className="bg-brand-accent text-brand-bg text-[8px] font-mono uppercase py-0.2 px-1 rounded font-bold">
                                Vos
                              </span>
                            )}
                          </div>
                          
                          {/* Subtext info for responsivenes */}
                          <span className="block text-[10px] text-brand-ink-muted sm:hidden">
                            Completado: {u.completionPercent}% | {u.email.split("@")[0]}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Completion percentages */}
                    <td className="py-4 px-4 text-center font-mono text-xs hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 bg-brand-bg border border-brand-ink/20 rounded h-2 overflow-hidden">
                          <div 
                            className="bg-brand-blue h-full" 
                            style={{ width: `${u.completionPercent}%` }}
                          ></div>
                        </div>
                        <span className="font-bold">{u.completionPercent}%</span>
                      </div>
                    </td>

                    {/* Total Accumulations */}
                    <td className="py-4 px-4 text-right pr-6">
                      <span className="font-mono text-lg font-bold text-brand-accent">
                        {u.totalPoints}
                      </span>
                      <span className="text-[9px] font-mono text-brand-ink-muted uppercase ml-1 font-bold">PTS</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {confirmedUsers.length === 0 && (
          <div className="p-8 text-center font-mono text-xs text-brand-ink-muted">
            📭 Todavía no hay participantes confirmados que figuren en la tabla.
          </div>
        )}

      </div>
      
    </div>
  );
};
export default Ranking;
