// ==========================================
// Nkwalink Emergency Dashboard
// Role-based Dashboard Logic
// ==========================================

// ===== STATE MANAGEMENT =====
let currentUser = {
    id: 'user_001',
    name: 'Emergency Officer',
    role: 'citizen', // 'citizen', 'responder', 'coordinator'
    phone: '0501234567',
    team: null,
    status: 'available'
};

let incidents = [
    {
        id: 'INC-001',
        type: 'fire',
        location: 'Accra Central',
        priority: 'critical',
        status: 'reported',
        time: new Date(Date.now() - 15 * 60000),
        reporter: { name: 'John Doe', phone: '0501234567' },
        description: 'Fire outbreak at commercial building',
        assignedUnit: null
    },
    {
        id: 'INC-002',
        type: 'medical',
        location: 'Tema Station',
        priority: 'high',
        status: 'en-route',
        time: new Date(Date.now() - 45 * 60000),
        reporter: { name: 'Jane Smith', phone: '0509876543' },
        description: 'Medical emergency - cardiac arrest',
        assignedUnit: 'AMB-001'
    },
    {
        id: 'INC-003',
        type: 'accident',
        location: 'Ring Road West',
        priority: 'medium',
        status: 'assigned',
        time: new Date(Date.now() - 90 * 60000),
        reporter: { name: 'Robert Johnson', phone: '0557654321' },
        description: 'Vehicle collision - 3 vehicles involved',
        assignedUnit: 'POL-003'
    }
];

let resources = [
    { id: 'AMB-001', type: 'ambulance', location: 'Accra Central', status: 'busy', crew: 2 },
    { id: 'AMB-002', type: 'ambulance', location: 'Tema', status: 'available', crew: 2 },
    { id: 'FIR-001', type: 'fire_truck', location: 'Fire Station', status: 'available', crew: 5 },
    { id: 'POL-001', type: 'police_unit', location: 'Police Station', status: 'available', crew: 3 },
    { id: 'POL-002', type: 'police_unit', location: 'Patrolling', status: 'busy', crew: 2 },
    { id: 'POL-003', type: 'police_unit', location: 'Ring Road West', status: 'busy', crew: 2 },
];

let messages = [
    { sender: 'Command Center', text: 'Respond to incident INC-001 immediately', timestamp: new Date(Date.now() - 10 * 60000) },
    { sender: 'You', text: 'En route to location', timestamp: new Date(Date.now() - 5 * 60000) },
    { sender: 'Command Center', text: 'Backup unit has been dispatched', timestamp: new Date(Date.now() - 2 * 60000) }
];

let alerts = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupEventListeners();
    switchRole('citizen');
});

function initializeDashboard() {
    updateHeaderInfo();
    populateLanguageOptions();
}

function setupEventListeners() {
    // Language selector
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });
    
    // User menu
    document.getElementById('userMenuBtn').addEventListener('click', showUserMenu);
    
    // Citizen role events
    document.getElementById('citizenReportForm')?.addEventListener('submit', handleCitizenReport);
    document.getElementById('useGPSBtn')?.addEventListener('click', getUserLocation);
    document.getElementById('citizenVoiceBtn')?.addEventListener('click', startVoiceInput);
    document.getElementById('citizenMediaBtn')?.addEventListener('click', startMediaCapture);
    
    // Responder role events
    document.getElementById('responderStatusSelect')?.addEventListener('change', (e) => updateResponderStatus(e.target.value));
    document.getElementById('responderSendChat')?.addEventListener('click', sendResponderMessage);
    
    // Coordinator role events
    document.getElementById('alertBroadcastForm')?.addEventListener('submit', handleAlertBroadcast);
    document.getElementById('exportReportBtn')?.addEventListener('click', exportReport);
    
    // Modal close buttons
    document.getElementById('closeSuccessBtn')?.addEventListener('click', () => {
        document.getElementById('successModal').classList.add('hidden');
    });
}

// ===== HEADER AND NAV =====
function updateHeaderInfo() {
    const activeIncidents = incidents.filter(i => ['reported', 'en-route', 'assigned'].includes(i.status)).length;
    document.getElementById('headerIncidentCount').textContent = activeIncidents;
    
    const avgResponse = calculateAverageResponse();
    document.getElementById('headerResponseRate').textContent = avgResponse;
    
    const availableUnits = resources.filter(r => r.status === 'available').length;
    document.getElementById('headerAvailableUnits').textContent = availableUnits;
    
    document.getElementById('headerAlerts').textContent = alerts.length;
}

function calculateAverageResponse() {
    const resolved = incidents.filter(i => i.status === 'resolved');
    if (resolved.length === 0) return '--';
    const total = resolved.reduce((sum, i) => sum + (i.resolvedTime ? i.resolvedTime - i.time : 0), 0);
    const avg = total / resolved.length / 60000; // Convert to minutes
    return Math.round(avg) + ' min';
}

function populateLanguageOptions() {
    // Language options already set in HTML
}

function setLanguage(lang) {
    // Placeholder for multi-language support
    console.log('Language changed to:', lang);
    // In production, load language strings from i18n file
}

function showUserMenu() {
    const menu = document.createElement('div');
    menu.className = 'absolute top-16 right-0 bg-white rounded-lg shadow-lg z-50 w-48 mt-2';
    menu.innerHTML = `
        <div class="p-4 border-b border-gray-200">
            <p class="font-semibold text-gray-900">${currentUser.name}</p>
            <p class="text-sm text-gray-600">${currentUser.role}</p>
        </div>
        <button class="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors" onclick="switchRole('citizen')">
            Switch to Citizen
        </button>
        <button class="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors" onclick="switchRole('responder')">
            Switch to Responder
        </button>
        <button class="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors" onclick="switchRole('coordinator')">
            Switch to Coordinator
        </button>
        <button class="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-t border-gray-200 mt-2" onclick="logout()">
            Logout
        </button>
    `;
    
    // Remove existing menu if present
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) existingMenu.remove();
    
    document.body.appendChild(menu);
    menu.classList.add('user-menu');
}

function switchRole(role) {
    currentUser.role = role;
    updateUserDisplay();
    
    // Hide all dashboards
    document.querySelectorAll('[id$="Dashboard"]').forEach(el => el.classList.add('hidden'));
    
    // Show selected dashboard
    const dashboard = document.getElementById(`${role}Dashboard`);
    if (dashboard) {
        dashboard.classList.remove('hidden');
        dashboard.classList.add('fade-in');
        renderDashboard(role);
    }
    
    // Close user menu
    const menu = document.querySelector('.user-menu');
    if (menu) menu.remove();
}

function updateUserDisplay() {
    document.getElementById('userDisplayName').textContent = `${currentUser.name} (${currentUser.role.toUpperCase()})`;
    document.getElementById('userMenuBtn').innerHTML = `
        <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
            </svg>
        </div>
        <span class="text-sm font-medium">${currentUser.name}</span>
    `;
}

// ===== DASHBOARD RENDERING =====
function renderDashboard(role) {
    switch(role) {
        case 'citizen':
            renderCitizenDashboard();
            break;
        case 'responder':
            renderResponderDashboard();
            break;
        case 'coordinator':
            renderCoordinatorDashboard();
            break;
    }
}

// ===== CITIZEN DASHBOARD =====
function renderCitizenDashboard() {
    renderCitizenAlerts();
}

function renderCitizenAlerts() {
    const container = document.getElementById('citizenAlertsContainer');
    if (!container) return;
    
    container.innerHTML = incidents
        .filter(i => ['reported', 'en-route'].includes(i.status))
        .sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority))
        .map(incident => `
            <div class="incident-card incident-card-${incident.priority} bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-start justify-between">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="status-badge status-${incident.priority}">
                                ${getPriorityEmoji(incident.priority)} ${incident.priority.toUpperCase()}
                            </span>
                            <span class="text-sm font-medium text-gray-600">${getIncidentEmoji(incident.type)} ${incident.type.toUpperCase()}</span>
                        </div>
                        <h4 class="font-semibold text-gray-900 mt-2">${incident.location}</h4>
                        <p class="text-sm text-gray-600 mt-1">${incident.description}</p>
                        <p class="text-xs text-gray-500 mt-2">Reported: ${formatTime(incident.time)}</p>
                    </div>
                    <span class="status-badge status-${incident.status === 'en-route' ? 'medium' : 'high'}">
                        ${incident.status === 'en-route' ? '🚗 En Route' : '📍 Reported'}
                    </span>
                </div>
            </div>
        `).join('');
}

function handleCitizenReport(e) {
    e.preventDefault();
    
    const type = document.getElementById('citizenEmergencyType').value;
    const priority = document.getElementById('citizenPriority').value;
    const location = document.getElementById('citizenLocation').value;
    const description = document.getElementById('citizenDescription').value;
    const phone = document.getElementById('citizenPhone').value;
    
    if (!type || !location || !phone) {
        showError('Please fill in all required fields');
        return;
    }
    
    const newIncident = {
        id: `INC-${Math.floor(Math.random() * 10000)}`,
        type,
        location,
        priority,
        status: 'reported',
        time: new Date(),
        reporter: { name: currentUser.name, phone },
        description,
        assignedUnit: null
    };
    
    incidents.push(newIncident);
    updateHeaderInfo();
    
    showSuccess('Emergency Report Submitted', `Your report ID is: ${newIncident.id}`);
    document.getElementById('citizenReportForm').reset();
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            // In production, use reverse geocoding to get address
            document.getElementById('citizenLocation').value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            showSuccess('Location', 'GPS location captured successfully');
        }, error => {
            showError('Unable to get location: ' + error.message);
        });
    } else {
        showError('Geolocation not supported by your browser');
    }
}

function startVoiceInput() {
    showSuccess('Voice Input', 'Voice input feature would open recording interface');
}

function startMediaCapture() {
    showSuccess('Media Capture', 'Media capture interface would open (photo/video)');
}

// ===== RESPONDER DASHBOARD =====
function renderResponderDashboard() {
    renderResponderStats();
    renderResponderIncidentQueue();
    renderResponderTeamStatus();
    renderResponderResources();
    renderResponderMessages();
}

function renderResponderStats() {
    const critical = incidents.filter(i => i.priority === 'critical' && ['reported', 'assigned'].includes(i.status)).length;
    const high = incidents.filter(i => i.priority === 'high' && ['reported', 'assigned'].includes(i.status)).length;
    const medium = incidents.filter(i => i.priority === 'medium' && ['reported', 'assigned'].includes(i.status)).length;
    const low = incidents.filter(i => i.priority === 'low' && ['reported', 'assigned'].includes(i.status)).length;
    
    document.getElementById('respCriticalCount').textContent = critical;
    document.getElementById('respHighCount').textContent = high;
    document.getElementById('respMediumCount').textContent = medium;
    document.getElementById('respLowCount').textContent = low;
}

function renderResponderIncidentQueue() {
    const container = document.getElementById('responderIncidentQueue');
    if (!container) return;
    
    container.innerHTML = incidents
        .filter(i => ['reported', 'assigned'].includes(i.status))
        .sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority))
        .map(incident => `
            <div class="incident-card incident-card-${incident.priority} bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-mono font-bold text-gray-600">${incident.id}</span>
                            <span class="status-badge status-${incident.priority}">${getPriorityEmoji(incident.priority)}</span>
                        </div>
                        <h4 class="font-semibold text-gray-900 mt-1">${incident.location}</h4>
                        <p class="text-sm text-gray-600">${incident.type.toUpperCase()}</p>
                        <p class="text-xs text-gray-500 mt-1">Reported: ${formatTime(incident.time)}</p>
                    </div>
                    <button onclick="acceptIncident('${incident.id}')" class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors">
                        Accept
                    </button>
                </div>
            </div>
        `).join('');
}

function renderResponderTeamStatus() {
    const container = document.getElementById('responderTeamStatusContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="space-y-2">
            <div class="resource-status">
                <div class="resource-indicator resource-active"></div>
                <div>
                    <p class="font-semibold text-gray-900">Officer John</p>
                    <p class="text-xs text-gray-600">Available</p>
                </div>
            </div>
            <div class="resource-status">
                <div class="resource-indicator resource-busy"></div>
                <div>
                    <p class="font-semibold text-gray-900">Officer Mary</p>
                    <p class="text-xs text-gray-600">On Assignment</p>
                </div>
            </div>
            <div class="resource-status">
                <div class="resource-indicator resource-active"></div>
                <div>
                    <p class="font-semibold text-gray-900">Officer Mike</p>
                    <p class="text-xs text-gray-600">Available</p>
                </div>
            </div>
        </div>
    `;
}

function renderResponderResources() {
    const container = document.getElementById('responderResourcesContainer');
    if (!container) return;
    
    container.innerHTML = resources
        .filter(r => r.status === 'available')
        .map(resource => `
            <div class="resource-status">
                <div class="resource-indicator resource-active"></div>
                <div>
                    <p class="font-semibold text-gray-900 text-sm">${resource.id}</p>
                    <p class="text-xs text-gray-600">${resource.location}</p>
                </div>
            </div>
        `).join('');
}

function renderResponderMessages() {
    const container = document.getElementById('responderChatThread');
    if (!container) return;
    
    container.innerHTML = messages
        .map(msg => `
            <div class="message-bubble ${msg.sender === 'You' ? 'message-sent' : 'message-received'}">
                <p class="text-xs font-semibold opacity-70 mb-1">${msg.sender}</p>
                <p>${msg.text}</p>
                <p class="text-xs opacity-60 mt-1">${formatTime(msg.timestamp)}</p>
            </div>
        `).join('');
}

function updateResponderStatus(status) {
    currentUser.status = status;
    showSuccess('Status Updated', `Your status is now: ${status.toUpperCase()}`);
}

function acceptIncident(incidentId) {
    const incident = incidents.find(i => i.id === incidentId);
    if (incident) {
        incident.status = 'assigned';
        incident.assignedUnit = 'RESP-' + Math.floor(Math.random() * 1000);
        updateHeaderInfo();
        renderResponderDashboard();
        showSuccess('Incident Accepted', `You have accepted incident ${incidentId}`);
    }
}

function sendResponderMessage() {
    const input = document.getElementById('responderChatInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    messages.push({
        sender: 'You',
        text: text,
        timestamp: new Date()
    });
    
    input.value = '';
    renderResponderMessages();
    document.getElementById('responderChatThread').scrollTop = document.getElementById('responderChatThread').scrollHeight;
}

// ===== COORDINATOR DASHBOARD =====
function renderCoordinatorDashboard() {
    renderCoordinatorStats();
    renderCoordinatorHeatmap();
    renderCoordinatorResources();
    renderCoordinatorIncidentTable();
    renderCoordinatorRecentAlerts();
    renderCoordinatorCharts();
}

function renderCoordinatorStats() {
    const total = incidents.filter(i => ['reported', 'en-route', 'assigned'].includes(i.status)).length;
    const avgResponse = calculateAverageResponse();
    const activeUnits = resources.filter(r => r.status === 'busy').length;
    const capacity = Math.round((activeUnits / resources.length) * 100);
    
    document.getElementById('coordTotalIncidents').textContent = total;
    document.getElementById('coordAvgResponse').textContent = avgResponse;
    document.getElementById('coordActiveUnits').textContent = activeUnits + ' / ' + resources.length;
    document.getElementById('coordCapacityUsage').textContent = capacity + '%';
}

function renderCoordinatorHeatmap() {
    const container = document.getElementById('coordinatorHeatmap');
    if (!container) return;
    
    const regions = 20;
    const incidentDensity = new Array(regions).fill(0);
    
    incidents.forEach(incident => {
        const hash = incident.location.charCodeAt(0);
        const regionIndex = hash % regions;
        incidentDensity[regionIndex]++;
    });
    
    const maxDensity = Math.max(...incidentDensity, 1);
    
    container.innerHTML = incidentDensity.map((count, index) => {
        const intensity = count / maxDensity;
        const colors = [
            'bg-gray-100',
            'bg-yellow-100',
            'bg-orange-200',
            'bg-orange-400',
            'bg-red-500',
            'bg-red-700'
        ];
        const colorIndex = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
        const color = colors[colorIndex];
        
        return `
            <div class="heatmap-cell ${color} cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-red-500 transition-all" 
                 title="Region ${index + 1}: ${count} incidents"
                 onclick="showRegionIncidents(${index})">
            </div>
        `;
    }).join('');
}

function renderCoordinatorResources() {
    const container = document.getElementById('coordinatorResourcesOverview');
    if (!container) return;
    
    const resourceTypes = {};
    resources.forEach(r => {
        if (!resourceTypes[r.type]) resourceTypes[r.type] = { available: 0, busy: 0 };
        resourceTypes[r.type][r.status]++;
    });
    
    container.innerHTML = Object.entries(resourceTypes).map(([type, counts]) => `
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3">
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-semibold text-gray-900 capitalize">${type.replace('_', ' ')}</p>
                    <div class="flex gap-2 mt-1">
                        <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">🟢 ${counts.available} Available</span>
                        <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">🟡 ${counts.busy} Busy</span>
                    </div>
                </div>
                <p class="text-2xl font-bold text-gray-400">${counts.available + counts.busy}</p>
            </div>
        </div>
    `).join('');
}

function renderCoordinatorIncidentTable() {
    const container = document.getElementById('coordinatorIncidentTable');
    if (!container) return;
    
    container.innerHTML = incidents
        .filter(i => ['reported', 'en-route', 'assigned'].includes(i.status))
        .sort((a, b) => b.time - a.time)
        .map(incident => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4 font-mono text-sm">${incident.id}</td>
                <td class="py-3 px-4">${getIncidentEmoji(incident.type)} ${incident.type.toUpperCase()}</td>
                <td class="py-3 px-4">${incident.location}</td>
                <td class="py-3 px-4">
                    <span class="status-badge status-${incident.priority}">${getPriorityEmoji(incident.priority)} ${incident.priority}</span>
                </td>
                <td class="py-3 px-4">
                    <span class="status-badge status-${incident.status === 'reported' ? 'critical' : 'medium'}">
                        ${incident.status.toUpperCase()}
                    </span>
                </td>
                <td class="py-3 px-4">${incident.assignedUnit || 'Unassigned'}</td>
                <td class="py-3 px-4">
                    <button onclick="editIncident('${incident.id}')" class="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                        Edit
                    </button>
                </td>
            </tr>
        `).join('');
}

function renderCoordinatorRecentAlerts() {
    const container = document.getElementById('coordinatorRecentAlerts');
    if (!container) return;
    
    container.innerHTML = alerts.slice(-5).map(alert => `
        <div class="alert-broadcast ${alert.type === 'urgent' ? 'alert-urgent' : alert.type === 'warning' ? 'alert-warning' : 'alert-info'} text-sm">
            <p class="font-semibold mb-1">${alert.message}</p>
            <p class="text-xs opacity-80">${formatTime(alert.timestamp)} • ${alert.channels.join(', ')}</p>
        </div>
    `).join('') || '<p class="text-gray-500 text-sm">No recent alerts</p>';
}

function renderCoordinatorCharts() {
    // Incidents by Type Chart
    const incidentChart = document.getElementById('incidentChart');
    if (incidentChart) {
        const types = {};
        incidents.forEach(i => {
            types[i.type] = (types[i.type] || 0) + 1;
        });
        
        new Chart(incidentChart, {
            type: 'doughnut',
            data: {
                labels: Object.keys(types).map(t => t.toUpperCase()),
                datasets: [{
                    data: Object.values(types),
                    backgroundColor: [
                        '#dc2626',
                        '#ea580c',
                        '#f59e0b',
                        '#10b981',
                        '#3b82f6',
                        '#8b5cf6'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    // Response Times Chart
    const responseChart = document.getElementById('responseChart');
    if (responseChart) {
        const data = [8.2, 7.5, 9.1, 6.8, 10.2, 8.7, 9.3].map((_, i) => {
            return { label: `Day ${i + 1}`, time: 5 + Math.random() * 8 };
        });
        
        new Chart(responseChart, {
            type: 'line',
            data: {
                labels: data.map(d => d.label),
                datasets: [{
                    label: 'Avg Response Time (minutes)',
                    data: data.map(d => d.time),
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, max: 15 }
                }
            }
        });
    }
}

function handleAlertBroadcast(e) {
    e.preventDefault();
    
    const type = document.getElementById('alertType').value;
    const message = document.getElementById('alertMessage').value;
    const channels = [];
    
    if (document.getElementById('alertSMS').checked) channels.push('SMS');
    if (document.getElementById('alertWhatsApp').checked) channels.push('WhatsApp');
    if (document.getElementById('alertUSSD').checked) channels.push('USSD');
    
    if (!message || channels.length === 0) {
        showError('Please fill in all required fields');
        return;
    }
    
    alerts.push({
        type,
        message,
        channels,
        timestamp: new Date()
    });
    
    updateHeaderInfo();
    renderCoordinatorRecentAlerts();
    document.getElementById('alertBroadcastForm').reset();
    showSuccess('Alert Broadcast', 'Alert has been sent to ' + channels.join(', '));
}

function exportReport() {
    const report = {
        timestamp: new Date().toISOString(),
        totalIncidents: incidents.length,
        incidents: incidents,
        resources: resources,
        alerts: alerts
    };
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nkwalink-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showSuccess('Report Exported', 'Report has been downloaded successfully');
}

// ===== UTILITY FUNCTIONS =====
function getPriorityValue(priority) {
    const values = { critical: 4, high: 3, medium: 2, low: 1 };
    return values[priority] || 0;
}

function getPriorityEmoji(priority) {
    const emojis = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    return emojis[priority] || '❓';
}

function getIncidentEmoji(type) {
    const emojis = {
        fire: '🔥',
        medical: '🏥',
        accident: '🚗',
        crime: '🚨',
        flood: '🌊',
        other: '❓'
    };
    return emojis[type] || '❓';
}

function formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

function showSuccess(title, message) {
    const modal = document.getElementById('successModal');
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    modal.classList.remove('hidden');
    modal.classList.add('slide-in');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 3000);
}

function showError(message) {
    alert('Error: ' + message); // In production, use a proper error modal
}

function editIncident(incidentId) {
    console.log('Editing incident:', incidentId);
    showSuccess('Edit Incident', 'Edit interface would open for ' + incidentId);
}

function showRegionIncidents(regionIndex) {
    const regionIncidents = incidents.filter((_, i) => i === regionIndex % incidents.length);
    console.log('Region ' + (regionIndex + 1) + ' incidents:', regionIncidents);
}

function callHotline(number) {
    const telLink = `tel:${number}`;
    window.location.href = telLink;
    showSuccess('Calling', `Initiating call to emergency number: ${number}`);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        window.location.reload();
    }
}

// ===== OFFLINE SUPPORT =====
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
        console.log('Service Worker registration failed');
    });
}

// ===== PERIODIC UPDATES =====
setInterval(() => {
    updateHeaderInfo();
    if (currentUser?.role === 'responder') {
        renderResponderDashboard();
    } else if (currentUser?.role === 'coordinator') {
        renderCoordinatorStats();
    }
}, 10000); // Update every 10 seconds
