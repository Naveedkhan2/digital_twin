"""
Quick test to verify Firebase connection.
Run: python test_firebase.py
"""
import sys
import os

try:
    import firebase_admin
    from firebase_admin import credentials, db
except ImportError:
    print("ERROR: firebase-admin not installed.")
    print("Run: pip install firebase-admin")
    sys.exit(1)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRED_PATH = os.path.join(SCRIPT_DIR, "motor-f8005-firebase-adminsdk-fbsvc-b789b512df.json")

if not os.path.exists(CRED_PATH):
    print("ERROR: Credentials file not found:", CRED_PATH)
    sys.exit(1)

print("1. Connecting to Firebase...")
if not firebase_admin._apps:
    cred = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://motor-f8005-default-rtdb.asia-southeast1.firebasedatabase.app/"
    })
print("   OK")

print("2. Writing test data to motor01/_test...")
ref = db.reference("motor01/_test")
ref.set({"test": "hello", "timestamp": "now"})
print("   OK")

print("3. Reading back...")
data = ref.get()
print("   Data:", data)

print("4. Cleaning up...")
ref.delete()
print("   OK")

print("\nFirebase connection working! You can run live_updater.py now.")
