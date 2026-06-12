"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
/**
 * Trigger que se ejecuta al crearse un usuario en Firebase Auth.
 * Crea un perfil "stub" en Firestore para evitar que haya usuarios huérfanos
 * si el cliente falla al ejecutar `setDoc` durante el registro.
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const db = admin.firestore();
    const uid = user.uid;
    const checkEmail = (user.email || "").toLowerCase();
    const isAdminEmail = checkEmail === "sebahotelmkt@gmail.com" || checkEmail === "felixblancovolpe@gmail.com";
    let formattedName = user.displayName;
    if (!formattedName && checkEmail) {
        const words = checkEmail.split("@")[0].split(/[\.\_\-]+/);
        formattedName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    const userRef = db.collection("users").doc(uid);
    try {
        const snap = await userRef.get();
        if (!snap.exists) {
            await userRef.set({
                uid: uid,
                email: checkEmail,
                fullName: isAdminEmail ? "Felix Blanco" : (formattedName || "Usuario Nuevo"),
                paymentStatus: isAdminEmail ? "confirmed" : "pending",
                createdAt: new Date().toISOString(),
                isAdmin: isAdminEmail,
                totalPoints: 0,
                completionPercent: 0,
                rank: 999999 // Un rank temporal alto hasta que se actualice la tabla
            });
            console.log(`Perfil inicial creado para el usuario ${uid} (${checkEmail})`);
        }
        else {
            console.log(`El perfil del usuario ${uid} ya existía en Firestore.`);
        }
    }
    catch (error) {
        console.error(`Error creando el perfil inicial para ${uid}:`, error);
    }
});
//# sourceMappingURL=index.js.map