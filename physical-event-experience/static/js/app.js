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
        // KPI Updates
        document.getElementById('kpi-occupancy').textContent = data.occupancy.toLocaleString();
        
        const avgWait = Math.round(data.gates.reduce((acc, g) => acc + g.waitTimeMinutes, 0) / data.gates.length);
        document.getElementById('kpi-wait').textContent = `${avgWait}m`;
        
        const congestionCount = data.zones.filter(z => z.crowdLevel > 70).length;
        document.getElementById('kpi-congestion').textContent = congestionCount;
        
        // Update subtitle with timestamp
        const timeStr = new Date(data.timestamp * 1000).toLocaleTimeString();
        document.querySelector('.subtitle').textContent = `Live Stats - Last updated: ${timeStr}`;
    }

    // Initial fetch and set interval
    fetchData();
    setInterval(fetchData, 3000); // Update every 3 seconds for that "real-time" feel
});
