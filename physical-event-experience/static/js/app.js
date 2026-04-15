document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI Components
    window.initMap();
    window.initCharts();

    // Navigation Logic
    const tabs = {
        'dashboard': document.getElementById('tab-dashboard'),
        'map': document.getElementById('tab-map'),
        'alerts': document.getElementById('tab-alerts')
    };

    const views = {
        'dashboard': document.getElementById('view-dashboard'),
        'map': document.getElementById('view-map'),
        'alerts': document.getElementById('view-alerts')
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
    tabs.alerts.addEventListener('click', (e) => { e.preventDefault(); switchView('alerts'); });

    // Navigation Quick Actions Logic
    document.querySelectorAll('.nav-action-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const routeType = e.currentTarget.dataset.route; // 'exit', 'restroom', 'food'
            switchView('map');
            
            // Wait slightly for map view transition before routing
            setTimeout(() => {
                let dest = 'FoodCourt'; // default
                if (routeType === 'exit') dest = 'NorthGate'; // mock fastest gate
                else if (routeType === 'restroom') dest = 'MerchStand'; // Mock nearby node
                else if (routeType === 'food') dest = 'FoodCourt';
                
                // Route from generic 'Your Seat' (Center) to destination
                window.calculateAndDrawRoute('Center', dest);
                
                // Also update the select dropdowns visually
                document.getElementById('route-start').value = 'Center';
                document.getElementById('route-end').value = dest;
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

    // --- Real-time Alert Engine ---
    const activeAlerts = new Set(); 

    function showToast(title, message, type = 'warning') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const iconName = type === 'danger' ? 'alert-triangle' : 'info';

        let autoDismissTimer;
        const dismissToast = () => {
            clearTimeout(autoDismissTimer);
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        };

        toast.innerHTML = `
            <div class="toast-icon"><i data-lucide="${iconName}" style="width:20px; height:20px;"></i></div>
            <div class="toast-content">
                <span class="toast-title">${title}</span>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close"><i data-lucide="x" style="width:16px; height:16px;"></i></button>
        `;
        
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) closeBtn.addEventListener('click', dismissToast);
        
        container.insertBefore(toast, container.firstChild); 
        if(window.lucide) window.lucide.createIcons({root: toast});

        // Add to persistent History Feed on the Alerts Tab
        const feedContainer = document.getElementById('alert-history-feed');
        if (feedContainer) {
            const emptyState = feedContainer.querySelector('.empty-state');
            if (emptyState) emptyState.remove();

            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            const historyItem = document.createElement('div');
            historyItem.className = `alert-feed-item ${type}`;
            historyItem.innerHTML = `
                <div class="toast-icon">
                    <i data-lucide="${iconName}" style="width:24px; height:24px; color: var(--${type === 'danger' ? 'danger' : 'warning'});"></i>
                </div>
                <div class="alert-body">
                    <h4>${title}</h4>
                    <p>${message}</p>
                </div>
                <div class="alert-time">${timeStr}</div>
            `;
            feedContainer.insertBefore(historyItem, feedContainer.firstChild); // Prepend to top
            if(window.lucide) window.lucide.createIcons({root: historyItem});
        }

        autoDismissTimer = setTimeout(dismissToast, 6000);
    }

    function processAlerts(data) {
        data.zones.forEach(zone => {
            if (zone.crowdLevel > 85) {
                const alertKey = `zone-${zone.id}-hi`;
                if (!activeAlerts.has(alertKey)) {
                    showToast('Zone Overcrowded!', `DO NOT ENTER ${zone.name.toUpperCase()}. Capacity is severe.`, 'danger');
                    activeAlerts.add(alertKey);
                }
            } else { activeAlerts.delete(`zone-${zone.id}-hi`); }
        });

        data.gates.forEach(gate => {
            if (gate.waitTimeMinutes > 25) {
                const alertKey = `gate-${gate.id}-hi`;
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

    // Data Fetching Logic
    async function fetchData() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            processAlerts(data); 
            
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
        const subtitle = document.querySelector('.subtitle');
        if (subtitle) subtitle.textContent = `Live Stats - Last updated: ${timeStr}`;
        
        // (Optional) simulate routing estimates changing slightly
        const navTime = document.getElementById('nav-exit-time');
        if(navTime) navTime.textContent = `Est. ${fastestGate.waitTimeMinutes + 2} min`;
    }

    // Initial fetch and set interval
    fetchData();
    setInterval(fetchData, 3000); 
});
