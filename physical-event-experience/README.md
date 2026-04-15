# 🏟️ StadiumIQ | Smart Venue Crowd Management

StadiumIQ is a cutting-edge, real-time crowd management and navigation ecosystem designed for large-scale sporting venues and stadiums. It provides a seamless experience for both attendees and venue operators through a dual-interface architecture, now supercharged with **Google Gemini AI**.

![StadiumIQ Banner](https://img.shields.io/badge/StadiumIQ-AI%20Powered-blue?style=for-the-badge&logo=google-gemini)
![Tech Stack](https://img.shields.io/badge/Stack-Flask%20%7C%20Gemini%20%7C%20Google%20Maps-orange?style=for-the-badge)

## 🚀 Key Features

### 👤 Attendee Experience (`/dashboard`)
- **🤖 AI Stadium Concierge:** A smart assistant powered by simulated **Google Gemini** that provides real-time navigation advice, food recommendations, and safety alerts via natural language.
- **📍 Smart Pathfinder:** Dynamic wait-time tracking for gates, restrooms, and food stands with optimized routing.
- **🗺️ Hybrid Map View:** Seamlessly toggle between custom stadium layouts and **Google Maps Platform** satellite imagery.
- **📊 Live Occupancy:** Real-time visualization of stadium capacity and current attendance.

### 🛡️ Command Center (`/admin`)
- **📢 Global Broadcasts:** Manually push urgent alerts to all active attendee dashboards.
- **🚨 Staff Dispatching:** Coordinate and deploy security or medical units to high-density zones with a single click.
- **🧠 Autonomous Monitoring:** Backend engine automatically detects overcrowding (e.g., Food Court >90%) and flags medical standby.

### 🧪 Advanced Simulation Engine
- **🔄 Stateful Drift:** Data points (occupancy, wait times, crowd levels) drift realistically over time using a bounded random walk algorithm.
- **📉 Predictive Density:** Simulates realistic crowd flow patterns and correlating impacts across zones.

---

## 🏗️ Hackathon Criteria Demonstration

- **Smart, Dynamic Assistant:** The AI Concierge uses model-based grounding to help users navigate complex physical environments.
- **Logical Decision Making:** The assistant analyzes the live `simulation_state` to recommend the fastest gates and shortest food lines.
- **Google Services Integration:** Leverages **Google Gemini** for intelligent chat and **Google Maps Platform** for high-resolution venue visualization.
- **Practical Usability:** Addresses real-world friction points in stadium logistics (congestion, hygiene access, emergency response).

---

## 🛠️ Technology Stack

- **Backend:** Flask (Python 3.11+)
- **AI Engine:** Google Gemini (Simulated)
- **Maps:** Google Maps Platform & Leaflet
- **Frontend:** Vanilla JavaScript, CSS3 (Modern Glassmorphism), Lucide Icons
- **Deployment:** Docker & Gunicorn

---

## Demo 🌐
- **Home Page:** https://smart-stadium-126509203511.us-central1.run.app/
- **Main Dashboard:** https://smart-stadium-126509203511.us-central1.run.app/dashboard
- **Admin Panel:** https://smart-stadium-126509203511.us-central1.run.app/admin


## 🏁 Getting Started

### Prerequisites
- Python 3.9+
- Pip

## Screenshot:
<img width="1919" height="895" alt="Screenshot 2026-04-15 205708" src="https://github.com/user-attachments/assets/a96b05f1-1fc5-489a-accc-b2ce3550534f" />
<img width="1904" height="773" alt="Screenshot 2026-04-15 184110" src="https://github.com/user-attachments/assets/db09123a-c1ab-49ee-953c-eb987bf84b01" />

### Local Setup
1. **Clone & Navigate:**
   ```bash
   git clone https://github.com/your-repo/promptwars-hackathon.git
   cd promptwars-hackathon/physical-event-experience
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Application:**
   ```bash
   python app.py
   ```
   The app will be available at `http://localhost:8080`.

---

## 📂 Project Structure

```text
physical-event-experience/
├── app.py              # Flask server, stateful simulation, and AI logic
├── static/
│   ├── css/style.css   # Core design system (Glassmorphism)
│   └── js/
│       ├── assistant.js # Google Gemini AI Concierge logic
│       ├── map.js       # Map routing and Google Maps toggle
│       └── dashboard.js # Real-time KPI and chart updates
└── templates/
    ├── portal.html     # Entry point / Landing page
    ├── index.html      # Attendee Dashboard (AI Powered)
    └── admin.html      # Admin Command Center
```

## 📄 License
This project was developed for the PromptWars Hackathon 2026. All rights reserved.
