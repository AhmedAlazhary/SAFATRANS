// Inventory Management Tab Content and Functions

async function loadInventoryTab() {
    const inventoryContent = document.getElementById('inventory');
    inventoryContent.innerHTML = `
        <h2 class="mb-4">
            <i class="bi bi-box-seam"></i>
            المخزون والجرد
        </h2>
        
        <!-- Purchase Form -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">
                            <i class="bi bi-plus-circle"></i>
                            إذن إضافة
                        </h5>
                    </div>
                    <div class="card-body">
                        <form id="purchaseForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">كود الصنف</label>
                                    <select class="form-select" id="purchaseItemCode" required>
                                        <option value="">اختر الصنف</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">التاريخ</label>
                                    <input type="date" class="form-control" id="purchaseDate" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">اسم الصنف</label>
                                    <input type="text" class="form-control" id="purchaseItemName" readonly required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">سعر الشراء</label>
                                    <input type="number" class="form-control" id="purchasePrice" step="0.01" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">الكمية</label>
                                    <input type="number" class="form-control" id="purchaseQuantity" min="1" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">القيمة الإجمالية</label>
                                    <input type="number" class="form-control" id="purchaseTotalValue" readonly>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">المورد</label>
                                    <select class="form-select" id="purchaseSupplier" required>
                                        <option value="">اختر المورد</option>
                                    </select>
                                </div>
                                <div class="col-12 mb-3">
                                    <label class="form-label">ملاحظات</label>
                                    <textarea class="form-control" id="purchaseNotes" rows="2"></textarea>
                                </div>
                                <div class="col-12">
                                    <button type="submit" class="btn btn-success w-100">
                                        <i class="bi bi-plus-circle"></i>
                                        حفظ الإذن
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-danger text-white">
                        <h5 class="mb-0">
                            <i class="bi bi-dash-circle"></i>
                            إذن صرف
                        </h5>
                    </div>
                    <div class="card-body">
                        <form id="issueForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">كود الصنف</label>
                                    <select class="form-select" id="issueItemCode" required>
                                        <option value="">اختر الصنف</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">التاريخ</label>
                                    <input type="date" class="form-control" id="issueDate" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">اسم الصنف</label>
                                    <input type="text" class="form-control" id="issueItemName" readonly required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">الكمية</label>
                                    <input type="number" class="form-control" id="issueQuantity" min="1" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">القائم بالصرف</label>
                                    <input type="number" class="form-control" id="issuePrice" step="0.01" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">سبب الصرف</label>
                                    <select class="form-select" id="issueReason" required>
                                        <option value="">اختر السبب</option>
                                        <option value="صيانة">صيانة</option>
                                        <option value="بيع">بيع</option>
                                        <option value="تالف">تالف</option>
                                        <option value="أخرى">أخرى</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">رقم السيارة المستلمة</label>
                                    <select class="form-select" id="issueCarNumber">
                                        <option value="">اختر السيارة</option>
                                    </select>
                                </div>
                                <div class="col-12 mb-3">
                                    <label class="form-label">ملاحظات</label>
                                    <textarea class="form-control" id="issueNotes" rows="2"></textarea>
                                </div>
                                <div class="col-12">
                                    <button type="submit" class="btn btn-danger w-100">
                                        <i class="bi bi-dash-circle"></i>
                                        حفظ الإذن
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Movements Table -->
        <div class="card">
            <div class="card-header bg-primary text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="bi bi-list-ul"></i>
                        سجل الحركة الموحد
                    </h5>
                    <div>
                        <button class="btn btn-light btn-sm me-2" onclick="exportMovementsToExcel()">
                            <i class="bi bi-file-earmark-excel"></i>
                            تصدير Excel
                        </button>
                        <button class="btn btn-light btn-sm" onclick="printMovements()">
                            <i class="bi bi-printer"></i>
                            طباعة
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <!-- Search Box -->
                <div class="row mb-3">
                    <div class="col-md-4">
                        <div class="search-box">
                            <i class="bi bi-search"></i>
                            <input type="text" class="form-control" id="movementsSearch" placeholder="بحث بالصنف أو التاريخ...">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="movementsFilter">
                            <option value="">كل العمليات</option>
                            <option value="purchase">إضافات فقط</option>
                            <option value="issue">منصرفات فقط</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <input type="date" class="form-control" id="movementsDateFrom" placeholder="من تاريخ">
                    </div>
                    <div class="col-md-3">
                        <input type="date" class="form-control" id="movementsDateTo" placeholder="إلى تاريخ">
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>التاريخ</th>
                                <th>كود الصنف</th>
                                <th>اسم الصنف</th>
                                <th>نوع العملية</th>
                                <th>الكمية</th>
                                <th>السعر</th>
                                <th>القيمة</th>
                                <th>المورد/السيارة</th>
                                <th>سبب الصرف</th>
                                <th>ملاحظات</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="movementsTable">
                            <tr>
                                <td colspan="11" class="text-center text-muted">جاري تحميل البيانات...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Initialize form event listeners and load data
    initializeInventoryForms();
    await loadInventoryData();
}

function initializeInventoryForms() {
    // Set default dates
    const today = getCurrentDate();
    document.getElementById('purchaseDate').value = today;
    document.getElementById('issueDate').value = today;
    
    // Populate dropdowns
    populateInventoryDropdowns();
    
    // Setup form event listeners
    document.getElementById('purchaseForm').addEventListener('submit', handlePurchaseSubmit);
    document.getElementById('issueForm').addEventListener('submit', handleIssueSubmit);
    
    // Setup search and filters
    document.getElementById('movementsSearch').addEventListener('input', filterMovements);
    document.getElementById('movementsFilter').addEventListener('change', filterMovements);
    document.getElementById('movementsDateFrom').addEventListener('change', filterMovements);
    document.getElementById('movementsDateTo').addEventListener('change', filterMovements);
    
    // Setup item code change handlers
    document.getElementById('purchaseItemCode').addEventListener('change', handlePurchaseItemChange);
    document.getElementById('issueItemCode').addEventListener('change', handleIssueItemChange);
    
    // Setup quantity and price calculation
    document.getElementById('purchaseQuantity').addEventListener('input', calculatePurchaseTotal);
    document.getElementById('purchasePrice').addEventListener('input', calculatePurchaseTotal);
}

function populateInventoryDropdowns() {
    // Populate item dropdowns
    const purchaseItemCode = document.getElementById('purchaseItemCode');
    const issueItemCode = document.getElementById('issueItemCode');
    
    purchaseItemCode.innerHTML = '<option value="">اختر الصنف</option>';
    issueItemCode.innerHTML = '<option value="">اختر الصنف</option>';
    
    masterData.items.forEach((item, index) => {
        purchaseItemCode.innerHTML += `<option value="${index}">${item}</option>`;
        issueItemCode.innerHTML += `<option value="${index}">${item}</option>`;
    });
    
    // Populate suppliers dropdown
    const purchaseSupplier = document.getElementById('purchaseSupplier');
    purchaseSupplier.innerHTML = '<option value="">اختر المورد</option>';
    masterData.suppliers.forEach(supplier => {
        purchaseSupplier.innerHTML += `<option value="${supplier}">${supplier}</option>`;
    });
    
    // Populate car numbers dropdown
    const issueCarNumber = document.getElementById('issueCarNumber');
    issueCarNumber.innerHTML = '<option value="">اختر السيارة</option>';
    masterData.cars.forEach(car => {
        issueCarNumber.innerHTML += `<option value="${car}">${car}</option>`;
    });
}

function handlePurchaseItemChange() {
    const itemCode = document.getElementById('purchaseItemCode').value;
    const itemName = document.getElementById('purchaseItemName');
    
    if (itemCode !== '') {
        itemName.value = masterData.items[itemCode];
    } else {
        itemName.value = '';
    }
}

function handleIssueItemChange() {
    const itemCode = document.getElementById('issueItemCode').value;
    const itemName = document.getElementById('issueItemName');
    
    if (itemCode !== '') {
        itemName.value = masterData.items[itemCode];
    } else {
        itemName.value = '';
    }
}

function calculatePurchaseTotal() {
    const quantity = parseFloat(document.getElementById('purchaseQuantity').value) || 0;
    const price = parseFloat(document.getElementById('purchasePrice').value) || 0;
    const total = quantity * price;
    document.getElementById('purchaseTotalValue').value = total.toFixed(2);
}

async function handlePurchaseSubmit(e) {
    e.preventDefault();
    
    const purchaseData = {
        type: 'purchase',
        date: new Date(document.getElementById('purchaseDate').value),
        itemCode: document.getElementById('purchaseItemCode').value,
        itemName: document.getElementById('purchaseItemName').value,
        price: parseFloat(document.getElementById('purchasePrice').value),
        quantity: parseInt(document.getElementById('purchaseQuantity').value),
        totalValue: parseFloat(document.getElementById('purchaseTotalValue').value),
        supplier: document.getElementById('purchaseSupplier').value,
        notes: document.getElementById('purchaseNotes').value,
        createdBy: currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('inventoryMovements').add(purchaseData);
        await updateStockBalance(purchaseData.itemName, purchaseData.quantity, 'add');
        
        // Reset form
        document.getElementById('purchaseForm').reset();
        document.getElementById('purchaseDate').value = getCurrentDate();
        calculatePurchaseTotal();
        
        showNotification('تم حفظ إذن الإضافة بنجاح', 'success');
        await loadMovementsTable();
        
    } catch (error) {
        console.error('Error saving purchase:', error);
        showNotification('خطأ في حفظ إذن الإضافة', 'danger');
    }
}

async function handleIssueSubmit(e) {
    e.preventDefault();
    
    const issueData = {
        type: 'issue',
        date: new Date(document.getElementById('issueDate').value),
        itemCode: document.getElementById('issueItemCode').value,
        itemName: document.getElementById('issueItemName').value,
        quantity: parseInt(document.getElementById('issueQuantity').value),
        price: parseFloat(document.getElementById('issuePrice').value),
        reason: document.getElementById('issueReason').value,
        carNumber: document.getElementById('issueCarNumber').value,
        notes: document.getElementById('issueNotes').value,
        createdBy: currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Check if enough stock is available
        const stockDoc = await db.collection('stockBalances').doc(issueData.itemName).get();
        if (stockDoc.exists) {
            const currentBalance = stockDoc.data().balance || 0;
            if (currentBalance < issueData.quantity) {
                showNotification('الرصيد المتاح غير كافي لهذه الكمية', 'warning');
                return;
            }
        }
        
        await db.collection('inventoryMovements').add(issueData);
        await updateStockBalance(issueData.itemName, issueData.quantity, 'subtract');
        
        // Reset form
        document.getElementById('issueForm').reset();
        document.getElementById('issueDate').value = getCurrentDate();
        
        showNotification('تم حفظ إذن الصرف بنجاح', 'success');
        await loadMovementsTable();
        
    } catch (error) {
        console.error('Error saving issue:', error);
        showNotification('خطأ في حفظ إذن الصرف', 'danger');
    }
}

async function updateStockBalance(itemName, quantity, operation) {
    const stockDoc = await db.collection('stockBalances').doc(itemName).get();
    let currentBalance = 0;
    
    if (stockDoc.exists) {
        currentBalance = stockDoc.data().balance || 0;
    }
    
    const newBalance = operation === 'add' ? currentBalance + quantity : currentBalance - quantity;
    
    await db.collection('stockBalances').doc(itemName).set({
        itemName: itemName,
        balance: newBalance,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
}

async function loadInventoryData() {
    await loadMovementsTable();
}

async function loadMovementsTable() {
    try {
        const movementsSnapshot = await db.collection('inventoryMovements')
            .orderBy('date', 'desc')
            .limit(100)
            .get();
        
        const movements = movementsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateMovementsTable(movements);
        
    } catch (error) {
        console.error('Error loading movements:', error);
        showNotification('خطأ في تحميل سجل الحركة', 'danger');
    }
}

function updateMovementsTable(movements) {
    const tbody = document.getElementById('movementsTable');
    
    if (movements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">لا توجد حركات مسجلة</td></tr>';
        return;
    }
    
    tbody.innerHTML = movements.map(movement => `
        <tr>
            <td>${formatDate(movement.date)}</td>
            <td>${movement.itemCode}</td>
            <td>${movement.itemName}</td>
            <td>
                <span class="badge ${movement.type === 'purchase' ? 'bg-success' : 'bg-danger'}">
                    ${movement.type === 'purchase' ? 'إضافة' : 'صرف'}
                </span>
            </td>
            <td>${movement.quantity}</td>
            <td>${movement.price ? movement.price.toFixed(2) : '-'}</td>
            <td>${movement.totalValue ? movement.totalValue.toFixed(2) : '-'}</td>
            <td>${movement.supplier || movement.carNumber || '-'}</td>
            <td>${movement.reason || '-'}</td>
            <td>${movement.notes || '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteMovement('${movement.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function deleteMovement(movementId) {
    if (!confirm('هل أنت متأكد من حذف هذه الحركة؟')) return;
    
    try {
        const movementDoc = await db.collection('inventoryMovements').doc(movementId).get();
        const movement = movementDoc.data();
        
        // Reverse the stock balance update
        const quantityChange = movement.type === 'purchase' ? -movement.quantity : movement.quantity;
        await updateStockBalance(movement.itemName, Math.abs(quantityChange), 
                                  movement.type === 'purchase' ? 'subtract' : 'add');
        
        // Delete the movement
        await db.collection('inventoryMovements').doc(movementId).delete();
        
        showNotification('تم حذف الحركة بنجاح', 'success');
        await loadMovementsTable();
        
    } catch (error) {
        console.error('Error deleting movement:', error);
        showNotification('خطأ في حذف الحركة', 'danger');
    }
}

function filterMovements() {
    const searchTerm = document.getElementById('movementsSearch').value.toLowerCase();
    const filterType = document.getElementById('movementsFilter').value;
    const dateFrom = document.getElementById('movementsDateFrom').value;
    const dateTo = document.getElementById('movementsDateTo').value;
    
    // This would need to be implemented with client-side filtering
    // For now, just reload the data
    loadMovementsTable();
}

function exportMovementsToExcel() {
    showNotification('جاري تحضير ملف Excel...', 'info');
    // Implementation would go here
}

function printMovements() {
    printElement('movementsTable');
}
