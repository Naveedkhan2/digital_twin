/**
 * Vercel Serverless Function: updates Firebase Realtime Database (motor01/live_reading + motor01/logs).
 * Called by Vercel Cron every minute, or manually: GET /api/update-motor
 *
 * Required env vars in Vercel:
 *   FIREBASE_SERVICE_ACCOUNT_JSON - full JSON string of Firebase service account key
 *   FIREBASE_DATABASE_URL         - e.g. https://motor-f8005-default-rtdb.asia-southeast1.firebasedatabase.app
 */

const admin = require("firebase-admin");

function getAdmin() {
  if (admin.apps.length > 0) return admin;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  if (!key || !databaseURL) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_DATABASE_URL");
  }
  const credential = admin.credential.cert(JSON.parse(key));
  admin.initializeApp({ credential, databaseURL });
  return admin;
}

function generateLogEntry() {
  const now = new Date();
  const ts = now.toISOString().slice(0, 19).replace("T", " ");
  const r = (min, max) => Math.round((min + Math.random() * (max - min)) * 100) / 100;
  return {
    I1: r(60, 95),
    I2: r(60, 95),
    I3: r(60, 95),
    V1: r(395, 410),
    V2: r(395, 410),
    V3: r(395, 410),
    frequency: r(49.8, 50.2),
    pf: r(0.83, 0.96),
    T1: r(45, 75),
    T2: r(40, 65),
    vibration: r(1.2, 4.5),
    timestamp: ts,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).end();
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const app = getAdmin();
    const db = app.database();
    const flat = generateLogEntry();
    const ts = flat.timestamp;

    const livePayload = {
      current: { I1: flat.I1, I2: flat.I2, I3: flat.I3 },
      voltage: { V1: flat.V1, V2: flat.V2, V3: flat.V3 },
      temperature: { T1: flat.T1, T2: flat.T2 },
      frequency: flat.frequency,
      vibration: flat.vibration,
      timestamp: ts,
    };

    const liveRef = db.ref("motor01/live_reading");
    const logsRef = db.ref("motor01/logs");
    const logKey = `entry_${Date.now()}`;

    await liveRef.set(livePayload);
    await logsRef.child(logKey).set(flat);

    return res.status(200).json({
      ok: true,
      at: ts,
      live_reading: "updated",
      log: logKey,
    });
  } catch (err) {
    console.error("[update-motor]", err.message);
    return res.status(500).json({
      error: "Firebase update failed",
      message: err.message,
    });
  }
};
