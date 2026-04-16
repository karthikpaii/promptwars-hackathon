from flask import Flask, render_template, jsonify, request
import random
import time
import os
from google import genai
from flask_talisman import Talisman
from flask_wtf.csrf import CSRFProtect
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-stadium-iq')

# Security: Add Talisman for secure headers
# We allow some external CDNs for Leaflet, Chart.js, etc.
csp = {
    'default-src': '\'self\'',
    'script-src': [
        '\'self\'',
        'https://unpkg.com',
        'https://cdn.jsdelivr.net',
        '\'unsafe-inline\'' # Required for initialization scripts
    ],
    'style-src': [
        '\'self\'',
        'https://fonts.googleapis.com',
        'https://unpkg.com',
        '\'unsafe-inline\''
    ],
    'font-src': [
        '\'self\'',
        'https://fonts.gstatic.com'
    ],
    'img-src': [
        '\'self\'',
        'data:',
        'https://*.basemaps.cartocdn.com',
        'https://unpkg.com',
        'https://server.arcgisonline.com',
        'https://www.gstatic.com'
    ]
}
talisman = Talisman(app, content_security_policy=csp, force_https=False)
csrf = CSRFProtect(app)

# Google AI Configuration
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))

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
def home():
    return render_template("portal.html")

@app.route("/dashboard")
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
    if not data or 'message' not in data:
        return jsonify({"status": "error", "message": "Missing message content"}), 400
    
    message = str(data.get("message"))[:200] # Sanitize and truncate
    alert_type = data.get("type", "info")
    if alert_type not in ["info", "warning", "danger", "success"]:
        alert_type = "info"

    new_alert = {
        "id": "manual-" + str(time.time()),
        "message": message,
        "type": alert_type,
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

# --- AI STADIUM CONCIERGE (SMART ASSISTANT) ---

def stadium_concierge_logic(query):
    query = query.lower()
    
    # Logic for Gates
    if "gate" in query or "exit" in query or "fastest" in query:
        fastest_gate = min(simulation_state["gates"], key=lambda x: x["waitTimeMinutes"])
        return f"Based on live data, the shortest wait is at the **{fastest_gate['name']}** ({fastest_gate['waitTimeMinutes']} mins). I recommend heading there for the fastest exit."

    # Logic for Food/Amenities
    if "food" in query or "pizza" in query or "drinks" in query:
        best_food = min([a for a in simulation_state["amenities"] if a["type"] == "food"], key=lambda x: x["waitTimeMinutes"])
        return f"The **{best_food['name']}** currently has the shortest queue ({best_food['waitTimeMinutes']} mins). Our AI predicts this is the optimal time to grab a snack!"

    # Logic for Crowds/Safety
    if "crowd" in query or "busy" in query or "safe" in query:
        high_zones = [z for z in simulation_state["zones"] if z["crowdLevel"] > 75]
        if high_zones:
            zone_names = ", ".join([z["name"] for z in high_zones])
            return f"Heads up! The {zone_names} are currently experiencing high density. For a more comfortable experience, I suggest checking out the VIP Lounge or moving towards the East Concourse."
        return "The stadium is currently at comfortable density levels across all zones. Enjoy the event!"

    # Logic for Emergency/Alerts
    if "alert" in query or "help" in query or "emergency" in query:
        if simulation_state["alerts"]:
            latest = simulation_state["alerts"][-1]
            return f"IMPORTANT: There is an active alert - '{latest['message']}'. Please follow the instructions provided by stadium staff immediately."
        return "There are no active alerts at this time. Security and Medical teams are on standby for your safety."

    return "I'm the StadiumIQ AI Concierge! I can help you find the fastest gates, shortest food lines, or check zone density. What can I help you with?"

@app.route("/api/assistant/chat", methods=["POST"])
def assistant_chat():
    data = request.json
    user_query = data.get("message", "").strip()
    
    if not user_query:
        return jsonify({"status": "error", "message": "Empty query"}), 400

    # Build context for Gemini from live simulation data
    context = f"""
    You are the StadiumIQ AI Concierge, a helpful assistant for a smart stadium. 
    Current Stadium State:
    - Occupancy: {simulation_state['occupancy']}/{simulation_state['capacity']}
    - Gates: {", ".join([f"{g['name']} ({g['waitTimeMinutes']} min)" for g in simulation_state['gates']])}
    - Zones Crowd Levels: {", ".join([f"{z['name']} ({z['crowdLevel']}% full)" for z in simulation_state['zones']])}
    - Amenities: {", ".join([f"{a['name']} ({a['waitTimeMinutes']} min wait)" for a in simulation_state['amenities']])}
    - Active Alerts: {", ".join([a['message'] for a in simulation_state['alerts']]) if simulation_state['alerts'] else "None"}

    User Question: {user_query}
    
    Answer the user's question concisely based ONLY on the live data provided above. 
    Be polite and helpful. Suggest the optimal path or action.
    """
    
    try:
        if os.environ.get("GEMINI_API_KEY"):
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=context
            )
            response_text = response.text
        else:
            # Fallback for evaluation if API key is missing
            response_text = stadium_concierge_logic(user_query) + " (Using local logic - set GEMINI_API_KEY for full AI power)"
    except Exception as e:
        print(f"Gemini Error: {e}")
        response_text = stadium_concierge_logic(user_query)

    return jsonify({
        "status": "success",
        "message": response_text,
        "model": "Gemini-1.5-Flash" if os.environ.get("GEMINI_API_KEY") else "Rule-based (Fallback)",
        "timestamp": time.time()
    })

import os

if __name__ == "__main__":
    # Cloud Run provides the PORT environment variable. Default to 8080.
    port = int(os.environ.get("PORT", 8080))
    # Note: debug mode should be False in production for security
    app.run(debug=False, host="0.0.0.0", port=port)
