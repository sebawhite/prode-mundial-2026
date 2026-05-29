/**
 * PRODE Mundial 2026 - Firestore Seeder Automation
 * Usage: Node scripts/seed-firestore.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const fs = require('fs');
const path = require('path');

// 1. Load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (e) {
  // Silent fallback
}

// 2. Try to read active firebase configurations
let configData = {};
try {
  const configPath = path.join(__dirname, '../firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn("No se pudo cargar firebase-applet-config.json. Se usarán datos por defecto:", e);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || configData.apiKey || "YOUR_API_KEY",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || configData.authDomain || "YOUR_PROJECT.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || configData.projectId || "YOUR_PROJECT_ID",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || configData.storageBucket || "YOUR_PROJECT.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || configData.messagingSenderId || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || configData.appId || "YOUR_APP_ID"
};

console.log("🚀 Inicializando Firebase con el proyecto:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sorteo oficial (5 diciembre 2025)
const TEAMS = {
  MEX: { code: "MEX", name: "México", flag: "🇲🇽" },
  RSA: { code: "RSA", name: "Sudáfrica", flag: "🇿🇦" },
  KOR: { code: "KOR", name: "Corea del Sur", flag: "🇰🇷" },
  CZE: { code: "CZE", name: "Rep. Checa", flag: "🇨🇿" },
  CAN: { code: "CAN", name: "Canadá", flag: "🇨🇦" },
  BIH: { code: "BIH", name: "Bosnia y H.", flag: "🇧🇦" },
  QAT: { code: "QAT", name: "Qatar", flag: "🇶🇦" },
  SUI: { code: "SUI", name: "Suiza", flag: "🇨🇭" },
  BRA: { code: "BRA", name: "Brasil", flag: "🇧🇷" },
  MAR: { code: "MAR", name: "Marruecos", flag: "🇲🇦" },
  HAI: { code: "HAI", name: "Haití", flag: "🇭🇹" },
  SCO: { code: "SCO", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  USA: { code: "USA", name: "Estados Unidos", flag: "🇺🇸" },
  PAR: { code: "PAR", name: "Paraguay", flag: "🇵🇾" },
  AUS: { code: "AUS", name: "Australia", flag: "🇦🇺" },
  TUR: { code: "TUR", name: "Turquía", flag: "🇹🇷" },
  GER: { code: "GER", name: "Alemania", flag: "🇩🇪" },
  CUW: { code: "CUW", name: "Curazao", flag: "🇨🇼" },
  CIV: { code: "CIV", name: "Costa de Marfil", flag: "🇨🇮" },
  ECU: { code: "ECU", name: "Ecuador", flag: "🇪🇨" },
  NED: { code: "NED", name: "Países Bajos", flag: "🇳🇱" },
  JPN: { code: "JPN", name: "Japón", flag: "🇯🇵" },
  SWE: { code: "SWE", name: "Suecia", flag: "🇸🇪" },
  TUN: { code: "TUN", name: "Túnez", flag: "🇹🇳" },
  BEL: { code: "BEL", name: "Bélgica", flag: "🇧🇪" },
  EGY: { code: "EGY", name: "Egipto", flag: "🇪🇬" },
  IRN: { code: "IRN", name: "Irán", flag: "🇮🇷" },
  NZL: { code: "NZL", name: "Nueva Zelanda", flag: "🇳🇿" },
  ESP: { code: "ESP", name: "España", flag: "🇪🇸" },
  CPV: { code: "CPV", name: "Cabo Verde", flag: "🇨🇻" },
  KSA: { code: "KSA", name: "Arabia Saudita", flag: "🇸🇦" },
  URU: { code: "URU", name: "Uruguay", flag: "🇺🇾" },
  FRA: { code: "FRA", name: "Francia", flag: "🇫🇷" },
  SEN: { code: "SEN", name: "Senegal", flag: "🇸🇳" },
  IRQ: { code: "IRQ", name: "Irak", flag: "🇮🇶" },
  NOR: { code: "NOR", name: "Noruega", flag: "🇳🇴" },
  ARG: { code: "ARG", name: "Argentina", flag: "🇦🇷" },
  ALG: { code: "ALG", name: "Argelia", flag: "🇩🇿" },
  AUT: { code: "AUT", name: "Austria", flag: "🇦🇹" },
  JOR: { code: "JOR", name: "Jordania", flag: "🇯🇴" },
  POR: { code: "POR", name: "Portugal", flag: "🇵🇹" },
  COD: { code: "COD", name: "RD Congo", flag: "🇨🇩" },
  UZB: { code: "UZB", name: "Uzbekistán", flag: "🇺🇿" },
  COL: { code: "COL", name: "Colombia", flag: "🇨🇴" },
  ENG: { code: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  CRO: { code: "CRO", name: "Croacia", flag: "🇭🇷" },
  GHA: { code: "GHA", name: "Ghana", flag: "🇬🇭" },
  PAN: { code: "PAN", name: "Panamá", flag: "🇵🇦" }
};

const GROUPS = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COD", "UZB", "COL"],
  L: ["ENG", "CRO", "GHA", "PAN"]
};

// Generar partidos desde el fixture oficial public/worldcup.json
const worldcupData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/worldcup.json'), 'utf8'));

const findTeamByName = (name) => {
  const cleaned = name.trim().toLowerCase();
  const found = Object.values(TEAMS).find(t => t.name.toLowerCase() === cleaned);
  if (found) return found;
  
  if (cleaned.includes("bosnia")) return TEAMS.BIH;
  if (cleaned.includes("marfil")) return TEAMS.CIV;
  if (cleaned.includes("congo")) return TEAMS.COD;
  if (cleaned.includes("estados unidos") || cleaned === "usa") return TEAMS.USA;
  if (cleaned.includes("curazao") || cleaned.includes("curacao")) return TEAMS.CUW;
  if (cleaned.includes("países bajos") || cleaned.includes("paises bajos") || cleaned === "netherlands") return TEAMS.NED;
  if (cleaned.includes("arabia")) return TEAMS.KSA;
  if (cleaned.includes("zelanda")) return TEAMS.NZL;
  if (cleaned.includes("checa")) return TEAMS.CZE;
  if (cleaned.includes("cabo verde")) return TEAMS.CPV;
  if (cleaned.includes("corea")) return TEAMS.KOR;
  if (cleaned.includes("sudáfrica")) return TEAMS.RSA;
  
  return {
    code: name.substring(0, 3).toUpperCase(),
    name,
    flag: "🏳️",
    placeholder: true
  };
};

function parseMatchDate(dateStr, timeStr) {
  try {
    if (timeStr) {
      const timeClean = timeStr.replace(/UTC/i, "").trim();
      const combined = `${dateStr}T${timeClean}`;
      const d = new Date(combined);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
    const fallbackD = new Date(dateStr);
    if (!isNaN(fallbackD.getTime())) {
      return fallbackD.toISOString();
    }
  } catch (e) {}
  return new Date("2026-06-11T12:00:00Z").toISOString();
}

const matches = [];
const groupMatchesData = worldcupData.matches.filter(item => item.group && /Group/i.test(item.group));

groupMatchesData.forEach((item, idx) => {
  const matchId = `match-${idx + 1}`;
  
  let groupLetter = "A";
  if (item.group) {
    const groupMatch = item.group.match(/Group\s+([A-L])/i);
    if (groupMatch) {
      groupLetter = groupMatch[1];
    }
  }
  
  let matchday = 1;
  if (item.round) {
    const mdayMatch = item.round.match(/Matchday\s+(\d+)/i);
    if (mdayMatch) {
      matchday = parseInt(mdayMatch[1], 10);
    }
  }
  
  const homeTeam = findTeamByName(item.team1);
  const awayTeam = findTeamByName(item.team2);
  
  matches.push({
    id: matchId,
    stage: "groups",
    group: groupLetter,
    matchday: matchday,
    date: parseMatchDate(item.date, item.time),
    homeTeam,
    awayTeam,
    homeScore: null,
    awayScore: null,
    isFinished: false,
    venue: item.ground || "Estadio Mundial 2026"
  });
});

const TOP_PLAYERS = [
  { id: "lm10", name: "Lionel Messi", team: "ARG", position: "FW" },
  { id: "km10", name: "Kylian Mbappé", team: "FRA", position: "FW" },
  { id: "vj07", name: "Vinícius Júnior", team: "BRA", position: "FW" },
  { id: "jb10", name: "Jude Bellingham", team: "ENG", position: "MF" },
  { id: "ly19", name: "Lamine Yamal", team: "ESP", position: "FW" },
  { id: "cr07", name: "Cristiano Ronaldo", team: "POR", position: "FW" }
];

const INITIAL_CONFIG = {
  groupStageDeadline: "2026-06-10T23:59:00Z",
  knockoutDeadline: "2026-06-27T23:59:00Z",
  buyInAmount: 6000,
  currency: "ARS",
  paymentAlias: "yelcho.prode.mp",
  prizeDistribution: { first: 0.60, second: 0.25, third: 0.15 },
  poolPercent: 0.50,
  inviteCodes: ["YELCHO2026-A8F3K2", "YELCHO2026-XYZ", "YELCHO2026-PRODE", "YELCHO2026-MUNDIAL"]
};

// 6. Execution runner upload
async function runSeeder() {
  try {
    console.log("🔑 Autenticando credenciales de Administrador Maestro...");
    const auth = getAuth(app);
    try {
      await signInWithEmailAndPassword(auth, "felixblancovolpe@gmail.com", "FelixWhiteAdmin2026!");
      console.log("   • [OK] Conectado como felixblancovolpe@gmail.com (Acceso Admin)");
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential' || authErr.message.includes('credential')) {
        try {
          console.log("   • [INFO] Cuenta de admin no encontrada en Auth. Creando registro...");
          await createUserWithEmailAndPassword(auth, "felixblancovolpe@gmail.com", "FelixWhiteAdmin2026!");
          console.log("   • [OK] Cuenta de administrador creada e iniciada con éxito!");
        } catch (createErr) {
          console.warn("   • [ALERTA] No se pudo crear la cuenta de administrador. Continuando sin auth por si las reglas de Firestore son abiertas:", createErr.message);
        }
      } else {
        console.warn("   • [ALERTA] Falló el login de administrador. Continuando sin auth por si las reglas son abiertas:", authErr.message);
      }
    }

    console.log("1. Generando configuraciones iniciales...");
    await setDoc(doc(db, "config", "settings"), INITIAL_CONFIG);

    console.log(`2. Insertando ${matches.length} partidos oficiales...`);
    for (const m of matches) {
      await setDoc(doc(db, "matches", m.id), m);
    }

    console.log(`3. Insertando ${TOP_PLAYERS.length} jugadores top destacados...`);
    for (const p of TOP_PLAYERS) {
      await setDoc(doc(db, "players", p.id), p);
    }

    console.log("✅ ¡Hinchada cargada y partidos inicializados con éxito en Cloud Firestore!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error grave en la carga del Semillero:", err);
    process.exit(1);
  }
}

runSeeder();
