from flask import Flask, render_template, jsonify
import random
import time

app = Flask(__name__)

# Stateful mock data for random walk simulation
simulation_state = {
    "occupancy": 52000,
    "capacity": 70000,
    "gates": [
        {"id": "gate-n", "name": "North Gate", "waitTimeMinutes": 12},
        {"id": "gate-s", "name": "South Gate", "waitTimeMinutes": 8},
        {"id": "gate-e", "name": "East Gate", "waitTimeMinutes": 22},
        {"id": "gate-w", "name": "West Gate", "waitTimeMinutes": 4},
    ],
    "zones": [
        {"id": "zone-nc", "name": "North Concourse", "crowdLevel": 45},
        {"id": "zone-sc", "name": "South Concourse", "crowdLevel": 62},
        {"id": "zone-food", "name": "Food Court A", "crowdLevel": 85},
        {"id": "zone-merch", "name": "Merch Stand", "crowdLevel": 78},
        {"id": "zone-vip", "name": "VIP Lounge", "crowdLevel": 35},
        {"id": "zone-main", "name": "Main Entrance", "crowdLevel": 55},
    ]
}

def advance_simulation():
    """Applies a random walk drift to the current state"""
    
    # Drift global occupancy wildly by -500 to +800 roughly
    simulation_state["occupancy"] = max(10000, min(simulation_state["capacity"], 
                                      simulation_state["occupancy"] + random.randint(-500, +800)))
    
    # Drift gate waits (-3 to +3 minutes)
    for gate in simulation_state["gates"]:
        drift = random.randint(-2, 3)
        gate["waitTimeMinutes"] = max(1, min(60, gate["waitTimeMinutes"] + drift))
        gate["throughput"] = random.randint(10, 40) # Add a noisy static value

    # Drift crowd density levels (-5% to +5%)
    for zone in simulation_state["zones"]:
        drift = random.randint(-5, 5)
        # Bounded between 10% and 98%
        zone["crowdLevel"] = max(10, min(98, zone["crowdLevel"] + drift))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/status")
def status():
    advance_simulation()
    
    return jsonify({
        "timestamp": time.time(),
        "occupancy": simulation_state["occupancy"],
        "capacity": simulation_state["capacity"],
        "gates": simulation_state["gates"],
        "zones": simulation_state["zones"]
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
