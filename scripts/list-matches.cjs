/**
 * List all match documents currently in Firestore.
 * Useful for detecting orphans from old partial seeds.
 *
 * Usage: node scripts/list-matches.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.error("❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars.");
    process.exit(1);
  }

  console.log("🔑 Autenticando...");
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

  console.log("📋 Listando matches en Firestore...\n");
  const snap = await getDocs(collection(db, "matches"));

  const matches = [];
  snap.forEach(doc => {
    const d = doc.data();
    matches.push({
      id: doc.id,
      stage: d.stage || "—",
      group: d.group || "—",
      matchday: d.matchday ?? "—",
      home: d.homeTeam?.code || d.homeTeam?.name || "?",
      away: d.awayTeam?.code || d.awayTeam?.name || "?",
    });
  });

  matches.sort((a, b) => {
    const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 999;
    const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 999;
    return numA - numB;
  });

  console.log(`Total: ${matches.length} matches\n`);
  console.log("ID                  STAGE     GROUP MDAY  HOME      AWAY");
  console.log("─".repeat(70));
  matches.forEach(m => {
    console.log(
      `${m.id.padEnd(20)} ${m.stage.padEnd(8)} ${String(m.group).padEnd(5)} ${String(m.matchday).padEnd(5)} ${m.home.padEnd(8)} ${m.away}`
    );
  });

  const standardIds = new Set(Array.from({length: 72}, (_, i) => `match-${i+1}`));
  const orphans = matches.filter(m => !standardIds.has(m.id));
  if (orphans.length > 0) {
    console.log("\n⚠️  ORPHANS (IDs that are NOT match-1..match-72):");
    orphans.forEach(m => console.log(`   • ${m.id}  ${m.home} vs ${m.away}`));
  } else {
    console.log("\n✅ Todos los IDs son match-1..match-72 (esperado).");
  }
  process.exit(0);
}

run().catch(err => { console.error("❌", err); process.exit(1); });
