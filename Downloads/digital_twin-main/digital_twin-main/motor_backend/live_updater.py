"""
Real-time Motor Data Updater
- Infinite loop: generates data indefinitely
- Live updates: motor01/live_reading with latest values for real-time dashboard
- Logs: motor01/logs/entry_01, entry_02, entry_03... (incrementing, one per cycle)
- Timing: new value every 20 seconds
- Data: same random ranges as app.py (I: 60-95, V: 395-410, T1: 45-75, T2: 40-65, etc.)
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

print("Generating data every 20 seconds (Ctrl+C to stop)")
print("  - motor01/live_reading: latest values for dashboard")
print("  - motor01/logs: entry_01, entry_02, entry_03... (incrementing)")
print()

live_ref = db.reference("motor01/live_reading")
entry_counter = 0

# Same random ranges as app.py
def generate_log_entry(entry_index: int):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Vibration ko audio‑style waveform jaisa banane ke liye:
    # slow trend + thodi high‑freq variation + halka noise
    t = entry_index / 40.0
    slow = math.sin(2 * math.pi * 0.08 * t)
    mid = math.sin(2 * math.pi * 0.35 * t)
    base_vib = 2.2 + 0.4 * slow + 0.25 * mid  # approx 1.5–2.9 range
    vib_noise = 0.15 * (random.random() - 0.5)
    vibration = round(base_vib + vib_noise, 2)

    return {
        "I1": round(random.uniform(60, 95), 2),
        "I2": round(random.uniform(60, 95), 2),
        "I3": round(random.uniform(60, 95), 2),
        "V1": round(random.uniform(395, 410), 2),
        "V2": round(random.uniform(395, 410), 2),
        "V3": round(random.uniform(395, 410), 2),
        "frequency": round(random.uniform(49.8, 50.2), 2),
        "pf": round(random.uniform(0.83, 0.96), 2),
        "T1": round(random.uniform(45, 75), 2),
        "T2": round(random.uniform(40, 65), 2),
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
        time.sleep(20)
except KeyboardInterrupt:
    print("\nStopped.")
