# 🏟️ Solution Architecture & Logic: StadiumIQ

This document outlines the strategic approach, technical logic, and core assumptions behind the **StadiumIQ** crowd management system.

## 🎯 Chosen Vertical: Physical Event Experience
StadiumIQ is designed for the **Smart Venue Management** sector. Our solution focuses on optimizing the attendee experience and operational safety in large-scale physical environments, specifically sport stadiums and entertainment arenas.

---

## 🧠 Approach and Logic

### 1. Dual-Interface Philosophy
We utilize a asymmetric architecture to serve two distinct user personas:
- **The Attendee (End-User):** A minimalist, high-impact dashboard focused on low-latency navigation and personal convenience.
- **The Command Center (Operator):** A macro-level overview for real-time dispatching, broadcasting, and safety monitoring.

### 2. Stateful Simulation Engine
Instead of static mock data, we implemented a **Stateful Drift Engine**. The backend maintains a consistent world state that evolves realistically over time.
- **Random Walk Algorithm:** Metrics like occupancy and gate wait times don't just "jump"; they drift using a bounded random walk, mimicking the fluid nature of real crowd movements.
- **Interconnected Logic:** Changes in one area (e.g., high gate wait times) correlates with downstream impacts (e.g., increased concourse density).

---

## 🛠️ How the Solution Works

### Backend (Python/Flask)
The core logic resides in `app.py`. 
- **The State:** A global dictionary `simulation_state` tracks every metric (Gates, Zones, Staff, Alerts).
- **The Engine:** The `advance_simulation()` function is triggered on every API poll. It applies mathematical drifts to all data points to ensure the "world" feels alive.
- **Auto-Intelligence:** The backend contains conditional logic that monitors density. If a zone exceeds a critical threshold (e.g., 90%), the system automatically generates an emergency medical alert.

### Frontend (Modern JS & Glassmorphism)
- **API Polling:** The frontend uses asynchronous JavaScript to poll the `/api/status` endpoint every 3 seconds.
- **Dynamic DOM Updates:** Instead of refreshing the page, we use data-binding logic to update specific elements (progress bars, status badges, and alert lists).
- **Premium Aesthetics:** We leveraged a modern "Glassmorphism" design system with Lucide icons and dynamic gradients to create a premium, state-of-the-art feel that wows the user.

---

## 📋 Assumptions Made

1. **Simplified Venue Topology:** We assume a generalized stadium layout consisting of four main gates (N, S, E, W) and centralized concourse/food zones.
2. **Global State Consistency:** For this prototype, the state is held in-memory. In a production environment, this would be backed by a low-latency cache like Redis.
3. **Mobile-First Interaction:** We assume the primary attendee interaction happens on mobile devices, leading to our choice of a single-page dashboard layout.
4. **Automated Cleanup:** We assume that 20% of automated alerts are "resolved" naturally over time, which is reflected in our simulation cleanup logic.

---
*Created for the PromptWars Hackathon 2026*
