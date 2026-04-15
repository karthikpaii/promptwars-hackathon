# 🏟️ StadiumIQ | Smart Venue Crowd Management

StadiumIQ is a cutting-edge, real-time crowd management and navigation ecosystem designed for large-scale sporting venues and stadiums. It provides a seamless experience for both attendees and venue operators through a dual-interface architecture.

![StadiumIQ Banner](https://img.shields.io/badge/StadiumIQ-Mission%20Control-blue?style=for-the-badge&logo=flask)
![Tech Stack](https://img.shields.io/badge/Stack-Flask%20%7C%20JavaScript%20%7C%20Docker-orange?style=for-the-badge)

## 🚀 Key Features

### 👤 Attendee Experience (`/dashboard`)
- **Live Occupancy Tracking:** Real-time visualization of stadium capacity and current attendance.
- **Smart Pathfinder:** Dynamic wait-time tracking for gates, restrooms, and food stands.
- **Real-Time Alerts:** Instant notifications for crowd density updates or emergency announcements.
- **Interactive Map:** Visual representation of zones with color-coded density levels.

### 🛡️ Command Center (`/admin`)
- **Global Broadcasts:** Manually push urgent alerts to all active attendee dashboards.
- **Staff Dispatching:** Coordinate and deploy security or medical units to high-density zones.
- **Autonomous Monitoring:** Backend engine automatically detects overcrowding and flags medical standby.
- **Operational Overview:** High-level metrics for venue personnel to maintain smooth operations.

### 🧪 Advanced Simulation Engine
- **Live Drifting:** Data points (occupancy, wait times, crowd levels) drift realistically over time.
- **Predictive Density:** Simulates random walks and realistic crowd flow patterns.
- **Auto-Alerts:** Automated system alerts triggered by real-time density spikes.

## 🛠️ Technology Stack

- **Backend:** Flask (Python 3.11+)
- **Frontend:** Vanilla JavaScript, CSS3 (Modern Glassmorphism Design), Lucide Icons
- **Deployment:** Docker & Gunicorn
- **Styling:** Premium UI with dynamic gradients and micro-animations

## 🏁 Getting Started

### Prerequisites
- Python 3.9+
- Pip

### Local Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/promptwars-hackathon.git
   cd promptwars-hackathon/physical-event-experience
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```
   The app will be available at `http://localhost:8080`.

### Running with Docker
```bash
docker build -t stadiumiq .
docker run -p 8080:8080 stadiumiq
```

## 📂 Project Structure

```text
physical-event-experience/
├── app.py              # Flask server and simulation logic
├── Dockerfile          # Container configuration
├── requirements.txt    # Python dependencies
├── static/
│   ├── css/style.css   # Core design system
│   └── js/app.js       # Frontend logic and API polling
└── templates/
    ├── portal.html     # Entry point / Landing page
    ├── index.html      # Attendee Dashboard
    └── admin.html      # Admin Command Center
```

## 📄 License
This project was developed for the PromptWars Hackathon. All rights reserved.
