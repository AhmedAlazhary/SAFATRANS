// Garage Custody Tab Content and Functions

async function loadGarageCustody() {
    const custodyContent = document.getElementById('garage-custody');
    custodyContent.innerHTML = `
        <h2 class="mb-4">
            <i class="bi bi-safe2"></i>
            عهدة الجراج
        </h2>
        
        <!-- Summary Cards -->
        <div class="row mb-4">
            <div class="col-md-4 mb-3">
                <div class="summary-card" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                    <i class="bi bi-arrow-down-circle" style="font-size: 2rem;"></i>
                    <div class="summary-number" id="totalCustodyIn">0</div>
                    <div>إجمالي الوارد للعهدة</div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="summary-card" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                    <i class="bi bi-arrow-up-circle" style="font-size: 2rem;"></i>
                    <div class="summary-number" id="totalCustodyOut">0</div>
                    <div>إجمالي المصروف من العهدة</div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="summary-card" style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%);">
                    <i class="bi bi-cash-stack" style="font-size: 2rem;"></i>
                    <div class="summary-number" id="netCustodyBalance">0</div>
                    <div>صافي المتبقي بالخزينة</div>
                </div>
            </div>
        </div>
        
        <!-- Add Custody Form -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">
                            <i class="bi bi-plus-circle"></i>
                            إضافة عهدة
                        </h5>
                    </div>
                    <div class="card-body">
                        <form id="addCustodyForm">
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <label class="form-label">التاريخ</label>
                                    <input type="date" class="form-control" id="custodyDate" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">المحاسب</label>
                                    <select class="form-select" id="custodyAccountant" required>
                                        <option value="">اختر المحاسب</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">القيمة</label>
                                    <input type="number" class="form-control" id="custodyAmount" step="0.01" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">المستلم</label>
                                    <select class="form-select" id="custodyRecipient" required>
                                        <option value="">اختر المستلم</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">سبب الإضافة</label>
                                    <input type="text" class="form-control" id="custodyReason" required>
                                </div>
                                <div class="col-12 mb-3">
                                    <label class="form-label">ملاحظات</label>
                                    <textarea class="form-control" id="custodyNotes" rows="2"></textarea>
                                </div>
                                <div class="col-12">
                                    <button type="submit" class="btn btn-success w-100">
                                        <i class="bi bi-plus-circle"></i>
                                        حفظ العهدة
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
                            صرف عهدة
                        </h5>
                    </div>
                    <div class="card-body">
                        <form id="spendCustodyForm">
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <label class="form-label">التاريخ</label>
                                    <input type="date" class="form-control" id="spendDate" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">المحاسب</label>
                                    <select class="form-select" id="spendAccountant" required>
                                        <option value="">اختر المحاسب</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">القيمة</label>
                                    <input type="number" class="form-control" id="spendAmount" step="0.01" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">المستلم</label>
                                    <select class="form-select" id="spendRecipient" required>
                                        <option value="">اختر المستلم</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">سبب الصرف</label>
                                    <input type="text" class="form-control" id="spendReason" required>
                                </div>
                                <div class="col-12 mb-3">
                                    <label class="form-label">ملاحظات</label>
                                    <textarea class="form-control" id="spendNotes" rows="2"></textarea>
                                </div>
                                <div class="col-12">
                                    <button type="submit" class="btn btn-danger w-100">
                                        <i class="bi bi-dash-circle"></i>
                                        حفظ الصرف
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Custody Transactions Table -->
        <div class="card">
            <div class="card-header bg-primary text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="bi bi-list-ul"></i>
                        سجل عهدة الجراج
                    </h5>
                    <div>
                        <button class="btn btn-light btn-sm me-2" onclick="exportCustodyToExcel()">
                            <i class="bi bi-file-earmark-excel"></i>
                            تصدير Excel
                        </button>
                        <button class="btn btn-light btn-sm" onclick="printCustody()">
                            <i class="bi bi-printer"></i>
                            طباعة
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <!-- Search and Filter -->
                <div class="row mb-3">
                    <div class="col-md-4">
                        <div class="search-box">
                            <i class="bi bi-search"></i>
                            <input type="text" class="form-control" id="custodySearch" placeholder="بحث بالسبب أو المستلم...">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="custodyFilter">
                            <option value="">كل العمليات</option>
                            <option value="addition">إضافات فقط</option>
                            <option value="spending">صروف فقط</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <input type="date" class="form-control" id="custodyDateFrom" placeholder="من تاريخ">
                    </div>
                    <div class="col-md-3">
                        <input type="date" class="form-control" id="custodyDateTo" placeholder="إلى تاريخ">
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>التاريخ</th>
                                <th>المحاسب</th>
                                <th>نوع العملية</th>
                                <th>القيمة</th>
                                <th>المستلم</th>
                                <th>السبب</th>
                                <th>ملاحظات</th>
                                <th>حذف</th>
                                <th>تعديل</th>
                            </tr>
                        </thead>
                        <tbody id="custodyTable">
                            <tr>
                                <td colspan="9" class="text-center text-muted">جاري تحميل البيانات...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Initialize form event listeners and load data
    initializeCustodyForms();
    await loadCustodyData();
}

function initializeCustodyForms() {
    // Set default dates
    const today = getCurrentDate();
    document.getElementById('custodyDate').value = today;
    document.getElementById('spendDate').value = today;
    
    // Populate dropdowns
    populateCustodyDropdowns();
    
    // Setup form event listeners
    document.getElementById('addCustodyForm').addEventListener('submit', handleAddCustody);
    document.getElementById('spendCustodyForm').addEventListener('submit', handleSpendCustody);
    
    // Setup search and filters
    document.getElementById('custodySearch').addEventListener('input', filterCustodyTransactions);
    document.getElementById('custodyFilter').addEventListener('change', filterCustodyTransactions);
    document.getElementById('custodyDateFrom').addEventListener('change', filterCustodyTransactions);
    document.getElementById('custodyDateTo').addEventListener('change', filterCustodyTransactions);
}

function populateCustodyDropdowns() {
    // Populate accountants dropdowns
    var accountants = ['أحمد محمد', 'محمد علي', 'خالد أحمد', 'عمر خالد']; // Can be moved to master data
    
    var custodyAccountant = document.getElementById('custodyAccountant');
    var spendAccountant = document.getElementById('spendAccountant');
    
    custodyAccountant.innerHTML = '<option value="">اختر المحاسب</option>';
    spendAccountant.innerHTML = '<option value="">اختر المحاسب</option>';
    
    accountants.forEach(function(accountant) {
        custodyAccountant.innerHTML += '<option value="' + accountant + '">' + accountant + '</option>';
        spendAccountant.innerHTML += '<option value="' + accountant + '">' + accountant + '</option>';
    });
    
    // Populate recipients dropdowns
    var recipients = [];
    if (masterData && masterData.workers && masterData.drivers) {
        recipients = masterData.workers.concat(masterData.drivers);
    }
    
    var custodyRecipient = document.getElementById('custodyRecipient');
    var spendRecipient = document.getElementById('spendRecipient');
    
    custodyRecipient.innerHTML = '<option value="">اختر المستلم</option>';
    spendRecipient.innerHTML = '<option value="">اختر المستلم</option>';
    
    recipients.forEach(function(recipient) {
        custodyRecipient.innerHTML += '<option value="' + recipient + '">' + recipient + '</option>';
        spendRecipient.innerHTML += '<option value="' + recipient + '">' + recipient + '</option>';
    });
}

async function handleAddCustody(e) {
    e.preventDefault();
    
    var custodyData = {
        type: 'addition',
        date: new Date(document.getElementById('custodyDate').value),
        accountant: document.getElementById('custodyAccountant').value,
        amount: parseFloat(document.getElementById('custodyAmount').value),
        recipient: document.getElementById('custodyRecipient').value,
        reason: document.getElementById('custodyReason').value,
        notes: document.getElementById('custodyNotes').value,
        createdBy: currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('garageCustody').add(custodyData);
        
        // Reset form
        document.getElementById('addCustodyForm').reset();
        document.getElementById('custodyDate').value = getCurrentDate();
        
        showNotification('تم حفظ العهدة بنجاح', 'success');
        await loadCustodyTable();
        await calculateCustodySummary();
        
    } catch (error) {
        console.error('Error saving custody:', error);
        showNotification('خطأ في حفظ العهدة', 'danger');
    }
}

async function handleSpendCustody(e) {
    e.preventDefault();
    
    var spendData = {
        type: 'spending',
        date: new Date(document.getElementById('spendDate').value),
        accountant: document.getElementById('spendAccountant').value,
        amount: parseFloat(document.getElementById('spendAmount').value),
        recipient: document.getElementById('spendRecipient').value,
        reason: document.getElementById('spendReason').value,
        notes: document.getElementById('spendNotes').value,
        createdBy: currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('garageCustody').add(spendData);
        
        // Reset form
        document.getElementById('spendCustodyForm').reset();
        document.getElementById('spendDate').value = getCurrentDate();
        
        showNotification('تم حفظ الصرف بنجاح', 'success');
        await loadCustodyTable();
        await calculateCustodySummary();
        
    } catch (error) {
        console.error('Error saving spend:', error);
        showNotification('خطأ في حفظ الصرف', 'danger');
    }
}

async function loadCustodyData() {
    await loadCustodyTable();
    await calculateCustodySummary();
}

async function loadCustodyTable() {
    try {
        const custodySnapshot = await db.collection('garageCustody')
            .orderBy('date', 'desc')
            .limit(50)
            .get();
        
        const custodyTransactions = custodySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateCustodyTable(custodyTransactions);
        
    } catch (error) {
        console.error('Error loading custody data:', error);
        showNotification('خطأ في تحميل سجل العهدة', 'danger');
    }
}

function updateCustodyTable(transactions) {
    var tbody = document.getElementById('custodyTable');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">لا توجد حركات مسجلة</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(function(transaction) {
        var typeClass = transaction.type === 'addition' ? 'bg-success' : 'bg-danger';
        var typeText = transaction.type === 'addition' ? 'إضافة' : 'صرف';
        
        return '<tr>' +
            '<td>' + formatDate(transaction.date) + '</td>' +
            '<td>' + transaction.accountant + '</td>' +
            '<td><span class="badge ' + typeClass + '">' + typeText + '</span></td>' +
            '<td class="fw-bold">' + transaction.amount.toFixed(2) + '</td>' +
            '<td>' + transaction.recipient + '</td>' +
            '<td>' + transaction.reason + '</td>' +
            '<td>' + (transaction.notes || '-') + '</td>' +
            '<td><button class="btn btn-sm btn-danger" onclick="deleteCustodyTransaction(\'' + transaction.id + '\')"><i class="bi bi-trash"></i></button></td>' +
            '<td><button class="btn btn-sm btn-info" onclick="editCustodyTransaction(\'' + transaction.id + '\')"><i class="bi bi-pencil"></i></button></td>' +
        '</tr>';
    }).join('');
}

async function calculateCustodySummary() {
    try {
        var custodySnapshot = await db.collection('garageCustody').get();
        var transactions = custodySnapshot.docs.map(function(doc) { return doc.data(); });
        
        var additions = transactions.filter(function(t) { return t.type === 'addition'; });
        var spendings = transactions.filter(function(t) { return t.type === 'spending'; });
        
        var totalIn = additions.reduce(function(sum, t) { return sum + t.amount; }, 0);
        var totalOut = spendings.reduce(function(sum, t) { return sum + t.amount; }, 0);
        var netBalance = totalIn - totalOut;
        
        // Update summary cards
        document.getElementById('totalCustodyIn').textContent = totalIn.toFixed(2);
        document.getElementById('totalCustodyOut').textContent = totalOut.toFixed(2);
        document.getElementById('netCustodyBalance').textContent = netBalance.toFixed(2);
        
    } catch (error) {
        console.error('Error calculating custody summary:', error);
    }
}

async function deleteCustodyTransaction(transactionId) {
    if (!confirm('هل أنت متأكد من حذف هذه الحركة؟')) return;
    
    try {
        await db.collection('garageCustody').doc(transactionId).delete();
        
        showNotification('تم حذف الحركة بنجاح', 'success');
        await loadCustodyTable();
        await calculateCustodySummary();
        
    } catch (error) {
        console.error('Error deleting custody transaction:', error);
        showNotification('خطأ في حذف الحركة', 'danger');
    }
}

function editCustodyTransaction(transactionId) {
    // Create edit modal
    const modalHtml = '<div class="modal fade" id="editCustodyModal" tabindex="-1">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<h5 class="modal-title">تعديل حركة العهدة</h5>' +
        '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>' +
        '</div>' +
        '<div class="modal-body">' +
        '<form id="editCustodyForm">' +
        '<div class="row">' +
        '<div class="col-md-6 mb-3">' +
        '<label class="form-label">التاريخ</label>' +
        '<input type="date" class="form-control" id="editCustodyDate" required>' +
        '</div>' +
        '<div class="col-md-6 mb-3">' +
        '<label class="form-label">القيمة</label>' +
        '<input type="number" class="form-control" id="editCustodyAmount" step="0.01" required>' +
        '</div>' +
        '<div class="col-md-6 mb-3">' +
        '<label class="form-label">المستلم</label>' +
        '<select class="form-select" id="editCustodyRecipient" required>' +
        '<option value="">اختر المستلم</option>' +
        '</select>' +
        '</div>' +
        '<div class="col-md-6 mb-3">' +
        '<label class="form-label">السبب</label>' +
        '<input type="text" class="form-control" id="editCustodyReason" required>' +
        '</div>' +
        '<div class="col-12 mb-3">' +
        '<label class="form-label">ملاحظات</label>' +
        '<textarea class="form-control" id="editCustodyNotes" rows="2"></textarea>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>' +
        '<button type="button" class="btn btn-primary" onclick="saveEditedCustody(\'' + transactionId + '\')">حفظ التعديلات</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Load transaction data and populate form
    loadCustodyData(transactionId);
    
    const modal = new bootstrap.Modal(document.getElementById('editCustodyModal'));
    modal.show();
    
    // Remove modal when hidden
    document.getElementById('editCustodyModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function loadCustodyData(transactionId) {
    try {
        const transactionDoc = await db.collection('garageCustody').doc(transactionId).get();
        const transaction = transactionDoc.data();
        
        // Populate form with current data
        document.getElementById('editCustodyDate').value = transaction.date.toDate ? transaction.date.toDate().toISOString().split('T')[0] : new Date(transaction.date).toISOString().split('T')[0];
        document.getElementById('editCustodyAmount').value = transaction.amount;
        document.getElementById('editCustodyReason').value = transaction.reason;
        document.getElementById('editCustodyNotes').value = transaction.notes || '';
        
        // Populate recipients dropdown
        const recipientsSelect = document.getElementById('editCustodyRecipient');
        recipientsSelect.innerHTML = '<option value="">اختر المستلم</option>';
        if (masterData && masterData.workers && masterData.drivers) {
            var recipients = masterData.workers.concat(masterData.drivers);
            recipients.forEach(function(person) {
                var selected = person === transaction.recipient ? 'selected' : '';
                recipientsSelect.innerHTML += '<option value="' + person + '" ' + selected + '>' + person + '</option>';
            });
        }
        
        // Store transaction data globally for save function
        window.currentCustodyTransaction = transaction;
        
    } catch (error) {
        console.error('Error loading custody data:', error);
        showNotification('خطأ في تحميل بيانات الحركة', 'danger');
    }
}

async function saveEditedCustody(transactionId) {
    try {
        const originalTransaction = window.currentCustodyTransaction;
        const newAmount = parseFloat(document.getElementById('editCustodyAmount').value);
        const newRecipient = document.getElementById('editCustodyRecipient').value;
        const newReason = document.getElementById('editCustodyReason').value;
        const newNotes = document.getElementById('editCustodyNotes').value;
        const newDate = new Date(document.getElementById('editCustodyDate').value);
        
        // Update transaction document
        await db.collection('garageCustody').doc(transactionId).update({
            date: newDate,
            amount: newAmount,
            recipient: newRecipient,
            reason: newReason,
            notes: newNotes,
            updatedBy: currentUser.email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('editCustodyModal')).hide();
        showNotification('تم تعديل الحركة بنجاح', 'success');
        await loadCustodyTable();
        await calculateCustodySummary();
        
    } catch (error) {
        console.error('Error saving edited custody:', error);
        showNotification('خطأ في حفظ التعديلات', 'danger');
    }
}

function filterCustodyTransactions() {
    const searchTerm = document.getElementById('custodySearch').value.toLowerCase();
    const filterType = document.getElementById('custodyFilter').value;
    const dateFrom = document.getElementById('custodyDateFrom').value;
    const dateTo = document.getElementById('custodyDateTo').value;
    
    // This would need to be implemented with client-side filtering
    // For now, just reload the data
    loadCustodyTable();
}

function exportCustodyToExcel() {
    showNotification('جاري تحضير ملف Excel...', 'info');
    
    // Get all custody data
    db.collection('garageCustody').get().then(function(snapshot) {
        var custodyData = snapshot.docs.map(function(doc) {
            var data = doc.data();
            return {
                'التاريخ': formatDate(data.date),
                'المحاسب': data.accountant,
                'نوع العملية': data.type === 'addition' ? 'إضافة' : 'صرف',
                'القيمة': data.amount,
                'المستلم': data.recipient,
                'السبب': data.reason,
                'ملاحظات': data.notes || ''
            };
        });
        
        // Export to Excel
        ExcelExporter.exportToExcel(custodyData, 'عهدة_الجراج_' + new Date().toISOString().split('T')[0] + '.xlsx');
        
    }).catch(function(error) {
        console.error('Error exporting to Excel:', error);
        showNotification('خطأ في تصدير ملف Excel', 'danger');
    });
}

function printCustody() {
    const custodyTable = document.getElementById('custodyTable');
    var printWindow = window.open('', '_blank');
    var htmlContent = '<!DOCTYPE html><html dir="rtl"><head><title>طباعة عهدة الجراج</title>' +
        '<style>body { font-family: Arial, sans-serif; margin: 20px; }' +
        'table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }' +
        'th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }' +
        'th { background-color: #f2f2f2; }' +
        '.badge-success { background-color: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px; }' +
        '.badge-danger { background-color: #f8d7da; color: #721c24; padding: 2px 6px; border-radius: 3px; }' +
        '.summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }' +
        '@media print { .no-print { display: none; } }</style></head><body>' +
        '<h1 style="text-align: center; margin-bottom: 30px;">عهدة الجراج</h1>' +
        '<p style="text-align: center; margin-bottom: 30px;">التاريخ: ' + new Date().toLocaleDateString('ar-EG') + '</p>' +
        '<div class="summary"><div style="display: flex; justify-content: space-around;">' +
        '<div>إجمالي الوارد: <span id="totalCustodyIn"></span></div>' +
        '<div>إجمالي المصروف: <span id="totalCustodyOut"></span></div>' +
        '<div>الصافي المتبقي: <span id="netCustodyBalance"></span></div></div></div>' +
        '<table><thead><tr><th>التاريخ</th><th>المحاسب</th><th>نوع العملية</th><th>القيمة</th><th>المستلم</th><th>السبب</th><th>ملاحظات</th></tr></thead>' +
        '<tbody>' + custodyTable.innerHTML + '</tbody></table></body></html>';
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
}
