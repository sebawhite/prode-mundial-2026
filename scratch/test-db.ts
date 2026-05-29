// Mock browser environment variables and APIs for Node execution before importing firebase.ts
const storage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { for (const key in storage) delete storage[key]; },
  length: 0,
  key: (index: number) => null,
} as any;

global.window = {
  dispatchEvent: (event: any) => {
    // console.log(`[Mock Window] Dispatched event: ${event.type}`);
    return true;
  },
  addEventListener: () => {},
  removeEventListener: () => {},
} as any;

global.Event = class {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
} as any;

// Force VITE_FIREBASE env variables to be empty so SDK boots in Sandbox Mode safely
(import.meta as any).env = {
  VITE_FIREBASE_API_KEY: "PLACEHOLDER",
  VITE_FIREBASE_PROJECT_ID: "PLACEHOLDER",
};

// Now import the actual database functions and constants
import { 
  saveActiveUsers, 
  saveActivePredictions, 
  getActiveUsers, 
  getActivePredictions, 
  IS_SANDBOX 
} from '../src/lib/firebase';
import { ALL_MATCHES } from '../src/data/seedData';

console.log("==================================================");
console.log("⚽ INICIANDO PRUEBA DE REGISTRO Y PREDICCIONES ⚽");
console.log("==================================================");
console.log(`ℹ️ Estado de Base de Datos: ${IS_SANDBOX ? "🟢 MODO SANDBOX (Local Storage)" : "🔥 CLOUD FIRESTORE ACTIVO"}`);

// 1. Create a mock user
const fakeUser = {
  uid: "fake_crack_tester_2026",
  fullName: "Esteban Probador De Prode",
  nickname: "EstebanV8",
  email: "esteban.tester@example.com",
  whatsapp: "+5491199998888",
  paymentStatus: "confirmed", // payment fee accepted
  createdAt: new Date().toISOString(),
  isAdmin: false,
  totalPoints: 0,
  completionPercent: 0,
  rank: 5
};

console.log("\n1. Registrando un usuario nuevo de prueba...");
console.log(`   • Nickname:  ${fakeUser.nickname}`);
console.log(`   • Email:     ${fakeUser.email}`);
console.log(`   • WhatsApp:  ${fakeUser.whatsapp}`);

// Get existing users and append the new one
const currentUsers = getActiveUsers();
const updatedUsers = [...currentUsers.filter(u => u.uid !== fakeUser.uid), fakeUser];
saveActiveUsers(updatedUsers);
console.log("✅ Usuario registrado con éxito!");

// 2. Add mock predictions
console.log("\n2. Creando predicciones simuladas para la planilla del usuario...");

// Let's predict on the first two World Cup matches
const match1 = ALL_MATCHES[0]; // MEX vs RSA
const match2 = ALL_MATCHES[1]; // KOR vs CZE

console.log(`   • Partido 1: ${match1.homeTeam.flag} ${match1.homeTeam.name} vs ${match1.awayTeam.name} ${match1.awayTeam.flag}`);
console.log(`   • Partido 2: ${match2.homeTeam.flag} ${match2.homeTeam.name} vs ${match2.awayTeam.name} ${match2.awayTeam.flag}`);

const fakePredictions = [
  {
    id: `${fakeUser.uid}_${match1.id}`,
    userId: fakeUser.uid,
    matchId: match1.id,
    homeScore: 2, // Esteban predicts Mexico wins 2-1
    awayScore: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: `${fakeUser.uid}_${match2.id}`,
    userId: fakeUser.uid,
    matchId: match2.id,
    homeScore: 1, // Esteban predicts KOR vs CZE draws 1-1
    awayScore: 1,
    createdAt: new Date().toISOString()
  }
];

// Load existing predictions and append the new ones
const currentPredictions = getActivePredictions();
const otherPredictions = currentPredictions.filter(p => p.userId !== fakeUser.uid);
const updatedPredictions = [...otherPredictions, ...fakePredictions];

console.log(`   👉 Guardando ${fakePredictions.length} predicciones en la base de datos...`);
saveActivePredictions(updatedPredictions);
console.log("✅ Predicciones guardadas con éxito!");

// 3. Verify they were saved correctly and read them back
console.log("\n3. Verificando persistencia y lectura de los datos...");

const verifiedUsers = getActiveUsers();
const registeredTester = verifiedUsers.find(u => u.uid === fakeUser.uid);

if (registeredTester) {
  console.log(`   🎉 [CONFIRMADO] Usuario encontrado en DB: "${registeredTester.fullName}"`);
  console.log(`     - Rank: #${registeredTester.rank} | Completitud: ${registeredTester.completionPercent}%`);
} else {
  console.log("   ❌ ERROR: El usuario no pudo ser leído de la base de datos.");
}

const verifiedPredictions = getActivePredictions().filter(p => p.userId === fakeUser.uid);
console.log(`   🎉 [CONFIRMADO] Se leyeron ${verifiedPredictions.length} predicciones de la base de datos:`);

verifiedPredictions.forEach((p, idx) => {
  const match = ALL_MATCHES.find(m => m.id === p.matchId);
  const homeName = match?.homeTeam.name || "Local";
  const awayName = match?.awayTeam.name || "Visitante";
  console.log(`     - Predicción #${idx + 1} (${p.matchId}): ${homeName} [${p.homeScore} : ${p.awayScore}] ${awayName}`);
});

console.log("\n==================================================");
console.log("🏁 PRUEBA DE PERSISTENCIA COMPLETADA CON ÉXITO 🏁");
console.log("==================================================");
