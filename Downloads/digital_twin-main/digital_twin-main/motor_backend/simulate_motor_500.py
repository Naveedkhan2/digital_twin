import os
import math
import random
from datetime import datetime, timedelta

import firebase_admin
from firebase_admin import credentials, db


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Try to find the Firebase service account JSON in a flexible way
CRED_PATHS = [
    os.path.join(SCRIPT_DIR, "motor-f8005-firebase-adminsdk-fbsvc-b789b512df (2).json"),
    os.path.join(SCRIPT_DIR, "motor-f8005-firebase-adminsdk-fbsvc-b789b512df.json"),
    os.path.join(os.path.dirname(SCRIPT_DIR), "motor_backend", "motor-f8005-firebase-adminsdk-fbsvc-b789b512df (2).json"),
    os.path.join(os.getcwd(), "motor-f8005-firebase-adminsdk-fbsvc-b789b512df (2).json"),
]

CRED_PATH = None
for p in CRED_PATHS:
    if os.path.exists(p):
        CRED_PATH = p
        break

if not CRED_PATH and os.path.isdir(SCRIPT_DIR):
    for f in os.listdir(SCRIPT_DIR):
        name = f.lower()
        if f.endswith(".json") and "firebase" in name and "adminsdk" in name:
            CRED_PATH = os.path.join(SCRIPT_DIR, f)
            break

if not CRED_PATH:
    print("ERROR: Firebase credentials not found. Put your key JSON in motor_backend folder.")
    print("Filename should contain 'firebase' and 'adminsdk'.")
    raise SystemExit(1)

if not firebase_admin._apps:
    cred = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(
        cred,
        {
            "databaseURL": "https://motor-f8005-default-rtdb.asia-southeast1.firebasedatabase.app/"
        },
    )

print("✅ Connected to Firebase")
print("Simulating 500 realistic motor samples into motor01/logs ...")


def simulate_series(num_points: int = 500):
    """Generate a realistic-looking time series for a 3-phase induction motor."""
    logs = {}

    # Start history a bit in the past so timestamps look natural
    start_time = datetime.now() - timedelta(seconds=num_points * 10)

    base_current = 70.0  # A
    base_voltage = 400.0  # V

    for i in range(1, num_points + 1):
        t_norm = i / num_points  # 0 → 1 over whole run

        # Warm‑up over first 80–100 points
        warmup = min(1.0, i / 100.0)

        # Load oscillation over time (motor load going up/down)
        load_wave = 0.8 + 0.4 * math.sin(2 * math.pi * t_norm * 3.0)

        # Simulated slow degradation after ~70% of history
        degradation = 1.0 + 0.3 * max(0.0, t_norm - 0.7)

        # Phase currents with slight unbalance and noise
        I1 = base_current * load_wave * random.gauss(1.00, 0.03) * degradation
        I2 = base_current * 1.03 * load_wave * random.gauss(1.00, 0.03) * degradation
        I3 = base_current * 0.97 * load_wave * random.gauss(1.00, 0.03) * degradation

        # Line voltages with small ripple and noise
        volt_ripple = 0.01 * math.sin(2 * math.pi * t_norm * 5.0)
        V1 = base_voltage * (1.0 + volt_ripple) + random.gauss(0.0, 2.0)
        V2 = base_voltage * (1.0 - volt_ripple / 2.0) + random.gauss(0.0, 2.0)
        V3 = base_voltage * (1.0 + volt_ripple / 3.0) + random.gauss(0.0, 2.0)

        # Frequency very close to 50 Hz with tiny variation
        frequency = 50.0 + random.gauss(0.0, 0.05)

        # Power factor slightly degrading as load and vibration increase
        pf_base = 0.94 - 0.04 * (1.0 - load_wave)
        pf = pf_base - 0.05 * (degradation - 1.0) + random.gauss(0.0, 0.01)
        pf = max(0.75, min(0.98, pf))

        # Temperature: ramp up during warm‑up, then slightly increase with degradation
        T1 = 35.0 + 45.0 * warmup + 8.0 * (degradation - 1.0) + random.gauss(0.0, 1.0)
        T2 = T1 - 4.0 + random.gauss(0.0, 1.0)

        # Vibration: grows with load and degradation, plus rare spikes (bearing issue)
        vib_base = 1.5 + 0.8 * load_wave + 4.0 * (degradation - 1.0)
        vibration = vib_base + random.gauss(0.0, 0.2)
        if i > int(num_points * 0.7) and random.random() < 0.05:
            vibration += random.uniform(1.0, 2.5)

        ts = (start_time + timedelta(seconds=i * 10)).strftime("%Y-%m-%d %H:%M:%S")

        logs[f"entry_{i:03}"] = {
            "I1": round(I1, 2),
            "I2": round(I2, 2),
            "I3": round(I3, 2),
            "V1": round(V1, 2),
            "V2": round(V2, 2),
            "V3": round(V3, 2),
            "frequency": round(frequency, 2),
            "pf": round(pf, 2),
            "T1": round(T1, 2),
            "T2": round(T2, 2),
            "vibration": round(vibration, 2),
            "timestamp": ts,
        }

    return logs


logs_ref = db.reference("motor01/logs")
logs = simulate_series(500)

logs_ref.set(logs)
print(f"🎯 Wrote {len(logs)} log entries to motor01/logs (entry_001 → entry_{len(logs):03})")

# Also update live_reading with the latest point so gauges show consistent values
latest_key = f"entry_{len(logs):03}"
latest = logs[latest_key]

live_ref = db.reference("motor01/live_reading")
live_ref.set(
    {
        "current": {"I1": latest["I1"], "I2": latest["I2"], "I3": latest["I3"]},
        "voltage": {"V1": latest["V1"], "V2": latest["V2"], "V3": latest["V3"]},
        "temperature": {"T1": latest["T1"], "T2": latest["T2"]},
        "frequency": latest["frequency"],
        "vibration": latest["vibration"],
        "timestamp": latest["timestamp"],
    }
)

print("✅ live_reading updated with latest simulated values")

