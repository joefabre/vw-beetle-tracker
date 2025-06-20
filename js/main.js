/**
 * VW Beetle Maintenance Tracker - JavaScript
 * 
 * This file handles all the functionality for the maintenance tracker including:
 * - Data persistence with localStorage
 * - Form submissions and validation
 * - Dynamic content rendering
 * - Service interval calculations
 * - Filtering and search functionality
 */

// ========== DATA MANAGEMENT ==========

// Main data store
const store = {
    vehicleInfo: {
        year: 1969,
        make: "Volkswagen",
        model: "Beetle",
        vin: "",
        mileage: 0
    },
    maintenance: [],
    issues: [],
    serviceSchedule: {
        oil: { lastDone: '', nextDue: '' },
        valve: { lastDone: '', nextDue: '' },
        tune: { lastDone: '', nextDue: '' },
        brake: { lastDone: '', nextDue: '' }
    },
    lastSaved: null
};

// Service intervals in miles
const serviceIntervals = {
    "oil-change": 3000,
    "valve-adjustment": 6000,
    "tune-up": 12000,
    "brake-inspection": 12000
};

// Initialize the application
async function initApp() {
    await loadDataFromStorage();
    renderMaintenanceEntries();
    renderIssues();
    updateServiceSchedule();
    loadServiceSchedule(); // Load saved service schedule dates
    setCurrentDateOnForms();
    attachEventListeners();
}

// Load data from Firebase or localStorage fallback
async function loadDataFromStorage() {
    if (window.db) {
        try {
            // Load from Firebase
            await loadFromFirebase();
        } catch (error) {
            console.error('Error loading from Firebase:', error);
            console.log('Falling back to localStorage');
            loadFromLocalStorage();
        }
    } else {
        // Firebase not available, use localStorage
        loadFromLocalStorage();
    }
}

// Load data from Firebase
async function loadFromFirebase() {
    try {
        const doc = await db.collection('vehicles').doc('beetle-1969').get();
        
        if (doc.exists) {
            const data = doc.data();
            Object.assign(store, data);
            console.log('Data loaded from Firebase');
        } else {
            console.log('No Firebase data found, using default values');
        }
        
        // Update the UI with saved vehicle info
        document.getElementById('vin').value = store.vehicleInfo.vin || '';
        document.getElementById('current-mileage').value = store.vehicleInfo.mileage || '';
        
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        throw error;
    }
}

// Load data from localStorage (fallback)
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('vwBeetleData');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        Object.assign(store, parsedData);
        console.log('Data loaded from localStorage');
        
        // Update the UI with saved vehicle info
        document.getElementById('vin').value = store.vehicleInfo.vin || '';
        document.getElementById('current-mileage').value = store.vehicleInfo.mileage || '';
    }
}

// Save all data to Firebase and localStorage
async function saveToStorage() {
    store.lastSaved = new Date().toISOString();
    
    // Always save to localStorage as backup
    localStorage.setItem('vwBeetleData', JSON.stringify(store));
    
    if (window.db) {
        try {
            // Save to Firebase
            await db.collection('vehicles').doc('beetle-1969').set(store);
            console.log('Data saved to Firebase and localStorage');
            showNotification('Data synced to cloud successfully!', 'success');
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            console.log('Data saved to localStorage only');
            showNotification('Saved locally (cloud sync failed)', 'warning');
        }
    } else {
        console.log('Data saved to localStorage only (Firebase not available)');
        showNotification('Saved locally', 'info');
    }
}

// Set current date on form datepickers
function setCurrentDateOnForms() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('maintenance-date').value = today;
    document.getElementById('issue-date').value = today;
}

// ========== VEHICLE INFORMATION ==========

// Save vehicle information
function saveVehicleInfo() {
    const vin = document.getElementById('vin').value.trim();
    const mileage = parseInt(document.getElementById('current-mileage').value) || 0;
    
    store.vehicleInfo.vin = vin;
    store.vehicleInfo.mileage = mileage;
    
    saveToStorage();
    updateServiceSchedule();
    
    // Show confirmation
    showNotification('Vehicle information saved successfully!', 'success');
}

// ========== MAINTENANCE LOG ==========

// Add a new maintenance entry
function addMaintenanceEntry(date, type, mileage, notes, cost) {
    const entry = {
        id: generateId(),
        date: date,
        type: type,
        mileage: mileage,
        notes: notes || '',
        cost: cost || 0,
        timestamp: new Date().toISOString()
    };
    
    store.maintenance.unshift(entry); // Add to beginning of array
    saveToStorage();
    renderMaintenanceEntries();
    updateServiceSchedule();
    
    return entry;
}

// Delete a maintenance entry
function deleteMaintenanceEntry(id) {
    if (confirm('Are you sure you want to delete this maintenance record?')) {
        store.maintenance = store.maintenance.filter(entry => entry.id !== id);
        saveToStorage();
        renderMaintenanceEntries();
        updateServiceSchedule();
    }
}

// Render all maintenance entries to the table
function renderMaintenanceEntries(filterType = 'all') {
    const tableBody = document.getElementById('maintenance-entries');
    tableBody.innerHTML = '';
    
    // Filter entries if needed
    let entries = store.maintenance;
    if (filterType !== 'all') {
        entries = entries.filter(entry => entry.type === filterType);
    }
    
    if (entries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" class="empty-table">No maintenance records found</td>`;
        tableBody.appendChild(row);
        return;
    }
    
    // Create a row for each entry
    entries.forEach(entry => {
        const row = document.createElement('tr');
        const formattedDate = new Date(entry.date).toLocaleDateString();
        const typeName = getTypeDisplayName(entry.type);
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${typeName}</td>
            <td>${entry.mileage.toLocaleString()}</td>
            <td>${entry.notes}</td>
            <td>$${parseFloat(entry.cost).toFixed(2)}</td>
            <td>
                <button class="btn-small" data-action="delete" data-id="${entry.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Attach delete event listeners
    tableBody.querySelectorAll('button[data-action="delete"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            deleteMaintenanceEntry(id);
        });
    });
}

// Filter maintenance entries by type
function filterMaintenanceEntries() {
    const filterType = document.getElementById('filter-type').value;
    renderMaintenanceEntries(filterType);
}

// Reset filter to show all entries
function clearMaintenanceFilter() {
    document.getElementById('filter-type').value = 'all';
    renderMaintenanceEntries();
}

// ========== ISSUE TRACKING ==========

// Add a new issue
function addIssue(date, description, priority) {
    const issue = {
        id: generateId(),
        date: date,
        description: description,
        priority: priority,
        resolved: false,
        resolvedDate: null,
        timestamp: new Date().toISOString()
    };
    
    store.issues.unshift(issue); // Add to beginning of array
    saveToStorage();
    renderIssues();
    
    return issue;
}

// Toggle issue resolved status
function toggleIssueStatus(id) {
    const issue = store.issues.find(issue => issue.id === id);
    if (issue) {
        issue.resolved = !issue.resolved;
        issue.resolvedDate = issue.resolved ? new Date().toISOString() : null;
        saveToStorage();
        renderIssues();
    }
}

// Edit an issue
function startEditIssue(id) {
    const issue = store.issues.find(issue => issue.id === id);
    if (!issue) return;
    
    // Find the issue element
    const issueElement = document.querySelector(`[data-issue-id="${id}"]`);
    if (!issueElement) return;
    
    // Store original content for canceling
    issueElement.dataset.originalContent = issueElement.innerHTML;
    
    // Create edit form
    const editForm = `
        <div class="issue-edit-form">
            <div class="form-group">
                <label for="edit-date-${id}">Date Noticed:</label>
                <input type="date" id="edit-date-${id}" value="${issue.date}" required>
            </div>
            <div class="form-group">
                <label for="edit-description-${id}">Description:</label>
                <textarea id="edit-description-${id}" rows="3" required>${issue.description}</textarea>
            </div>
            <div class="form-group">
                <label for="edit-priority-${id}">Priority:</label>
                <select id="edit-priority-${id}" required>
                    <option value="low" ${issue.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${issue.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${issue.priority === 'high' ? 'selected' : ''}>High</option>
                    <option value="critical" ${issue.priority === 'critical' ? 'selected' : ''}>Critical</option>
                </select>
            </div>
            <div class="issue-edit-actions">
                <button class="btn-small btn-save" data-action="save-edit" data-id="${id}">
                    <i class="fas fa-save"></i> Save
                </button>
                <button class="btn-small btn-cancel" data-action="cancel-edit" data-id="${id}">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `;
    
    // Replace content with edit form
    issueElement.innerHTML = editForm;
    issueElement.classList.add('editing');
    
    // Attach event listeners to edit form buttons
    issueElement.querySelector('button[data-action="save-edit"]').addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        saveEditIssue(id);
    });
    
    issueElement.querySelector('button[data-action="cancel-edit"]').addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        cancelEditIssue(id);
    });
}

// Save edited issue
function saveEditIssue(id) {
    const issue = store.issues.find(issue => issue.id === id);
    if (!issue) return;
    
    // Get form values
    const date = document.getElementById(`edit-date-${id}`).value;
    const description = document.getElementById(`edit-description-${id}`).value.trim();
    const priority = document.getElementById(`edit-priority-${id}`).value;
    
    // Validate required fields
    if (!date || !description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Update issue
    issue.date = date;
    issue.description = description;
    issue.priority = priority;
    issue.lastModified = new Date().toISOString();
    
    saveToStorage();
    renderIssues();
    
    showNotification('Issue updated successfully!', 'success');
}

// Cancel editing issue
function cancelEditIssue(id) {
    const issueElement = document.querySelector(`[data-issue-id="${id}"]`);
    if (!issueElement) return;
    
    // Restore original content
    const originalContent = issueElement.dataset.originalContent;
    if (originalContent) {
        issueElement.innerHTML = originalContent;
        issueElement.classList.remove('editing');
        
        // Re-attach event listeners
        attachIssueEventListeners(issueElement);
    }
}

// Delete an issue
function deleteIssue(id) {
    if (confirm('Are you sure you want to delete this issue?')) {
        store.issues = store.issues.filter(issue => issue.id !== id);
        saveToStorage();
        renderIssues();
    }
}

// Render all issues
function renderIssues() {
    const activeIssuesList = document.getElementById('issue-list');
    const resolvedIssuesList = document.getElementById('resolved-issue-list');
    
    activeIssuesList.innerHTML = '';
    resolvedIssuesList.innerHTML = '';
    
    const activeIssues = store.issues.filter(issue => !issue.resolved);
    const resolvedIssues = store.issues.filter(issue => issue.resolved);
    
    // Render active issues
    if (activeIssues.length === 0) {
        activeIssuesList.innerHTML = '<li class="no-issues">No active issues</li>';
    } else {
        activeIssues.forEach(issue => {
            const li = createIssueElement(issue);
            activeIssuesList.appendChild(li);
        });
    }
    
    // Render resolved issues
    if (resolvedIssues.length === 0) {
        resolvedIssuesList.innerHTML = '<li class="no-issues">No resolved issues</li>';
    } else {
        resolvedIssues.forEach(issue => {
            const li = createIssueElement(issue);
            resolvedIssuesList.appendChild(li);
        });
    }
}

// Attach event listeners to an issue element
function attachIssueEventListeners(issueElement) {
    const toggleBtn = issueElement.querySelector('button[data-action="toggle"]');
    const editBtn = issueElement.querySelector('button[data-action="edit-issue"]');
    const deleteBtn = issueElement.querySelector('button[data-action="delete-issue"]');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            toggleIssueStatus(id);
        });
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            startEditIssue(id);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            deleteIssue(id);
        });
    }
}

// Create an issue list item element
function createIssueElement(issue) {
    const li = document.createElement('li');
    li.className = `issue-item ${issue.priority}`;
    li.setAttribute('data-issue-id', issue.id);
    
    const formattedDate = new Date(issue.date).toLocaleDateString();
    
    // Create the updated timestamp if it exists
    const updatedTimestamp = issue.lastModified 
        ? `<div class="issue-updated">Updated: ${new Date(issue.lastModified).toLocaleDateString()}</div>`
        : '';
    
    li.innerHTML = `
        <div class="issue-header">
            <span class="issue-date">${formattedDate}</span>
            <span class="issue-priority ${issue.priority}">${capitalizeFirstLetter(issue.priority)}</span>
        </div>
        <p class="issue-description">${issue.description}</p>
        <div class="issue-actions">
            <button class="btn-small" data-action="toggle" data-id="${issue.id}">
                ${issue.resolved ? '<i class="fas fa-undo"></i> Reopen' : '<i class="fas fa-check"></i> Resolve'}
            </button>
            <button class="btn-small btn-edit" data-action="edit-issue" data-id="${issue.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-small btn-delete" data-action="delete-issue" data-id="${issue.id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
        ${updatedTimestamp}
    `;
    
    // Attach event listeners
    attachIssueEventListeners(li);
    
    return li;
}

// ========== SERVICE SCHEDULE ==========

// Update the service schedule section
function updateServiceSchedule() {
    // Update each service type
    updateServiceStatus('oil-change', 'oil');
    updateServiceStatus('valve-adjustment', 'valve');
    updateServiceStatus('tune-up', 'tune');
    updateServiceStatus('brakes', 'brake');
}

// Update a specific service status
function updateServiceStatus(serviceType, idPrefix) {
    // Find the most recent maintenance entry of this type
    const lastService = store.maintenance
        .filter(entry => entry.type === serviceType)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    const lastDoneElem = document.getElementById(`${idPrefix}-last`);
    const nextDueElem = document.getElementById(`${idPrefix}-next`);
    const statusElem = document.getElementById(`${idPrefix}-status`);
    
    if (!lastService) {
        if (lastDoneElem && !lastDoneElem.value) {
            // Only update if no manual date has been entered
        }
        if (nextDueElem && !nextDueElem.value) {
            // Only update if no manual date has been entered
        }
        if (statusElem) {
            statusElem.innerHTML = '<span class="status unknown">Unknown</span>';
        }
        return;
    }
    
    // Update last done date if not manually set
    if (lastDoneElem && !lastDoneElem.value) {
        lastDoneElem.value = lastService.date;
    }
    
    // Calculate next due date based on mileage intervals
    const interval = serviceIntervals[serviceType];
    if (interval && nextDueElem && !nextDueElem.value && store.vehicleInfo.mileage) {
        // Calculate based on mileage interval (convert to approximate months)
        const avgMilesPerMonth = 1000; // Assume 1000 miles per month average
        const monthsToNext = Math.ceil(interval / avgMilesPerMonth);
        
        const lastDate = new Date(lastService.date);
        const nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + monthsToNext);
        nextDueElem.value = nextDate.toISOString().split('T')[0];
    }
    
    // Update status
    updateScheduleStatus(idPrefix);
}

// Update status based on current date vs next due date
function updateScheduleStatus(idPrefix) {
    const nextDueElem = document.getElementById(`${idPrefix}-next`);
    const statusElem = document.getElementById(`${idPrefix}-status`);
    
    if (!nextDueElem || !statusElem || !nextDueElem.value) {
        if (statusElem) {
            statusElem.innerHTML = '<span class="status unknown">Unknown</span>';
        }
        return;
    }
    
    const today = new Date();
    const nextDue = new Date(nextDueElem.value);
    const daysDiff = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
    
    let statusClass = 'unknown';
    let statusText = 'Unknown';
    
    if (daysDiff < 0) {
        statusClass = 'overdue';
        statusText = `Overdue by ${Math.abs(daysDiff)} days`;
    } else if (daysDiff <= 30) {
        statusClass = 'due';
        statusText = `Due in ${daysDiff} days`;
    } else {
        statusClass = 'completed';
        statusText = `OK (${daysDiff} days remaining)`;
    }
    
    statusElem.innerHTML = `<span class="status ${statusClass}">${statusText}</span>`;
}

// Save service schedule dates to storage
function saveServiceSchedule() {
    const scheduleKeys = ['oil', 'valve', 'tune', 'brake'];
    
    scheduleKeys.forEach(key => {
        const lastDoneElem = document.getElementById(`${key}-last`);
        const nextDueElem = document.getElementById(`${key}-next`);
        
        if (lastDoneElem && nextDueElem) {
            store.serviceSchedule[key] = {
                lastDone: lastDoneElem.value || '',
                nextDue: nextDueElem.value || ''
            };
        }
    });
    
    saveToStorage();
}

// Load service schedule dates from storage
function loadServiceSchedule() {
    const scheduleKeys = ['oil', 'valve', 'tune', 'brake'];
    
    scheduleKeys.forEach(key => {
        const lastDoneElem = document.getElementById(`${key}-last`);
        const nextDueElem = document.getElementById(`${key}-next`);
        
        if (lastDoneElem && nextDueElem && store.serviceSchedule[key]) {
            lastDoneElem.value = store.serviceSchedule[key].lastDone || '';
            nextDueElem.value = store.serviceSchedule[key].nextDue || '';
            
            // Update status after loading
            updateScheduleStatus(key);
        }
    });
}

// Handle vehicle info form submission
function handleVehicleInfoSubmit(e) {
    e.preventDefault();
    saveVehicleInfo();
}

// Handle maintenance form submission
function handleMaintenanceFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const date = form.querySelector('#maintenance-date').value;
    const type = form.querySelector('#maintenance-type').value;
    const mileage = parseInt(form.querySelector('#maintenance-mileage').value) || 0;
    const notes = form.querySelector('#maintenance-notes').value.trim();
    const cost = parseFloat(form.querySelector('#maintenance-cost').value) || 0;
    
    if (!date || !type || !mileage) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    addMaintenanceEntry(date, type, mileage, notes, cost);
    form.reset();
    setCurrentDateOnForms();
    
    // Show confirmation
    showNotification('Maintenance record added successfully!', 'success');
}

// Handle issue form submission
function handleIssueFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const date = form.querySelector('#issue-date').value;
    const description = form.querySelector('#issue-description').value.trim();
    const priority = form.querySelector('#issue-priority').value;
    
    if (!date || !description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    addIssue(date, description, priority);
    form.reset();
    setCurrentDateOnForms();
    
    // Show confirmation
    showNotification('Issue added successfully!', 'success');
}

// ========== EVENT LISTENERS ==========

// Attach all event listeners
function attachEventListeners() {
    // Vehicle info form
    document.getElementById('save-info').addEventListener('click', handleVehicleInfoSubmit);
    
    // Maintenance log form
    document.getElementById('maintenance-form').addEventListener('submit', handleMaintenanceFormSubmit);
    
    // Issue tracking form
    document.getElementById('issue-form').addEventListener('submit', handleIssueFormSubmit);
    
    // Filter controls
    document.getElementById('apply-filter').addEventListener('click', filterMaintenanceEntries);
    document.getElementById('clear-filter').addEventListener('click', clearMaintenanceFilter);

    // Export issue controls
    document.getElementById('print-issues').addEventListener('click', handlePrintIssues);
    document.getElementById('email-issues').addEventListener('click', handleEmailIssues);
    document.getElementById('export-issues-csv').addEventListener('click', exportIssuesToCSV);
    
    // Data management controls
    document.getElementById('export-all-csv').addEventListener('click', exportAllDataToCSV);
    document.getElementById('export-maintenance-csv').addEventListener('click', exportMaintenanceToCSV);
    document.getElementById('export-complete-backup').addEventListener('click', exportCompleteBackup);
    
    // Import controls
    document.getElementById('csv-import-file').addEventListener('change', handleFileSelection);
    document.getElementById('json-import-file').addEventListener('change', handleFileSelection);
    document.getElementById('import-csv-btn').addEventListener('click', handleCSVImport);
    document.getElementById('import-json-btn').addEventListener('click', handleJSONImport);
    
    // Update stats on load
    updateDataStatistics();
}

// ========== UTILITY FUNCTIONS ==========

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Get readable name for maintenance type
function getTypeDisplayName(type) {
    const typeMap = {
        'oil-change': 'Oil Change',
        'tune-up': 'Tune-Up',
        'brakes': 'Brakes',
        'electrical': 'Electrical',
        'engine': 'Engine',
        'transmission': 'Transmission',
        'suspension': 'Suspension',
        'valve-adjustment': 'Valve Adjustment',
        'brake-inspection': 'Brake Inspection',
        'other': 'Other'
    };
    
    return typeMap[type] || capitalizeFirstLetter(type);
}

// Capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Show notification to user
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
        
        // Add styles for the notification
        const style = document.createElement('style');
        style.textContent = `
            #notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 4px;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transition: transform 0.3s ease-out, opacity 0.3s ease-out;
                transform: translateY(-100px);
                opacity: 0;
            }
            #notification.show {
                transform: translateY(0);
                opacity: 1;
            }
            #notification.info {
                background-color: #17a2b8;
                color: white;
            }
            #notification.success {
                background-color: #28a745;
                color: white;
            }
            #notification.error {
                background-color: #dc3545;
                color: white;
            }
            #notification.warning {
                background-color: #ffc107;
                color: #212529;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Set notification content and type
    notification.textContent = message;
    notification.className = type;
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ========== CSV EXPORT/IMPORT FUNCTIONALITY ==========

// Export all data to CSV format
function exportDataToCSV() {
    try {
        const timestamp = new Date().toISOString().split('T')[0];
        
        // Create comprehensive data export
        const exportData = {
            vehicleInfo: store.vehicleInfo,
            maintenance: store.maintenance,
            issues: store.issues,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        // Convert to CSV format
        let csvContent = '';
        
        // Header
        csvContent += '# VW Beetle Tracker Data Export\n';
        csvContent += `# Export Date: ${new Date().toLocaleString()}\n`;
        csvContent += `# Vehicle: ${store.vehicleInfo.year} ${store.vehicleInfo.make} ${store.vehicleInfo.model}\n`;
        csvContent += '# \n';
        
        // Vehicle Information
        csvContent += '\n[VEHICLE_INFO]\n';
        csvContent += 'Field,Value\n';
        csvContent += `Year,${store.vehicleInfo.year || ''}\n`;
        csvContent += `Make,${store.vehicleInfo.make || ''}\n`;
        csvContent += `Model,${store.vehicleInfo.model || ''}\n`;
        csvContent += `VIN,"${store.vehicleInfo.vin || ''}"\n`;
        csvContent += `Mileage,${store.vehicleInfo.mileage || ''}\n`;
        
        // Maintenance Records
        csvContent += '\n[MAINTENANCE_RECORDS]\n';
        csvContent += 'ID,Date,Type,Mileage,Notes,Cost,Timestamp\n';
        store.maintenance.forEach(entry => {
            const notes = (entry.notes || '').replace(/"/g, '""'); // Escape quotes
            csvContent += `${entry.id},${entry.date},${entry.type},${entry.mileage || 0},"${notes}",${entry.cost || 0},${entry.timestamp}\n`;
        });
        
        // Issues
        csvContent += '\n[ISSUES]\n';
        csvContent += 'ID,Date,Description,Priority,Resolved,ResolvedDate,LastModified,Timestamp\n';
        store.issues.forEach(issue => {
            const description = (issue.description || '').replace(/"/g, '""'); // Escape quotes
            csvContent += `${issue.id},${issue.date},"${description}",${issue.priority},${issue.resolved},${issue.resolvedDate || ''},${issue.lastModified || ''},${issue.timestamp}\n`;
        });
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `vw_beetle_data_${timestamp}.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Data exported to CSV successfully!', 'success');
        
    } catch (error) {
        console.error('CSV export error:', error);
        showNotification(`Export failed: ${error.message}`, 'error');
    }
}

// Import data from CSV file
function importDataFromCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const csvContent = e.target.result;
                const importedData = parseCSVData(csvContent);
                
                // Validate imported data
                if (!importedData) {
                    throw new Error('Invalid CSV format');
                }
                
                // Backup current data
                const backup = {
                    vehicleInfo: { ...store.vehicleInfo },
                    maintenance: [...store.maintenance],
                    issues: [...store.issues]
                };
                
                // Import vehicle info
                if (importedData.vehicleInfo) {
                    Object.assign(store.vehicleInfo, importedData.vehicleInfo);
                }
                
                // Import maintenance records
                if (importedData.maintenance && importedData.maintenance.length > 0) {
                    // Option 1: Replace all data
                    if (confirm('Replace all maintenance records with imported data? (Cancel to merge)')) {
                        store.maintenance = importedData.maintenance;
                    } else {
                        // Option 2: Merge data (avoid duplicates by ID)
                        importedData.maintenance.forEach(importedEntry => {
                            const existingIndex = store.maintenance.findIndex(entry => entry.id === importedEntry.id);
                            if (existingIndex >= 0) {
                                store.maintenance[existingIndex] = importedEntry;
                            } else {
                                store.maintenance.push(importedEntry);
                            }
                        });
                    }
                }
                
                // Import issues
                if (importedData.issues && importedData.issues.length > 0) {
                    // Option 1: Replace all data
                    if (confirm('Replace all issues with imported data? (Cancel to merge)')) {
                        store.issues = importedData.issues;
                    } else {
                        // Option 2: Merge data (avoid duplicates by ID)
                        importedData.issues.forEach(importedIssue => {
                            const existingIndex = store.issues.findIndex(issue => issue.id === importedIssue.id);
                            if (existingIndex >= 0) {
                                store.issues[existingIndex] = importedIssue;
                            } else {
                                store.issues.push(importedIssue);
                            }
                        });
                    }
                }
                
                // Save imported data
                saveToStorage();
                
                // Update UI
                updateVehicleInfoUI();
                renderMaintenanceEntries();
                renderIssues();
                updateServiceSchedule();
                
                resolve({
                    vehicleInfo: importedData.vehicleInfo ? Object.keys(importedData.vehicleInfo).length : 0,
                    maintenance: importedData.maintenance ? importedData.maintenance.length : 0,
                    issues: importedData.issues ? importedData.issues.length : 0
                });
                
            } catch (error) {
                console.error('CSV import error:', error);
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
}

// Parse CSV data
function parseCSVData(csvContent) {
    try {
        const lines = csvContent.split('\n');
        let currentSection = null;
        const data = {
            vehicleInfo: {},
            maintenance: [],
            issues: []
        };
        
        let isHeaderLine = true;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip comments and empty lines
            if (line.startsWith('#') || line === '') {
                continue;
            }
            
            // Check for section headers
            if (line.startsWith('[') && line.endsWith(']')) {
                currentSection = line.slice(1, -1);
                isHeaderLine = true;
                continue;
            }
            
            // Skip header lines
            if (isHeaderLine) {
                isHeaderLine = false;
                continue;
            }
            
            // Parse data based on current section
            if (currentSection === 'VEHICLE_INFO') {
                const [field, value] = parseCSVLine(line);
                if (field && value !== undefined) {
                    if (field === 'Year' || field === 'Mileage') {
                        data.vehicleInfo[field.toLowerCase()] = parseInt(value) || 0;
                    } else {
                        data.vehicleInfo[field.toLowerCase()] = value;
                    }
                }
            } else if (currentSection === 'MAINTENANCE_RECORDS') {
                const [id, date, type, mileage, notes, cost, timestamp] = parseCSVLine(line);
                if (id && date && type) {
                    data.maintenance.push({
                        id: id,
                        date: date,
                        type: type,
                        mileage: parseInt(mileage) || 0,
                        notes: notes || '',
                        cost: parseFloat(cost) || 0,
                        timestamp: timestamp || new Date().toISOString()
                    });
                }
            } else if (currentSection === 'ISSUES') {
                const [id, date, description, priority, resolved, resolvedDate, lastModified, timestamp] = parseCSVLine(line);
                if (id && date && description) {
                    data.issues.push({
                        id: id,
                        date: date,
                        description: description,
                        priority: priority || 'medium',
                        resolved: resolved === 'true',
                        resolvedDate: resolvedDate || null,
                        lastModified: lastModified || null,
                        timestamp: timestamp || new Date().toISOString()
                    });
                }
            }
        }
        
        return data;
        
    } catch (error) {
        console.error('CSV parsing error:', error);
        return null;
    }
}

// Parse a single CSV line
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Update vehicle info UI after import
function updateVehicleInfoUI() {
    document.getElementById('vin').value = store.vehicleInfo.vin || '';
    document.getElementById('current-mileage').value = store.vehicleInfo.mileage || '';
}

// Handle file input for import
function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showNotification('Please select a CSV file', 'error');
        return;
    }
    
    showNotification('Importing data...', 'info');
    
    importDataFromCSV(file)
        .then(stats => {
            showNotification(
                `Import successful! Imported: ${stats.maintenance} maintenance records, ${stats.issues} issues`,
                'success'
            );
        })
        .catch(error => {
            showNotification(`Import failed: ${error.message}`, 'error');
        })
        .finally(() => {
            // Clear the file input
            event.target.value = '';
        });
}

// ========== EXPORT FUNCTIONALITY ==========

// Generate a formatted report of all issues
function generateIssuesReport() {
    const activeIssues = store.issues.filter(issue => !issue.resolved);
    const resolvedIssues = store.issues.filter(issue => issue.resolved);
    
    // Get vehicle information
    const vehicleInfo = store.vehicleInfo;
    const vin = vehicleInfo.vin || 'Not specified';
    const mileage = vehicleInfo.mileage ? vehicleInfo.mileage.toLocaleString() : 'Not specified';
    
    // Build report header
    let report = `
        1969 VW BEETLE ISSUES REPORT
        Generated: ${new Date().toLocaleString()}
        VIN/Chassis: ${vin}
        Current Mileage: ${mileage} miles
        
        ACTIVE ISSUES (${activeIssues.length})
        ${'-'.repeat(80)}
    `;
    
    // Add active issues
    if (activeIssues.length === 0) {
        report += '\n        No active issues.\n';
    } else {
        activeIssues.forEach((issue, index) => {
            const issueDate = new Date(issue.date).toLocaleDateString();
            report += `
        ${index + 1}. ${issueDate} - PRIORITY: ${issue.priority.toUpperCase()}
           ${issue.description}
        `;
        });
    }
    
    // Add resolved issues
    report += `
        
        RESOLVED ISSUES (${resolvedIssues.length})
        ${'-'.repeat(80)}
    `;
    
    if (resolvedIssues.length === 0) {
        report += '\n        No resolved issues.\n';
    } else {
        resolvedIssues.forEach((issue, index) => {
            const issueDate = new Date(issue.date).toLocaleDateString();
            const resolvedDate = issue.resolvedDate 
                ? new Date(issue.resolvedDate).toLocaleDateString()
                : 'Unknown';
            
            report += `
        ${index + 1}. ${issueDate} - RESOLVED: ${resolvedDate}
           ${issue.description}
        `;
        });
    }
    
    return report;
}

// Create printable version of issues and print
function handlePrintIssues() {
    const report = generateIssuesReport();
    
    // Create a printable window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>VW Beetle Issues Report</title>
            <style>
                body {
                    font-family: monospace;
                    line-height: 1.5;
                    padding: 20px;
                    white-space: pre-wrap;
                }
                h1 {
                    text-align: center;
                }
                .print-only {
                    display: block;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <h1>1969 VW Beetle Issues Report</h1>
            <div class="no-print">
                <p>Click the button below to print this report or use Ctrl+P (Cmd+P on Mac).</p>
                <button onclick="window.print()">Print Report</button>
                <button onclick="window.close()">Close</button>
                <hr>
            </div>
            <pre>${report}</pre>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Focus the new window
    printWindow.focus();
    
    // Show notification
    showNotification('Issues report ready to print', 'success');
}

// Create an email with issues summary
function handleEmailIssues() {
    const activeIssues = store.issues.filter(issue => !issue.resolved);
    
    // Prepare email subject and body
    const subject = '1969 VW Beetle Issues Report';
    
    // Simple version for email body (limited to active issues for brevity)
    let body = '1969 VW BEETLE ISSUES REPORT\n\n';
    body += `Generated: ${new Date().toLocaleDateString()}\n`;
    body += `VIN/Chassis: ${store.vehicleInfo.vin || 'Not specified'}\n`;
    body += `Current Mileage: ${store.vehicleInfo.mileage?.toLocaleString() || 'Not specified'} miles\n\n`;
    
    body += `ACTIVE ISSUES (${activeIssues.length}):\n\n`;
    
    if (activeIssues.length === 0) {
        body += 'No active issues.\n';
    } else {
        activeIssues.forEach((issue, index) => {
            const issueDate = new Date(issue.date).toLocaleDateString();
            body += `${index + 1}. ${issueDate} - PRIORITY: ${issue.priority.toUpperCase()}\n`;
            body += `   ${issue.description}\n\n`;
        });
    }
    
    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open default email client
    window.location.href = mailtoLink;
    
    // Show notification
    showNotification('Opening email client with issues report', 'info');
}

// Export issues to CSV file
function exportIssuesToCSV() {
    // Prepare CSV content
    let csvContent = 'Date,Description,Priority,Status,Resolved Date\n';
    
    store.issues.forEach(issue => {
        const date = new Date(issue.date).toLocaleDateString();
        const description = `"${issue.description.replace(/"/g, '""')}"`; // Escape quotes
        const priority = issue.priority;
        const status = issue.resolved ? 'Resolved' : 'Active';
        const resolvedDate = issue.resolvedDate 
            ? new Date(issue.resolvedDate).toLocaleDateString() 
            : '';
        
        csvContent += `${date},${description},${priority},${status},${resolvedDate}\n`;
    });
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vw_beetle_issues_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show notification
    showNotification('Issues exported to CSV successfully', 'success');
}

// ========== CSV EXPORT/IMPORT FUNCTIONALITY ==========

// Export all data to CSV format
function exportDataToCSV() {
    try {
        const timestamp = new Date().toISOString().split('T')[0];
        
        // Create comprehensive data export
        const exportData = {
            vehicleInfo: store.vehicleInfo,
            maintenance: store.maintenance,
            issues: store.issues,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        // Convert to CSV format
        let csvContent = '';
        
        // Header
        csvContent += '# VW Beetle Tracker Data Export\n';
        csvContent += `# Export Date: ${new Date().toLocaleString()}\n`;
        csvContent += `# Vehicle: ${store.vehicleInfo.year} ${store.vehicleInfo.make} ${store.vehicleInfo.model}\n`;
        csvContent += '# \n';
        
        // Vehicle Information
        csvContent += '\n[VEHICLE_INFO]\n';
        csvContent += 'Field,Value\n';
        csvContent += `Year,${store.vehicleInfo.year || ''}\n`;
        csvContent += `Make,${store.vehicleInfo.make || ''}\n`;
        csvContent += `Model,${store.vehicleInfo.model || ''}\n`;
        csvContent += `VIN,"${store.vehicleInfo.vin || ''}"\n`;
        csvContent += `Mileage,${store.vehicleInfo.mileage || ''}\n`;
        
        // Maintenance Records
        csvContent += '\n[MAINTENANCE_RECORDS]\n';
        csvContent += 'ID,Date,Type,Mileage,Notes,Cost,Timestamp\n';
        store.maintenance.forEach(entry => {
            const notes = (entry.notes || '').replace(/"/g, '""'); // Escape quotes
            csvContent += `${entry.id},${entry.date},${entry.type},${entry.mileage || 0},"${notes}",${entry.cost || 0},${entry.timestamp}\n`;
        });
        
        // Issues
        csvContent += '\n[ISSUES]\n';
        csvContent += 'ID,Date,Description,Priority,Resolved,ResolvedDate,LastModified,Timestamp\n';
        store.issues.forEach(issue => {
            const description = (issue.description || '').replace(/"/g, '""'); // Escape quotes
            csvContent += `${issue.id},${issue.date},"${description}",${issue.priority},${issue.resolved},${issue.resolvedDate || ''},${issue.lastModified || ''},${issue.timestamp}\n`;
        });
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `vw_beetle_data_${timestamp}.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Data exported to CSV successfully!', 'success');
        
    } catch (error) {
        console.error('CSV export error:', error);
        showNotification(`Export failed: ${error.message}`, 'error');
    }
}

// Export all data to CSV
function exportAllDataToCSV() {
    exportDataToCSV();
    updateDataStatistics();
}

// Export only maintenance records to CSV
function exportMaintenanceToCSV() {
    try {
        const timestamp = new Date().toISOString().split('T')[0];
        
        let csvContent = '';
        
        // Header
        csvContent += '# VW Beetle Maintenance Records Export\n';
        csvContent += `# Export Date: ${new Date().toLocaleString()}\n`;
        csvContent += `# Vehicle: ${store.vehicleInfo.year} ${store.vehicleInfo.make} ${store.vehicleInfo.model}\n`;
        csvContent += '# \n';
        
        // Maintenance Records
        csvContent += 'Date,Type,Mileage,Notes,Cost,Timestamp\n';
        store.maintenance.forEach(entry => {
            const notes = (entry.notes || '').replace(/"/g, '""'); // Escape quotes
            csvContent += `${entry.date},${entry.type},${entry.mileage || 0},"${notes}",${entry.cost || 0},${entry.timestamp}\n`;
        });
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `vw_beetle_maintenance_${timestamp}.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Maintenance records exported to CSV successfully!', 'success');
        updateDataStatistics();
        
    } catch (error) {
        console.error('Maintenance CSV export error:', error);
        showNotification(`Export failed: ${error.message}`, 'error');
    }
}

// Export issues to CSV file
function exportIssuesToCSV() {
    // Prepare CSV content
    let csvContent = 'Date,Description,Priority,Status,Resolved Date\n';
    
    store.issues.forEach(issue => {
        const date = new Date(issue.date).toLocaleDateString();
        const description = `"${issue.description.replace(/"/g, '""')}"`; // Escape quotes
        const priority = issue.priority;
        const status = issue.resolved ? 'Resolved' : 'Active';
        const resolvedDate = issue.resolvedDate 
            ? new Date(issue.resolvedDate).toLocaleDateString() 
            : '';
        
        csvContent += `${date},${description},${priority},${status},${resolvedDate}\n`;
    });
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vw_beetle_issues_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show notification
    showNotification('Issues exported to CSV successfully', 'success');
}

// Parse CSV data
function parseCSVData(csvContent) {
    try {
        const lines = csvContent.split('\n');
        let currentSection = null;
        const data = {
            vehicleInfo: {},
            maintenance: [],
            issues: []
        };
        
        let isHeaderLine = true;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip comments and empty lines
            if (line.startsWith('#') || line === '') {
                continue;
            }
            
            // Check for section headers
            if (line.startsWith('[') && line.endsWith(']')) {
                currentSection = line.slice(1, -1);
                isHeaderLine = true;
                continue;
            }
            
            // Skip header lines
            if (isHeaderLine) {
                isHeaderLine = false;
                continue;
            }
            
            // Parse data based on current section
            if (currentSection === 'VEHICLE_INFO') {
                const [field, value] = parseCSVLine(line);
                if (field && value !== undefined) {
                    if (field === 'Year' || field === 'Mileage') {
                        data.vehicleInfo[field.toLowerCase()] = parseInt(value) || 0;
                    } else {
                        data.vehicleInfo[field.toLowerCase()] = value;
                    }
                }
            } else if (currentSection === 'MAINTENANCE_RECORDS') {
                const [id, date, type, mileage, notes, cost, timestamp] = parseCSVLine(line);
                if (id && date && type) {
                    data.maintenance.push({
                        id: id,
                        date: date,
                        type: type,
                        mileage: parseInt(mileage) || 0,
                        notes: notes || '',
                        cost: parseFloat(cost) || 0,
                        timestamp: timestamp || new Date().toISOString()
                    });
                }
            } else if (currentSection === 'ISSUES') {
                const [id, date, description, priority, resolved, resolvedDate, lastModified, timestamp] = parseCSVLine(line);
                if (id && date && description) {
                    data.issues.push({
                        id: id,
                        date: date,
                        description: description,
                        priority: priority || 'medium',
                        resolved: resolved === 'true',
                        resolvedDate: resolvedDate || null,
                        lastModified: lastModified || null,
                        timestamp: timestamp || new Date().toISOString()
                    });
                }
            }
        }
        
        return data;
        
    } catch (error) {
        console.error('CSV parsing error:', error);
        return null;
    }
}

// Parse a single CSV line
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Update vehicle info UI after import
function updateVehicleInfoUI() {
    document.getElementById('vin').value = store.vehicleInfo.vin || '';
    document.getElementById('current-mileage').value = store.vehicleInfo.mileage || '';
}

// Export complete backup as JSON
function exportCompleteBackup() {
    try {
        const timestamp = new Date().toISOString().split('T')[0];
        
        // Create comprehensive backup data
        const backupData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            exportSource: 'VW Beetle Tracker',
            data: {
                vehicleInfo: store.vehicleInfo,
                maintenance: store.maintenance,
                issues: store.issues,
                lastSaved: store.lastSaved
            },
            metadata: {
                maintenanceCount: store.maintenance.length,
                issuesCount: store.issues.length,
                activeIssuesCount: store.issues.filter(issue => !issue.resolved).length,
                lastMaintenanceDate: store.maintenance.length > 0 
                    ? store.maintenance.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
                    : null
            }
        };
        
        // Convert to JSON string
        const jsonContent = JSON.stringify(backupData, null, 2);
        
        // Create and download file
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `vw_beetle_backup_${timestamp}.json`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Complete backup exported successfully!', 'success');
        updateDataStatistics();
        
    } catch (error) {
        console.error('JSON backup export error:', error);
        showNotification(`Backup failed: ${error.message}`, 'error');
    }
}

// Handle file selection for import
function handleFileSelection(event) {
    const file = event.target.files[0];
    const importButton = event.target.id === 'csv-import-file' 
        ? document.getElementById('import-csv-btn')
        : document.getElementById('import-json-btn');
    
    if (file) {
        importButton.disabled = false;
        importButton.textContent = `Import ${file.name}`;
    } else {
        importButton.disabled = true;
        importButton.textContent = event.target.id === 'csv-import-file' 
            ? 'Import CSV Data'
            : 'Import JSON Backup';
    }
}

// Handle CSV import
function handleCSVImport() {
    const fileInput = document.getElementById('csv-import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a CSV file first', 'error');
        return;
    }
    
    const mergeData = document.getElementById('merge-data').checked;
    
    showNotification('Importing CSV data...', 'info');
    
    importDataFromCSV(file, mergeData)
        .then(stats => {
            const message = mergeData 
                ? `Data merged successfully! Added: ${stats.maintenance} maintenance records, ${stats.issues} issues`
                : `Data replaced successfully! Imported: ${stats.maintenance} maintenance records, ${stats.issues} issues`;
            
            showNotification(message, 'success');
            updateDataStatistics();
        })
        .catch(error => {
            showNotification(`Import failed: ${error.message}`, 'error');
        })
        .finally(() => {
            fileInput.value = '';
            document.getElementById('import-csv-btn').disabled = true;
            document.getElementById('import-csv-btn').textContent = 'Import CSV Data';
        });
}

// Handle JSON import
function handleJSONImport() {
    const fileInput = document.getElementById('json-import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a JSON file first', 'error');
        return;
    }
    
    const mergeData = document.getElementById('merge-data').checked;
    
    showNotification('Importing JSON backup...', 'info');
    
    importJSONBackup(file, mergeData)
        .then(stats => {
            const message = mergeData 
                ? `Backup merged successfully! Added: ${stats.maintenance} maintenance records, ${stats.issues} issues`
                : `Backup restored successfully! Imported: ${stats.maintenance} maintenance records, ${stats.issues} issues`;
            
            showNotification(message, 'success');
            updateDataStatistics();
        })
        .catch(error => {
            showNotification(`Import failed: ${error.message}`, 'error');
        })
        .finally(() => {
            fileInput.value = '';
            document.getElementById('import-json-btn').disabled = true;
            document.getElementById('import-json-btn').textContent = 'Import JSON Backup';
        });
}

// Import JSON backup
function importJSONBackup(file, mergeData = true) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const jsonContent = e.target.result;
                const backupData = JSON.parse(jsonContent);
                
                // Validate backup structure
                if (!backupData.data || (!backupData.data.vehicleInfo && !backupData.data.maintenance && !backupData.data.issues)) {
                    throw new Error('Invalid backup file format');
                }
                
                const importedData = backupData.data;
                
                // Backup current data
                const currentBackup = {
                    vehicleInfo: { ...store.vehicleInfo },
                    maintenance: [...store.maintenance],
                    issues: [...store.issues]
                };
                
                let stats = { maintenance: 0, issues: 0 };
                
                try {
                    // Import vehicle info
                    if (importedData.vehicleInfo) {
                        Object.assign(store.vehicleInfo, importedData.vehicleInfo);
                    }
                    
                    // Import maintenance records
                    if (importedData.maintenance && importedData.maintenance.length > 0) {
                        if (mergeData) {
                            // Merge data (avoid duplicates by ID)
                            importedData.maintenance.forEach(importedEntry => {
                                const existingIndex = store.maintenance.findIndex(entry => entry.id === importedEntry.id);
                                if (existingIndex >= 0) {
                                    store.maintenance[existingIndex] = importedEntry;
                                } else {
                                    store.maintenance.push(importedEntry);
                                    stats.maintenance++;
                                }
                            });
                        } else {
                            // Replace all data
                            store.maintenance = importedData.maintenance;
                            stats.maintenance = importedData.maintenance.length;
                        }
                    }
                    
                    // Import issues
                    if (importedData.issues && importedData.issues.length > 0) {
                        if (mergeData) {
                            // Merge data (avoid duplicates by ID)
                            importedData.issues.forEach(importedIssue => {
                                const existingIndex = store.issues.findIndex(issue => issue.id === importedIssue.id);
                                if (existingIndex >= 0) {
                                    store.issues[existingIndex] = importedIssue;
                                } else {
                                    store.issues.push(importedIssue);
                                    stats.issues++;
                                }
                            });
                        } else {
                            // Replace all data
                            store.issues = importedData.issues;
                            stats.issues = importedData.issues.length;
                        }
                    }
                    
                    // Save imported data
                    saveToStorage();
                    
                    // Update UI
                    updateVehicleInfoUI();
                    renderMaintenanceEntries();
                    renderIssues();
                    updateServiceSchedule();
                    
                    resolve(stats);
                    
                } catch (importError) {
                    // Restore backup on error
                    Object.assign(store, currentBackup);
                    throw importError;
                }
                
            } catch (error) {
                console.error('JSON import error:', error);
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
}

// Update CSV import function to support merge option
function importDataFromCSV(file, mergeData = true) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const csvContent = e.target.result;
                const importedData = parseCSVData(csvContent);
                
                // Validate imported data
                if (!importedData) {
                    throw new Error('Invalid CSV format');
                }
                
                // Backup current data
                const backup = {
                    vehicleInfo: { ...store.vehicleInfo },
                    maintenance: [...store.maintenance],
                    issues: [...store.issues]
                };
                
                let stats = { maintenance: 0, issues: 0 };
                
                try {
                    // Import vehicle info
                    if (importedData.vehicleInfo) {
                        Object.assign(store.vehicleInfo, importedData.vehicleInfo);
                    }
                    
                    // Import maintenance records
                    if (importedData.maintenance && importedData.maintenance.length > 0) {
                        if (mergeData) {
                            // Merge data (avoid duplicates by ID)
                            importedData.maintenance.forEach(importedEntry => {
                                const existingIndex = store.maintenance.findIndex(entry => entry.id === importedEntry.id);
                                if (existingIndex >= 0) {
                                    store.maintenance[existingIndex] = importedEntry;
                                } else {
                                    store.maintenance.push(importedEntry);
                                    stats.maintenance++;
                                }
                            });
                        } else {
                            // Replace all data
                            store.maintenance = importedData.maintenance;
                            stats.maintenance = importedData.maintenance.length;
                        }
                    }
                    
                    // Import issues
                    if (importedData.issues && importedData.issues.length > 0) {
                        if (mergeData) {
                            // Merge data (avoid duplicates by ID)
                            importedData.issues.forEach(importedIssue => {
                                const existingIndex = store.issues.findIndex(issue => issue.id === importedIssue.id);
                                if (existingIndex >= 0) {
                                    store.issues[existingIndex] = importedIssue;
                                } else {
                                    store.issues.push(importedIssue);
                                    stats.issues++;
                                }
                            });
                        } else {
                            // Replace all data
                            store.issues = importedData.issues;
                            stats.issues = importedData.issues.length;
                        }
                    }
                    
                    // Save imported data
                    saveToStorage();
                    
                    // Update UI
                    updateVehicleInfoUI();
                    renderMaintenanceEntries();
                    renderIssues();
                    updateServiceSchedule();
                    
                    resolve(stats);
                    
                } catch (importError) {
                    // Restore backup on error
                    Object.assign(store, backup);
                    throw importError;
                }
                
            } catch (error) {
                console.error('CSV import error:', error);
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
}

// Update data statistics
function updateDataStatistics() {
    try {
        // Update counts
        document.getElementById('maintenance-count').textContent = store.maintenance.length;
        document.getElementById('issues-count').textContent = store.issues.length;
        document.getElementById('active-issues-count').textContent = 
            store.issues.filter(issue => !issue.resolved).length;
        
        // Update last backup time
        const lastBackupElem = document.getElementById('last-backup');
        if (store.lastSaved) {
            const lastSavedDate = new Date(store.lastSaved);
            const now = new Date();
            const diffInHours = Math.floor((now - lastSavedDate) / (1000 * 60 * 60));
            
            if (diffInHours < 1) {
                lastBackupElem.textContent = 'Just now';
            } else if (diffInHours < 24) {
                lastBackupElem.textContent = `${diffInHours}h ago`;
            } else {
                const diffInDays = Math.floor(diffInHours / 24);
                lastBackupElem.textContent = `${diffInDays}d ago`;
            }
        } else {
            lastBackupElem.textContent = 'Never';
        }
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// ========== INITIALIZATION ==========
// Listen for changes in the service schedule date inputs
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to date inputs
    const dateInputs = document.querySelectorAll('#schedule-table input[type="date"]');
    dateInputs.forEach(input => {
        input.addEventListener('change', function() {
            const idPrefix = this.id.replace(/-last$|-next$/, '');
            updateScheduleStatus(idPrefix);
            saveServiceSchedule(); // Save whenever dates change
        });
    });
});
// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
