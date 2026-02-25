"""
Real-time Motor Data Updater
- Infinite loop: generates data indefinitely
- Live updates: motor01/live_reading with latest values for real-time dashboard
- Logs: motor01/logs/entry_01, entry_02, entry_03... (incrementing, one per cycle)
- Timing: new value every 5 seconds (small gradual changes)
- Data: centered around realistic ranges (I: ~72A, V: ~400V, T: ~55°C, etc.) with tiny deltas
- Startup: clears old logs before beginning

Run: python live_updater.py
"""
import firebase_admin
from firebase_admin import credentials, db
import random
import time
import os
from datetime import datetime
import math

# Resolve credential path (works with any filename you gave the key)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
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
# If you renamed the key file, we look for any *firebase*adminsdk*.json in motor_backend
if not CRED_PATH and os.path.isdir(SCRIPT_DIR):
    for f in os.listdir(SCRIPT_DIR):
        if f.endswith(".json") and "firebase" in f.lower() and "adminsdk" in f.lower():
            CRED_PATH = os.path.join(SCRIPT_DIR, f)
            break
if not CRED_PATH:
    print("ERROR: Firebase credentials not found. Put your key JSON in motor_backend folder.")
    print("Tried:", CRED_PATHS)
    print("Or use any .json file whose name contains 'firebase' and 'adminsdk'.")
    raise SystemExit(1)

if not firebase_admin._apps:
    cred = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://motor-f8005-default-rtdb.asia-southeast1.firebasedatabase.app/"
    })

print("Connected to Firebase")
print("Database: https://motor-f8005-default-rtdb.asia-southeast1.firebasedatabase.app/")

# Verify write works
try:
    test_ref = db.reference("motor01/_test")
    test_ref.set({"ping": datetime.now().isoformat()})
    result = test_ref.get()
    if result:
        print("Write test: OK")
    test_ref.delete()
except Exception as e:
    print("ERROR - Write test failed:", e)
    print("Check: 1) Firebase rules, 2) Service account has Editor role, 3) Database URL is correct")
    raise SystemExit(1)

# Clear old logs
logs_ref = db.reference("motor01/logs")
logs_ref.delete()
print("Cleared old logs")

print("Generating data every 5 seconds (Ctrl+C to stop)")
print("  - motor01/live_reading: latest values for dashboard")
print("  - motor01/logs: entry_01, entry_02, entry_03... (incrementing)")
print()

live_ref = db.reference("motor01/live_reading")
entry_counter = 0

# Stateful baselines so har step pe sirf chhota +/‑ change aaye (random walk style)
last_I1 = 72.0
last_I2 = 72.5
last_I3 = 71.5
last_V1 = 400.0
last_V2 = 401.0
last_V3 = 399.0
last_freq = 50.0
last_pf = 0.9
last_T1 = 55.0
last_T2 = 50.0
last_vib = 2.1


def _step(value: float, low: float, high: float, max_delta: float) -> float:
    """Chhota random step within [low, high], clamp + soft bounce at edges."""
    delta = random.uniform(-max_delta, max_delta)
    value += delta
    if value < low:
        value = low + (low - value) * 0.3
    if value > high:
        value = high - (value - high) * 0.3
    return round(value, 2)


def generate_log_entry(entry_index: int):
    global last_I1, last_I2, last_I3
    global last_V1, last_V2, last_V3
    global last_freq, last_pf, last_T1, last_T2, last_vib

    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Even smaller, more subtle random walks around baselines
    last_I1 = _step(last_I1, 60.0, 90.0, 0.25)
    last_I2 = _step(last_I2, 60.0, 90.0, 0.25)
    last_I3 = _step(last_I3, 60.0, 90.0, 0.25)

    last_V1 = _step(last_V1, 395.0, 410.0, 0.3)
    last_V2 = _step(last_V2, 395.0, 410.0, 0.3)
    last_V3 = _step(last_V3, 395.0, 410.0, 0.3)

    last_freq = _step(last_freq, 49.8, 50.2, 0.005)
    last_pf = round(max(0.83, min(0.96, last_pf + random.uniform(-0.002, 0.002))), 3)

    last_T1 = _step(last_T1, 45.0, 75.0, 0.2)
    last_T2 = _step(last_T2, 40.0, 65.0, 0.2)

    # Vibration: sine shape + very small random walk for realistic but gentle waveform
    t = entry_index / 40.0
    slow = math.sin(2 * math.pi * 0.06 * t)
    mid = math.sin(2 * math.pi * 0.32 * t)
    base_vib = 2.0 + 0.35 * slow + 0.2 * mid
    last_vib = _step(base_vib, 1.2, 3.0, 0.04)
    vibration = last_vib

    return {
        "I1": last_I1,
        "I2": last_I2,
        "I3": last_I3,
        "V1": last_V1,
        "V2": last_V2,
        "V3": last_V3,
        "frequency": last_freq,
        "pf": last_pf,
        "T1": last_T1,
        "T2": last_T2,
        "vibration": vibration,
        "timestamp": ts,
    }

try:
    while True:
        try:
            flat = generate_log_entry(entry_counter)
            ts = flat["timestamp"]

            # 1. Update live_reading (latest values for real-time dashboard)
            payload = {
                "current": {"I1": flat["I1"], "I2": flat["I2"], "I3": flat["I3"]},
                "voltage": {"V1": flat["V1"], "V2": flat["V2"], "V3": flat["V3"]},
                "temperature": {"T1": flat["T1"], "T2": flat["T2"]},
                "frequency": flat["frequency"],
                "vibration": flat["vibration"],
                "timestamp": ts,
            }
            live_ref.set(payload)

            # 2. Add new log entry with incrementing number
            entry_counter += 1
            logs_ref.update({f"entry_{entry_counter:02d}": flat})

            print(f"Updated at {ts} | live_reading ✓ | logs/entry_{entry_counter:02d} ✓")
        except Exception as e:
            print(f"ERROR writing to Firebase: {e}")
        # Har 5 second me chhota, gradual update
        time.sleep(5)
except KeyboardInterrupt:
    print("\nStopped.")
