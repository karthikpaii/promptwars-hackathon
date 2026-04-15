let stadiumMap;
let gateMarkers = {};
let zoneLayers = {};

function initMap() {
    const stadiumCenter = [51.504, -0.09]; 
    
    stadiumMap = L.map('stadium-map').setView(stadiumCenter, 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(stadiumMap);
}

function updateMap(data) {
    if (!stadiumMap) return;

    // Update Gates
    data.gates.forEach(gate => {
        const coords = getGateCoords(gate.id);
        
        if (!gateMarkers[gate.id]) {
            gateMarkers[gate.id] = L.circleMarker(coords, {
                radius: 8,
                weight: 2,
                color: '#fff',
                fillOpacity: 1
            }).addTo(stadiumMap);
        }
        
        const waitTime = gate.waitTimeMinutes;
        const color = waitTime > 20 ? '#ef4444' : (waitTime > 10 ? '#f59e0b' : '#10b981');
        
        gateMarkers[gate.id].setStyle({ fillColor: color });
        
        gateMarkers[gate.id].bindPopup(`
            <div class="map-popup">
                <strong>${gate.name}</strong><br>
                Wait Time: <span style="color:${color}">${waitTime} mins</span>
            </div>
        `);
    });

    // Update Zones with smooth path transitions
    data.zones.forEach(zone => {
        const coords = getZoneCoords(zone.id);
        const color = zone.crowdLevel > 80 ? '#ef4444' : (zone.crowdLevel > 50 ? '#f59e0b' : '#10b981');

        if (!zoneLayers[zone.id]) {
            // Draw a polygon to represent a "section"
            zoneLayers[zone.id] = L.polygon(coords, {
                fillColor: color,
                color: color,
                weight: 2,
                fillOpacity: 0.4,
                className: 'smooth-transition-path' // We will add CSS for this
            }).addTo(stadiumMap);
        } else {
            zoneLayers[zone.id].setStyle({
                fillColor: color,
                color: color
            });
        }
        
        zoneLayers[zone.id].bindTooltip(`${zone.name}: ${zone.crowdLevel}% density`, { permanent: false });
    });
}

function getGateCoords(id) {
    const coords = {
        'gate-n': [51.506, -0.09],
        'gate-s': [51.502, -0.09],
        'gate-e': [51.504, -0.087],
        'gate-w': [51.504, -0.093]
    };
    return coords[id] || [51.504, -0.09];
}

function getZoneCoords(id) {
    // Return an array of lat/lng points to make a polygon "stadium section"
    const coords = {
        'zone-nc': [[51.506,-0.092], [51.506,-0.088], [51.505,-0.089], [51.505,-0.091]], // North Concourse
        'zone-sc': [[51.502,-0.092], [51.502,-0.088], [51.503,-0.089], [51.503,-0.091]], // South Concourse
        'zone-food': [[51.5055,-0.0925], [51.5055,-0.0915], [51.5045,-0.0915], [51.5045,-0.0925]], // Food Court
        'zone-merch': [[51.5055,-0.0885], [51.5055,-0.0875], [51.5045,-0.0875], [51.5045,-0.0885]], // Merch Stand
        'zone-vip': [[51.5035,-0.0925], [51.5035,-0.0915], [51.5025,-0.0915], [51.5025,-0.0925]], // VIP
        'zone-main': [[51.5045,-0.09], [51.5045,-0.089], [51.5035,-0.089], [51.5035,-0.09]], // Main center
    };
    return coords[id] || [[51.504,-0.09],[51.504,-0.091],[51.503,-0.091]];
}

// Global expose
window.initMap = initMap;
window.updateMap = updateMap;
