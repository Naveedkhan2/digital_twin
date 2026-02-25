"""
Remove old data from Firebase Realtime Database.
Uses same credentials as app.py. Run from motor_backend folder.
"""
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRED_PATH = os.path.join(SCRIPT_DIR, "motor-f8005-firebase-adminsdk-fbsvc-b789b512df.json")

if not os.path.isfile(CRED_PATH):
    print("❌ Firebase credentials file not found:", CRED_PATH)
    print("   Put your service account JSON here, or remove old data manually:")
    print("   Firebase Console → Realtime Database → motor01 → logs → ⋮ → Delete")
    sys.exit(1)

import firebase_admin
from firebase_admin import credentials, db

if not firebase_admin._apps:
    cred = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://motor-f8005-default-rtdb.asia-southeast1.firebasedatabase.app/"
    })

# Choose what to clear (uncomment ONE):

# 1) Clear only old LOGS (motor01/logs) – keeps live_reading
logs_ref = db.reference("motor01/logs")
logs_ref.delete()
print("✅ Deleted motor01/logs (all log entries)")

# 2) Clear only live_reading
# live_ref = db.reference("motor01/live_reading")
# live_ref.delete()
# print("✅ Deleted motor01/live_reading")

# 3) Clear entire motor01 (logs + live_reading + everything under motor01)
# motor_ref = db.reference("motor01")
# motor_ref.delete()
# print("✅ Deleted motor01 (all data)")

# 4) Clear entire database (use with caution)
# root_ref = db.reference("/")
# root_ref.delete()
# print("✅ Deleted entire database")
