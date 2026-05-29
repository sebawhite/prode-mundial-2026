/**
 * PRODE Mundial 2026 - Firestore Seeder Automation
 * Usage: Node scripts/seed-firestore.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// 1. Try to read active firebase configurations
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
  apiKey: configData.apiKey || process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: configData.authDomain || "YOUR_PROJECT.firebaseapp.com",
  projectId: configData.projectId || "YOUR_PROJECT_ID",
  storageBucket: configData.storageBucket || "YOUR_PROJECT.appspot.com",
  messagingSenderId: configData.messagingSenderId || "YOUR_MESSAGING_SENDER_ID",
  appId: configData.appId || "YOUR_APP_ID"
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

// Generar partidos
const matches = [];
let idCounter = 1;

// Fase de grupos
Object.entries(GROUPS).forEach(([groupName, teams]) => {
  const pairings = [
    [0, 1, 1], [2, 3, 1], [0, 2, 2], [1, 3, 2], [3, 0, 3], [1, 2, 3]
  ];
  pairings.forEach(([t1Idx, t2Idx, mday]) => {
    const d = new Date("2026-06-11T12:00:00Z");
    d.setDate(d.getDate() + (idCounter % 16));
    matches.push({
      id: `match-${idCounter++}`,
      stage: "groups",
      group: groupName,
      matchday: mday,
      date: d.toISOString(),
      homeTeam: TEAMS[teams[t1Idx]],
      awayTeam: TEAMS[teams[t2Idx]],
      homeScore: null,
      awayScore: null,
      isFinished: false,
      venue: "Estadio Oficial Mundial 2026"
    });
  });
});

// Playoff Slots
const createKnockoutMatch = (stage, homeCode, homePlaceholder, awayCode, awayPlaceholder, dayOffset) => {
  const d = new Date("2026-06-28T16:00:00Z");
  d.setDate(d.getDate() + dayOffset);
  matches.push({
    id: `match-${idCounter++}`,
    stage,
    date: d.toISOString(),
    homeTeam: { code: homeCode, name: homePlaceholder, flag: "🏳️", placeholder: true },
    awayTeam: { code: awayCode, name: awayPlaceholder, flag: "🏳️", placeholder: true },
    homeScore: null,
    awayScore: null,
    isFinished: false,
    venue: "Estadio Finalista Mundial 2026"
  });
};

// Seeding 32 Playoff matches
for (let i = 1; i <= 16; i++) {
  createKnockoutMatch("16avos", "1A", `1° Grupo ${i}`, "2B", `2° Grupo ${i}`, Math.floor(i / 4));
}
for (let i = 1; i <= 8; i++) {
  createKnockoutMatch("8vos", "M" + (72 + i), `Ganador M${72 + i}`, "M" + (88 - i), `Ganador M${88 - i}`, 8 + Math.floor(i / 2));
}
for (let i = 1; i <= 4; i++) {
  createKnockoutMatch("cuartos", "M" + (88 + i), `Ganador M${88 + i}`, "M" + (96 - i), `Ganador M${96 - i}`, 13 + Math.floor(i / 2));
}
createKnockoutMatch("semis", "M97", "Ganador M97", "M98", "Ganador M98", 18);
createKnockoutMatch("semis", "M99", "Ganador M99", "M100", "Ganador M100", 19);
createKnockoutMatch("third_place", "L101", "Perdedor Semifinal 1", "L102", "Perdedor Semifinal 2", 22);
createKnockoutMatch("final", "W101", "Ganador Semifinal 1", "W102", "Ganador Semifinal 2", 23);

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
  buyInAmount: 5000,
  currency: "ARS",
  paymentAlias: "yelcho.prode.mp",
  prizeDistribution: { first: 0.60, second: 0.25, third: 0.15 },
  organizerCommission: 0.50,
  inviteCodes: ["YELCHO2026-A8F3K2", "YELCHO2026-XYZ", "YELCHO2026-PRODE", "YELCHO2026-MUNDIAL"]
};

// 6. Execution runner upload
async function runSeeder() {
  try {
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
