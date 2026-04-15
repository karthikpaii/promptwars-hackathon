let stadiumMap;
let gateMarkers = {};
let zoneLayers = {};
let amenityMarkers = {}; // NEW: Tracker for amenity labels
let currentRouteLine = null;
let lastKnownData = null; 

// --- Graph Definition ---
const mapNodes = {
    'Center': [51.504, -0.09],
    'NorthGate': [51.506, -0.09],
    'SouthGate': [51.502, -0.09],
    'EastGate': [51.504, -0.087],
    'WestGate': [51.504, -0.093],
    'FoodCourt': [51.505, -0.091],
    'MerchStand': [51.505, -0.088],
    'VIP': [51.503, -0.092],
    'Main Washroom': [51.5055, -0.089],
    'North Washroom': [51.5065, -0.089],
    'Pizza Stand': [51.5055, -0.0915],
    'Drinks Tent': [51.5035, -0.0915]
};

// Edges list with connections and the ZONE they pass through.
const mapEdges = [
    { a: 'Center', b: 'NorthGate', zone: 'zone-nc', dist: 10 },
    { a: 'Center', b: 'SouthGate', zone: 'zone-sc', dist: 10 },
    { a: 'Center', b: 'EastGate', zone: 'zone-main', dist: 10 },
    { a: 'Center', b: 'WestGate', zone: 'zone-main', dist: 10 },
    { a: 'Center', b: 'FoodCourt', zone: 'zone-food', dist: 6 },
    { a: 'Center', b: 'VIP', zone: 'zone-vip', dist: 5 },
    { a: 'Center', b: 'MerchStand', zone: 'zone-merch', dist: 6 },
    { a: 'Center', b: 'Main Washroom', zone: null, dist: 7 },
    
    // Outer Ring paths to walk around the center
    { a: 'NorthGate', b: 'FoodCourt', zone: 'zone-nc', dist: 4 },
    { a: 'NorthGate', b: 'MerchStand', zone: 'zone-nc', dist: 4 },
    { a: 'EastGate', b: 'MerchStand', zone: null, dist: 5 },
    { a: 'EastGate', b: 'Main Washroom', zone: null, dist: 4 },
    { a: 'SouthGate', b: 'VIP', zone: 'zone-sc', dist: 4 },
    { a: 'WestGate', b: 'VIP', zone: null, dist: 5 },
    { a: 'WestGate', b: 'FoodCourt', zone: null, dist: 5 },
];

// --- Map Initialization ---
function initMap() {
    const stadiumCenter = [51.504, -0.09]; 
    stadiumMap = L.map('stadium-map', { zoomControl: false }).setView(stadiumCenter, 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(stadiumMap);
}

// --- Status Updates ---
function updateMap(data) {
    if (!stadiumMap) return;
    lastKnownData = data;

    // 1. Update Gates
    data.gates.forEach(gate => {
        const coords = getGateCoords(gate.id);
        if (!gateMarkers[gate.id]) {
            gateMarkers[gate.id] = L.circleMarker(coords, { radius: 8, weight: 2, color: '#fff', fillOpacity: 1 }).addTo(stadiumMap);
        }
        
        const waitTime = gate.waitTimeMinutes;
        const color = waitTime > 20 ? '#ef4444' : (waitTime > 10 ? '#f59e0b' : '#10b981');
        gateMarkers[gate.id].setStyle({ fillColor: color });
        
        // Update tooltip with time!
        if(!gateMarkers[gate.id].getTooltip()) {
             gateMarkers[gate.id].bindTooltip(`${gate.name} (${waitTime}m)`, {
                permanent: true, direction: 'top', className: 'gate-label', opacity: 1, offset: [0, -10]
            }).openTooltip();
        } else {
             gateMarkers[gate.id].setTooltipContent(`${gate.name} (${waitTime}m)`);
        }
    });

    // 2. Update Zones
    data.zones.forEach(zone => {
        const coords = getZoneCoords(zone.id);
        const color = zone.crowdLevel > 80 ? '#ef4444' : (zone.crowdLevel > 50 ? '#f59e0b' : '#10b981');

        if (!zoneLayers[zone.id]) {
            zoneLayers[zone.id] = L.polygon(coords, {
                fillColor: color, color: color, weight: 2, fillOpacity: 0.4, className: 'smooth-transition-path'
            }).addTo(stadiumMap);
            
            zoneLayers[zone.id].bindTooltip(zone.name, {
                permanent: true, direction: 'center', className: 'map-label', opacity: 1
            });
        } else {
            zoneLayers[zone.id].setStyle({ fillColor: color, color: color });
        }
    });

    // 3. Update Amenities
    if(data.amenities) {
        data.amenities.forEach(amenity => {
            const coords = mapNodes[amenity.name] || [51.504, -0.09];
            if (!amenityMarkers[amenity.id]) {
                amenityMarkers[amenity.id] = L.circleMarker(coords, { radius: 0, opacity: 0 }).addTo(stadiumMap);
                amenityMarkers[amenity.id].bindTooltip(`${amenity.name} (${amenity.waitTimeMinutes}m wait)`, { 
                    permanent: true, direction: 'center', className: 'map-label', opacity: 1 
                }).openTooltip();
            } else {
                amenityMarkers[amenity.id].setTooltipContent(`${amenity.name} (${amenity.waitTimeMinutes}m wait)`);
            }
        });
    }
}

// --- Routing System (Dijkstra) ---
function calculateAndDrawRoute(startNodeId, endNodeId) {
    if(!lastKnownData) return console.log("Waiting for live data sync...");
    
    if(currentRouteLine) { stadiumMap.removeLayer(currentRouteLine); }

    const adj = {};
    Object.keys(mapNodes).forEach(n => adj[n] = []);
    const densityMap = {};
    lastKnownData.zones.forEach(z => densityMap[z.id] = z.crowdLevel);

    mapEdges.forEach(edge => {
        let weight = edge.dist;
        if (edge.zone && densityMap[edge.zone]) {
            let crowd = densityMap[edge.zone];
            if (crowd > 70) weight += (crowd * 0.5); 
            else if (crowd > 50) weight += (crowd * 0.2);
        }
        
        adj[edge.a].push({ id: edge.b, weight: weight });
        adj[edge.b].push({ id: edge.a, weight: weight });
    });

    const dists = {};
    const prev = {};
    const unvisited = new Set(Object.keys(mapNodes));
    
    Object.keys(mapNodes).forEach(n => dists[n] = Infinity);
    dists[startNodeId] = 0;

    while(unvisited.size > 0) {
        let current = null;
        let minD = Infinity;
        unvisited.forEach(n => { if (dists[n] < minD) { minD = dists[n]; current = n; } });

        if (!current || current === endNodeId) break;
        unvisited.delete(current);

        adj[current].forEach(neighbor => {
            let alt = dists[current] + neighbor.weight;
            if (alt < dists[neighbor.id]) {
                dists[neighbor.id] = alt;
                prev[neighbor.id] = current;
            }
        });
    }

    const path = [];
    let u = endNodeId;
    if (prev[u] || u === startNodeId) {
        while (u) { path.unshift(u); u = prev[u]; }
    }

    if (path.length > 0) {
        const latlngs = path.map(node => mapNodes[node]);
        currentRouteLine = L.polyline(latlngs, {
            color: '#3b82f6', weight: 6, className: 'neon-route-path'
        }).addTo(stadiumMap);
        
        stadiumMap.fitBounds(currentRouteLine.getBounds(), { padding: [50,50] });
    }
}

// --- Helpers ---
function getGateCoords(id) {
    const coords = { 'gate-n': [51.506, -0.09], 'gate-s': [51.502, -0.09], 'gate-e': [51.504, -0.087], 'gate-w': [51.504, -0.093] };
    return coords[id] || mapNodes['Center'];
}

function getZoneCoords(id) {
    const coords = {
        'zone-nc': [[51.506,-0.092], [51.506,-0.088], [51.505,-0.089], [51.505,-0.091]],
        'zone-sc': [[51.502,-0.092], [51.502,-0.088], [51.503,-0.089], [51.503,-0.091]],
        'zone-food': [[51.5055,-0.0925], [51.5055,-0.0915], [51.5045,-0.0915], [51.5045,-0.0925]],
        'zone-merch': [[51.5055,-0.0885], [51.5055,-0.0875], [51.5045,-0.0875], [51.5045,-0.0885]],
        'zone-vip': [[51.5035,-0.0925], [51.5035,-0.0915], [51.5025,-0.0915], [51.5025,-0.0925]],
        'zone-main': [[51.5045,-0.09], [51.5045,-0.089], [51.5035,-0.089], [51.5035,-0.09]],
    };
    return coords[id] || [[51.504,-0.09],[51.504,-0.091],[51.503,-0.091]];
}

// Global expose
window.initMap = initMap;
window.updateMap = updateMap;
window.calculateAndDrawRoute = calculateAndDrawRoute;
