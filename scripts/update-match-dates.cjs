/**
 * Script para actualizar las fechas, horarios y sedes de los partidos
 * de la fase de grupos sin sobreescribir resultados ni predicciones.
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const fs = require('fs');
const path = require('path');

// 1. Cargar config local y .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

let configData = {};
try {
  const configPath = path.join(__dirname, '../firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn("No se pudo cargar config. Usando defaults.");
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || configData.apiKey || "YOUR_API_KEY",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || configData.authDomain || "YOUR_PROJECT.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || configData.projectId || "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 2. Leer JSON local y mapearlo usando el script seedData
// Para esto, en un script de node necesitamos cargar el TS o recrear la lógica básica.
// Pero como es un script de node, vamos a leer el JSON y hacer la lógica directo acá.
const worldcupJson = require('../public/worldcup.json');
const matchesData = worldcupJson.matches;

// Mismo mapeo de seedData
const TEAMS = {
  // Group A
  MEX: { code: "MEX", name: "México", flag: "🇲🇽" },
  RSA: { code: "RSA", name: "Sudáfrica", flag: "🇿🇦" },
  KOR: { code: "KOR", name: "Corea del Sur", flag: "🇰🇷" },
  CZE: { code: "CZE", name: "Rep. Checa", flag: "🇨🇿" },
  // Group B
  CAN: { code: "CAN", name: "Canadá", flag: "🇨🇦" },
  BIH: { code: "BIH", name: "Bosnia y H.", flag: "🇧🇦" },
  QAT: { code: "QAT", name: "Qatar", flag: "🇶🇦" },
  SUI: { code: "SUI", name: "Suiza", flag: "🇨🇭" },
  // Group C
  BRA: { code: "BRA", name: "Brasil", flag: "🇧🇷" },
  MAR: { code: "MAR", name: "Marruecos", flag: "🇲🇦" },
  HAI: { code: "HAI", name: "Haití", flag: "🇭🇹" },
  SCO: { code: "SCO", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  // Group D
  USA: { code: "USA", name: "Estados Unidos", flag: "🇺🇸" },
  PAR: { code: "PAR", name: "Paraguay", flag: "🇵🇾" },
  AUS: { code: "AUS", name: "Australia", flag: "🇦🇺" },
  TUR: { code: "TUR", name: "Turquía", flag: "🇹🇷" },
  // Group E
  GER: { code: "GER", name: "Alemania", flag: "🇩🇪" },
  CUW: { code: "CUW", name: "Curazao", flag: "🇨🇼" },
  CIV: { code: "CIV", name: "Costa de Marfil", flag: "🇨🇮" },
  ECU: { code: "ECU", name: "Ecuador", flag: "🇪🇨" },
  // Group F
  NED: { code: "NED", name: "Países Bajos", flag: "🇳🇱" },
  JPN: { code: "JPN", name: "Japón", flag: "🇯🇵" },
  SWE: { code: "SWE", name: "Suecia", flag: "🇸🇪" },
  TUN: { code: "TUN", name: "Túnez", flag: "🇹🇳" },
  // Group G
  BEL: { code: "BEL", name: "Bélgica", flag: "🇧🇪" },
  EGY: { code: "EGY", name: "Egipto", flag: "🇪🇬" },
  IRN: { code: "IRN", name: "Irán", flag: "🇮🇷" },
  NZL: { code: "NZL", name: "Nueva Zelanda", flag: "🇳🇿" },
  // Group H
  ESP: { code: "ESP", name: "España", flag: "🇪🇸" },
  CPV: { code: "CPV", name: "Cabo Verde", flag: "🇨🇻" },
  KSA: { code: "KSA", name: "Arabia Saudita", flag: "🇸🇦" },
  URU: { code: "URU", name: "Uruguay", flag: "🇺🇾" },
  // Group I
  FRA: { code: "FRA", name: "Francia", flag: "🇫🇷" },
  SEN: { code: "SEN", name: "Senegal", flag: "🇸🇳" },
  IRQ: { code: "IRQ", name: "Irak", flag: "🇮🇶" },
  NOR: { code: "NOR", name: "Noruega", flag: "🇳🇴" },
  // Group J
  ARG: { code: "ARG", name: "Argentina", flag: "🇦🇷" },
  ALG: { code: "ALG", name: "Argelia", flag: "🇩🇿" },
  AUT: { code: "AUT", name: "Austria", flag: "🇦🇹" },
  JOR: { code: "JOR", name: "Jordania", flag: "🇯🇴" },
  // Group K
  POR: { code: "POR", name: "Portugal", flag: "🇵🇹" },
  COD: { code: "COD", name: "RD Congo", flag: "🇨🇩" },
  UZB: { code: "UZB", name: "Uzbekistán", flag: "🇺🇿" },
  COL: { code: "COL", name: "Colombia", flag: "🇨🇴" },
  // Group L
  ENG: { code: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  CRO: { code: "CRO", name: "Croacia", flag: "🇭🇷" },
  GHA: { code: "GHA", name: "Ghana", flag: "🇬🇭" },
  PAN: { code: "PAN", name: "Panamá", flag: "🇵🇦" }
};

function findTeam(name) {
  for (const k in TEAMS) {
    if (TEAMS[k].name === name || TEAMS[k].code === name || name.includes(TEAMS[k].name)) {
      return TEAMS[k];
    }
  }
  return { code: name.substring(0,3).toUpperCase(), name, flag: "🏳️", placeholder: true };
}

function parseMatchDate(dateStr, timeStr) {
  if (timeStr && timeStr !== "TBD" && !timeStr.includes("TBD")) {
    // Check if it's in the new ART format: "16:00 ART"
    const artMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s+ART$/i);
    if (artMatch) {
      const hh = artMatch[1].padStart(2, '0');
      const mm = artMatch[2];
      const combined = `${dateStr}T${hh}:${mm}:00-03:00`;
      const d = new Date(combined);
      if (!isNaN(d.getTime())) return combined;
    }

    const d = new Date(`${dateStr}T${timeStr.replace(/UTC/i,"").trim()}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date(`${dateStr}T12:00:00Z`).toISOString();
}

async function run() {
  // Admin credentials read from env vars — never hardcoded.
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.error("❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars. Set them in your .env file.");
    process.exit(1);
  }

  console.log("🔑 Autenticando credenciales de Administrador...");
  try {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log(`   • [OK] Conectado como ${adminEmail}`);
  } catch (err) {
    console.error("   • [ERROR] Falló el login de admin:", err.message);
    process.exit(1);
  }

  let successCount = 0;
  console.log("⚡ Empezando actualización en vivo de 72 partidos de grupos...");

  for (let i = 0; i < 72; i++) {
    const item = matchesData[i];
    const matchId = `match-${i+1}`;
    
    let groupLetter = "A";
    if (item.group) {
      const match = item.group.match(/Group\s+([A-L])/i);
      if (match) groupLetter = match[1];
    }
    
    let matchday = 1;
    if (item.round) {
      const md = item.round.match(/Matchday\s+(\d+)/i);
      if (md) matchday = parseInt(md[1], 10);
    }
    
    const updatePayload = {
      date: parseMatchDate(item.date, item.time),
      venue: item.ground || "TBD",
      group: groupLetter,
      matchday: matchday,
      homeTeam: findTeam(item.team1),
      awayTeam: findTeam(item.team2)
    };

    try {
      const docRef = doc(db, "matches", matchId);
      await updateDoc(docRef, updatePayload);
      console.log(`✅ ${matchId} actualizado (Matchday ${matchday}, ${updatePayload.homeTeam.name} vs ${updatePayload.awayTeam.name}, ${item.date})`);
      successCount++;
    } catch (e) {
      if (e.code === 'not-found') {
        console.log(`⚠️ ${matchId} no existe. Creando sin scores...`);
        const { setDoc } = require('firebase/firestore');
        await setDoc(docRef, {
          id: matchId,
          stage: "groups",
          ...updatePayload,
          homeScore: null,
          awayScore: null,
          isFinished: false
        });
        successCount++;
      } else {
        console.error(`❌ Error actualizando ${matchId}:`, e.message);
      }
    }
  }

  console.log(`\n🎉 FINISHED: ${successCount}/72 matches actualizados exitosamente.`);
  process.exit(0);
}

run();
