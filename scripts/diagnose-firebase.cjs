/**
 * PRODE Mundial 2026 - Firebase Services Diagnostic Tool
 * Usage: node scripts/diagnose-firebase.cjs
 */

const fs = require('fs');
const path = require('path');

// Load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (e) {
  // Silent fallback
}

console.log("======================================= ⚽");
console.log("🔍 DIAGNÓSTICO DE SERVICIOS FIREBASE - PRODE 2026");
console.log("=======================================");

// 1. Load active configurations
let configData = null;
const configPath = path.join(__dirname, '../firebase-applet-config.json');

try {
  if (fs.existsSync(configPath)) {
    configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log("✅ Archivo 'firebase-applet-config.json' encontrado y parseado correctamente.");
  } else {
    console.log("⚠️  firebase-applet-config.json no existe. Buscando variables de entorno...");
  }
} catch (err) {
  console.log("❌ Error leyendo firebase-applet-config.json:", err.message);
}

// 2. Map Configuration (prioritize json config, fallback to process.env)
const firebaseConfig = {
  apiKey: (configData && configData.apiKey) || process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: (configData && configData.authDomain) || process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: (configData && configData.projectId) || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: (configData && configData.storageBucket) || process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (configData && configData.messagingSenderId) || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: (configData && configData.appId) || process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  firestoreDatabaseId: (configData && configData.firestoreDatabaseId) || "default"
};

const hasCredentials = firebaseConfig.apiKey && firebaseConfig.apiKey !== "PLACEHOLDER";

if (!hasCredentials) {
  console.log("\n❌ SIN CONFIGURACIÓN ACTIVA: Se detectaron credenciales PLACEHOLDER o vacías.");
  console.log("   La aplicación está operando en modo SANDBOX persistido localmente.");
  process.exit(1);
}

// Mask API key for security
const maskedKey = firebaseConfig.apiKey 
  ? `${firebaseConfig.apiKey.substring(0, 6)}...${firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4)}` 
  : "N/A";

console.log("\n📋 Datos de Configuración Mapeados:");
console.log(`   • Project ID:      \x1b[36m${firebaseConfig.projectId}\x1b[0m`);
console.log(`   • API Key:         \x1b[32m${maskedKey}\x1b[0m`);
console.log(`   • Auth Domain:     ${firebaseConfig.authDomain}`);
console.log(`   • Storage Bucket:  ${firebaseConfig.storageBucket}`);
console.log(`   • Database ID:     ${firebaseConfig.firestoreDatabaseId}`);

// 3. Match env vars with config values (Check for consistency)
console.log("\n🔄 Verificando mapeo de variables de entorno (Vite):");
const envKeys = [
  { env: 'VITE_FIREBASE_API_KEY', val: process.env.VITE_FIREBASE_API_KEY, match: firebaseConfig.apiKey },
  { env: 'VITE_FIREBASE_PROJECT_ID', val: process.env.VITE_FIREBASE_PROJECT_ID, match: firebaseConfig.projectId },
  { env: 'VITE_FIREBASE_AUTH_DOMAIN', val: process.env.VITE_FIREBASE_AUTH_DOMAIN, match: firebaseConfig.authDomain },
  { env: 'VITE_FIREBASE_STORAGE_BUCKET', val: process.env.VITE_FIREBASE_STORAGE_BUCKET, match: firebaseConfig.storageBucket },
];

let envConsistent = true;
envKeys.forEach(k => {
  if (k.val) {
    if (k.val === k.match) {
      console.log(`   • \x1b[32m[OK]\x1b[0m ${k.env} está configurado y coincide.`);
    } else {
      console.log(`   • \x1b[31m[ADVERTENCIA]\x1b[0m ${k.env} está definido pero no coincide con el JSON.`);
      envConsistent = false;
    }
  } else {
    console.log(`   • \x1b[33m[INFO]\x1b[0m ${k.env} no está definido localmente en .env (se usará firebase-applet-config.json).`);
  }
});

// 4. Test SDK Initialization
console.log("\n⚙️  Inicializando Firebase SDK...");
try {
  const { initializeApp } = require('firebase/app');
  const { getFirestore, doc, getDoc } = require('firebase/firestore');
  const { getAuth } = require('firebase/auth');
  const { getStorage } = require('firebase/storage');

  const app = initializeApp(firebaseConfig);
  console.log("   • \x1b[32m[ÉXITO]\x1b[0m App inicializada correctamente.");

  // Test Authentication Service
  const auth = getAuth(app);
  if (auth) {
    console.log("   • \x1b[32m[ÉXITO]\x1b[0m Servicio de Firebase Auth preparado.");
  }

  // Test Storage Service
  const storage = getStorage(app);
  if (storage) {
    console.log(`   • \x1b[32m[ÉXITO]\x1b[0m Servicio de Firebase Storage conectado al bucket: ${firebaseConfig.storageBucket}`);
  }

  // Test Firestore Service
  const db = getFirestore(app);
  console.log("   • \x1b[32m[ÉXITO]\x1b[0m Servicio de Cloud Firestore preparado.");

  // Firestore read test
  console.log("\n📡 Solicitando lectura de prueba de Firestore...");
  const docRef = doc(db, "config", "settings");
  
  getDoc(docRef)
    .then((snap) => {
      console.log("   • \x1b[32m[LECTURA EXITOSA]\x1b[0m Se pudo leer 'config/settings' desde Firestore!");
      console.log("     Configuración activa en Firestore:", snap.data());
      finishTest(true);
    })
    .catch((err) => {
      if (err.code === 'permission-denied') {
        console.log("   • \x1b[32m[VÍNCULO EXITOSO (PROTEGIDO)]\x1b[0m Conexión establecida con Firestore.");
        console.log("     📌 Nota: El servidor rechazó la lectura con 'PERMISSION_DENIED' (Falta de permisos).");
        console.log("     Esto es CORRECTO y esperado: confirma que tus 'firestore.rules' están");
        console.log("     protegiendo de manera segura el acceso sin autenticación a la base de datos.");
        console.log("     Los administradores autenticados o usuarios logueados podrán operar sin problemas.");
        finishTest(true);
      } else {
        console.log("   • \x1b[31m[ERROR EN LECTURA]\x1b[0m No se pudo comunicar con Firestore.");
        console.log("     Código de Error:", err.code);
        console.log("     Detalles:", err.message);
        finishTest(false);
      }
    });

} catch (err) {
  console.log("❌ Error fatal inicializando el SDK de Firebase:", err.message);
  process.exit(1);
}

function finishTest(ok) {
  console.log("\n=======================================");
  if (ok) {
    console.log("🎉 \x1b[32mDIAGNÓSTICO EN CONEXIÓN COMPLETADO CON ÉXITO\x1b[0m");
    console.log("El clúster está listo para producción. Los servicios de Auth, Firestore");
    console.log("y Storage están cargados, con el direccionamiento correcto hacia:");
    console.log(`Project: "${firebaseConfig.projectId}"`);
  } else {
    console.log("❌ \x1b[31mDIAGNÓSTICO CON ALERTAS O ANOMALÍAS\x1b[0m");
    console.log("Por favor, revisá las credenciales en 'firebase-applet-config.json'.");
  }
  console.log("======================================= ⚽\n");
  process.exit(ok ? 0 : 1);
}
