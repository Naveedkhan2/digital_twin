#import firebase_admin
#from firebase_admin import credentials, db

# 1. Connect to Firebase
#if not firebase_admin._apps: 
#    cred = credentials.Certificate(r"d:\motor_backend\motor-f8005-firebase-adminsdk-fbsvc-b789b512df.json")
#    firebase_admin.initialize_app(cred, {
 #       'databaseURL': 'https://motor-f8005-default-rtdb.asia-southeast1.firebasedatabase.app/'
 #   })
#print("Connected ✅")

# 2. Clear root and set motor01 structure
#root_ref = db.reference('/')
#root_ref.set({  # This will overwrite everything at root
    #"motor01": {
      #  "logs": {
         #   "entry_1": "Motor started",
        #    "entry_2": "Temperature spike detected"
       # },
        #"live_reading": {
            #"current": {
            #    "I1": 12.5,
            #    "I2": 13.0,
           #     "I3": 11.8
           # },
            #"temperature": {
           #     "T1": 36.5,
          #      "T2": 37.2
         #   },
        #    "voltage": {
       #         "V1": 220,
      #          "V2": 221,
     #           "V3": 219
    #        },
   #          "power factor": 50.0,
 #           "vibration": 0.15
#        }
#    }
#})
#print("✅ motor01 structure set")

# 3. Fetch and display data
#def fetch_motor_data():
#    ref = db.reference('motor01')
 #   data = ref.get()
  #  print("\n🔹 motor01 Data:")
   # print(data)
    #return data

#fetch_motor_data()
import firebase_admin
from firebase_admin import credentials, db
import random
import os
from datetime import datetime, timedelta

# 1. Connect to Firebase
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRED_PATH = os.path.join(SCRIPT_DIR, "motor-f8005-firebase-adminsdk-fbsvc-b789b512df.json")
if not firebase_admin._apps:
    cred = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://motor-f8005-default-rtdb.asia-southeast1.firebasedatabase.app/'
    })

print("✅ Connected to Firebase")

# 2. Reference to logs node
ref = db.reference('motor01/logs')

# 3. Start generating logs (360 entries). History preserved - no delete.
start_time = datetime.now()
all_logs = {}

for i in range(1, 361):
    log_data = {
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
        "vibration": round(random.uniform(1.2, 4.5), 2),
        "timestamp": (start_time + timedelta(seconds=i * 10)).strftime("%Y-%m-%d %H:%M:%S")
    }

    # pad number like entry_001, entry_002, ...
    all_logs[f"entry_{i:03}"] = log_data

# 4. Push all logs to Firebase at once
ref.set(all_logs)
print("🎯 360 Sequential Logs Added Successfully (entry_001 → entry_360)")





