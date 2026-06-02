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
let currentIncidentDetailId = null;
let incidentEditMode = false;
const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:4000' : window.location.origin;
let incidentChartInstance = null;
let responseChartInstance = null;
let forecastChartInstance = null;
let gpsWatchId = null;
let pushSubscription = null;
let swRegistration = null;
let systemIntegrations = {
    dispatch: false,
    hospital: false,
    government: false,
    broadcast: false
};

let coordinatorFilters = {
    status: 'all',
    priority: 'all',
    search: ''
};

let coordinatorAssignments = {};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupEventListeners();
    switchRole('citizen');
});

function initializeDashboard() {
    updateHeaderInfo();
    populateLanguageOptions();
    monitorConnectionStatus();
    registerServiceWorker();
    refreshOfflineQueueStatus();
    checkMockServerHealth();
}

function setupEventListeners() {
    // Language selector
    document.getElementById('languageSelect')?.addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });

    // Push notifications
    document.getElementById('enablePushBtn')?.addEventListener('click', subscribeToPushNotifications);

    // GPS controls
    document.getElementById('startGpsTrackingBtn')?.addEventListener('click', startResponderLocationTracking);
    document.getElementById('stopGpsTrackingBtn')?.addEventListener('click', stopResponderLocationTracking);

    // Network status
    window.addEventListener('online', () => {
        setConnectionIndicator(true);
        syncOfflineReportsIfOnline();
        showToast('Connection restored. Syncing offline reports...', 'success');
    });

    window.addEventListener('offline', () => {
        setConnectionIndicator(false);
        showToast('You are offline. Reports will be queued locally.', 'warning');
    });

    // User menu
    document.getElementById('userMenuBtn')?.addEventListener('click', showUserMenu);
    document.addEventListener('click', (event) => {
        const menu = document.querySelector('.user-menu');
        const button = document.getElementById('userMenuBtn');
        if (menu && button && !button.contains(event.target) && !menu.contains(event.target)) {
            menu.remove();
        }
    });

    // Citizen role events
    document.getElementById('citizenReportForm')?.addEventListener('submit', handleCitizenReport);
    document.getElementById('useGPSBtn')?.addEventListener('click', getUserLocation);
    document.getElementById('citizenVoiceBtn')?.addEventListener('click', startVoiceInput);
    document.getElementById('citizenMediaBtn')?.addEventListener('click', startMediaCapture);

    // Responder role events
    document.getElementById('responderStatusSelect')?.addEventListener('change', (e) => updateResponderStatus(e.target.value));
    document.getElementById('responderSendChat')?.addEventListener('click', sendResponderMessage);
    document.getElementById('responderRefreshTable')?.addEventListener('click', () => {
        renderResponderDashboard();
        showToast('Responder queue refreshed', 'success');
    });

    // Coordinator role events
    document.getElementById('alertBroadcastForm')?.addEventListener('submit', handleAlertBroadcast);
    document.getElementById('exportReportBtn')?.addEventListener('click', exportReport);
    document.getElementById('refreshAnalytics')?.addEventListener('click', () => {
        renderCoordinatorDashboard();
        showToast('Analytics refreshed', 'success');
    });
    document.getElementById('coordinatorStatusFilter')?.addEventListener('change', (e) => {
        coordinatorFilters.status = e.target.value;
        renderCoordinatorIncidentTable();
    });
    document.getElementById('coordinatorPriorityFilter')?.addEventListener('change', (e) => {
        coordinatorFilters.priority = e.target.value;
        renderCoordinatorIncidentTable();
    });
    document.getElementById('coordinatorSearchFilter')?.addEventListener('input', (e) => {
        coordinatorFilters.search = e.target.value.trim();
        renderCoordinatorIncidentTable();
    });
    document.getElementById('coordinatorClearFilters')?.addEventListener('click', (e) => {
        e.preventDefault();
        coordinatorFilters = { status: 'all', priority: 'all', search: '' };
        document.getElementById('coordinatorStatusFilter').value = 'all';
        document.getElementById('coordinatorPriorityFilter').value = 'all';
        document.getElementById('coordinatorSearchFilter').value = '';
        renderCoordinatorIncidentTable();
    });
    document.getElementById('coordinatorBulkAssign')?.addEventListener('click', (e) => {
        e.preventDefault();
        bulkAssignIncidents();
    });

    // Modal close buttons
    document.getElementById('closeSuccessBtn')?.addEventListener('click', () => {
        document.getElementById('successModal').classList.add('hidden');
    });
    document.getElementById('closeIncidentDetailBtn')?.addEventListener('click', closeIncidentDetailModal);
    document.getElementById('incidentDetailClose')?.addEventListener('click', closeIncidentDetailModal);
    document.getElementById('incidentDetailAssign')?.addEventListener('click', () => {
        if (currentIncidentDetailId) {
            assignIncidentToService(currentIncidentDetailId);
            closeIncidentDetailModal();
        }
    });
    document.getElementById('incidentDetailResolve')?.addEventListener('click', () => {
        if (currentIncidentDetailId) {
            resolveIncident(currentIncidentDetailId);
            closeIncidentDetailModal();
        }
    });
    document.getElementById('incidentDetailEdit')?.addEventListener('click', () => {
        if (currentIncidentDetailId) {
            showIncidentDetails(currentIncidentDetailId, true);
        }
    });
    document.getElementById('incidentDetailSave')?.addEventListener('click', () => {
        if (currentIncidentDetailId) {
            saveIncidentChanges(currentIncidentDetailId);
        }
    });

    const incidentModal = document.getElementById('incidentDetailModal');
    incidentModal?.addEventListener('click', event => {
        if (event.target === incidentModal) {
            closeIncidentDetailModal();
        }
    });

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeIncidentDetailModal();
        }
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
    
    renderRoleHint(role);
    showToast(`Switched to ${role.charAt(0).toUpperCase() + role.slice(1)} mode`, 'success');

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

function renderRoleHint(role) {
    const hint = document.getElementById('roleHint');
    if (!hint) return;

    const messages = {
        citizen: {
            title: 'Citizen Mode',
            description: 'Report an emergency quickly, share your location, and stay updated with alerts in your area.'
        },
        responder: {
            title: 'Responder Mode',
            description: 'Review active incidents, update your status, chat with command, and accept your next assignment.'
        },
        coordinator: {
            title: 'Coordinator Mode',
            description: 'Monitor active incidents, assign units, connect integrations, and broadcast alerts to the public.'
        }
    };

    const selected = messages[role] || messages.citizen;
    hint.innerHTML = `
        <p class="font-semibold text-gray-900">${selected.title}</p>
        <p class="mt-1 text-sm text-gray-600">${selected.description}</p>
    `;
}

// ===== CITIZEN DASHBOARD =====
function renderCitizenDashboard() {
    renderRoleHint('citizen');
}

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
        id: `INC-${Math.floor(Math.random() * 100000)}`,
        type,
        location,
        priority,
        status: 'reported',
        time: new Date(),
        reporter: { name: currentUser.name, phone },
        description,
        assignedUnit: null,
        offline: !navigator.onLine
    };

    incidents.push(newIncident);
    updateHeaderInfo();
    renderDashboard('citizen');

    const finalizeReport = (message, isOffline = false) => {
        if (isOffline) {
            showSuccess('Offline Report Queued', message);
        } else {
            showSuccess('Emergency Report Submitted', message);
        }
    };

    if (!navigator.onLine) {
        savePendingReport(newIncident)
            .then(() => enqueueReportSync())
            .catch(() => console.warn('Could not queue report for later sync'));
        finalizeReport(`Report ${newIncident.id} will sync when online`, true);
    } else {
        submitReportToServer(newIncident)
            .then(() => {
                finalizeReport(`Your report ID is: ${newIncident.id}`);
            })
            .catch(async error => {
                console.warn('Report submission failed:', error);
                await savePendingReport(newIncident);
                enqueueReportSync();
                finalizeReport(`Report ${newIncident.id} will sync when connection is stable`, true);
            });
    }

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
    renderRoleHint('responder');
}

function renderResponderStats() {
    const critical = incidents.filter(i => i.priority === 'critical' && ['reported', 'assigned'].includes(i.status)).length;
    const high = incidents.filter(i => i.priority === 'high' && ['reported', 'assigned'].includes(i.status)).length;
    const medium = incidents.filter(i => i.priority === 'medium' && ['reported', 'assigned'].includes(i.status)).length;
    const low = incidents.filter(i => i.priority === 'low' && ['reported', 'assigned'].includes(i.status)).length;
    const dispatched = resources.filter(r => r.status === 'busy').length;
    const available = resources.filter(r => r.status === 'available').length;
    const offline = resources.filter(r => r.status === 'offline').length;

    document.getElementById('respCriticalCount').textContent = critical;
    document.getElementById('respHighCount').textContent = high;
    document.getElementById('respMediumCount').textContent = medium;
    document.getElementById('respLowCount').textContent = low;
    document.getElementById('unitDispatched')?.textContent = dispatched;
    document.getElementById('unitBusy')?.textContent = dispatched;
    document.getElementById('unitAvailable')?.textContent = available;
    document.getElementById('unitOffline')?.textContent = offline;
    document.getElementById('respTeamName')?.textContent = currentUser.team || 'Central Response';
    document.getElementById('respLocationName')?.textContent = currentUser.location ? 'Current Area' : 'Not tracked';
}

function renderResponderIncidentQueue() {
    const container = document.getElementById('responderIncidentQueue');
    if (!container) return;

    const queue = incidents
        .filter(i => ['reported', 'assigned'].includes(i.status))
        .sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));

    if (queue.length === 0) {
        container.innerHTML = '<div class="rounded-3xl border border-dashed border-gray-300 p-6 text-center text-gray-500">No active incidents in the queue. Await new reports or refresh the incident feed.</div>';
        return;
    }

    container.innerHTML = queue.map(incident => {
        const alreadyAssigned = !!incident.assignedUnit;
        return `
            <div onclick="showIncidentDetails('${incident.id}')" class="incident-card incident-card-${incident.priority} bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-sm font-mono font-bold text-gray-600">${incident.id}</span>
                            <span class="status-badge status-${incident.priority}">${getPriorityEmoji(incident.priority)} ${incident.priority.toUpperCase()}</span>
                        </div>
                        <h4 class="font-semibold text-gray-900 mt-2">${incident.location}</h4>
                        <p class="text-sm text-gray-600">${incident.type.toUpperCase()} • ${alreadyAssigned ? 'Assigned to ' + incident.assignedUnit : 'Awaiting assignment'}</p>
                        <p class="text-xs text-gray-500 mt-1">Reported: ${formatTime(incident.time)}</p>
                    </div>
                    <button onclick="event.stopPropagation(); acceptIncident('${incident.id}')" class="px-4 py-2 ${alreadyAssigned ? 'bg-slate-300 text-slate-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'} rounded-lg text-sm font-semibold transition-colors" ${alreadyAssigned ? 'disabled' : ''}>
                        ${alreadyAssigned ? 'Assigned' : 'Accept'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderResponderTeamStatus() {
    const container = document.getElementById('responderTeamStatusContainer');
    if (!container) return;

    const teamResources = resources.slice(0, 5);
    if (teamResources.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">No team resource data available.</p>';
        return;
    }

    container.innerHTML = teamResources.map(resource => `
        <div class="resource-status">
            <div class="resource-indicator ${resource.status === 'available' ? 'resource-active' : resource.status === 'busy' ? 'resource-busy' : 'resource-offline'}"></div>
            <div>
                <p class="font-semibold text-gray-900">${resource.id}</p>
                <p class="text-xs text-gray-600">${resource.status === 'available' ? 'Available' : resource.status === 'busy' ? 'On Assignment' : 'Offline'}</p>
            </div>
        </div>
    `).join('');
}

function renderResponderResources() {
    const container = document.getElementById('responderResourcesContainer');
    if (!container) return;

    container.innerHTML = resources.map(resource => `
        <div class="resource-status">
            <div class="resource-indicator ${resource.status === 'available' ? 'resource-active' : resource.status === 'busy' ? 'resource-busy' : 'resource-offline'}"></div>
            <div>
                <p class="font-semibold text-gray-900 text-sm">${resource.id}</p>
                <p class="text-xs text-gray-600">${resource.location} • ${resource.status.toUpperCase()}</p>
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
    if (!incident) return;

    const unit = selectAvailableResourceForIncident(incident.type);
    if (!unit) {
        showError('No available units can be assigned at this time.');
        return;
    }

    incident.status = 'assigned';
    incident.assignedUnit = unit.id;
    markResourceStatus(unit.id, 'busy');
    updateHeaderInfo();
    renderResponderDashboard();
    renderCoordinatorDashboard();
    showSuccess('Incident Accepted', `Incident ${incidentId} assigned to ${unit.id}`);
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
    renderCoordinatorIntegrationStatus();
    renderCoordinatorHeatmap();
    renderCoordinatorResources();
    renderCoordinatorFilters();
    renderCoordinatorIncidentTable();
    renderCoordinatorCharts();
    renderCoordinatorAIPanels();
    renderRoleHint('coordinator');
}

function renderCoordinatorIntegrationStatus() {
    document.getElementById('dispatchIntegrationStatus').textContent = systemIntegrations.dispatch ? 'Connected' : 'Disconnected';
    document.getElementById('hospitalIntegrationStatus').textContent = systemIntegrations.hospital ? 'Connected' : 'Disconnected';
    document.getElementById('governmentIntegrationStatus').textContent = systemIntegrations.government ? 'Connected' : 'Disconnected';
    document.getElementById('broadcastSystemStatus').textContent = systemIntegrations.broadcast ? 'Online' : 'Offline';
}

function connectDispatchIntegration() {
    attemptIntegration('dispatch')
        .then(() => {
            systemIntegrations.dispatch = true;
            renderCoordinatorIntegrationStatus();
            showSuccess('Dispatch Connected', 'Emergency dispatch integration is now active.');
        })
        .catch(err => {
            showError('Dispatch integration failed: ' + err.message);
        });
}

function connectHospitalIntegration() {
    attemptIntegration('hospital')
        .then(() => {
            systemIntegrations.hospital = true;
            renderCoordinatorIntegrationStatus();
            showSuccess('Hospital Connected', 'Hospital system integration is now active.');
        })
        .catch(err => {
            showError('Hospital integration failed: ' + err.message);
        });
}

function connectGovernmentIntegration() {
    attemptIntegration('government')
        .then(() => {
            systemIntegrations.government = true;
            renderCoordinatorIntegrationStatus();
            showSuccess('Government DB Connected', 'Government database connection is now active.');
        })
        .catch(err => {
            showError('Government integration failed: ' + err.message);
        });
}

function connectBroadcastSystem() {
    attemptIntegration('broadcast')
        .then(() => {
            systemIntegrations.broadcast = true;
            renderCoordinatorIntegrationStatus();
            showSuccess('Broadcast Activated', 'National emergency broadcast system is now online.');
        })
        .catch(err => {
            showError('Broadcast activation failed: ' + err.message);
        });
}

async function attemptIntegration(type, retries = 3) {
    const url = `${API_BASE_URL}/api/integrations/${type}/connect`;
    let attempt = 0;
    const maxDelay = 2000;

    while (attempt < retries) {
        attempt += 1;
        try {
            // update UI
            const statusEl = document.getElementById(`${type}IntegrationStatus`);
            if (statusEl) statusEl.textContent = `Connecting... (${attempt}/${retries})`;

            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timestamp: Date.now() }) });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            return data;
        } catch (err) {
            if (attempt >= retries) {
                // final failure
                const statusEl = document.getElementById(`${type}IntegrationStatus`);
                if (statusEl) statusEl.textContent = 'Disconnected';
                showToast(`${type.toUpperCase()} connection failed after ${attempt} attempts.`, 'error');
                throw err;
            } else {
                const statusEl = document.getElementById(`${type}IntegrationStatus`);
                if (statusEl) statusEl.textContent = `Retrying... (${attempt}/${retries})`;
            }
            // backoff
            const delay = Math.min(maxDelay, 300 * Math.pow(2, attempt));
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

function assignIncidentToService(incidentId, unitId, suppressToast = false) {
    const incident = incidents.find(i => i.id === incidentId);
    if (!incident) return;

    const route = getServiceRoute(incident.type);
    const chosenUnit = unitId || incident.assignedUnit || route.unit;
    const previousUnit = incident.assignedUnit;

    incident.assignedUnit = chosenUnit;
    if (incident.status !== 'resolved') {
        incident.status = route.status;
    }

    if (chosenUnit) {
        markResourceStatus(chosenUnit, 'busy');
    }

    if (previousUnit && previousUnit !== chosenUnit) {
        markResourceStatus(previousUnit, 'available');
    }

    delete coordinatorAssignments[incidentId];
    updateHeaderInfo();
    renderCoordinatorDashboard();
    renderResponderDashboard();
    if (!suppressToast) {
        showSuccess('Incident Routed', `Incident ${incidentId} assigned to ${chosenUnit}.`);
    }
}

function bulkAssignIncidents() {
    const unassignedIncidents = getFilteredCoordinatorIncidents().filter(i => !i.assignedUnit && i.status !== 'resolved');
    if (unassignedIncidents.length === 0) {
        showError('There are no unassigned active incidents in the current view to bulk assign.');
        return;
    }

    let assignedCount = 0;
    let noResourceCount = 0;

    unassignedIncidents.forEach(incident => {
        const available = selectAvailableResourceForIncident(incident.type);
        if (available) {
            assignIncidentToService(incident.id, available.id, true);
            assignedCount += 1;
        } else {
            noResourceCount += 1;
        }
    });

    if (assignedCount > 0) {
        showSuccess('Bulk Assign Complete', `${assignedCount} incident${assignedCount === 1 ? '' : 's'} assigned.`);
    }
    if (noResourceCount > 0) {
        showToast(`${noResourceCount} incident${noResourceCount === 1 ? '' : 's'} could not be assigned due to limited available resources.`, 'warning');
    }
}

function setCoordinatorAssignment(incidentId, unitId) {
    if (!incidentId) return;
    if (unitId === '') {
        delete coordinatorAssignments[incidentId];
    } else {
        coordinatorAssignments[incidentId] = unitId;
    }
}

function getServiceRoute(type) {
    switch (type) {
        case 'fire':
            return { unit: 'FIR-001', label: 'Fire Service', status: 'assigned' };
        case 'medical':
            return { unit: 'AMB-001', label: 'Ambulance Service', status: 'assigned' };
        case 'crime':
            return { unit: 'POL-001', label: 'Police Service', status: 'assigned' };
        case 'flood':
            return { unit: 'NADMO-001', label: 'NADMO Disaster Response', status: 'assigned' };
        default:
            return { unit: 'COORD-001', label: 'Coordinator Review', status: 'assigned' };
    }
}

function selectAvailableResourceForIncident(type) {
    const preferred = type === 'fire' ? 'fire_truck' : type === 'medical' ? 'ambulance' : type === 'crime' ? 'police_unit' : undefined;
    let unit = resources.find(r => r.status === 'available' && (!preferred || r.type === preferred));
    if (!unit) {
        unit = resources.find(r => r.status === 'available');
    }
    return unit || null;
}

function markResourceStatus(unitId, status) {
    const resource = resources.find(r => r.id === unitId);
    if (!resource) return;
    resource.status = status;
    if (currentUser?.role === 'responder') renderResponderResources();
    if (currentUser?.role === 'coordinator') renderCoordinatorResources();
}

async function submitReportToServer(report) {
    const url = `${API_BASE_URL}/api/reports`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
    });
    if (!response.ok) {
        throw new Error(`Report submission failed: ${response.status}`);
    }
    return response.json();
}

function renderCoordinatorStats() {
    const total = incidents.filter(i => ['reported', 'en-route', 'assigned'].includes(i.status)).length;
    const avgResponse = calculateAverageResponse();
    const busyUnits = resources.filter(r => r.status === 'busy').length;
    const availableUnits = resources.filter(r => r.status === 'available').length;
    const pendingAssignments = incidents.filter(i => !i.assignedUnit && i.status !== 'resolved').length;
    const capacity = Math.min(100, Math.round((busyUnits / Math.max(resources.length, 1)) * 100));
    
    document.getElementById('coordTotalIncidents').textContent = total;
    document.getElementById('coordAvgResponse').textContent = avgResponse;
    document.getElementById('coordActiveUnits').textContent = availableUnits + ' / ' + resources.length;
    document.getElementById('coordCapacityUsage').textContent = capacity + '%';
    document.getElementById('coordPendingAssignments')?.textContent = pendingAssignments;
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

function getFilteredCoordinatorIncidents() {
    return incidents
        .filter(i => coordinatorFilters.status === 'all' || i.status === coordinatorFilters.status)
        .filter(i => coordinatorFilters.priority === 'all' || i.priority === coordinatorFilters.priority)
        .filter(i => {
            if (!coordinatorFilters.search) return true;
            const search = coordinatorFilters.search.toLowerCase();
            return i.id.toLowerCase().includes(search) ||
                i.location.toLowerCase().includes(search) ||
                i.type.toLowerCase().includes(search) ||
                i.description.toLowerCase().includes(search) ||
                i.reporter.name.toLowerCase().includes(search);
        })
        .sort((a, b) => b.time - a.time);
}

function renderCoordinatorIncidentTable() {
    const container = document.getElementById('coordinatorIncidentTable');
    if (!container) return;

    const filteredIncidents = getFilteredCoordinatorIncidents();

    const filteredUnassigned = filteredIncidents.filter(i => !i.assignedUnit && i.status !== 'resolved').length;
    const summaryEl = document.getElementById('coordinatorFilterSummary');
    if (summaryEl) {
        const total = incidents.length;
        const filtered = filteredIncidents.length;
        const filtersActive = coordinatorFilters.status !== 'all' || coordinatorFilters.priority !== 'all' || coordinatorFilters.search !== '';
        summaryEl.textContent = filtersActive
            ? `Showing ${filtered} of ${total} incidents matching filter criteria. ${filteredUnassigned} are unassigned.`
            : `Showing all ${total} incidents. ${filteredUnassigned} remain unassigned.`;
    }

    const tableRows = filteredIncidents.map(incident => {
        const availableUnits = resources
            .filter(r => r.status === 'available' || r.id === incident.assignedUnit)
            .map(r => `<option value="${r.id}" ${incident.assignedUnit === r.id ? 'selected' : ''}>${r.id} (${r.type.replace('_', ' ')})</option>`)
            .join('');

        const selectedUnit = coordinatorAssignments[incident.id] || incident.assignedUnit || '';
        const isAssignable = selectedUnit || availableUnits.length > 0;
        const assignLabel = selectedUnit ? 'Assign' : 'Auto Assign';

        const quickAssign = `<div class="flex gap-2 items-center">
                <select onchange="setCoordinatorAssignment('${incident.id}', this.value)" class="p-2 border border-gray-300 rounded-lg text-xs">
                    <option value="">Select unit</option>
                    ${availableUnits}
                </select>
                <button onclick="event.stopPropagation(); assignIncidentToService('${incident.id}', coordinatorAssignments['${incident.id}'])" class="text-xs px-2 py-1 ${isAssignable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} rounded transition-colors" ${isAssignable ? '' : 'disabled'}>
                    ${assignLabel}
                </button>
            </div>`;

        return `
            <tr class="hover:bg-gray-50 transition-colors cursor-pointer" onclick="showIncidentDetails('${incident.id}')">
                <td class="py-3 px-4 font-mono text-sm">${incident.id}</td>
                <td class="py-3 px-4">${getIncidentEmoji(incident.type)} ${incident.type.toUpperCase()}</td>
                <td class="py-3 px-4">${incident.location}</td>
                <td class="py-3 px-4">
                    <span class="status-badge status-${incident.priority}">${getPriorityEmoji(incident.priority)} ${incident.priority}</span>
                </td>
                <td class="py-3 px-4">
                    <span class="status-badge status-${incident.status === 'reported' ? 'critical' : incident.status === 'en-route' ? 'medium' : incident.status === 'assigned' ? 'low' : 'high'}">
                        ${incident.status.toUpperCase()}
                    </span>
                </td>
                <td class="py-3 px-4">${incident.assignedUnit || 'Unassigned'}</td>
                <td class="py-3 px-4 space-y-2">
                    ${quickAssign}
                    <button onclick="event.stopPropagation(); editIncident('${incident.id}')" class="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                        Edit
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = tableRows || '<tr><td colspan="7" class="py-6 px-4 text-center text-gray-500">No incidents match the filters. Adjust status, priority, or search terms.</td></tr>';

    const summaryEl = document.getElementById('coordinatorFilterSummary');
    if (summaryEl) {
        const total = incidents.length;
        const filtered = filteredIncidents.length;
        const filtersActive = coordinatorFilters.status !== 'all' || coordinatorFilters.priority !== 'all' || coordinatorFilters.search !== '';
        summaryEl.textContent = filtersActive
            ? `Showing ${filtered} of ${total} incidents matching the selected filters.`
            : `Showing all ${total} incidents.`;
    }
}

function renderCoordinatorCharts() {
    const types = {};
    incidents.forEach(i => {
        types[i.type] = (types[i.type] || 0) + 1;
    });

    const typeLabels = Object.keys(types).map(t => t.toUpperCase());
    const typeData = Object.values(types);
    const incidentElement = document.getElementById('incidentChart');

    if (incidentElement) {
        if (incidentChartInstance) {
            incidentChartInstance.data.labels = typeLabels;
            incidentChartInstance.data.datasets[0].data = typeData;
            incidentChartInstance.update();
        } else {
            incidentChartInstance = new Chart(incidentElement, {
                type: 'doughnut',
                data: {
                    labels: typeLabels,
                    datasets: [{
                        data: typeData,
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
    }
    
    const responseData = [8.2, 7.5, 9.1, 6.8, 10.2, 8.7, 9.3].map((_, i) => ({
        label: `Day ${i + 1}`,
        time: 5 + Math.random() * 8
    }));
    const responseElement = document.getElementById('responseChart');

    if (responseElement) {
        if (responseChartInstance) {
            responseChartInstance.data.labels = responseData.map(d => d.label);
            responseChartInstance.data.datasets[0].data = responseData.map(d => d.time);
            responseChartInstance.update();
        } else {
            responseChartInstance = new Chart(responseElement, {
                type: 'line',
                data: {
                    labels: responseData.map(d => d.label),
                    datasets: [{
                        label: 'Avg Response Time (minutes)',
                        data: responseData.map(d => d.time),
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

    renderCoordinatorForecastChart();
}

function renderCoordinatorForecastChart() {
    const forecastData = getPredictedIncidentDemand(7);
    const canvas = document.getElementById('forecastChart');
    if (!canvas) return;

    if (forecastChartInstance) {
        forecastChartInstance.data.labels = forecastData.map(item => item.day);
        forecastChartInstance.data.datasets[0].data = forecastData.map(item => item.value);
        forecastChartInstance.update();
        return;
    }

    forecastChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: forecastData.map(item => item.day),
            datasets: [{
                label: 'Predicted Incident Volume',
                data: forecastData.map(item => item.value),
                backgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, max: Math.max(...forecastData.map(item => item.value)) + 2 }
            }
        }
    });
}

function renderCoordinatorFilters() {
    const statusControl = document.getElementById('coordinatorStatusFilter');
    const priorityControl = document.getElementById('coordinatorPriorityFilter');
    const searchControl = document.getElementById('coordinatorSearchFilter');

    if (statusControl) statusControl.value = coordinatorFilters.status;
    if (priorityControl) priorityControl.value = coordinatorFilters.priority;
    if (searchControl) searchControl.value = coordinatorFilters.search;
}

function renderCoordinatorAIPanels() {
    const latest = incidents[incidents.length - 1];
    const aiContainer = document.getElementById('aiIncidentClassifier');
    const allocationContainer = document.getElementById('aiAllocationInsight');

    if (latest && aiContainer) {
        const prediction = classifyIncident(latest.description || latest.type);
        aiContainer.innerHTML = `
            <p><strong>Incident:</strong> ${latest.id}</p>
            <p><strong>Suggested Type:</strong> ${prediction.type.toUpperCase()} (${prediction.confidence}%)</p>
            <p><strong>Tags:</strong> ${prediction.tags.join(', ') || 'review'}</p>
        `;
    }

    if (allocationContainer && latest) {
        const recommendation = recommendResourceAllocation(latest);
        allocationContainer.innerHTML = `
            <p><strong>Primary Unit:</strong> ${recommendation.unit}</p>
            <p><strong>Reason:</strong> ${recommendation.reason}</p>
        `;
    }
}

function getPredictedIncidentDemand(days) {
    const counts = incidents.reduce((map, incident) => {
        map[incident.type] = (map[incident.type] || 0) + 1;
        return map;
    }, {});

    const totalIncidents = incidents.length || 1;
    const base = Math.max(2, Math.round(totalIncidents / 3));
    const demand = [];

    for (let i = 1; i <= days; i++) {
        const trend = base + Math.round(Math.sin(i / 2) * 2) + Math.floor(Math.random() * 3);
        demand.push({
            day: `Day ${i}`,
            value: Math.max(1, trend)
        });
    }

    return demand;
}

function classifyIncident(text) {
    const lower = text.toLowerCase();
    const mapping = [
        { type: 'fire', keywords: ['fire', 'smoke', 'flames', 'burn'] },
        { type: 'medical', keywords: ['injury', 'medical', 'unconscious', 'bleeding', 'medical'] },
        { type: 'accident', keywords: ['accident', 'collision', 'crash', 'vehicle'] },
        { type: 'crime', keywords: ['robbery', 'theft', 'assault', 'shooting'] },
        { type: 'flood', keywords: ['flood', 'water', 'river', 'storm'] }
    ];

    let best = { type: 'other', score: 0, tags: [] };

    mapping.forEach(item => {
        let score = 0;
        item.keywords.forEach(keyword => {
            if (lower.includes(keyword)) {
                score += 1;
                best.tags.push(keyword);
            }
        });
        if (score > best.score) {
            best = { type: item.type, score, tags: item.keywords.filter(keyword => lower.includes(keyword)) };
        }
    });

    if (best.score === 0) {
        return { type: 'other', confidence: 65, tags: ['review'] };
    }

    return { type: best.type, confidence: Math.min(95, 65 + best.score * 10), tags: best.tags };
}

function recommendResourceAllocation(incident) {
    const route = getServiceRoute(incident.type);
    return {
        unit: route.unit,
        reason: `Selected based on incident type ${incident.type.toUpperCase()} and severity ${incident.priority.toUpperCase()}`
    };
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
    showToast(message, 'error');
}

function showToast(message, type = 'info', duration = 4000) {
    const toast = document.getElementById('notificationToast');
    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;
    toast.className = `fixed bottom-6 right-6 z-50 max-w-sm rounded-xl p-4 text-sm font-medium shadow-xl ring-1 ring-black/10 ${type === 'error' ? 'bg-red-600 text-white' : type === 'warning' ? 'bg-orange-500 text-white' : 'bg-green-600 text-white'}`;
    toast.classList.remove('hidden');

    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

function showIncidentDetails(incidentId, editable = false) {
    const incident = incidents.find(i => i.id === incidentId);
    if (!incident) return;

    currentIncidentDetailId = incidentId;
    incidentEditMode = editable && currentUser.role === 'coordinator';
    const content = document.getElementById('incidentDetailContent');
    const title = document.getElementById('incidentDetailTitle');
    const subtitle = document.getElementById('incidentDetailSubtitle');

    if (!content || !title || !subtitle) return;

    title.textContent = `${incident.id} • ${incident.location}`;
    subtitle.textContent = `${incident.type.toUpperCase()} • ${incident.priority.toUpperCase()} • ${incident.status.toUpperCase()}`;

    if (incidentEditMode) {
        const resourceOptions = resources
            .filter(r => r.status === 'available' || r.id === incident.assignedUnit)
            .map(r => `<option value="${r.id}" ${incident.assignedUnit === r.id ? 'selected' : ''}>${r.id} (${r.type.replace('_', ' ')})</option>`)
            .join('');

        content.innerHTML = `
            <form id="incidentDetailEditForm" class="space-y-4">
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="rounded-2xl bg-gray-50 p-4">
                        <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Reporter</p>
                        <p class="mt-2 text-sm text-gray-900">${incident.reporter.name}</p>
                        <p class="text-xs text-gray-500">${incident.reporter.phone}</p>
                        <p class="text-xs text-gray-500 mt-3">Submitted ${formatTime(incident.time)}</p>
                    </div>
                    <div class="rounded-2xl bg-gray-50 p-4 space-y-3">
                        <div>
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Status</label>
                            <select id="incidentDetailStatus" class="w-full p-3 border border-gray-300 rounded-lg">
                                <option value="reported" ${incident.status === 'reported' ? 'selected' : ''}>Reported</option>
                                <option value="en-route" ${incident.status === 'en-route' ? 'selected' : ''}>En Route</option>
                                <option value="assigned" ${incident.status === 'assigned' ? 'selected' : ''}>Assigned</option>
                                <option value="resolved" ${incident.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Priority</label>
                            <select id="incidentDetailPriority" class="w-full p-3 border border-gray-300 rounded-lg">
                                <option value="critical" ${incident.priority === 'critical' ? 'selected' : ''}>Critical</option>
                                <option value="high" ${incident.priority === 'high' ? 'selected' : ''}>High</option>
                                <option value="medium" ${incident.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="low" ${incident.priority === 'low' ? 'selected' : ''}>Low</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Assigned Unit</label>
                            <select id="incidentDetailAssignedUnit" class="w-full p-3 border border-gray-300 rounded-lg">
                                <option value="">Unassigned</option>
                                ${resourceOptions}
                            </select>
                        </div>
                    </div>
                </div>
                <div class="rounded-2xl bg-gray-50 p-4">
                    <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Location</label>
                    <input id="incidentDetailLocation" class="w-full p-3 border border-gray-300 rounded-lg" value="${incident.location}">
                </div>
                <div class="rounded-2xl bg-gray-50 p-4">
                    <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Description</label>
                    <textarea id="incidentDetailDescription" rows="4" class="w-full p-3 border border-gray-300 rounded-lg">${incident.description}</textarea>
                </div>
            </form>
        `;
    } else {
        content.innerHTML = `
            <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-2xl bg-gray-50 p-4">
                    <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Reporter</p>
                    <p class="mt-2 text-sm text-gray-900">${incident.reporter.name}</p>
                    <p class="text-xs text-gray-500">${incident.reporter.phone}</p>
                    <p class="text-xs text-gray-500 mt-3">Submitted ${formatTime(incident.time)}</p>
                </div>
                <div class="rounded-2xl bg-gray-50 p-4">
                    <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Assigned Unit</p>
                    <p class="mt-2 text-sm text-gray-900">${incident.assignedUnit || 'Unassigned'}</p>
                    <p class="text-xs text-gray-500 mt-3">Status: ${incident.status}</p>
                </div>
            </div>
            <div class="rounded-2xl bg-gray-50 p-4">
                <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Description</p>
                <p class="mt-2 text-sm text-gray-700">${incident.description}</p>
            </div>
            <div class="rounded-2xl bg-gray-50 p-4">
                <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Recommended Response</p>
                <p class="mt-2 text-sm text-gray-700">${recommendResourceAllocation(incident).reason}</p>
            </div>
        `;
    }

    document.getElementById('incidentDetailModal')?.classList.remove('hidden');
    toggleIncidentDetailButtons(incidentEditMode);
}

function closeIncidentDetailModal() {
    currentIncidentDetailId = null;
    incidentEditMode = false;
    document.getElementById('incidentDetailModal')?.classList.add('hidden');
}

function toggleIncidentDetailButtons(editMode) {
    document.getElementById('incidentDetailAssign')?.classList.toggle('hidden', editMode);
    document.getElementById('incidentDetailResolve')?.classList.toggle('hidden', editMode);
    document.getElementById('incidentDetailEdit')?.classList.toggle('hidden', editMode || currentUser.role !== 'coordinator');
    document.getElementById('incidentDetailSave')?.classList.toggle('hidden', !editMode);
}

function saveIncidentChanges(incidentId) {
    const incident = incidents.find(i => i.id === incidentId);
    if (!incident) return;

    const status = document.getElementById('incidentDetailStatus')?.value;
    const priority = document.getElementById('incidentDetailPriority')?.value;
    const assignedUnit = document.getElementById('incidentDetailAssignedUnit')?.value || null;
    const location = document.getElementById('incidentDetailLocation')?.value;
    const description = document.getElementById('incidentDetailDescription')?.value;

    if (!status || !priority || !location) {
        showError('Status, priority, and location are required.');
        return;
    }

    const previousUnit = incident.assignedUnit;
    incident.status = status;
    incident.priority = priority;
    incident.location = location;
    incident.description = description;
    incident.assignedUnit = assignedUnit;

    if (assignedUnit && assignedUnit !== previousUnit) {
        markResourceStatus(assignedUnit, 'busy');
    }
    if (previousUnit && previousUnit !== assignedUnit) {
        markResourceStatus(previousUnit, 'available');
    }

    incidentEditMode = false;
    updateHeaderInfo();
    renderCoordinatorDashboard();
    renderResponderDashboard();
    showSuccess('Incident Updated', `Incident ${incidentId} has been updated.`);
    showIncidentDetails(incidentId, false);
}

function resolveIncident(incidentId) {
    const incident = incidents.find(i => i.id === incidentId);
    if (!incident) return;
    incident.status = 'resolved';
    incident.resolvedTime = new Date();
    if (incident.assignedUnit) {
        markResourceStatus(incident.assignedUnit, 'available');
    }
    updateHeaderInfo();
    if (currentUser.role === 'responder') renderResponderDashboard();
    if (currentUser.role === 'coordinator') renderCoordinatorDashboard();
    showToast(`Incident ${incidentId} marked as resolved.`, 'success');
}

function editIncident(incidentId) {
    showIncidentDetails(incidentId, true);
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

function monitorConnectionStatus() {
    setConnectionIndicator(navigator.onLine);
    if (navigator.onLine) {
        checkMockServerHealth();
    } else {
        setMockApiIndicator('Offline', false);
    }
}

async function checkMockServerHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`, { cache: 'no-store' });
        const status = response.ok ? 'Healthy' : 'Degraded';
        setMockApiIndicator(status, response.ok);
    } catch (error) {
        setMockApiIndicator('Unavailable', false);
    }
}

function setMockApiIndicator(label, healthy) {
    const statusEl = document.getElementById('mockApiStatus');
    if (!statusEl) return;
    statusEl.textContent = label;
    statusEl.className = `px-2 py-1 rounded-full text-xs ${healthy ? 'bg-green-500' : 'bg-gray-500'}`;
}

async function getPendingReportCount() {
    try {
        const db = await openDb();
        const tx = db.transaction('pendingReports', 'readonly');
        const store = tx.objectStore('pendingReports');
        const count = await new Promise((resolve, reject) => {
            const req = store.count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        return count;
    } catch (error) {
        console.warn('Unable to read pending report count:', error);
        return 0;
    }
}

async function getPendingReportIds() {
    try {
        const db = await openDb();
        const tx = db.transaction('pendingReports', 'readonly');
        const store = tx.objectStore('pendingReports');
        return await new Promise((resolve, reject) => {
            const req = store.getAllKeys();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    } catch (error) {
        console.warn('Unable to read queued report IDs:', error);
        return [];
    }
}

async function displayPendingSyncDetails() {
    const pendingIds = await getPendingReportIds();
    if (pendingIds.length === 0) {
        showSuccess('Pending Sync', 'No reports are currently queued for sync.');
        return;
    }

    showSuccess('Pending Sync Reports', `Queued report IDs:\n${pendingIds.slice(0, 10).join('\n')}${pendingIds.length > 10 ? '\n...and more' : ''}`);
}

async function refreshOfflineQueueStatus() {
    const count = await getPendingReportCount();
    const statusEl = document.getElementById('pendingOfflineCount');
    if (statusEl) {
        statusEl.textContent = count > 0 ? `${count} pending` : 'All synced';
    }
    return count;
}

function setConnectionIndicator(isOnline) {
    const statusDot = document.getElementById('connectionStatus');
    const statusText = document.getElementById('connectionText');
    if (!statusDot || !statusText) return;

    statusDot.className = `w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`;
    statusText.textContent = isOnline ? 'Online' : 'Offline';
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
        swRegistration = await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registered:', swRegistration.scope);

        const ready = await navigator.serviceWorker.ready;
        swRegistration = ready;
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'push-received') {
                displayLocalNotification(event.data.title, event.data.options);
            }
        });
    } catch (error) {
        console.warn('Service Worker registration failed:', error);
    }
}

async function subscribeToPushNotifications() {
    if (!('Notification' in window)) {
        showError('Push notifications are not supported by this browser.');
        return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        showError('Push notification permission denied.');
        return;
    }

    const statusText = document.getElementById('notificationStatusText');
    if (statusText) {
        statusText.textContent = 'Push notifications enabled locally.';
    }
    const button = document.getElementById('enablePushBtn');
    if (button) {
        button.textContent = 'Push Enabled';
        button.disabled = true;
        button.classList.add('opacity-50', 'cursor-not-allowed');
    }
    showSuccess('Push Enabled', 'Local push notifications are now enabled.');
}

function displayLocalNotification(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(title, options);
}

function startResponderLocationTracking() {
    if (!navigator.geolocation) {
        showError('Geolocation is not available in this browser.');
        return;
    }

    if (gpsWatchId !== null) {
        showSuccess('Tracking', 'GPS tracking is already active.');
        return;
    }

    gpsWatchId = navigator.geolocation.watchPosition(position => {
        const { latitude, longitude } = position.coords;
        currentUser.location = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        updateResponderLocationUI();
        document.getElementById('stopGpsTrackingBtn')?.classList.remove('hidden');
        showSuccess('GPS Tracking', 'Responder location is now being tracked.');
    }, error => {
        showError('GPS Error: ' + error.message);
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
}

function stopResponderLocationTracking() {
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
        currentUser.location = null;
        updateResponderLocationUI();
        document.getElementById('stopGpsTrackingBtn')?.classList.add('hidden');
        showSuccess('GPS Stopped', 'Responder location tracking has stopped.');
    }
}

function updateResponderLocationUI() {
    const locationText = document.getElementById('respCurrentLocation');
    if (!locationText) return;
    locationText.textContent = currentUser.location || 'Not tracking';
}

function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('NkwalinkDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pendingReports')) {
                db.createObjectStore('pendingReports', { keyPath: 'id' });
            }
        };
    });
}

async function savePendingReport(report) {
    const db = await openDb();
    const tx = db.transaction('pendingReports', 'readwrite');
    tx.objectStore('pendingReports').put(report);
    await (tx.complete || new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = reject;
    }));
    await refreshOfflineQueueStatus();
}

async function syncOfflineReportsIfOnline() {
    if (!navigator.onLine) return;
    try {
        const db = await openDb();
        const tx = db.transaction('pendingReports', 'readonly');
        const store = tx.objectStore('pendingReports');
        const allReports = await new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        for (const report of allReports) {
            try {
                await fetch(`${API_BASE_URL}/api/reports`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(report)
                });
                const deleteTx = db.transaction('pendingReports', 'readwrite');
                deleteTx.objectStore('pendingReports').delete(report.id);
            } catch (error) {
                console.warn('Offline report sync failed for', report.id, error);
            }
        }
    } catch (error) {
        console.warn('Sync offline reports failed:', error);
    }
    await refreshOfflineQueueStatus();
}

function enqueueReportSync() {
    if (!navigator.serviceWorker || !navigator.serviceWorker.ready) return;
    navigator.serviceWorker.ready.then(registration => {
        if (registration.sync) {
            registration.sync.register('sync-reports').catch(() => {
                console.warn('Background sync registration failed.');
            });
        }
        refreshOfflineQueueStatus();
    });
}

// ===== PERIODIC UPDATES =====
setInterval(() => {
    updateHeaderInfo();
    refreshOfflineQueueStatus();
    if (currentUser?.role === 'responder') {
        renderResponderDashboard();
    } else if (currentUser?.role === 'coordinator') {
        renderCoordinatorStats();
    }
}, 10000); // Update every 10 seconds
