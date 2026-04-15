from flask import Flask, render_template, jsonify
import random
import time

app = Flask(__name__)

# Sample static locations for a generic stadium
# We will use simple cartesian-like coordinates or relative percentages that map to our Leaflet view later
GATES = [
    {"id": "gate-n", "name": "North Gate", "lat": 51.505, "lng": -0.09},
    {"id": "gate-s", "name": "South Gate", "lat": 51.503, "lng": -0.09},
    {"id": "gate-e", "name": "East Gate", "lat": 51.504, "lng": -0.088},
    {"id": "gate-w", "name": "West Gate", "lat": 51.504, "lng": -0.092},
]

ZONES = [
    {"id": "zone-food", "name": "Food Court", "lat": 51.5045, "lng": -0.091},
    {"id": "zone-merch", "name": "Merch Stand", "lat": 51.5045, "lng": -0.089},
]

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/status")
def status():
    # Simulate real-time data for waits and crowds
    gate_status = []
    for gate in GATES:
        gate_status.append({
            "id": gate["id"],
            "name": gate["name"],
            "waitTimeMinutes": random.randint(2, 30),
            "throughput": random.randint(5, 50) # people per minute
        })
        
    zone_status = []
    for zone in ZONES:
        zone_status.append({
            "id": zone["id"],
            "name": zone["name"],
            "crowdLevel": random.randint(0, 100) # percentage full
        })
        
    # Global stadium occupancy
    occupancy = random.randint(40000, 65000)
    capacity = 70000
        
    return jsonify({
        "timestamp": time.time(),
        "occupancy": occupancy,
        "capacity": capacity,
        "gates": gate_status,
        "zones": zone_status
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
