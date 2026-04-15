let stadiumMap;
let gateMarkers = {};
let zoneCircles = {};

function initMap() {
    // Initialize map centered on a generic "stadium" location
    // Since we're using a generic map, we'll just use a fixed coordinate set
    const stadiumCenter = [51.504, -0.09]; 
    
    stadiumMap = L.map('stadium-map').setView(stadiumCenter, 16);

    // Dark themed tiles (via filter in CSS, but using CartoDB Dark Matter for better base)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(stadiumMap);

    // We can add a "stadium ring" or layout if we wanted to be fancy, 
    // but for now let's just place the markers for gates and zones.
}

function updateMap(data) {
    if (!stadiumMap) return;

    // Update Gates
    data.gates.forEach(gate => {
        // Find gate coordinates from our "database" entries (simulated in app.py)
        // In a real app, the /api/status might return lat/lng too.
        // For simplicity, let's assume we know them or they are in the data.
        
        // Let's hardcode some offsets for our generic stadium
        const coords = getGateCoords(gate.id);
        
        if (!gateMarkers[gate.id]) {
            gateMarkers[gate.id] = L.marker(coords).addTo(stadiumMap);
        }
        
        const waitTime = gate.waitTimeMinutes;
        const color = waitTime > 20 ? 'red' : (waitTime > 10 ? 'orange' : 'green');
        
        gateMarkers[gate.id].bindPopup(`
            <div class="map-popup">
                <strong>${gate.name}</strong><br>
                Wait Time: <span style="color:${color}">${waitTime} mins</span><br>
                Throughput: ${gate.throughput} p/m
            </div>
        `);
    });

    // Update Zones (Crowd Density Heatmaps)
    data.zones.forEach(zone => {
        const coords = getZoneCoords(zone.id);
        const radius = 40; // meters
        const opacity = zone.crowdLevel / 100;
        const color = zone.crowdLevel > 80 ? '#ef4444' : (zone.crowdLevel > 50 ? '#f59e0b' : '#10b981');

        if (!zoneCircles[zone.id]) {
            zoneCircles[zone.id] = L.circle(coords, {
                radius: radius,
                fillColor: color,
                color: color,
                weight: 1,
                fillOpacity: opacity * 0.6
            }).addTo(stadiumMap);
        } else {
            zoneCircles[zone.id].setStyle({
                fillColor: color,
                color: color,
                fillOpacity: opacity * 0.6
            });
        }
        
        zoneCircles[zone.id].bindTooltip(`${zone.name}: ${zone.crowdLevel}% density`);
    });
}

// Helper to simulate coordinates for our generic stadium layout
function getGateCoords(id) {
    const coords = {
        'gate-n': [51.505, -0.09],
        'gate-s': [51.503, -0.09],
        'gate-e': [51.504, -0.088],
        'gate-w': [51.504, -0.092]
    };
    return coords[id] || [51.504, -0.09];
}

function getZoneCoords(id) {
    const coords = {
        'zone-food': [51.5045, -0.091],
        'zone-merch': [51.5045, -0.089]
    };
    return coords[id] || [51.504, -0.09];
}

// Global expose
window.initMap = initMap;
window.updateMap = updateMap;
