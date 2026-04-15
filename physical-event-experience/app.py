from flask import Flask, render_template, jsonify, request
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
    ],
    "amenities": [
        {"id": "am-rest-main", "name": "Main Washroom", "type": "restroom", "waitTimeMinutes": 2},
        {"id": "am-rest-north", "name": "North Washroom", "type": "restroom", "waitTimeMinutes": 8},
        {"id": "am-food-pizza", "name": "Pizza Stand", "type": "food", "waitTimeMinutes": 15},
        {"id": "am-food-drinks", "name": "Drinks Tent", "type": "food", "waitTimeMinutes": 5},
    ],
    "alerts": [],
    "staff": {
        "security": {"available": 10, "deployed": []},
        "medical": {"available": 5, "deployed": []}
    }
}

def advance_simulation():
    """Applies a random walk drift to the current state"""
    
    # Drift global occupancy (-500 to +800) capped at capacity/min occupancy
    simulation_state["occupancy"] = max(5000, min(simulation_state["capacity"], 
                                      simulation_state["occupancy"] + random.randint(-400, +600)))
    
    # Drift gate waits (-2 to +2 minutes)
    for gate in simulation_state["gates"]:
        drift = random.randint(-2, 2)
        gate["waitTimeMinutes"] = max(1, min(45, gate["waitTimeMinutes"] + drift))

    # Drift crowd density levels (-3% to +3%)
    for zone in simulation_state["zones"]:
        drift = random.randint(-3, 3)
        # Bounded between 5% and 99%
        zone["crowdLevel"] = max(5, min(99, zone["crowdLevel"] + drift))

    # Drift amenities wait times (-2 to +2 minutes)
    for amenity in simulation_state["amenities"]:
        drift = random.randint(-2, 2)
        amenity["waitTimeMinutes"] = max(0, min(30, amenity["waitTimeMinutes"] + drift))
        
    # Automatic Alerts Cleanup
    if random.random() < 0.2:
        simulation_state["alerts"] = [a for a in simulation_state["alerts"] if not a.get("auto")]

    # Automatic Security/Medical Alerts based on REAL density
    food_zone = next(z for z in simulation_state["zones"] if z["id"] == "zone-food")
    if food_zone["crowdLevel"] > 90 and not any("Food Court" in a["message"] for a in simulation_state["alerts"]):
         simulation_state["alerts"].append({
            "id": "auto-" + str(time.time()),
            "message": "Critical overcrowding in Food Court. Medical staff on standby.",
            "type": "danger",
            "auto": True
         })

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/admin")
def admin():
    return render_template("admin.html")

@app.route("/api/status")
def status():
    advance_simulation()
    return jsonify({
        "timestamp": time.time(),
        "occupancy": simulation_state["occupancy"],
        "capacity": simulation_state["capacity"],
        "gates": simulation_state["gates"],
        "zones": simulation_state["zones"],
        "amenities": simulation_state["amenities"],
        "alerts": simulation_state["alerts"],
        "staff": simulation_state["staff"]
    })

@app.route("/api/admin/broadcast", methods=["POST"])
def broadcast():
    data = request.json
    new_alert = {
        "id": "manual-" + str(time.time()),
        "message": data.get("message", "Global Announcement"),
        "type": data.get("type", "info"),
        "auto": False
    }
    simulation_state["alerts"].append(new_alert)
    return jsonify({"status": "success", "alert": new_alert})

@app.route("/api/admin/dispatch", methods=["POST"])
def dispatch():
    data = request.json
    staff_type = data.get("type", "security") # security or medical
    zone_id = data.get("zone_id")
    
    if simulation_state["staff"][staff_type]["available"] > 0:
        simulation_state["staff"][staff_type]["available"] -= 1
        simulation_state["staff"][staff_type]["deployed"].append({
            "zone_id": zone_id,
            "timestamp": time.time()
        })
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "No available staff units"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
