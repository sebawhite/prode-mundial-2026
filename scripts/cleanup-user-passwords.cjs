/**
 * Strip the plaintext `password` field from every user document in Firestore.
 *
 * Old signups (before the security fix in useAuth.tsx) stored the user's
 * password in plaintext inside /users/{uid}.password. That field is now
 * unused — Firebase Auth handles credentials — but the values are still
 * sitting in Firestore and visible to anyone with read access.
 *
 * Usage:
 *   node scripts/cleanup-user-passwords.cjs            ← dry-run (lists only)
 *   node scripts/cleanup-user-passwords.cjs --apply    ← actually updates
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { FieldValue } = require('firebase/firestore');

const APPLY = process.argv.includes('--apply');

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
  console.log(`   • [OK] ${adminEmail}\n`);

  if (!APPLY) {
    console.log("⚠️  DRY-RUN mode. No updates will happen.");
    console.log("    Run with --apply to actually strip the field.\n");
  } else {
    console.log("🔥 APPLY mode. Updating documents.\n");
  }

  const snap = await getDocs(collection(db, "users"));
  const withPassword = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.password !== undefined) {
      withPassword.push({ uid: d.id, nickname: data.nickname, email: data.email });
    }
  });

  console.log(`Found ${snap.size} total users, ${withPassword.length} with a plaintext password field:\n`);
  withPassword.forEach(u => console.log(`   • ${u.nickname || '(no nickname)'}  ${u.email || '(no email)'}`));

  if (!APPLY) {
    console.log("\n✋ DRY-RUN complete. Nothing changed.");
    console.log("   Re-run with --apply to actually strip the field.");
    process.exit(0);
  }

  // Use REST API for reliability — admin update via PATCH with field deletion mask
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const FS_BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  async function getFreshToken() {
    return await auth.currentUser.getIdToken(true);
  }

  let ok = 0, fail = 0;
  console.log("\n🔥 Stripping `password` field via REST PATCH with updateMask...");
  for (const u of withPassword) {
    try {
      const idToken = await getFreshToken();
      // PATCH with updateMask.fieldPaths=password and an empty fields object
      // for that field tells Firestore to DELETE that field.
      const url = `${FS_BASE}/users/${u.uid}?updateMask.fieldPaths=password`;
      const body = { fields: {} };
      const r = await fetch(url, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (r.ok) {
        console.log(`   ✓ users/${u.uid} (${u.nickname})`);
        ok++;
      } else {
        const j = await r.json();
        console.log(`   ✗ users/${u.uid} — ${r.status} ${j?.error?.message?.split('\n')[0] || ''}`);
        fail++;
      }
    } catch (e) {
      console.log(`   ✗ users/${u.uid} — ${e.message}`);
      fail++;
    }
  }

  console.log(`\n✅ Done. ${ok} updated / ${fail} failed.`);
  process.exit(0);
}

run().catch(err => { console.error("❌ Error:", err); process.exit(1); });
