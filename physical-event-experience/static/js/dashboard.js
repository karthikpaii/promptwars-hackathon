let gateChart;
let zoneChart;

function initCharts() {
    const ctxGate = document.getElementById('gateWaitChart').getContext('2d');
    const ctxZone = document.getElementById('zoneDensityChart').getContext('2d');

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#94a3b8'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#94a3b8'
                }
            }
        }
    };

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
        options: commonOptions
    });

    zoneChart = new Chart(ctxZone, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.5)', 
                    'rgba(16, 185, 129, 0.5)',
                    'rgba(245, 158, 11, 0.5)',
                    'rgba(239, 68, 68, 0.5)'
                ],
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: '#94a3b8' }
                }
            }
        }
    });
}

function updateCharts(data) {
    if (!gateChart || !zoneChart) return;

    // Update Gate Chart
    gateChart.data.labels = data.gates.map(g => g.name);
    gateChart.data.datasets[0].data = data.gates.map(g => g.waitTimeMinutes);
    // Dynamic color based on wait
    gateChart.data.datasets[0].backgroundColor = data.gates.map(g => 
        g.waitTimeMinutes > 20 ? 'rgba(239, 68, 68, 0.5)' : 
        (g.waitTimeMinutes > 10 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(59, 130, 246, 0.5)')
    );
    gateChart.update('none'); // no animation for smooth real-time feel

    // Update Zone Chart
    zoneChart.data.labels = data.zones.map(z => z.name);
    zoneChart.data.datasets[0].data = data.zones.map(z => z.crowdLevel);
    zoneChart.update('none');
}

window.initCharts = initCharts;
window.updateCharts = updateCharts;
