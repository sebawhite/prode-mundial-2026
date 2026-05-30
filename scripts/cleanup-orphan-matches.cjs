/**
 * Cleanup orphan match documents from Firestore.
 * Removes any match doc whose ID is NOT in match-1..match-72.
 * Also removes any prediction doc whose matchId is not in that range.
 *
 * Usage:
 *   node scripts/cleanup-orphan-matches.cjs           ← dry-run (lists only, deletes nothing)
 *   node scripts/cleanup-orphan-matches.cjs --apply   ← actually deletes
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const APPLY = process.argv.includes('--apply');

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const db = getFirestore(app);
const auth = getAuth(app);

const VALID_MATCH_IDS = new Set(Array.from({length: 72}, (_, i) => `match-${i+1}`));

async function run() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.error("❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars.");
    process.exit(1);
  }

  console.log("🔑 Autenticando...");
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  console.log(`   • [OK] ${adminEmail}\n`);

  if (!APPLY) {
    console.log("⚠️  DRY-RUN mode. No deletions will happen.");
    console.log("    Run with --apply to actually delete.\n");
  } else {
    console.log("🔥 APPLY mode. Documents WILL BE DELETED.\n");
  }

  console.log("📋 Scanning /matches...");
  const matchSnap = await getDocs(collection(db, "matches"));
  const orphanMatchIds = [];
  matchSnap.forEach(d => {
    if (!VALID_MATCH_IDS.has(d.id)) orphanMatchIds.push(d.id);
  });
  console.log(`   Found ${matchSnap.size} total matches, ${orphanMatchIds.length} orphans:\n`);
  orphanMatchIds.forEach(id => console.log(`     • ${id}`));

  console.log("\n📋 Scanning /predictions for orphan references...");
  const predSnap = await getDocs(collection(db, "predictions"));
  const orphanPredIds = [];
  predSnap.forEach(d => {
    const data = d.data();
    if (data.matchId && !VALID_MATCH_IDS.has(data.matchId)) orphanPredIds.push(d.id);
  });
  console.log(`   Found ${predSnap.size} total predictions, ${orphanPredIds.length} pointing at orphan matches:\n`);
  orphanPredIds.forEach(id => console.log(`     • ${id}`));

  if (!APPLY) {
    console.log("\n✋ DRY-RUN complete. Nothing deleted.");
    console.log("   Re-run with --apply to actually delete.");
    process.exit(0);
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const FS_BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  async function getFreshToken() {
    return await auth.currentUser.getIdToken(true);
  }

  let okMatches = 0, failMatches = 0;
  console.log("\n🔥 Deleting orphan matches (REST)...");
  for (const id of orphanMatchIds) {
    try {
      const idToken = await getFreshToken();
      const r = await fetch(`${FS_BASE}/matches/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (r.ok) { console.log(`   ✓ matches/${id}`); okMatches++; }
      else {
        const j = await r.json();
        console.log(`   ✗ matches/${id} — ${r.status} ${j?.error?.message || ''}`);
        failMatches++;
      }
    } catch (e) {
      console.log(`   ✗ matches/${id} — ${e.message}`);
      failMatches++;
    }
  }

  let okPreds = 0, failPreds = 0;
  console.log("\n🔥 Deleting orphan predictions (REST)...");
  for (const id of orphanPredIds) {
    try {
      const idToken = await getFreshToken();
      const r = await fetch(`${FS_BASE}/predictions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (r.ok) { console.log(`   ✓ predictions/${id}`); okPreds++; }
      else {
        const j = await r.json();
        console.log(`   ✗ predictions/${id} — ${r.status} ${j?.error?.message?.split('\n')[0] || ''}`);
        failPreds++;
      }
    } catch (e) {
      console.log(`   ✗ predictions/${id} — ${e.message}`);
      failPreds++;
    }
  }

  console.log(`\n✅ Done. Matches: ${okMatches} deleted / ${failMatches} failed.`);
  console.log(`   Predictions: ${okPreds} deleted / ${failPreds} failed.`);
  process.exit(0);
}

run().catch(err => { console.error("❌ Error:", err); process.exit(1); });
