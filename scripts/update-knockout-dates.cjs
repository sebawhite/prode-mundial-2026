require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, "felixblancovolpe@gmail.com", "Matata2026");
  } catch (err) {
    console.log("No se pudo loguear:", err.message);
  }

  // Knockout structure from seedData
  const groupsOffset = [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7]; // R32
  const r16Offset = [6,6,7,7,8,8,9,9]; // R16
  const qfOffset = [11,11,12,12]; // QF
  const sfOffset = [16,17]; // SF
  const thirdOffset = [20]; // 3rd
  const finalOffset = [21]; // Final
  
  const allOffsets = [
    ...groupsOffset,
    ...r16Offset,
    ...qfOffset,
    ...sfOffset,
    ...thirdOffset,
    ...finalOffset
  ];
  
  let idCounter = 73;
  let count = 0;
  
  for (const daysOffset of allOffsets) {
    const baseDate = new Date("2026-06-28T00:00:00Z");
    baseDate.setDate(baseDate.getDate() + daysOffset);
    const dateStr = baseDate.toISOString().slice(0, 10);
    const explicitDate = `${dateStr}T16:00:00-03:00`;
    
    const mId = `match-${idCounter++}`;
    try {
      await updateDoc(doc(db, "matches", mId), { date: explicitDate });
      console.log(`✅ ${mId} actualizado a ${explicitDate}`);
      count++;
    } catch(e) {
      console.log(`❌ Error ${mId}`, e.message);
    }
  }
  
  console.log(`FIN: ${count}/${allOffsets.length} actualizados.`);
  process.exit(0);
}
run();
