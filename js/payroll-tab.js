// Payroll & Loans Tab Content and Functions

async function loadPayroll() {
    const payrollContent = document.getElementById('payroll');
    const content = `
        <h2 class="mb-4">
            <i class="bi bi-cash-stack"></i>
            السلف والمرتبات
        </h2>
        
        <!-- Navigation Tabs -->
        <ul class="nav nav-tabs mb-4" id="payrollTabs">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" data-bs-target="#salariesTab">جدول المرتبات</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" data-bs-target="#loansTab">سلف الحاج</a>
            </li>
        </ul>
        
        <!-- Tab Content -->
        <div class="tab-content">
            <!-- Salaries Tab -->
            <div class="tab-pane fade show active" id="salariesTab">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">
                                <i class="bi bi-people"></i>
                                جدول المرتبات
                            </h5>
                            <div>
                                <button class="btn btn-light btn-sm me-2" onclick="addSalary()">
                                    <i class="bi bi-plus-circle"></i>
                                    إضافة مرتب
                                </button>
                                <button class="btn btn-light btn-sm me-2" onclick="exportSalariesToExcel()">
                                    <i class="bi bi-file-earmark-excel"></i>
                                    تصدير Excel
                                </button>
                                <button class="btn btn-light btn-sm" onclick="printSalaries()">
                                    <i class="bi bi-printer"></i>
                                    طباعة
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Month and Year Selection -->
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label class="form-label">اختر الشهر</label>
                                <select class="form-select" id="salaryMonth">
                                    <option value="1">يناير</option>
                                    <option value="2">فبراير</option>
                                    <option value="3">مارس</option>
                                    <option value="4">أبريل</option>
                                    <option value="5">مايو</option>
                                    <option value="6">يونيو</option>
                                    <option value="7">يوليو</option>
                                    <option value="8">أغسطس</option>
                                    <option value="9">سبتمبر</option>
                                    <option value="10">أكتوبر</option>
                                    <option value="11">نوفمبر</option>
                                    <option value="12">ديسمبر</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">السنة</label>
                                <input type="number" class="form-control" id="salaryYear" value="${new Date().getFullYear()}" min="2020" max="2030">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">البحث</label>
                                <input type="text" class="form-control" id="salarySearch" placeholder="بحث باسم العامل...">
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>الشهر</th>
                                        <th>اسم العامل</th>
                                        <th>الراتب</th>
                                        <th>السلفة</th>
                                        <th>القابل للتحويل</th>
                                        <th>المتبقي</th>
                                        <th>المستلم</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody id="salariesTable">
                                    <tr>
                                        <td colspan="8" class="text-center text-muted">جاري تحميل البيانات...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Loans Tab -->
            <div class="tab-pane fade" id="loansTab">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">
                                <i class="bi bi-cash"></i>
                                سلف الحاج
                            </h5>
                            <div>
                                <button class="btn btn-light btn-sm me-2" onclick="addLoan()">
                                    <i class="bi bi-plus-circle"></i>
                                    إضافة سلفة
                                </button>
                                <button class="btn btn-light btn-sm me-2" onclick="exportLoansToExcel()">
                                    <i class="bi bi-file-earmark-excel"></i>
                                    تصدير Excel
                                </button>
                                <button class="btn btn-light btn-sm" onclick="printLoans()">
                                    <i class="bi bi-printer"></i>
                                    طباعة
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Summary Card -->
                        <div class="alert alert-info mb-3">
                            <h6>إجمالي السلف المسلمة من الحاج: <span id="totalLoansAmount">0</span> جنيه</h6>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>التاريخ</th>
                                        <th>اسم العامل</th>
                                        <th>المبلغ</th>
                                        <th>السبب</th>
                                        <th>المستلم</th>
                                        <th>ملاحظات</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody id="loansTable">
                                    <tr>
                                        <td colspan="7" class="text-center text-muted">جاري تحميل البيانات...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Use safe HTML setting
    if (window.securityEnhancer) {
        window.securityEnhancer.safeSetHTML(payrollContent, content);
    } else if (window.advancedSecurity) {
        payrollContent.innerHTML = window.advancedSecurity.sanitizeHTML(content);
    } else {
        payrollContent.innerHTML = content;
    }
    
    // Initialize event listeners and load data
    initializePayrollForms();
    await loadPayrollData();
}

function initializePayrollForms() {
    // Set current month
    const currentMonth = new Date().getMonth() + 1;
    document.getElementById('salaryMonth').value = currentMonth;
    
    // Setup event listeners
    document.getElementById('salaryMonth').addEventListener('change', loadSalariesTable);
    document.getElementById('salaryYear').addEventListener('change', loadSalariesTable);
    document.getElementById('salarySearch').addEventListener('input', filterSalaries);
}

async function loadPayrollData() {
    await loadSalariesTable();
    await loadLoansTable();
    await calculateTotalLoans();
}

async function loadSalariesTable() {
    try {
        const month = document.getElementById('salaryMonth').value;
        const year = document.getElementById('salaryYear').value;
        
        const salariesSnapshot = await db.collection('salaries')
            .where('month', '==', parseInt(month))
            .where('year', '==', parseInt(year))
            .get();
        
        const salaries = salariesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateSalariesTable(salaries);
        
    } catch (error) {
        console.error('Error loading salaries:', error);
        showNotification('خطأ في تحميل بيانات المرتبات', 'danger');
    }
}

function updateSalariesTable(salaries) {
    const tbody = document.getElementById('salariesTable');
    
    if (salaries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">لا توجد بيانات مرتبات لهذا الشهر</td></tr>';
        return;
    }
    
    tbody.innerHTML = salaries.map(salary => {
        const netTransferable = salary.salary - (salary.loan || 0);
        const remaining = netTransferable - (salary.received || 0);
        
        return `
            <tr>
                <td>${getMonthName(salary.month)} ${salary.year}</td>
                <td>${salary.workerName}</td>
                <td class="fw-bold">${salary.salary.toFixed(2)}</td>
                <td class="text-danger">${(salary.loan || 0).toFixed(2)}</td>
                <td class="text-success">${netTransferable.toFixed(2)}</td>
                <td class="text-info">${remaining.toFixed(2)}</td>
                <td>${salary.received ? 'نعم' : 'لا'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editSalary('${salary.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSalary('${salary.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadLoansTable() {
    try {
        const loansSnapshot = await db.collection('hajLoans')
            .orderBy('date', 'desc')
            .limit(50)
            .get();
        
        const loans = loansSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateLoansTable(loans);
        
    } catch (error) {
        console.error('Error loading loans:', error);
        showNotification('خطأ في تحميل بيانات السلف', 'danger');
    }
}

function updateLoansTable(loans) {
    const tbody = document.getElementById('loansTable');
    
    if (loans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">لا توجد سلف مسجلة</td></tr>';
        return;
    }
    
    tbody.innerHTML = loans.map(loan => `
        <tr>
            <td>${formatDate(loan.date)}</td>
            <td>${loan.workerName}</td>
            <td class="fw-bold text-danger">${loan.amount.toFixed(2)}</td>
            <td>${loan.reason}</td>
            <td>${loan.receivedBy}</td>
            <td>${loan.notes || '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editLoan('${loan.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteLoan('${loan.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function calculateTotalLoans() {
    try {
        const loansSnapshot = await db.collection('hajLoans').get();
        const loans = loansSnapshot.docs.map(doc => doc.data());
        
        const totalLoans = loans.reduce((sum, loan) => sum + loan.amount, 0);
        document.getElementById('totalLoansAmount').textContent = totalLoans.toFixed(2);
        
    } catch (error) {
        console.error('Error calculating total loans:', error);
    }
}

function addSalary() {
    const modalHtml = `
        <div class="modal fade" id="addSalaryModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">إضافة مرتب جديد</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addSalaryForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">الشهر</label>
                                    <select class="form-select" id="newSalaryMonth" required>
                                        <option value="1">يناير</option>
                                        <option value="2">فبراير</option>
                                        <option value="3">مارس</option>
                                        <option value="4">أبريل</option>
                                        <option value="5">مايو</option>
                                        <option value="6">يونيو</option>
                                        <option value="7">يوليو</option>
                                        <option value="8">أغسطس</option>
                                        <option value="9">سبتمبر</option>
                                        <option value="10">أكتوبر</option>
                                        <option value="11">نوفمبر</option>
                                        <option value="12">ديسمبر</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">السنة</label>
                                    <input type="number" class="form-control" id="newSalaryYear" value="${new Date().getFullYear()}" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">اسم العامل</label>
                                    <select class="form-select" id="newSalaryWorker" required>
                                        <option value="">اختر العامل</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">الراتب</label>
                                    <input type="number" class="form-control" id="newSalaryAmount" step="0.01" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">السلفة</label>
                                    <input type="number" class="form-control" id="newSalaryLoan" step="0.01" value="0">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">المستلم</label>
                                    <select class="form-select" id="newSalaryRecipient">
                                        <option value="">اختر المستلم</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">ملاحظات</label>
                                    <textarea class="form-control" id="newSalaryNotes" rows="2"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="button" class="btn btn-primary" onclick="saveNewSalary()">حفظ</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Populate workers dropdown
    const workersSelect = document.getElementById('newSalaryWorker');
    workersSelect.innerHTML = '<option value="">اختر العامل</option>';
    masterData.workers.forEach(worker => {
        workersSelect.innerHTML += `<option value="${worker}">${worker}</option>`;
    });
    
    const recipientsSelect = document.getElementById('newSalaryRecipient');
    recipientsSelect.innerHTML = '<option value="">اختر المستلم</option>';
    [...masterData.workers, ...masterData.drivers].forEach(person => {
        recipientsSelect.innerHTML += `<option value="${person}">${person}</option>`;
    });
    
    const modal = new bootstrap.Modal(document.getElementById('addSalaryModal'));
    modal.show();
    
    // Remove modal when hidden
    document.getElementById('addSalaryModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function saveNewSalary() {
    const salaryData = {
        month: parseInt(document.getElementById('newSalaryMonth').value),
        year: parseInt(document.getElementById('newSalaryYear').value),
        workerName: document.getElementById('newSalaryWorker').value,
        salary: parseFloat(document.getElementById('newSalaryAmount').value),
        loan: parseFloat(document.getElementById('newSalaryLoan').value) || 0,
        received: parseFloat(document.getElementById('newSalaryAmount').value) - (parseFloat(document.getElementById('newSalaryLoan').value) || 0),
        receivedBy: document.getElementById('newSalaryRecipient').value,
        notes: document.getElementById('newSalaryNotes').value,
        createdBy: currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('salaries').add(salaryData);
        
        bootstrap.Modal.getInstance(document.getElementById('addSalaryModal')).hide();
        showNotification('تم حفظ المرتب بنجاح', 'success');
        await loadSalariesTable();
        
    } catch (error) {
        console.error('Error saving salary:', error);
        showNotification('خطأ في حفظ المرتب', 'danger');
    }
}

function addLoan() {
    const modalHtml = `
        <div class="modal fade" id="addLoanModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">إضافة سلفة جديدة</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addLoanForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">التاريخ</label>
                                    <input type="date" class="form-control" id="newLoanDate" value="${getCurrentDate()}" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">اسم العامل</label>
                                    <select class="form-select" id="newLoanWorker" required>
                                        <option value="">اختر العامل</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">المبلغ</label>
                                    <input type="number" class="form-control" id="newLoanAmount" step="0.01" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">السبب</label>
                                    <input type="text" class="form-control" id="newLoanReason" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">المستلم</label>
                                    <select class="form-select" id="newLoanRecipient" required>
                                        <option value="">اختر المستلم</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">ملاحظات</label>
                                    <textarea class="form-control" id="newLoanNotes" rows="2"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="button" class="btn btn-primary" onclick="saveNewLoan()">حفظ</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Populate workers dropdown
    const workersSelect = document.getElementById('newLoanWorker');
    workersSelect.innerHTML = '<option value="">اختر العامل</option>';
    masterData.workers.forEach(worker => {
        workersSelect.innerHTML += `<option value="${worker}">${worker}</option>`;
    });
    
    const recipientsSelect = document.getElementById('newLoanRecipient');
    recipientsSelect.innerHTML = '<option value="">اختر المستلم</option>';
    [...masterData.workers, ...masterData.drivers].forEach(person => {
        recipientsSelect.innerHTML += `<option value="${person}">${person}</option>`;
    });
    
    const modal = new bootstrap.Modal(document.getElementById('addLoanModal'));
    modal.show();
    
    // Remove modal when hidden
    document.getElementById('addLoanModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function saveNewLoan() {
    const loanData = {
        date: new Date(document.getElementById('newLoanDate').value),
        workerName: document.getElementById('newLoanWorker').value,
        amount: parseFloat(document.getElementById('newLoanAmount').value),
        reason: document.getElementById('newLoanReason').value,
        receivedBy: document.getElementById('newLoanRecipient').value,
        notes: document.getElementById('newLoanNotes').value,
        createdBy: currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('hajLoans').add(loanData);
        
        bootstrap.Modal.getInstance(document.getElementById('addLoanModal')).hide();
        showNotification('تم حفظ السلفة بنجاح', 'success');
        await loadLoansTable();
        await calculateTotalLoans();
        
    } catch (error) {
        console.error('Error saving loan:', error);
        showNotification('خطأ في حفظ السلفة', 'danger');
    }
}

function filterSalaries() {
    const searchTerm = document.getElementById('salarySearch').value.toLowerCase();
    const rows = document.querySelectorAll('#salariesTable tr');
    
    rows.forEach(row => {
        const workerName = row.cells[1].textContent.toLowerCase();
        if (workerName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function getMonthName(monthNumber) {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[monthNumber - 1] || '';
}

async function deleteSalary(salaryId) {
    if (!confirm('هل أنت متأكد من حذف هذا المرتب؟')) return;
    
    try {
        await db.collection('salaries').doc(salaryId).delete();
        showNotification('تم حذف المرتب بنجاح', 'success');
        await loadSalariesTable();
    } catch (error) {
        console.error('Error deleting salary:', error);
        showNotification('خطأ في حذف المرتب', 'danger');
    }
}

function editSalary(salaryId) {
    // Create edit modal
    const modalHtml = `
        <div class="modal fade" id="editSalaryModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">تعديل المرتب</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editSalaryForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">الشهر</label>
                                    <select class="form-select" id="editSalaryMonth" required>
                                        <option value="1">يناير</option>
                                        <option value="2">فبراير</option>
                                        <option value="3">مارس</option>
                                        <option value="4">أبريل</option>
                                        <option value="5">مايو</option>
                                        <option value="6">يونيو</option>
                                        <option value="7">يوليو</option>
                                        <option value="8">أغسطس</option>
                                        <option value="9">سبتمبر</option>
                                        <option value="10">أكتوبر</option>
                                        <option value="11">نوفمبر</option>
                                        <option value="12">ديسمبر</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">السنة</label>
                                    <input type="number" class="form-control" id="editSalaryYear" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">الراتب</label>
                                    <input type="number" class="form-control" id="editSalaryAmount" step="0.01" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">السلفة</label>
                                    <input type="number" class="form-control" id="editSalaryLoan" step="0.01" value="0">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">المستلم</label>
                                    <select class="form-select" id="editSalaryRecipient">
                                        <option value="">اختر المستلم</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">ملاحظات</label>
                                    <textarea class="form-control" id="editSalaryNotes" rows="2"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="button" class="btn btn-primary" onclick="saveEditedSalary('${salaryId}')">حفظ التعديلات</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Load salary data and populate form
    loadSalaryData(salaryId);
    
    const modal = new bootstrap.Modal(document.getElementById('editSalaryModal'));
    modal.show();
    
    // Remove modal when hidden
    document.getElementById('editSalaryModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function loadSalaryData(salaryId) {
    try {
        const salaryDoc = await db.collection('salaries').doc(salaryId).get();
        const salary = salaryDoc.data();
        
        // Populate form with current data
        document.getElementById('editSalaryMonth').value = salary.month;
        document.getElementById('editSalaryYear').value = salary.year;
        document.getElementById('editSalaryAmount').value = salary.salary;
        document.getElementById('editSalaryLoan').value = salary.loan || 0;
        document.getElementById('editSalaryNotes').value = salary.notes || '';
        
        // Populate recipients dropdown
        const recipientsSelect = document.getElementById('editSalaryRecipient');
        recipientsSelect.innerHTML = '<option value="">اختر المستلم</option>';
        if (masterData && masterData.workers && masterData.drivers) {
            [...masterData.workers, ...masterData.drivers].forEach(person => {
                const selected = person === salary.receivedBy ? 'selected' : '';
                recipientsSelect.innerHTML += `<option value="${person}" ${selected}>${person}</option>`;
            });
        }
        
        // Store salary data globally for save function
        window.currentSalary = salary;
        
    } catch (error) {
        console.error('Error loading salary data:', error);
        showNotification('خطأ في تحميل بيانات المرتب', 'danger');
    }
}

async function saveEditedSalary(salaryId) {
    try {
        const originalSalary = window.currentSalary;
        const newMonth = parseInt(document.getElementById('editSalaryMonth').value);
        const newYear = parseInt(document.getElementById('editSalaryYear').value);
        const newSalaryAmount = parseFloat(document.getElementById('editSalaryAmount').value);
        const newLoan = parseFloat(document.getElementById('editSalaryLoan').value) || 0;
        const newRecipient = document.getElementById('editSalaryRecipient').value;
        const newNotes = document.getElementById('editSalaryNotes').value;
        
        const newReceived = newSalaryAmount - newLoan;
        
        // Update salary document
        await db.collection('salaries').doc(salaryId).update({
            month: newMonth,
            year: newYear,
            salary: newSalaryAmount,
            loan: newLoan,
            received: newReceived,
            receivedBy: newRecipient,
            notes: newNotes,
            updatedBy: currentUser.email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('editSalaryModal')).hide();
        showNotification('تم تعديل المرتب بنجاح', 'success');
        await loadSalariesTable();
        
    } catch (error) {
        console.error('Error saving edited salary:', error);
        showNotification('خطأ في حفظ التعديلات', 'danger');
    }
}

async function deleteLoan(loanId) {
    if (!confirm('هل أنت متأكد من حذف هذه السلفة؟')) return;
    
    try {
        await db.collection('hajLoans').doc(loanId).delete();
        showNotification('تم حذف السلفة بنجاح', 'success');
        await loadLoansTable();
        await calculateTotalLoans();
    } catch (error) {
        console.error('Error deleting loan:', error);
        showNotification('خطأ في حذف السلفة', 'danger');
    }
}

function editLoan(loanId) {
    // Create edit modal
    const modalHtml = `
        <div class="modal fade" id="editLoanModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">تعديل السلفة</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editLoanForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">التاريخ</label>
                                    <input type="date" class="form-control" id="editLoanDate" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">المبلغ</label>
                                    <input type="number" class="form-control" id="editLoanAmount" step="0.01" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">اسم العامل</label>
                                    <select class="form-select" id="editLoanWorker" required>
                                        <option value="">اختر العامل</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">السبب</label>
                                    <input type="text" class="form-control" id="editLoanReason" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">المستلم</label>
                                    <select class="form-select" id="editLoanRecipient" required>
                                        <option value="">اختر المستلم</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">ملاحظات</label>
                                    <textarea class="form-control" id="editLoanNotes" rows="2"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="button" class="btn btn-primary" onclick="saveEditedLoan('${loanId}')">حفظ التعديلات</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Load loan data and populate form
    loadLoanData(loanId);
    
    const modal = new bootstrap.Modal(document.getElementById('editLoanModal'));
    modal.show();
    
    // Remove modal when hidden
    document.getElementById('editLoanModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function loadLoanData(loanId) {
    try {
        const loanDoc = await db.collection('hajLoans').doc(loanId).get();
        const loan = loanDoc.data();
        
        // Populate form with current data
        document.getElementById('editLoanDate').value = loan.date.toDate ? loan.date.toDate().toISOString().split('T')[0] : new Date(loan.date).toISOString().split('T')[0];
        document.getElementById('editLoanAmount').value = loan.amount;
        document.getElementById('editLoanReason').value = loan.reason;
        document.getElementById('editLoanNotes').value = loan.notes || '';
        
        // Populate workers dropdown
        const workersSelect = document.getElementById('editLoanWorker');
        workersSelect.innerHTML = '<option value="">اختر العامل</option>';
        if (masterData && masterData.workers) {
            masterData.workers.forEach(worker => {
                const selected = worker === loan.workerName ? 'selected' : '';
                workersSelect.innerHTML += `<option value="${worker}" ${selected}>${worker}</option>`;
            });
        }
        
        // Populate recipients dropdown
        const recipientsSelect = document.getElementById('editLoanRecipient');
        recipientsSelect.innerHTML = '<option value="">اختر المستلم</option>';
        if (masterData && masterData.workers && masterData.drivers) {
            [...masterData.workers, ...masterData.drivers].forEach(person => {
                const selected = person === loan.receivedBy ? 'selected' : '';
                recipientsSelect.innerHTML += `<option value="${person}" ${selected}>${person}</option>`;
            });
        }
        
        // Store loan data globally for save function
        window.currentLoan = loan;
        
    } catch (error) {
        console.error('Error loading loan data:', error);
        showNotification('خطأ في تحميل بيانات السلفة', 'danger');
    }
}

async function saveEditedLoan(loanId) {
    try {
        const originalLoan = window.currentLoan;
        const newDate = new Date(document.getElementById('editLoanDate').value);
        const newAmount = parseFloat(document.getElementById('editLoanAmount').value);
        const newWorkerName = document.getElementById('editLoanWorker').value;
        const newReason = document.getElementById('editLoanReason').value;
        const newRecipient = document.getElementById('editLoanRecipient').value;
        const newNotes = document.getElementById('editLoanNotes').value;
        
        // Update loan document
        await db.collection('hajLoans').doc(loanId).update({
            date: newDate,
            workerName: newWorkerName,
            amount: newAmount,
            reason: newReason,
            receivedBy: newRecipient,
            notes: newNotes,
            updatedBy: currentUser.email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('editLoanModal')).hide();
        showNotification('تم تعديل السلفة بنجاح', 'success');
        await loadLoansTable();
        await calculateTotalLoans();
        
    } catch (error) {
        console.error('Error saving edited loan:', error);
        showNotification('خطأ في حفظ التعديلات', 'danger');
    }
}

function exportSalariesToExcel() {
    showNotification('جاري تحضير ملف Excel...', 'info');
    // Implementation would go here
}

function exportLoansToExcel() {
    showNotification('جاري تحضير ملف Excel...', 'info');
    // Implementation would go here
}

function printSalaries() {
    printElement('salariesTable');
}

function printLoans() {
    printElement('loansTable');
}
