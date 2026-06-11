"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncMatchResults = exports.onUserCreated = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const params_1 = require("firebase-functions/params");
const axios_1 = require("axios");
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
const apiFootballKey = (0, params_1.defineSecret)("API_FOOTBALL_KEY");
const TEAM_MAP = {
    "mexico": "méxico",
    "south africa": "sudáfrica",
    "south korea": "corea del sur",
    "czech republic": "rep. checa",
    "canada": "canadá",
    "bosnia": "bosnia y h.",
    "bosnia-herzegovina": "bosnia y h.",
    "bosnia and herzegovina": "bosnia y h.",
    "switzerland": "suiza",
    "qatar": "qatar",
    "brazil": "brasil",
    "morocco": "marruecos",
    "haiti": "haití",
    "scotland": "escocia",
};
exports.syncMatchResults = functions.runWith({ secrets: [apiFootballKey] })
    .pubsub.schedule("every 15 minutes").onRun(async () => {
    const today = new Date().toISOString().split("T")[0];
    const db = admin.firestore();
    try {
        const response = await axios_1.default.get("https://v3.football.api-sports.io/fixtures", {
            headers: { "x-apisports-key": apiFootballKey.value() },
            params: { date: today, league: 1, season: 2026 }
        });
        const fixtures = response.data.response;
        if (!fixtures || fixtures.length === 0)
            return null;
        const batch = db.batch();
        let updates = 0;
        const matchesSnap = await db.collection("matches").where("isFinished", "==", false).get();
        if (matchesSnap.empty)
            return null;
        for (const fixture of fixtures) {
            if (["FT", "PEN", "AET"].includes(fixture.fixture.status.short)) {
                const homeScore = fixture.goals.home;
                const awayScore = fixture.goals.away;
                let homeName = fixture.teams.home.name.toLowerCase();
                let awayName = fixture.teams.away.name.toLowerCase();
                homeName = TEAM_MAP[homeName] || homeName;
                awayName = TEAM_MAP[awayName] || awayName;
                for (const doc of matchesSnap.docs) {
                    const m = doc.data();
                    const mHome = m.homeTeam.name.toLowerCase();
                    const mAway = m.awayTeam.name.toLowerCase();
                    if ((mHome === homeName || mHome.includes(homeName)) &&
                        (mAway === awayName || mAway.includes(awayName))) {
                        batch.update(doc.ref, {
                            homeScore: homeScore,
                            awayScore: awayScore,
                            isFinished: true
                        });
                        updates++;
                    }
                }
            }
        }
        if (updates > 0) {
            await batch.commit();
            console.log(`Synced ${updates} matches.`);
        }
    }
    catch (err) {
        console.error("Error syncing matches:", err);
    }
    return null;
});
//# sourceMappingURL=index.js.map