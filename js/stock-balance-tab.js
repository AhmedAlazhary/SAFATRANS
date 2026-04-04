// Stock Balance Tab Content and Functions

async function loadStockBalance() {
    const stockContent = document.getElementById('stock-balance');
    stockContent.innerHTML = `
        <h2 class="mb-4">
            <i class="bi bi-bar-chart"></i>
            أرصدة قطع الغيار
        </h2>
        
        <!-- Search and Export -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="search-box">
                    <i class="bi bi-search"></i>
                    <input type="text" class="form-control" id="stockSearch" placeholder="بحث سريع باسم الصنف...">
                </div>
            </div>
            <div class="col-md-6 text-end">
                <button class="btn btn-primary me-2" onclick="exportStockToExcel()">
                    <i class="bi bi-file-earmark-excel"></i>
                    تصدير Excel
                </button>
                <button class="btn btn-secondary" onclick="printStockBalance()">
                    <i class="bi bi-printer"></i>
                    طباعة الأرصدة
                </button>
            </div>
        </div>
        
        <!-- Stock Cards -->
        <div id="stockCards" class="row">
            <div class="col-12 text-center py-5">
                <div class="spinner"></div>
                <p class="text-muted">جاري تحميل أرصدة المخزون...</p>
            </div>
        </div>
    `;
    
    await loadStockData();
}

async function loadStockData() {
    try {
        const stockSnapshot = await db.collection('stockBalances').get();
        const stockItems = stockSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateStockCards(stockItems);
        setupStockSearch();
        
    } catch (error) {
        console.error('Error loading stock data:', error);
        showNotification('خطأ في تحميل أرصدة المخزون', 'danger');
    }
}

function updateStockCards(stockItems) {
    const stockCards = document.getElementById('stockCards');
    
    if (stockItems.length === 0) {
        stockCards.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    لا توجد أرصدة مسجلة في المخزون
                </div>
            </div>
        `;
        return;
    }
    
    stockCards.innerHTML = stockItems.map(item => {
        const isLowStock = item.balance <= 1;
        const cardClass = isLowStock ? 'low-stock' : '';
        
        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="stock-card ${cardClass}">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="mb-0">${item.itemName}</h5>
                        <span class="badge ${isLowStock ? 'bg-danger' : 'bg-success'}">
                            ${isLowStock ? 'منخفض' : 'متوفر'}
                        </span>
                    </div>
                    
                    <div class="text-center mb-3">
                        <div class="display-4 fw-bold ${isLowStock ? 'text-danger' : 'text-success'}">
                            ${item.balance}
                        </div>
                        <div class="text-muted">وحدة</div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="bi bi-clock"></i>
                            آخر تحديث: ${formatDate(item.lastUpdated)}
                        </small>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="viewStockHistory('${item.itemName}')">
                                <i class="bi bi-clock-history"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning" onclick="editStockBalance('${item.itemName}', ${item.balance})">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setupStockSearch() {
    const searchInput = document.getElementById('stockSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterStockCards);
    }
}

function filterStockCards() {
    const searchTerm = document.getElementById('stockSearch').value.toLowerCase();
    const allCards = document.querySelectorAll('.stock-card');
    
    allCards.forEach(card => {
        const itemName = card.querySelector('h5').textContent.toLowerCase();
        if (itemName.includes(searchTerm)) {
            card.parentElement.style.display = 'block';
        } else {
            card.parentElement.style.display = 'none';
        }
    });
}

async function viewStockHistory(itemName) {
    try {
        const movementsSnapshot = await db.collection('inventoryMovements')
            .where('itemName', '==', itemName)
            .orderBy('date', 'desc')
            .limit(20)
            .get();
        
        const movements = movementsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Create modal to show history
        const modalHtml = `
            <div class="modal fade" id="stockHistoryModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">سجل حركة الصنف: ${itemName}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>التاريخ</th>
                                            <th>النوع</th>
                                            <th>الكمية</th>
                                            <th>السعر</th>
                                            <th>القيمة</th>
                                            <th>ملاحظات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${movements.map(movement => `
                                            <tr>
                                                <td>${formatDate(movement.date)}</td>
                                                <td>
                                                    <span class="badge ${movement.type === 'purchase' ? 'bg-success' : 'bg-danger'}">
                                                        ${movement.type === 'purchase' ? 'إضافة' : 'صرف'}
                                                    </span>
                                                </td>
                                                <td>${movement.quantity}</td>
                                                <td>${movement.price ? movement.price.toFixed(2) : '-'}</td>
                                                <td>${movement.totalValue ? movement.totalValue.toFixed(2) : '-'}</td>
                                                <td>${movement.notes || '-'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('stockHistoryModal'));
        modal.show();
        
        // Remove modal from DOM when hidden
        document.getElementById('stockHistoryModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
    } catch (error) {
        console.error('Error loading stock history:', error);
        showNotification('خطأ في تحميل سجل الحركة', 'danger');
    }
}

async function editStockBalance(itemName, currentBalance) {
    const newBalance = prompt(`تعديل رصيد الصنف: ${itemName}\nالرصيد الحالي: ${currentBalance}\nأدخل الرصيد الجديد:`, currentBalance);
    
    if (newBalance !== null && !isNaN(newBalance)) {
        try {
            await db.collection('stockBalances').doc(itemName).update({
                balance: parseInt(newBalance),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentUser.email
            });
            
            showNotification('تم تحديث الرصيد بنجاح', 'success');
            await loadStockData();
            
        } catch (error) {
            console.error('Error updating stock balance:', error);
            showNotification('خطأ في تحديث الرصيد', 'danger');
        }
    }
}

function exportStockToExcel() {
    showNotification('جاري تحضير ملف Excel...', 'info');
    
    // Get all stock data
    db.collection('stockBalances').get().then(snapshot => {
        const stockData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                'اسم الصنف': data.itemName,
                'الرصيد الحالي': data.balance,
                'حالة الرصيد': data.balance <= 1 ? 'منخفض' : 'متوفر',
                'آخر تحديث': formatDate(data.lastUpdated)
            };
        });
        
        // Export to Excel
        const ws = XLSX.utils.json_to_sheet(stockData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "أرصدة المخزون");
        XLSX.writeFile(wb, \`أرصدة_المخزون_\${new Date().toISOString().split('T')[0]}.xlsx\`);
        
        showNotification('تم تصدير ملف Excel بنجاح', 'success');
    }).catch(error => {
        console.error('Error exporting to Excel:', error);
        showNotification('خطأ في تصدير ملف Excel', 'danger');
    });
}

function printStockBalance() {
    const stockCards = document.getElementById('stockCards');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(\`
        <!DOCTYPE html>
        <html dir="rtl">
            <head>
                <title>طباعة أرصدة المخزون</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .stock-card { 
                        border: 1px solid #ddd; 
                        padding: 15px; 
                        margin: 10px; 
                        display: inline-block; 
                        width: 200px; 
                        text-align: center;
                    }
                    .low-stock { border-color: #e74c3c; background-color: #ffebee; }
                    .text-danger { color: #e74c3c; }
                    .text-success { color: #27ae60; }
                    h3 { margin: 0 0 10px 0; }
                    .balance { font-size: 24px; font-weight: bold; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <h1 style="text-align: center; margin-bottom: 30px;">أرصدة المخزون</h1>
                <p style="text-align: center; margin-bottom: 30px;">التاريخ: \${new Date().toLocaleDateString('ar-EG')}</p>
                \${stockCards.innerHTML}
            </body>
        </html>
    \`);
    printWindow.document.close();
    printWindow.print();
}
