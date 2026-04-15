document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI Components
    window.initMap();
    window.initCharts();

    // Navigation Logic
    const tabs = {
        'dashboard': document.getElementById('tab-dashboard'),
        'map': document.getElementById('tab-map')
    };

    const views = {
        'dashboard': document.getElementById('view-dashboard'),
        'map': document.getElementById('view-map')
    };

    function switchView(viewName) {
        // Update Nav UI
        Object.keys(tabs).forEach(k => {
            if (tabs[k]) tabs[k].parentElement.classList.toggle('active', k === viewName);
        });

        // Update View Visibility
        Object.keys(views).forEach(k => {
            if (views[k]) views[k].classList.toggle('hidden', k !== viewName);
        });

        // Update Page Title
        document.getElementById('page-title').textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        
        // Leaflet needs a resize trigger if it was hidden
        if (viewName === 'map') {
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        }
    }

    tabs.dashboard.addEventListener('click', (e) => { e.preventDefault(); switchView('dashboard'); });
    tabs.map.addEventListener('click', (e) => { e.preventDefault(); switchView('map'); });

    // Navigation Quick Actions
    document.querySelectorAll('.nav-action-card').forEach(btn => {
        btn.addEventListener('click', () => {
            // Right now, we just switch to the map view. In a real app we'd trigger routing.
            switchView('map');
        });
    });

    // Data Fetching Logic
    async function fetchData() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            updateUI(data);
            window.updateMap(data);
            window.updateCharts(data);
            
        } catch (error) {
            console.error('Error fetching stadium status:', error);
        }
    }

    function updateUI(data) {
        // --- Crowd Density Card Updates ---
        document.getElementById('kpi-occupancy').textContent = data.occupancy.toLocaleString();
        document.getElementById('kpi-capacity').textContent = data.capacity.toLocaleString();
        
        const densityPercent = Math.min(100, Math.round((data.occupancy / data.capacity) * 100));
        const densityBar = document.getElementById('density-bar');
        densityBar.style.width = `${densityPercent}%`;
        
        // Change color based on density
        if (densityPercent > 90) densityBar.style.backgroundColor = 'var(--danger)';
        else if (densityPercent > 70) densityBar.style.backgroundColor = 'var(--warning)';
        else densityBar.style.backgroundColor = 'var(--success)';
        
        document.getElementById('density-hint').textContent = `Stadium is ${densityPercent}% full`;

        // --- Fastest Gate Updates ---
        const fastestGate = data.gates.reduce((prev, current) => (prev.waitTimeMinutes < current.waitTimeMinutes) ? prev : current);
        document.getElementById('kpi-fastest-time').textContent = fastestGate.waitTimeMinutes;
        document.getElementById('kpi-fastest-gate').textContent = fastestGate.name;

        // --- Congestion Card Updates ---
        const congestionZones = data.zones.filter(z => z.crowdLevel > 70);
        document.getElementById('kpi-congestion').textContent = congestionZones.length;
        
        const congestionCard = document.getElementById('congestion-card');
        if (congestionZones.length > 0) {
            congestionCard.style.border = '1px solid var(--danger)';
        } else {
            congestionCard.style.border = '1px solid var(--panel-border)';
        }
        
        // Update subtitle with timestamp
        const timeStr = new Date(data.timestamp * 1000).toLocaleTimeString();
        document.querySelector('.subtitle').textContent = `Live Stats - Last updated: ${timeStr}`;
        
        // (Optional) simulate routing estimates changing slightly
        document.getElementById('nav-exit-time').textContent = `Est. ${fastestGate.waitTimeMinutes + 2} min`;
    }

    // Initial fetch and set interval
    fetchData();
    setInterval(fetchData, 3000); // Update every 3 seconds for that "real-time" feel
});
