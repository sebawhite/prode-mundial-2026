import { useState, useEffect } from 'react';
import { Match } from '../data/seedData';
import { getActiveMatches } from '../lib/firebase';

/**
 * Provides the match list to UI components.
 *
 * Source of truth: Firestore /matches collection. setupRealtimeSync() in
 * firebase.ts subscribes to that collection and persists every change to
 * localStorage. getActiveMatches() reads localStorage.
 *
 * IMPORTANT: this hook does NOT fetch openfootball at runtime. The earlier
 * implementation did, and on every page load it replaced the local cache
 * with the openfootball list — which pisó any admin-curated match (custom
 * test fixtures, manual date adjustments, etc.). Firestore is the only
 * source of truth now. To reseed/refresh the fixture from openfootball,
 * run scripts/seed-firestore.cjs or scripts/update-match-dates.cjs.
 */
export function useWorldCupData() {
  const [matches, setMatches] = useState<Match[]>(() => getActiveMatches());

  useEffect(() => {
    // Re-read from localStorage whenever the realtime sync emits a refresh
    // (setupRealtimeSync dispatches 'prode_data_updated' on each Firestore tick).
    const handleSync = () => setMatches(getActiveMatches());
    window.addEventListener('prode_data_updated', handleSync);
    return () => window.removeEventListener('prode_data_updated', handleSync);
  }, []);

  // No loading or error states — data is local-first and always available.
  return { matches, loading: false, error: null };
}
