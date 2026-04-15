document.addEventListener('DOMContentLoaded', () => {

    if(window.lucide) { window.lucide.createIcons(); }

    const tabs = { dashboard: document.getElementById('nav-dashboard'), map: document.getElementById('nav-map') };
    const views = { dashboard: document.getElementById('view-dashboard'), map: document.getElementById('view-map') };

    function switchView(viewName) {
        Object.values(views).forEach(v => v.classList.add('hidden'));
        Object.values(tabs).forEach(t => t.classList.remove('active'));
        views[viewName].classList.remove('hidden');
        tabs[viewName].classList.add('active');
        if (viewName === 'map' && window.stadiumMap) { setTimeout(() => window.stadiumMap.invalidateSize(), 150); }
    }

    tabs.dashboard.addEventListener('click', (e) => { e.preventDefault(); switchView('dashboard'); });
    tabs.map.addEventListener('click', (e) => { e.preventDefault(); switchView('map'); });

    // Navigation Quick Actions Logic
    document.querySelectorAll('.nav-action-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const routeType = e.currentTarget.dataset.route; 
            switchView('map');
            setTimeout(() => {
                let dest = 'FoodCourt'; 
                if (routeType === 'exit') dest = 'NorthGate'; 
                else if (routeType === 'restroom') dest = 'Main Washroom'; 
                else if (routeType === 'food') dest = 'Pizza Stand';
                
                window.calculateAndDrawRoute('Center', dest);
                const sStart = document.getElementById('route-start');
                const sEnd = document.getElementById('route-end');
                if(sStart) sStart.value = 'Center';
                if(sEnd) sEnd.value = dest;
            }, 150);
        });
    });

    // Map Specific Routing Panel
    const routeButton = document.getElementById('btn-draw-route');
    if (routeButton) {
        routeButton.addEventListener('click', () => {
            const start = document.getElementById('route-start').value;
            const end = document.getElementById('route-end').value;
            window.calculateAndDrawRoute(start, end);
        });
    }

    // --- Alert Manager Engine ---
    const activeAlerts = new Set(); 

    function showToast(title, message, type = 'warning') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const iconName = type === 'danger' ? 'alert-triangle' : 'info';

        toast.innerHTML = `
            <div class="toast-icon"><i data-lucide="${iconName}" style="width:20px; height:20px;"></i></div>
            <div class="toast-content">
                <span class="toast-title">${title}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        container.insertBefore(toast, container.firstChild); // New on top
        if(window.lucide) window.lucide.createIcons({root: toast});

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300); 
        }, 6000);
    }

    function processAlerts(data) {
        let currentTickAlerts = new Set();

        data.zones.forEach(zone => {
            if (zone.crowdLevel > 85) {
                const alertKey = `zone-${zone.id}-hi`;
                currentTickAlerts.add(alertKey);
                if (!activeAlerts.has(alertKey)) {
                    // USER EXPECTATION MATCH: "whenever limit corses send message tthat do not enter this place"
                    showToast('Zone Overcrowded!', `DO NOT ENTER ${zone.name.toUpperCase()}. Capacity is severe.`, 'danger');
                    activeAlerts.add(alertKey);
                }
            } else { activeAlerts.delete(`zone-${zone.id}-hi`); }
        });

        data.gates.forEach(gate => {
            if (gate.waitTimeMinutes > 25) {
                const alertKey = `gate-${gate.id}-hi`;
                currentTickAlerts.add(alertKey);
                if (!activeAlerts.has(alertKey)) {
                    showToast('Gate Delay', `Severe delays at ${gate.name} (${gate.waitTimeMinutes}m wait). Consider another exit.`, 'warning');
                    activeAlerts.add(alertKey);
                }
            } else { activeAlerts.delete(`gate-${gate.id}-hi`); }
        });

        if (data.alerts && data.alerts.length > 0) {
            data.alerts.forEach(alert => {
                if(!activeAlerts.has(`global-${alert.id}`)) {
                    showToast('Stadium Alert', alert.message, alert.type);
                    activeAlerts.add(`global-${alert.id}`);
                }
            });
        }
    }

    // --- Data Fetching Logic ---
    async function fetchData() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            if (window.updateCharts) window.updateCharts(data);
            if (window.updateMap) window.updateMap(data);

            processAlerts(data);

            // Update traditional KPI UI elements
            const occEl = document.getElementById('kpi-occupancy');
            const capEl = document.getElementById('kpi-capacity');
            if(occEl) occEl.textContent = data.occupancy.toLocaleString();
            if(capEl) capEl.textContent = data.capacity.toLocaleString();
            
            const densityPercent = Math.min(100, Math.round((data.occupancy / data.capacity) * 100));
            const densityBar = document.getElementById('density-bar');
            if(densityBar) {
                densityBar.style.width = `${densityPercent}%`;
                if (densityPercent > 90) densityBar.style.backgroundColor = 'var(--danger)';
                else if (densityPercent > 70) densityBar.style.backgroundColor = 'var(--warning)';
                else densityBar.style.backgroundColor = 'var(--success)';
            }
            const hintEl = document.getElementById('density-hint');
            if(hintEl) hintEl.textContent = `Stadium is ${densityPercent}% full`;

            const fastestGate = data.gates.reduce((prev, current) => (prev.waitTimeMinutes < current.waitTimeMinutes) ? prev : current);
            const timeEl = document.getElementById('kpi-fastest-time');
            const gateEl = document.getElementById('kpi-fastest-gate');
            if(timeEl) timeEl.textContent = fastestGate.waitTimeMinutes;
            if(gateEl) gateEl.textContent = fastestGate.name;

        } catch (error) { console.error('Error fetching stadium status:', error); }
    }

    // Init
    if (window.initCharts) window.initCharts();
    if (window.initMap) window.initMap();
    
    fetchData();
    setInterval(fetchData, 3000); 
});
