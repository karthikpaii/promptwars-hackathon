async function updateAdminStats() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();

        // Update Staff counts
        document.getElementById('avail-security').textContent = data.staff.security.available;
        document.getElementById('avail-medical').textContent = data.staff.medical.available;
        document.getElementById('total-occ').textContent = data.occupancy.toLocaleString();

        // Update Zone List
        const zoneList = document.getElementById('zone-list');
        zoneList.innerHTML = '';
        
        data.zones.forEach(zone => {
            const item = document.createElement('div');
            item.className = 'zone-control-item';
            
            let color = 'white';
            if(zone.crowdLevel > 80) color = 'var(--danger)';
            else if(zone.crowdLevel > 50) color = 'var(--warning)';

            item.innerHTML = `
                <div class="zone-info">
                    <div style="font-weight:600; color:${color}">${zone.name}</div>
                    <div class="zone-meta">${zone.crowdLevel}% Capacity</div>
                </div>
                <div class="dispatch-btns">
                    <button class="btn-primary btn-small" style="background:#1e293b;" onclick="dispatchStaff('${zone.id}', 'security')">Send Security</button>
                    <button class="btn-primary btn-small" style="background:#1e293b;" onclick="dispatchStaff('${zone.id}', 'medical')">Send Medical</button>
                </div>
            `;
            zoneList.appendChild(item);
        });

    } catch (err) {
        console.error("Failed to fetch admin stats", err);
    }
}

async function sendBroadcast(type) {
    const msg = document.getElementById('broadcast-msg').value;
    if(!msg) return alert("Please type a message first.");

    try {
        const response = await fetch('/api/admin/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, type: type })
        });
        
        if(response.ok) {
            alert("Broadcast sent successfully!");
            document.getElementById('broadcast-msg').value = '';
        }
    } catch (err) {
        alert("Failed to send broadcast.");
    }
}

async function dispatchStaff(zoneId, staffType) {
    try {
        const response = await fetch('/api/admin/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zone_id: zoneId, type: staffType })
        });
        
        const resData = await response.json();
        if(resData.status === 'success') {
            alert(`${staffType.charAt(0).toUpperCase() + staffType.slice(1)} unit dispatched!`);
            updateAdminStats();
        } else {
            alert(resData.message);
        }
    } catch (err) {
        alert("Failed to dispatch staff.");
    }
}

// Initial update and interval
updateAdminStats();
setInterval(updateAdminStats, 3000);
if(window.lucide) lucide.createIcons();
