let gateChart;

function initCharts() {
    const ctxGate = document.getElementById('gateWaitChart').getContext('2d');

    gateChart = new Chart(ctxGate, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Wait Time (mins)',
                data: [],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    // The zone list requires no init logic as it's built dynamically in updateCharts
}

function updateCharts(data) {
    if (!gateChart) return;

    // Update Gate Chart
    gateChart.data.labels = data.gates.map(g => g.name);
    gateChart.data.datasets[0].data = data.gates.map(g => g.waitTimeMinutes);
    gateChart.data.datasets[0].backgroundColor = data.gates.map(g => 
        g.waitTimeMinutes > 20 ? 'rgba(239, 68, 68, 0.5)' : 
        (g.waitTimeMinutes > 10 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(59, 130, 246, 0.5)')
    );
    gateChart.update('none'); 

    // Update Live Zone Status List
    const zoneListContainer = document.getElementById('zone-status-list');
    zoneListContainer.innerHTML = ''; // Clear for simple re-render
    
    // Sort zones by density descending
    const sortedZones = [...data.zones].sort((a,b) => b.crowdLevel - a.crowdLevel);

    sortedZones.forEach(zone => {
        const row = document.createElement('div');
        row.className = 'zone-row';
        
        let colorClass = 'green';
        let statusText = 'Clear';
        if (zone.crowdLevel > 80) { colorClass = 'red'; statusText = 'Severe'; }
        else if (zone.crowdLevel > 50) { colorClass = 'yellow'; statusText = 'Moderate'; }

        row.innerHTML = `
            <div class="zone-info">
                <span class="zone-name">${zone.name}</span>
                <span class="zone-meta">${zone.crowdLevel}% Capacity</span>
            </div>
            <div class="zone-indicator-wrapper">
                <span class="zone-meta">${statusText}</span>
                <div class="zone-status-ball ${colorClass}"></div>
            </div>
        `;
        zoneListContainer.appendChild(row);
    });

    // Update Amenities Queues List
    const amenityListContainer = document.getElementById('amenity-status-list');
    if(amenityListContainer && data.amenities) {
        amenityListContainer.innerHTML = '';
        
        // Sort amenities by wait time descending
        const sortedAmenities = [...data.amenities].sort((a,b) => b.waitTimeMinutes - a.waitTimeMinutes);

        sortedAmenities.forEach(amenity => {
            const row = document.createElement('div');
            row.className = 'zone-row';
            
            let colorClass = 'green';
            let statusText = 'Short';
            if (amenity.waitTimeMinutes > 15) { colorClass = 'red'; statusText = 'Long'; }
            else if (amenity.waitTimeMinutes > 5) { colorClass = 'yellow'; statusText = 'Med'; }

            const iconClass = amenity.type === 'restroom' ? 'droplet' : 'pizza';

            row.innerHTML = `
                <div class="zone-info" style="flex-direction:row; gap:8px; align-items:center;">
                    <i data-lucide="${iconClass}" style="width:16px; height:16px; color:var(--text-muted);"></i>
                    <span class="zone-name">${amenity.name}</span>
                </div>
                <div class="zone-indicator-wrapper">
                    <span class="zone-meta">${amenity.waitTimeMinutes}m (${statusText})</span>
                    <div class="zone-status-ball ${colorClass}"></div>
                </div>
            `;
            amenityListContainer.appendChild(row);
        });
        
        // Ensure new lucide icons are rendered
        if(window.lucide) {
            window.lucide.createIcons();
        }
    }
}

window.initCharts = initCharts;
window.updateCharts = updateCharts;
