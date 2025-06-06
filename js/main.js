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
function initApp() {
    loadDataFromStorage();
    renderMaintenanceEntries();
    renderIssues();
    updateServiceSchedule();
    setCurrentDateOnForms();
    attachEventListeners();
}

// Load data from localStorage
function loadDataFromStorage() {
    const savedData = localStorage.getItem('vwBeetleData');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        Object.assign(store, parsedData);
        
        // Update the UI with saved vehicle info
        document.getElementById('vin').value = store.vehicleInfo.vin || '';
        document.getElementById('current-mileage').value = store.vehicleInfo.mileage || '';
    }
}

// Save all data to localStorage
function saveToStorage() {
    store.lastSaved = new Date().toISOString();
    localStorage.setItem('vwBeetleData', JSON.stringify(store));
    console.log('Data saved to localStorage');
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
    if (!store.vehicleInfo.mileage) {
        console.log('Cannot update service schedule: no current mileage');
        return;
    }
    
    // Update each service type
    updateServiceStatus('oil-change', 'oil');
    updateServiceStatus('valve-adjustment', 'valve');
    updateServiceStatus('tune-up', 'tune');
    updateServiceStatus('brakes', 'brake');
}

// Update a specific service status
function updateServiceStatus(serviceType, idPrefix) {
    const currentMileage = store.vehicleInfo.mileage;
    
    // Find the most recent maintenance entry of this type
    const lastService = store.maintenance
        .filter(entry => entry.type === serviceType)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    const lastDoneElem = document.getElementById(`${idPrefix}-last`);
    const nextDueElem = document.getElementById(`${idPrefix}-next`);
    const statusElem = document.getElementById(`${idPrefix}-status`);
    
    if (!lastService) {
        lastDoneElem.textContent = 'Not recorded';
        nextDueElem.textContent = 'Not calculated';
        statusElem.innerHTML = '<span class="status unknown">Unknown</span>';
        return;
    }
    
    // Update last done date and mileage
    const lastDoneDate = new Date(lastService.date).toLocaleDateString();
    lastDoneElem.textContent = `${lastDoneDate} (${lastService.mileage.toLocaleString()} miles)`;
    
    // Calculate next service mileage
    const interval = serviceIntervals[serviceType] || serviceIntervals[lastService.type];
    const nextDueMileage = lastService.mileage + interval;
    nextDueElem.textContent = `${nextDueMileage.toLocaleString()} miles`;
    
    // Determine status
    let statusClass = 'unknown';
    let statusText = 'Unknown';
    
    const milesRemaining = nextDueMileage - currentMileage;
    
    if (milesRemaining < 0) {
        statusClass = 'overdue';
        statusText = `Overdue by ${Math.abs(milesRemaining).toLocaleString()} miles`;
    } else if (milesRemaining < interval * 0.1) { // Within 10% of interval
        statusClass = 'due';
        statusText = `Due soon (${milesRemaining.toLocaleString()} miles)`;
    } else {
        statusClass = 'completed';
        statusText = `OK (${milesRemaining.toLocaleString()} miles remaining)`;
    }
    
    statusElem.innerHTML = `<span class="status ${statusClass}">${statusText}</span>`;
}

// ========== FORM HANDLING ==========

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

// ========== INITIALIZATION ==========
// Listen for changes in the service schedule table
document.querySelectorAll('#schedule-table td[contenteditable="true"]').forEach(cell => {
    cell.addEventListener('input', function() {
        updateServiceStatus();
    });
});

function updateServiceStatus() {
    // Oil Change
    const oilNext = document.getElementById('oil-next').textContent.trim();
    const oilStatus = document.getElementById('oil-status').querySelector('.status');
    if (oilNext !== 'Not calculated' && oilNext !== '') {
        oilStatus.textContent = 'OK';
        oilStatus.className = 'status good';
    } else {
        oilStatus.textContent = 'Unknown';
        oilStatus.className = 'status unknown';
    }
    // Repeat for other services...
    const valveNext = document.getElementById('valve-next').textContent.trim();
    const valveStatus = document.getElementById('valve-status').querySelector('.status');
    if (valveNext !== 'Not calculated' && valveNext !== '') {
        valveStatus.textContent = 'OK';
        valveStatus.className = 'status good';
    } else {
        valveStatus.textContent = 'Unknown';
        valveStatus.className = 'status unknown';
    }

    const tuneNext = document.getElementById('tune-next').textContent.trim();
    const tuneStatus = document.getElementById('tune-status').querySelector('.status');
    if (tuneNext !== 'Not calculated' && tuneNext !== '') {
        tuneStatus.textContent = 'OK';
        tuneStatus.className = 'status good';
    } else {
        tuneStatus.textContent = 'Unknown';
        tuneStatus.className = 'status unknown';
    }

    const brakeNext = document.getElementById('brake-next').textContent.trim();
    const brakeStatus = document.getElementById('brake-status').querySelector('.status');
    if (brakeNext !== 'Not calculated' && brakeNext !== '') {
        brakeStatus.textContent = 'OK';
        brakeStatus.className = 'status good';
    } else {
        brakeStatus.textContent = 'Unknown';
        brakeStatus.className = 'status unknown';
    }

    function isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }
}

// Optionally, run once on page load
document.addEventListener('DOMContentLoaded', updateServiceStatus);
// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
