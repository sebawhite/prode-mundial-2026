/**
 * Identify which users have predictions pointing at orphan matches.
 * Read-only — does not delete anything.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const db = getFirestore(app);
const auth = getAuth(app);

const VALID_MATCH_IDS = new Set(Array.from({length: 72}, (_, i) => `match-${i+1}`));

async function run() {
  await signInWithEmailAndPassword(auth, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);

  const predSnap = await getDocs(collection(db, "predictions"));
  const orphanByUser = {};
  predSnap.forEach(d => {
    const data = d.data();
    if (data.matchId && !VALID_MATCH_IDS.has(data.matchId)) {
      const uid = data.userId;
      if (!orphanByUser[uid]) orphanByUser[uid] = 0;
      orphanByUser[uid]++;
    }
  });

  console.log("Users with orphan predictions:\n");
  for (const uid of Object.keys(orphanByUser)) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const u = userDoc.data();
      console.log(`   • ${u.nickname} (${u.fullName}, ${u.email})  →  ${orphanByUser[uid]} orphan preds`);
    } else {
      console.log(`   • ${uid} (user not found)  →  ${orphanByUser[uid]} orphan preds`);
    }
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
