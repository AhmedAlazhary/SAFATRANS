// Trial Balance Tab Content and Functions

async function loadTrialBalance() {
    const trialContent = document.getElementById('trial-balance');
    trialContent.innerHTML = `
        <h2 class="mb-4">
            <i class="bi bi-balance-scale"></i>
            ميزان المراجعة
        </h2>
        
        <!-- Date Selection -->
        <div class="row mb-4">
            <div class="col-md-4">
                <label class="form-label">من تاريخ</label>
                <input type="date" class="form-control" id="trialDateFrom" value="${getFirstDayOfMonth()}">
            </div>
            <div class="col-md-4">
                <label class="form-label">إلى تاريخ</label>
                <input type="date" class="form-control" id="trialDateTo" value="${getCurrentDate()}">
            </div>
            <div class="col-md-4">
                <label class="form-label">&nbsp;</label>
                <button class="btn btn-primary w-100" onclick="refreshTrialBalance()">
                    <i class="bi bi-arrow-clockwise"></i>
                    تحديث البيانات
                </button>
            </div>
        </div>
        
        <!-- Summary Cards -->
        <div class="row mb-4">
            <div class="col-md-3 mb-3">
                <div class="summary-card" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                    <i class="bi bi-cart-plus" style="font-size: 2rem;"></i>
                    <div class="summary-number" id="totalPurchases">0</div>
                    <div>إجمالي المشتريات</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="summary-card" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                    <i class="bi bi-box-arrow-up" style="font-size: 2rem;"></i>
                    <div class="summary-number" id="totalExpenses">0</div>
                    <div>إجمالي مصروفات عهدة</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="summary-card" style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);">
                    <i class="bi bi-cash" style="font-size: 2rem;"></i>
                    <div class="summary-number" id="totalLoans">0</div>
                    <div>إجمالي سلف</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="summary-card" style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%);">
                    <i class="bi bi-wallet2" style="font-size: 2rem;"></i>
                    <div class="summary-number" id="totalSalaries">0</div>
                    <div>إجمالي مرتبات</div>
                </div>
            </div>
        </div>
        
        <!-- Trial Balance Table -->
        <div class="card">
            <div class="card-header bg-dark text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="bi bi-balance-scale"></i>
                        ميزان المراجعة
                    </h5>
                    <div>
                        <button class="btn btn-light btn-sm me-2" onclick="exportTrialBalanceToExcel()">
                            <i class="bi bi-file-earmark-excel"></i>
                            تصدير Excel
                        </button>
                        <button class="btn btn-light btn-sm" onclick="printTrialBalance()">
                            <i class="bi bi-printer"></i>
                            طباعة
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-dark">
                            <tr>
                                <th>البند</th>
                                <th>الإجمالي</th>
                                <th>ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>إجمالي المشتريات</td>
                                <td class="fw-bold text-success" id="trialPurchases">0</td>
                                <td>مجموع قيم إذن الإضافة للمخزون</td>
                            </tr>
                            <tr>
                                <td>إجمالي مصروفات عهدة</td>
                                <td class="fw-bold text-danger" id="trialExpenses">0</td>
                                <td>مجموع المصروفات من عهدة الجراج</td>
                            </tr>
                            <tr>
                                <td>إجمالي سلف الحاج</td>
                                <td class="fw-bold text-warning" id="trialLoans">0</td>
                                <td>مجموع السلف المسلمة للعمال</td>
                            </tr>
                            <tr>
                                <td>إجمالي مرتبات</td>
                                <td class="fw-bold text-info" id="trialSalaries">0</td>
                                <td>مجموع المرتبات المدفوعة للعمال</td>
                            </tr>
                            <tr class="table-secondary">
                                <th>صافي الحركة</th>
                                <th class="fw-bold" id="netMovement">0</th>
                                <th>(مشتريات - مصروفات - سلف + مرتبات)</th>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Additional Details -->
                <div class="row mt-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0">تفاصيل المشتريات</h6>
                            </div>
                            <div class="card-body">
                                <div id="purchasesDetails">
                                    <div class="text-center text-muted">جاري تحميل التفاصيل...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header bg-danger text-white">
                                <h6 class="mb-0">تفاصيل المصروفات</h6>
                            </div>
                            <div class="card-body">
                                <div id="expensesDetails">
                                    <div class="text-center text-muted">جاري تحميل التفاصيل...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize event listeners and load data
    initializeTrialBalanceForms();
    await loadTrialBalanceData();
}

function initializeTrialBalanceForms() {
    // Setup event listeners
    document.getElementById('trialDateFrom').addEventListener('change', refreshTrialBalance);
    document.getElementById('trialDateTo').addEventListener('change', refreshTrialBalance);
}

async function loadTrialBalanceData() {
    await calculateAllTotals();
    await loadDetailedBreakdown();
}

async function calculateAllTotals() {
    try {
        const dateFrom = new Date(document.getElementById('trialDateFrom').value);
        const dateTo = new Date(document.getElementById('trialDateTo').value);
        
        // Calculate total purchases
        const purchasesSnapshot = await db.collection('inventoryMovements')
            .where('type', '==', 'purchase')
            .where('date', '>=', dateFrom)
            .where('date', '<=', dateTo)
            .get();
        
        const purchases = purchasesSnapshot.docs.map(doc => doc.data());
        const totalPurchases = purchases.reduce((sum, p) => sum + (p.totalValue || 0), 0);
        
        // Calculate total expenses (from garage custody)
        const expensesSnapshot = await db.collection('garageCustody')
            .where('type', '==', 'spending')
            .where('date', '>=', dateFrom)
            .where('date', '<=', dateTo)
            .get();
        
        const expenses = expensesSnapshot.docs.map(doc => doc.data());
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        // Calculate total loans
        const loansSnapshot = await db.collection('hajLoans')
            .where('date', '>=', dateFrom)
            .where('date', '<=', dateTo)
            .get();
        
        const loans = loansSnapshot.docs.map(doc => doc.data());
        const totalLoans = loans.reduce((sum, l) => sum + l.amount, 0);
        
        // Calculate total salaries
        const salariesSnapshot = await db.collection('salaries')
            .where('date', '>=', dateFrom)
            .where('date', '<=', dateTo)
            .get();
        
        const salaries = salariesSnapshot.docs.map(doc => doc.data());
        const totalSalaries = salaries.reduce((sum, s) => sum + s.salary, 0);
        
        // Calculate net movement
        const netMovement = totalPurchases - totalExpenses - totalLoans - totalSalaries;
        
        // Update summary cards
        updateSummaryCards({
            totalPurchases,
            totalExpenses,
            totalLoans,
            totalSalaries,
            netMovement
        });
        
        // Update trial balance table
        updateTrialBalanceTable({
            totalPurchases,
            totalExpenses,
            totalLoans,
            totalSalaries,
            netMovement
        });
        
    } catch (error) {
        console.error('Error calculating totals:', error);
        showNotification('خطأ في حساب الإجماليات', 'danger');
    }
}

function updateSummaryCards(data) {
    document.getElementById('totalPurchases').textContent = data.totalPurchases.toFixed(2);
    document.getElementById('totalExpenses').textContent = data.totalExpenses.toFixed(2);
    document.getElementById('totalLoans').textContent = data.totalLoans.toFixed(2);
    document.getElementById('totalSalaries').textContent = data.totalSalaries.toFixed(2);
}

function updateTrialBalanceTable(data) {
    document.getElementById('trialPurchases').textContent = data.totalPurchases.toFixed(2);
    document.getElementById('trialExpenses').textContent = data.totalExpenses.toFixed(2);
    document.getElementById('trialLoans').textContent = data.totalLoans.toFixed(2);
    document.getElementById('trialSalaries').textContent = data.totalSalaries.toFixed(2);
    document.getElementById('netMovement').textContent = data.netMovement.toFixed(2);
    
    // Color code the net movement
    const netMovementElement = document.getElementById('netMovement');
    netMovementElement.className = 'fw-bold';
    if (data.netMovement > 0) {
        netMovementElement.classList.add('text-success');
    } else if (data.netMovement < 0) {
        netMovementElement.classList.add('text-danger');
    } else {
        netMovementElement.classList.add('text-secondary');
    }
}

async function loadDetailedBreakdown() {
    try {
        const dateFrom = new Date(document.getElementById('trialDateFrom').value);
        const dateTo = new Date(document.getElementById('trialDateTo').value);
        
        // Load purchases breakdown
        const purchasesSnapshot = await db.collection('inventoryMovements')
            .where('type', '==', 'purchase')
            .where('date', '>=', dateFrom)
            .where('date', '<=', dateTo)
            .orderBy('date', 'desc')
            .limit(5)
            .get();
        
        const purchases = purchasesSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        
        // Load expenses breakdown
        const expensesSnapshot = await db.collection('garageCustody')
            .where('type', '==', 'spending')
            .where('date', '>=', dateFrom)
            .where('date', '<=', dateTo)
            .orderBy('date', 'desc')
            .limit(5)
            .get();
        
        const expenses = expensesSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        
        updateDetailedBreakdown(purchases, expenses);
        
    } catch (error) {
        console.error('Error loading detailed breakdown:', error);
    }
}

function updateDetailedBreakdown(purchases, expenses) {
    // Update purchases details
    const purchasesDetails = document.getElementById('purchasesDetails');
    if (purchases.length === 0) {
        purchasesDetails.innerHTML = '<div class="text-muted">لا توجد مشتريات في الفترة المحددة</div>';
    } else {
        purchasesDetails.innerHTML = `
            <div class="list-group">
                ${purchases.slice(0, 3).map(purchase => `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>${purchase.itemName}</strong>
                                <small class="text-muted d-block">${formatDate(purchase.date)}</small>
                            </div>
                            <span class="badge bg-success">${purchase.totalValue.toFixed(2)}</span>
                        </div>
                    </div>
                `).join('')}
                ${purchases.length > 3 ? `<div class="text-center text-muted mt-2">و ${purchases.length - 3} مشتريات أخرى...</div>` : ''}
            </div>
        `;
    }
    
    // Update expenses details
    const expensesDetails = document.getElementById('expensesDetails');
    if (expenses.length === 0) {
        expensesDetails.innerHTML = '<div class="text-muted">لا توجد مصروفات في الفترة المحددة</div>';
    } else {
        expensesDetails.innerHTML = `
            <div class="list-group">
                ${expenses.slice(0, 3).map(expense => `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>${expense.reason}</strong>
                                <small class="text-muted d-block">${formatDate(expense.date)}</small>
                            </div>
                            <span class="badge bg-danger">${expense.amount.toFixed(2)}</span>
                        </div>
                    </div>
                `).join('')}
                ${expenses.length > 3 ? `<div class="text-center text-muted mt-2">و ${expenses.length - 3} مصروفات أخرى...</div>` : ''}
            </div>
        `;
    }
}

function refreshTrialBalance() {
    showNotification('جاري تحديث بيانات ميزان المراجعة...', 'info');
    loadTrialBalanceData();
}

function getFirstDayOfMonth() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}

function exportTrialBalanceToExcel() {
    showNotification('جاري تحضير ملف Excel...', 'info');
    
    const dateFrom = document.getElementById('trialDateFrom').value;
    const dateTo = document.getElementById('trialDateTo').value;
    
    const trialData = [
        {
            'البند': 'إجمالي المشتريات',
            'الإجمالي': document.getElementById('trialPurchases').textContent,
            'ملاحظات': 'مجموع قيم إذن الإضافة للمخزون'
        },
        {
            'البند': 'إجمالي مصروفات عهدة',
            'الإجمالي': document.getElementById('trialExpenses').textContent,
            'ملاحظات': 'مجموع المصروفات من عهدة الجراج'
        },
        {
            'البند': 'إجمالي سلف الحاج',
            'الإجمالي': document.getElementById('trialLoans').textContent,
            'ملاحظات': 'مجموع السلف المسلمة للعمال'
        },
        {
            'البند': 'إجمالي مرتبات',
            'الإجمالي': document.getElementById('trialSalaries').textContent,
            'ملاحظات': 'مجموع المرتبات المدفوعة للعمال'
        },
        {
            'البند': 'صافي الحركة',
            'الإجمالي': document.getElementById('netMovement').textContent,
            'ملاحظات': '(مشتريات - مصروفات - سلف + مرتبات)'
        }
    ];
    
    // Add summary info
    trialData.unshift({
        'البند': 'تقرير ميزان المراجعة',
        'من تاريخ': dateFrom,
        'إلى تاريخ': dateTo,
        'تاريخ التقرير': new Date().toLocaleDateString('ar-EG')
    });
    
    // Export to Excel
    const ws = XLSX.utils.json_to_sheet(trialData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ميزان المراجعة");
    XLSX.writeFile(wb, \`ميزان_المراجعة_\${dateFrom}_\${dateTo}.xlsx\`);
    
    showNotification('تم تصدير ملف Excel بنجاح', 'success');
}

function printTrialBalance() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(\`
        <!DOCTYPE html>
        <html dir="rtl">
            <head>
                <title>طباعة ميزان المراجعة</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    th { background-color: #f2f2f2; }
                    .text-success { color: #27ae60; }
                    .text-danger { color: #e74c3c; }
                    .text-warning { color: #f39c12; }
                    .text-info { color: #3498db; }
                    .fw-bold { font-weight: bold; }
                    .summary-cards { display: flex; justify-content: space-around; margin-bottom: 30px; }
                    .summary-card { 
                        border: 1px solid #ddd; 
                        padding: 15px; 
                        text-align: center; 
                        border-radius: 5px;
                        min-width: 120px;
                    }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <h1 style="text-align: center; margin-bottom: 30px;">ميزان المراجعة</h1>
                <p style="text-align: center; margin-bottom: 30px;">
                    من تاريخ: \${document.getElementById('trialDateFrom').value} 
                    إلى تاريخ: \${document.getElementById('trialDateTo').value}
                </p>
                
                <div class="summary-cards">
                    <div class="summary-card">
                        <div>إجمالي المشتريات</div>
                        <div class="fw-bold text-success">\${document.getElementById('trialPurchases').textContent}</div>
                    </div>
                    <div class="summary-card">
                        <div>إجمالي مصروفات عهدة</div>
                        <div class="fw-bold text-danger">\${document.getElementById('trialExpenses').textContent}</div>
                    </div>
                    <div class="summary-card">
                        <div>إجمالي سلف</div>
                        <div class="fw-bold text-warning">\${document.getElementById('trialLoans').textContent}</div>
                    </div>
                    <div class="summary-card">
                        <div>إجمالي مرتبات</div>
                        <div class="fw-bold text-info">\${document.getElementById('trialSalaries').textContent}</div>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>البند</th>
                            <th>الإجمالي</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>إجمالي المشتريات</td>
                            <td class="fw-bold text-success">\${document.getElementById('trialPurchases').textContent}</td>
                            <td>مجموع قيم إذن الإضافة للمخزون</td>
                        </tr>
                        <tr>
                            <td>إجمالي مصروفات عهدة</td>
                            <td class="fw-bold text-danger">\${document.getElementById('trialExpenses').textContent}</td>
                            <td>مجموع المصروفات من عهدة الجراج</td>
                        </tr>
                        <tr>
                            <td>إجمالي سلف الحاج</td>
                            <td class="fw-bold text-warning">\${document.getElementById('trialLoans').textContent}</td>
                            <td>مجموع السلف المسلمة للعمال</td>
                        </tr>
                        <tr>
                            <td>إجمالي مرتبات</td>
                            <td class="fw-bold text-info">\${document.getElementById('trialSalaries').textContent}</td>
                            <td>مجموع المرتبات المدفوعة للعمال</td>
                        </tr>
                        <tr class="table-secondary">
                            <th>صافي الحركة</th>
                            <th class="fw-bold">\${document.getElementById('netMovement').textContent}</th>
                            <th>(مشتريات - مصروفات - سلف + مرتبات)</th>
                        </tr>
                    </tbody>
                </table>
            </body>
        </html>
    \`);
    printWindow.document.close();
    printWindow.print();
}
