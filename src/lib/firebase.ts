import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ALL_MATCHES, TOP_PLAYERS, INITIAL_CONFIG, Match, Player } from '../data/seedData';

// Safe config mapping supporting both JSON config and environment variables (Vite)
const metaEnv = (import.meta as any).env || {};
const resolvedConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig?.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig?.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig?.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig?.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig?.appId,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || (firebaseConfig as any)?.firestoreDatabaseId || 'default'
};

// Determine if Firebase is configured with real values or default placeholders
export const IS_SANDBOX = 
  !resolvedConfig.apiKey || 
  resolvedConfig.apiKey === "PLACEHOLDER" ||
  !resolvedConfig.projectId ||
  resolvedConfig.projectId === "PLACEHOLDER";

let firebaseApp;
let firestoreDb: any = null;
let firebaseAuth: any = null;

if (!IS_SANDBOX) {
  try {
    firebaseApp = initializeApp(resolvedConfig);
    // Explicitly handle default database configuration mapping dynamically
    const dbId = resolvedConfig.firestoreDatabaseId === 'default' ? undefined : resolvedConfig.firestoreDatabaseId;
    firestoreDb = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);
  } catch (error) {
    console.warn("Could not load Live Firebase, moving to Sandbox Fallback mode:", error);
  }
}

export const auth = firebaseAuth;
export const db = firestoreDb;

// 1. Error Handler pattern as mandated by the Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || 'anonymous-sandbox',
      email: auth?.currentUser?.email || 'anonymous-sandbox@example.com',
      emailVerified: auth?.currentUser?.emailVerified || false,
    },
    operationType,
    path
  };
  console.error('Firestore Hardened Error Event: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 2. Argentine PRODE Scoring Logic
export function calculateMatchPoints(
  predHome: number,
  predAway: number,
  actualHome: number | null,
  actualAway: number | null,
  isKnockout: boolean
): number {
  if (actualHome === null || actualAway === null) return 0;

  const predDiff = predHome - predAway;
  const actualDiff = actualHome - actualAway;

  const predSign = Math.sign(predDiff);
  const actualSign = Math.sign(actualDiff);

  let points = 0;

  if (predHome === actualHome && predAway === actualAway) {
    // Marcador exacto
    points = 5;
  } else if (predDiff === actualDiff && predSign === actualSign) {
    // Diferencia exacta de gol (gana/pierde con igual diferencia, o empate diferente como 1-1 vs 2-2)
    points = 3;
  } else if (predSign === actualSign) {
    // Solo acierto resultado (ganador/perdedor o empate)
    points = 1;
  }

  return points;
}

// Helper to determine if matches are before deadlines
export function isBeforeDeadline(stage: string): boolean {
  const config = getActiveConfig();
  const now = new Date();
  
  if (stage === "groups") {
    const deadline = new Date(config.groupStageDeadline);
    return now < deadline;
  } else {
    const deadline = new Date(config.knockoutDeadline);
    return now < deadline;
  }
}

// Client Side Storage Backed Store (Sandbox Database Engine)
const STORAGE_KEYS = {
  USERS: 'prode_sandbox_users',
  SESSION: 'prode_sandbox_session',
  MATCHES: 'prode_sandbox_matches',
  PREDICTIONS: 'prode_sandbox_predictions',
  CONFIG: 'prode_sandbox_config',
};

// Seed standard data if not found in local forage
function getOrInitStorage<T>(key: string, initialData: T): T {
  const existing = localStorage.getItem(key);
  if (!existing) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(existing) as T;
}

export function getActiveConfig() {
  const config = getOrInitStorage<any>(STORAGE_KEYS.CONFIG, INITIAL_CONFIG);
  return config;
}

export function saveActiveConfig(newConfig: any) {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
  if (!IS_SANDBOX && db) {
    setDoc(doc(db, "config", "settings"), newConfig).catch(err => {
      console.error("Error saving config to Firestore:", err);
    });
  }
}

// Get all matches from either mock storage or real collection
export function getActiveMatches(): Match[] {
  const stored = getOrInitStorage<Match[]>(STORAGE_KEYS.MATCHES, ALL_MATCHES);
  // Ensure we filter out knockout matches if any exist in legacy state
  const groupsOnly = stored.filter(m => m.stage === "groups" && m.group !== undefined);
  if (stored.length !== groupsOnly.length) {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(groupsOnly));
    return groupsOnly;
  }
  return stored;
}

export function saveActiveMatches(matches: Match[]) {
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  // Cascade recalculate points for all predictions when matches update
  recalculateAllScores(matches);
  if (!IS_SANDBOX && db) {
    matches.forEach(m => {
      if (m.id) {
        setDoc(doc(db, "matches", m.id), m).catch(err => {
          console.error(`Error saving match ${m.id} to Firestore:`, err);
        });
      }
    });
  }
}

// Recalculates user points based on final scores
export function recalculateAllScores(matches: Match[]) {
  const users = getOrInitStorage<any[]>(STORAGE_KEYS.USERS, []);
  const predictions = getOrInitStorage<any[]>(STORAGE_KEYS.PREDICTIONS, []);
  
  const matchesMap = new Map(matches.map(m => [m.id, m]));
  
  users.forEach(user => {
    let pts = 0;
    let predictedCount = 0;
    
    // Core predictions points calculation
    const userPreds = predictions.filter(p => p.userId === user.uid);
    userPreds.forEach(pred => {
      const match = matchesMap.get(pred.matchId);
      if (match) {
        predictedCount++;
        if (match.isFinished) {
          const mPoints = calculateMatchPoints(
            pred.homeScore,
            pred.awayScore,
            match.homeScore,
            match.awayScore,
            match.stage !== "groups"
          );
          pred.pointsEarned = mPoints;
          pts += mPoints;
        }
      }
    });

    // Calculate completion %
    const totalMatchesCount = matches.length;
    user.totalPoints = pts;
    user.completionPercent = Math.round((predictedCount / totalMatchesCount) * 100);
  });
  
  // Sort and assign ranks
  users.sort((a, b) => b.totalPoints - a.totalPoints);
  users.forEach((u, index) => {
    u.rank = index + 1;
  });
  
  localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(predictions));
  saveActiveUsers(users);
}

export function getActiveUsers(): any[] {
  // Prepopulate with a few mock participants to make the experience feel real and alive
  const defaultUsers = [
    {
      uid: "admin_tester",
      fullName: "Felix Blanco",
      nickname: "Felixwhite",
      email: "felixblancovolpe@gmail.com",
      whatsapp: "+541198765432",
      paymentStatus: "confirmed",
      createdAt: new Date().toISOString(),
      isAdmin: true,
      totalPoints: 23,
      completionPercent: 55,
      rank: 1
    },
    {
      uid: "user_pablo",
      fullName: "Pablo Mendoza Iglesias",
      nickname: "Crackito",
      email: "pablo@email.com",
      whatsapp: "+5491123456789",
      paymentStatus: "confirmed",
      createdAt: new Date().toISOString(),
      isAdmin: false,
      totalPoints: 18,
      completionPercent: 42,
      rank: 2
    },
    {
      uid: "user_marta",
      fullName: "Marta Gomez",
      nickname: "Marta_G",
      email: "marta@email.com",
      whatsapp: "+5491133334444",
      paymentStatus: "confirmed",
      createdAt: new Date().toISOString(),
      isAdmin: false,
      totalPoints: 12,
      completionPercent: 88,
      rank: 3
    },
    {
      uid: "user_juan",
      fullName: "Juan Perez",
      nickname: "Juancho_Mundial",
      email: "juan@email.com",
      whatsapp: "+541155556666",
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
      isAdmin: false,
      totalPoints: 0,
      completionPercent: 0,
      rank: 4
    }
  ];
  const users = getOrInitStorage(STORAGE_KEYS.USERS, defaultUsers);
    
    // Purge Sandbox Mock Users automatically in Live/Production mode to align with Firestore
    if (!IS_SANDBOX) {
      const realUsersOnly = users.filter((u: any) => u.uid && !u.uid.startsWith('user_') && u.uid !== 'admin_tester');
      if (realUsersOnly.length !== users.length) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(realUsersOnly));
        return realUsersOnly;
      }
    }
    return users;
}

export function saveActiveUsers(users: any[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  if (!IS_SANDBOX && db) {
    const currentUid = auth?.currentUser?.uid;
    const currentEmail = auth?.currentUser?.email;
    const isCurrentUserAdmin = currentEmail === 'sebahotelmkt@gmail.com' || currentEmail === 'felixblancovolpe@gmail.com';
    users.forEach(u => {
      if (u.uid && !u.uid.startsWith('user_') && u.uid !== 'admin_tester') {
        if (isCurrentUserAdmin || u.uid === currentUid) {
          setDoc(doc(db, "users", u.uid), u).catch(err => {
            console.error(`Error saving user ${u.uid} to Firestore:`, err);
          });
        }
      }
    });
  }
}

export async function deleteUserDoc(uid: string) {
  if (!IS_SANDBOX && db) {
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (err) {
      console.error(`Error deleting user ${uid} from Firestore:`, err);
    }
  }
}

// User session management helper
export function getActiveSession(): any | null {
  const sess = localStorage.getItem(STORAGE_KEYS.SESSION);
  return sess ? JSON.parse(sess) : null;
}

export function saveActiveSession(user: any | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

export function getActivePredictions(): any[] {
  const existing = localStorage.getItem(STORAGE_KEYS.PREDICTIONS);
  let preds = [];
  if (existing) {
    preds = JSON.parse(existing);
  } else {
    // Prepopulate standard prediction values for rank users to make dashboard look rich
    const defaults = [
      { id: "user_pablo_match-1", userId: "user_pablo", matchId: "match-1", homeScore: 2, awayScore: 1, pointsEarned: 5 },
      { id: "user_pablo_match-2", userId: "user_pablo", matchId: "match-2", homeScore: 1, awayScore: 1, pointsEarned: 3 },
      { id: "user_marta_match-1", userId: "user_marta", matchId: "match-1", homeScore: 0, awayScore: 2, pointsEarned: 0 },
      { id: "user_marta_match-2", userId: "user_marta", matchId: "match-2", homeScore: 1, awayScore: 1, pointsEarned: 3 }
    ];

    // Dynamically populate some predictions for the 3 mock users (Felix: ~55%, Pablo: ~42%, Marta: ~88%)
    // to make the initial state look incredibly realistic and rich!
    const matches = ALL_MATCHES; // 72 matches

    // Felix: ~55% (40 matches)
    for (let i = 0; i < 40; i++) {
      const match = matches[i];
      if (match) {
        defaults.push({
          id: `admin_tester_${match.id}`,
          userId: "admin_tester",
          matchId: match.id,
          homeScore: (i % 3),
          awayScore: ((i + 1) % 3),
          pointsEarned: 0
        });
      }
    }

    // Pablo: ~42% (30 matches)
    for (let i = 2; i < 30; i++) {
      const match = matches[i];
      if (match) {
        defaults.push({
          id: `user_pablo_${match.id}`,
          userId: "user_pablo",
          matchId: match.id,
          homeScore: ((i + 1) % 3),
          awayScore: (i % 3),
          pointsEarned: 0
        });
      }
    }

    // Marta: ~88% (63 matches)
    for (let i = 2; i < 63; i++) {
      const match = matches[i];
      if (match) {
        defaults.push({
          id: `user_marta_${match.id}`,
          userId: "user_marta",
          matchId: match.id,
          homeScore: (i % 3),
          awayScore: ((i + 2) % 3),
          pointsEarned: 0
        });
      }
    }

    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(defaults));
    preds = defaults;
  }

  // Purge Sandbox Mock Predictions automatically in Live/Production mode to align with Firestore
  if (!IS_SANDBOX) {
    const realPredsOnly = preds.filter((p: any) => p.userId && !p.userId.startsWith('user_') && p.userId !== 'admin_tester');
    if (realPredsOnly.length !== preds.length) {
      localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(realPredsOnly));
      return realPredsOnly;
    }
  }
  return preds;
}

export function saveActivePredictions(preds: any[]) {
  localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(preds));
  // Resync profile completed percents
  const matches = getActiveMatches();
  recalculateAllScores(matches);
  if (!IS_SANDBOX && db && auth?.currentUser) {
    const currentUid = auth.currentUser.uid;
    const currentEmail = auth?.currentUser?.email;
    const isCurrentUserAdmin = currentEmail === 'sebahotelmkt@gmail.com' || currentEmail === 'felixblancovolpe@gmail.com';
    preds.forEach(p => {
      if (p.id && (p.userId === currentUid || isCurrentUserAdmin)) {
        setDoc(doc(db, "predictions", p.id), p).catch(err => {
          console.error(`Error saving prediction ${p.id} to Firestore:`, err);
        });
      }
    });
  }
}

// Fetch system config on app boot to ensure local storage always has the latest config/settings, even if not logged in
export function fetchPublicConfig() {
  if (IS_SANDBOX || !db) return;
  getDoc(doc(db, "config", "settings")).then(docSnap => {
    if (docSnap.exists()) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(docSnap.data()));
      window.dispatchEvent(new Event('prode_data_updated'));
      console.log("Public config settings fetched successfully.");
    }
  }).catch(err => {
    console.warn("Public config fetch skipped or restricted:", err);
  });
}

// Verification Connection Check on Boot as requested by Firebase Integration Skill
async function testConnection() {
  if (!IS_SANDBOX && db) {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firebase connection verified successfully!");
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. Client is offline.");
      }
    }
  }
}
testConnection();

let activeUnsubscribes: (() => void)[] = [];

// Dynamically sets up real-time sync listeners only when an authenticated user is active.
// Includes a secure fallback query for predictions when global read is restricted before the group deadline.
export function setupRealtimeSync(currentUser: any, onDataUpdated: () => void): (() => void) | null {
  // Clear any existing active subscriptions first
  activeUnsubscribes.forEach(unsub => {
    try {
      unsub();
    } catch (e) {
      // Ignored
    }
  });
  activeUnsubscribes = [];

  if (IS_SANDBOX || !db || !currentUser) {
    return null;
  }

  console.log(`Setting up real-time listener subscriptions for authenticated user: ${currentUser.uid}`);

  // 1. Config Settings sync
  const unsubConfig = onSnapshot(doc(db, "config", "settings"), (docSnap) => {
    if (docSnap.exists()) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(docSnap.data()));
      onDataUpdated();
    }
  }, (err) => {
    console.warn("Real-time settings sync error:", err);
    handleFirestoreError(err, OperationType.GET, "config/settings");
  });
  activeUnsubscribes.push(unsubConfig);

  // 2. Users sync
  const unsubUsers = onSnapshot(collection(db, "users"), (querySnap) => {
    const list: any[] = [];
    querySnap.forEach((docSnap) => {
      list.push(docSnap.data());
    });
    if (list.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
      onDataUpdated();
    }
  }, (err) => {
    console.warn("Real-time users sync error:", err);
    handleFirestoreError(err, OperationType.GET, "users");
  });
  activeUnsubscribes.push(unsubUsers);

  // 3. Matches sync
  const unsubMatches = onSnapshot(collection(db, "matches"), (querySnap) => {
    const list: any[] = [];
    querySnap.forEach((docSnap) => {
      list.push(docSnap.data());
    });
    if (list.length > 0) {
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(list));
      onDataUpdated();
    }
  }, (err) => {
    console.warn("Real-time matches sync error:", err);
    handleFirestoreError(err, OperationType.GET, "matches");
  });
  activeUnsubscribes.push(unsubMatches);

  // 4. Predictions sync
  let unsubPredictions: (() => void) | null = null;
  
  const setupPredictionsQuery = (all: boolean) => {
    if (unsubPredictions) {
      unsubPredictions();
      const idx = activeUnsubscribes.indexOf(unsubPredictions);
      if (idx !== -1) activeUnsubscribes.splice(idx, 1);
    }

    const predictionsRef = collection(db, "predictions");
    const q = all 
      ? query(predictionsRef) 
      : query(predictionsRef, where("userId", "==", currentUser.uid));

    unsubPredictions = onSnapshot(q, (querySnap) => {
      const list: any[] = [];
      querySnap.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      if (all) {
        localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(list));
      } else {
        const existingPreds = getActivePredictions();
        const otherUsersPreds = existingPreds.filter((p: any) => p.userId !== currentUser.uid);
        const merged = [...otherUsersPreds, ...list];
        localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(merged));
      }
      onDataUpdated();
    }, (err) => {
      console.warn(`Real-time predictions sync error (all=${all}):`, err);
      // Fallback if full predictions access is denied (e.g. before group deadline)
      if (all && (err.code === 'permission-denied' || err.message.toLowerCase().includes("permission"))) {
        console.log("Full predictions query restricted. Falling back to syncing current user predictions only.");
        setupPredictionsQuery(false);
      } else {
        handleFirestoreError(err, OperationType.GET, "predictions");
      }
    });

    if (unsubPredictions) {
      activeUnsubscribes.push(unsubPredictions);
    }
  };

  // Initially try to fetch all predictions (e.g. if deadline has passed), fallback if permission is denied
  setupPredictionsQuery(true);

  return () => {
    activeUnsubscribes.forEach(unsub => {
      try {
        unsub();
      } catch (e) {
        // Ignored
      }
    });
    activeUnsubscribes = [];
  };
}
