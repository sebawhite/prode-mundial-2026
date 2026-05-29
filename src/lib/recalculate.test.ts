import { describe, it, expect, beforeEach } from 'vitest';
import { recalculateAllScores } from './firebase';
import { Match } from '../data/seedData';

// Polyfill/mock localStorage for Node/JSDOM test environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; },
  length: 0,
  key: (index: number) => null,
};
global.localStorage = localStorageMock as any;
if (typeof window !== 'undefined') {
  (window as any).localStorage = localStorageMock;
}

describe('Recalculate User Scores & Ranking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should correctly calculate totalPoints and ranks for a fixture of 3 users and 5 matches', () => {
    // 1. Setup 3 users
    const users = [
      { uid: 'user_A', nickname: 'User A', totalPoints: 0, rank: null },
      { uid: 'user_B', nickname: 'User B', totalPoints: 0, rank: null },
      { uid: 'user_C', nickname: 'User C', totalPoints: 0, rank: null }
    ];
    localStorage.setItem('prode_sandbox_users', JSON.stringify(users));

    // 2. Setup 5 matches (some finished, some not)
    const matches: Match[] = [
      {
        id: 'match-1',
        stage: 'groups',
        group: 'A',
        matchday: 1,
        date: new Date().toISOString(),
        homeTeam: { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
        awayTeam: { code: 'FRA', name: 'Francia', flag: '🇫🇷' },
        homeScore: 2,
        awayScore: 1,
        isFinished: true,
        venue: 'Stadium'
      },
      {
        id: 'match-2',
        stage: 'groups',
        group: 'A',
        matchday: 1,
        date: new Date().toISOString(),
        homeTeam: { code: 'MEX', name: 'México', flag: '🇲🇽' },
        awayTeam: { code: 'GER', name: 'Alemania', flag: '🇩🇪' },
        homeScore: 1,
        awayScore: 1,
        isFinished: true,
        venue: 'Stadium'
      },
      {
        id: 'match-3',
        stage: 'groups',
        group: 'A',
        matchday: 2,
        date: new Date().toISOString(),
        homeTeam: { code: 'BRA', name: 'Brasil', flag: '🇧🇷' },
        awayTeam: { code: 'ITA', name: 'Italia', flag: '🇮🇹' },
        homeScore: 3,
        awayScore: 0,
        isFinished: true,
        venue: 'Stadium'
      },
      {
        id: 'match-4',
        stage: 'groups',
        group: 'A',
        matchday: 2,
        date: new Date().toISOString(),
        homeTeam: { code: 'ESP', name: 'España', flag: '🇪🇸' },
        awayTeam: { code: 'JPN', name: 'Japón', flag: '🇯🇵' },
        homeScore: 1,
        awayScore: 2,
        isFinished: true,
        venue: 'Stadium'
      },
      {
        id: 'match-5',
        stage: 'groups',
        group: 'A',
        matchday: 3,
        date: new Date().toISOString(),
        homeTeam: { code: 'USA', name: 'EEUU', flag: '🇺🇸' },
        awayTeam: { code: 'URU', name: 'Uruguay', flag: '🇺🇾' },
        homeScore: null,
        awayScore: null,
        isFinished: false, // Match in progress / not played
        venue: 'Stadium'
      }
    ];

    // 3. Setup predictions
    const predictions = [
      // User A predictions:
      { id: 'user_A_match-1', userId: 'user_A', matchId: 'match-1', homeScore: 2, awayScore: 1 }, // Exact match: 5 pts
      { id: 'user_A_match-2', userId: 'user_A', matchId: 'match-2', homeScore: 0, awayScore: 0 }, // Tie diff exact: 3 pts
      { id: 'user_A_match-3', userId: 'user_A', matchId: 'match-3', homeScore: 1, awayScore: 0 }, // Winner exact sign: 1 pt
      { id: 'user_A_match-4', userId: 'user_A', matchId: 'match-4', homeScore: 0, awayScore: 3 }, // Winner exact sign: 1 pt
      { id: 'user_A_match-5', userId: 'user_A', matchId: 'match-5', homeScore: 1, awayScore: 1 }, // Match not finished: 0 pts
      // Total User A points = 5 + 3 + 1 + 1 + 0 = 10 pts

      // User B predictions:
      { id: 'user_B_match-1', userId: 'user_B', matchId: 'match-1', homeScore: 1, awayScore: 0 }, // Winner exact diff (+1): 3 pts
      { id: 'user_B_match-2', userId: 'user_B', matchId: 'match-2', homeScore: 1, awayScore: 1 }, // Exact match: 5 pts
      { id: 'user_B_match-3', userId: 'user_B', matchId: 'match-3', homeScore: 2, awayScore: 1 }, // Winner exact sign: 1 pt
      { id: 'user_B_match-4', userId: 'user_B', matchId: 'match-4', homeScore: 3, awayScore: 0 }, // Wrong prediction: 0 pts
      // Total User B points = 3 + 5 + 1 + 0 = 9 pts

      // User C predictions:
      { id: 'user_C_match-1', userId: 'user_C', matchId: 'match-1', homeScore: 0, awayScore: 3 }, // Wrong prediction: 0 pts
      { id: 'user_C_match-2', userId: 'user_C', matchId: 'match-2', homeScore: 1, awayScore: 2 }, // Wrong prediction: 0 pts
      { id: 'user_C_match-3', userId: 'user_C', matchId: 'match-3', homeScore: 3, awayScore: 0 }, // Exact match: 5 pts
      { id: 'user_C_match-4', userId: 'user_C', matchId: 'match-4', homeScore: 1, awayScore: 2 }, // Exact match: 5 pts
      // Total User C points = 0 + 0 + 5 + 5 = 10 pts
    ];
    localStorage.setItem('prode_sandbox_predictions', JSON.stringify(predictions));

    // 4. Run recalculation
    recalculateAllScores(matches);

    // 5. Read back and verify results
    const updatedUsers = JSON.parse(localStorage.getItem('prode_sandbox_users') || '[]');
    
    // Check scores
    const userA = updatedUsers.find((u: any) => u.uid === 'user_A');
    const userB = updatedUsers.find((u: any) => u.uid === 'user_B');
    const userC = updatedUsers.find((u: any) => u.uid === 'user_C');

    expect(userA.totalPoints).toBe(10);
    expect(userB.totalPoints).toBe(9);
    expect(userC.totalPoints).toBe(10);

    // Verify correct sorting (User A and C have 10, User B has 9)
    // User A and C should have ranks 1 and 2 (order depends on original order if points are same)
    expect(userA.rank).toBeLessThanOrEqual(2);
    expect(userC.rank).toBeLessThanOrEqual(2);
    expect(userB.rank).toBe(3);
  });
});
