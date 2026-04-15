async function updateAdminStats() {
    try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error("Network offline");
        const data = await response.json();

        // Update Staff counts
        document.getElementById('avail-security').textContent = data.staff.security.available;
        document.getElementById('avail-medical').textContent = data.staff.medical.available;
        document.getElementById('total-occ').textContent = data.occupancy.toLocaleString();

        // Optimized Zone List Update (Flicker-Free)
        const zoneListContainer = document.getElementById('zone-list');
        data.zones.forEach(zone => {
            let row = zoneListContainer.querySelector(`[data-id="${zone.id}"]`);
            if (!row) {
                row = document.createElement('div');
                row.className = 'zone-control-item';
                row.setAttribute('data-id', zone.id);
                zoneListContainer.appendChild(row);
            }
            
            let color = 'white';
            if(zone.crowdLevel > 80) color = 'var(--danger)';
            else if(zone.crowdLevel > 50) color = 'var(--warning)';

            row.innerHTML = `
                <div class="zone-info">
                    <div style="font-weight:600; color:${color}">${zone.name}</div>
                    <div class="zone-meta">${zone.crowdLevel}% Capacity</div>
                </div>
                <div class="dispatch-btns">
                    <button class="btn-primary btn-small" style="background:#1e293b;" onclick="dispatchStaff('${zone.id}', 'security')">Send Security</button>
                    <button class="btn-primary btn-small" style="background:#1e293b;" onclick="dispatchStaff('${zone.id}', 'medical')">Send Medical</button>
                </div>
            `;
        });

    } catch (err) {
        console.error("Failed to fetch admin stats", err);
    }
}

async function sendBroadcast(type) {
    const btnGroup = document.querySelector('.btn-group');
    const msg = document.getElementById('broadcast-msg').value;
    if(!msg) return alert("Please type a message first.");

    btnGroup.style.opacity = '0.5';
    btnGroup.style.pointerEvents = 'none';

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
    } finally {
        btnGroup.style.opacity = '1';
        btnGroup.style.pointerEvents = 'auto';
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
if(window.lucide) {
    window.lucide.createIcons();
}
