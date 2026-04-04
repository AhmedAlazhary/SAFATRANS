// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyARqSgfh78TqFQ2hhZaAtUaVQFqlPuRM3w",
    authDomain: "trialsafaprices2026.firebaseapp.com",
    databaseURL: "https://trialsafaprices2026-default-rtdb.firebaseio.com",
    projectId: "trialsafaprices2026",
    storageBucket: "trialsafaprices2026.appspot.com",
    messagingSenderId: "177091434445",
    appId: "1:177091434445:web:568b6ae3ba270a21d4d684"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Global Variables
let currentUser = null;
let masterData = {
    workers: [],
    items: [],
    suppliers: [],
    cars: [],
    drivers: []
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadMasterData();
            setupEventListeners();
            loadDashboardData();
        } else {
            // Redirect to login or show login modal
            showLoginModal();
        }
    });
}

// Authentication
function showLoginModal() {
    // Create login modal
    const modalHtml = `
        <div class="modal fade" id="loginModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">تسجيل الدخول</h5>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">البريد الإلكتروني</label>
                            <input type="email" class="form-control" id="loginEmail" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">كلمة المرور</label>
                            <input type="password" class="form-control" id="loginPassword" required>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="login()">دخول</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    } catch (error) {
        showNotification('خطأ في تسجيل الدخول: ' + error.message, 'danger');
    }
}

// Navigation
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    // Load tab-specific data
    loadTabData(tabName);
}

async function loadTabData(tabName) {
    switch(tabName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'inventory':
            await loadInventoryTab();
            break;
        case 'stock-balance':
            await loadStockBalance();
            break;
        case 'garage-custody':
            await loadGarageCustody();
            break;
        case 'payroll':
            await loadPayroll();
            break;
        case 'trial-balance':
            await loadTrialBalance();
            break;
    }
}

// Master Data Management
async function loadMasterData() {
    try {
        const snapshot = await db.collection('masterData').doc('data').get();
        if (snapshot.exists) {
            masterData = snapshot.data();
        }
        updateMasterDataUI();
    } catch (error) {
        console.error('Error loading master data:', error);
        showNotification('خطأ في تحميل البيانات الأساسية', 'danger');
    }
}

async function saveMasterData() {
    try {
        await db.collection('masterData').doc('data').set(masterData);
        showNotification('تم حفظ البيانات الأساسية بنجاح', 'success');
    } catch (error) {
        console.error('Error saving master data:', error);
        showNotification('خطأ في حفظ البيانات الأساسية', 'danger');
    }
}

function updateMasterDataUI() {
    // Update workers list
    const workersList = document.getElementById('workersList');
    if (workersList) {
        workersList.innerHTML = masterData.workers.map(worker => 
            `<div class="badge bg-primary m-1 p-2">${worker}</div>`
        ).join('');
    }
    
    // Update items list
    const itemsList = document.getElementById('itemsList');
    if (itemsList) {
        itemsList.innerHTML = masterData.items.map(item => 
            `<div class="badge bg-success m-1 p-2">${item}</div>`
        ).join('');
    }
    
    // Update suppliers list
    const suppliersList = document.getElementById('suppliersList');
    if (suppliersList) {
        suppliersList.innerHTML = masterData.suppliers.map(supplier => 
            `<div class="badge bg-info m-1 p-2">${supplier}</div>`
        ).join('');
    }
    
    // Update cars list
    const carsList = document.getElementById('carsList');
    if (carsList) {
        carsList.innerHTML = masterData.cars.map(car => 
            `<div class="badge bg-warning m-1 p-2">${car}</div>`
        ).join('');
    }
    
    // Update drivers list
    const driversList = document.getElementById('driversList');
    if (driversList) {
        driversList.innerHTML = masterData.drivers.map(driver => 
            `<div class="badge bg-secondary m-1 p-2">${driver}</div>`
        ).join('');
    }
}

// Add Master Data Functions
function addWorker() {
    const workerName = document.getElementById('workerName').value.trim();
    if (workerName && !masterData.workers.includes(workerName)) {
        masterData.workers.push(workerName);
        document.getElementById('workerName').value = '';
        updateMasterDataUI();
        saveMasterData();
        showNotification('تم إضافة العامل بنجاح', 'success');
    }
}

function addItem() {
    const itemName = document.getElementById('itemName').value.trim();
    if (itemName && !masterData.items.includes(itemName)) {
        masterData.items.push(itemName);
        document.getElementById('itemName').value = '';
        updateMasterDataUI();
        saveMasterData();
        showNotification('تم إضافة الصنف بنجاح', 'success');
    }
}

function addSupplier() {
    const supplierName = document.getElementById('supplierName').value.trim();
    if (supplierName && !masterData.suppliers.includes(supplierName)) {
        masterData.suppliers.push(supplierName);
        document.getElementById('supplierName').value = '';
        updateMasterDataUI();
        saveMasterData();
        showNotification('تم إضافة المورد بنجاح', 'success');
    }
}

function addCar() {
    const carNumber = document.getElementById('carNumber').value.trim();
    if (carNumber && !masterData.cars.includes(carNumber)) {
        masterData.cars.push(carNumber);
        document.getElementById('carNumber').value = '';
        updateMasterDataUI();
        saveMasterData();
        showNotification('تم إضافة السيارة بنجاح', 'success');
    }
}

function addDriver() {
    const driverName = document.getElementById('driverName').value.trim();
    if (driverName && !masterData.drivers.includes(driverName)) {
        masterData.drivers.push(driverName);
        document.getElementById('driverName').value = '';
        updateMasterDataUI();
        saveMasterData();
        showNotification('تم إضافة السائق بنجاح', 'success');
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        // Load summary statistics
        const movementsSnapshot = await db.collection('inventoryMovements')
            .orderBy('date', 'desc')
            .limit(10)
            .get();
        
        const movements = movementsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Update recent movements table
        updateRecentMovements(movements);
        
        // Calculate summary statistics
        await calculateSummaryStats();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('خطأ في تحميل بيانات لوحة التحكم', 'danger');
    }
}

function updateRecentMovements(movements) {
    const tbody = document.getElementById('recentMovements');
    if (!tbody) return;
    
    if (movements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">لا توجد حركات حديثة</td></tr>';
        return;
    }
    
    tbody.innerHTML = movements.map(movement => `
        <tr>
            <td>${formatDate(movement.date)}</td>
            <td>${movement.itemName}</td>
            <td>
                <span class="badge ${movement.type === 'purchase' ? 'bg-success' : 'bg-danger'}">
                    ${movement.type === 'purchase' ? 'إضافة' : 'صرف'}
                </span>
            </td>
            <td>${movement.quantity}</td>
            <td>${movement.value || '-'}</td>
            <td>${movement.notes || '-'}</td>
        </tr>
    `).join('');
}

async function calculateSummaryStats() {
    try {
        // Get all movements
        const movementsSnapshot = await db.collection('inventoryMovements').get();
        const movements = movementsSnapshot.docs.map(doc => doc.data());
        
        // Calculate statistics
        const purchases = movements.filter(m => m.type === 'purchase');
        const issues = movements.filter(m => m.type === 'issue');
        
        const totalPurchases = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
        const totalIssues = issues.reduce((sum, i) => sum + (i.quantity || 0), 0);
        
        // Get current stock balances
        const stockSnapshot = await db.collection('stockBalances').get();
        const stocks = stockSnapshot.docs.map(doc => doc.data());
        const lowStockItems = stocks.filter(s => s.balance <= 1);
        
        // Update UI
        document.getElementById('totalItems').textContent = masterData.items.length;
        document.getElementById('totalPurchases').textContent = totalPurchases;
        document.getElementById('totalIssues').textContent = totalIssues;
        document.getElementById('lowStockItems').textContent = lowStockItems.length;
        
    } catch (error) {
        console.error('Error calculating summary stats:', error);
    }
}

// Utility Functions
function formatDate(date) {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ar-EG');
}

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function showNotification(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Remove existing alerts
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    // Add new alert at the top of content area
    const contentArea = document.querySelector('.content-area');
    contentArea.insertAdjacentHTML('afterbegin', alertHtml);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const alert = contentArea.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

// Export to Excel function
function exportToExcel(data, filename) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
}

// Print function
function printElement(elementId) {
    const element = document.getElementById(elementId);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>طباعة</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    th { background-color: #f2f2f2; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                ${element.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Load remaining tabs
async function loadInventoryTab() {
    const inventoryContent = document.getElementById('inventory');
    inventoryContent.innerHTML = `
        <h2 class="mb-4">
            <i class="bi bi-box-seam"></i>
            المخزون والجرد
        </h2>
        <div class="loading">
            <div class="spinner"></div>
            <p>جاري تحميل صفحة المخزون...</p>
        </div>
    `;
    
    // Load inventory tab script
    const script = document.createElement('script');
    script.src = 'js/inventory-tab.js';
    document.head.appendChild(script);
    
    script.onload = () => {
        if (typeof loadInventoryTab === 'function') {
            loadInventoryTab();
        }
    };
}

async function loadStockBalance() {
    const stockContent = document.getElementById('stock-balance');
    stockContent.innerHTML = `
        <h2 class="mb-4">
            <i class="bi bi-bar-chart"></i>
            أرصدة المخزون
        </h2>
        <div class="loading">
            <div class="spinner"></div>
            <p>جاري تحميل أرصدة المخزون...</p>
        </div>
    `;
    
    // Load stock balance tab script
    const script = document.createElement('script');
    script.src = 'js/stock-balance-tab.js';
    document.head.appendChild(script);
    
    script.onload = () => {
        if (typeof loadStockBalance === 'function') {
            loadStockBalance();
        }
    };
}

async function loadGarageCustody() {
    const custodyContent = document.getElementById('garage-custody');
    custodyContent.innerHTML = `
        <h2 class="mb-4">
            <i class="bi bi-safe2"></i>
            عهدة الجراج
        </h2>
        <div class="loading">
            <div class="spinner"></div>
            <p>جاري تحميل عهدة الجراج...</p>
        </div>
    `;
    
    // Load garage custody tab script
    const script = document.createElement('script');
    script.src = 'js/garage-custody-tab.js';
    document.head.appendChild(script);
    
    script.onload = () => {
        if (typeof loadGarageCustody === 'function') {
            loadGarageCustody();
        }
    };
}

async function loadPayroll() {
    const payrollContent = document.getElementById('payroll');
    payrollContent.innerHTML = `
        <h2 class="mb-4">
            <i class="bi bi-cash-stack"></i>
            السلف والمرتبات
        </h2>
        <div class="loading">
            <div class="spinner"></div>
            <p>جاري تحميل السلف والمرتبات...</p>
        </div>
    `;
    
    // Load payroll tab script
    const script = document.createElement('script');
    script.src = 'js/payroll-tab.js';
    document.head.appendChild(script);
    
    script.onload = () => {
        if (typeof loadPayroll === 'function') {
            loadPayroll();
        }
    };
}

async function loadTrialBalance() {
    const trialContent = document.getElementById('trial-balance');
    trialContent.innerHTML = `
        <h2 class="mb-4">
            <i class="bi bi-balance-scale"></i>
            ميزان المراجعة
        </h2>
        <div class="loading">
            <div class="spinner"></div>
            <p>جاري تحميل ميزان المراجعة...</p>
        </div>
    `;
    
    // Load trial balance tab script
    const script = document.createElement('script');
    script.src = 'js/trial-balance-tab.js';
    document.head.appendChild(script);
    
    script.onload = () => {
        if (typeof loadTrialBalance === 'function') {
            loadTrialBalance();
        }
    };
}
