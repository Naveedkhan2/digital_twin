
// Initialize random data with realistic ranges for a 3-phase motor

export interface MotorData {
  current: {
    phaseA: number;
    phaseB: number;
    phaseC: number;
  };
  voltage: {
    phaseA: number;
    phaseB: number;
    phaseC: number;
  };
  frequency: number;
  temperature: {
    t1: number;
    t2: number;
  };
}

// Initial state with realistic values
let motorData: MotorData = {
  current: {
    phaseA: 24.3,
    phaseB: 24.5,
    phaseC: 24.1,
  },
  voltage: {
    phaseA: 381.2,
    phaseB: 380.8,
    phaseC: 382.1,
  },
  frequency: 50.2,
  temperature: {
    t1: 72.4,
    t2: 68.7,
  },
};

// Counter for periodic anomaly generation
let anomalyCounter = 0;

// Function to update data with small random variations
function updateMotorData(): MotorData {
  const randomVariation = (base: number, variation: number) => {
    return base + (Math.random() - 0.5) * variation;
  };

  // Occasionally introduce anomalies for demonstrating health indicators
  anomalyCounter++;
  let anomalyType = "none";
  
  if (anomalyCounter % 20 === 0) {
    // Every 20 updates, introduce a random anomaly
    const anomalyTypes = ["current_imbalance", "voltage_spike", "temperature_rise", "none"];
    anomalyType = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
  }

  motorData = {
    current: {
      phaseA: randomVariation(motorData.current.phaseA, 0.3) + 
              (anomalyType === "current_imbalance" ? 5 + Math.random() * 10 : 0),
      phaseB: randomVariation(motorData.current.phaseB, 0.3),
      phaseC: randomVariation(motorData.current.phaseC, 0.3),
    },
    voltage: {
      phaseA: randomVariation(motorData.voltage.phaseA, 1.5) + 
              (anomalyType === "voltage_spike" ? 10 + Math.random() * 20 : 0),
      phaseB: randomVariation(motorData.voltage.phaseB, 1.5),
      phaseC: randomVariation(motorData.voltage.phaseC, 1.5),
    },
    frequency: randomVariation(motorData.frequency, 0.1),
    temperature: {
      t1: randomVariation(motorData.temperature.t1, 0.5) + 
         (anomalyType === "temperature_rise" ? 5 + Math.random() * 10 : 0),
      t2: randomVariation(motorData.temperature.t2, 0.5),
    },
  };

  return { ...motorData };
}

export const getMotorData = (): MotorData => {
  return updateMotorData();
};
