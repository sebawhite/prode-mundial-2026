import { useState, useEffect } from 'react';
import { Match } from '../data/seedData';
import { getActiveMatches, saveActiveMatches } from '../lib/firebase';
import { fetchWorldCup2026Matches } from '../lib/worldcupApi';

export function useWorldCupData() {
  const [matches, setMatches] = useState<Match[]>(() => getActiveMatches());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const liveMatches = await fetchWorldCup2026Matches();
        if (isMounted) {
          // If we got matches from API, save to Local Storage & state
          saveActiveMatches(liveMatches);
          setMatches(liveMatches);
        }
      } catch (err: any) {
        console.warn("Failed to load real World Cup data, falling back to cached matches:", err);
        if (isMounted) {
          setError(err.message || String(err));
          // Rollback to cached matches
          setMatches(getActiveMatches());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { matches, loading, error };
}
