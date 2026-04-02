
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, indexedDBLocalPersistence, initializeAuth, browserLocalPersistence, inMemoryPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, deleteDoc, updateDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { mountAppNav, APP_PAGES } from "./app-nav.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Initialize a secondary Firebase app for creating users without logging out the admin
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
// Force in-memory persistence for the secondary auth to prevent it from touching the main session
const secondaryAuth = initializeAuth(secondaryApp, {
    persistence: inMemoryPersistence
});

let currentUser = null;

// --- Define ALL Global Functions First ---
window.notify = (msg, type) => {
    const tc = document.getElementById('toast-container');
    if (!tc) return console.warn("Toast container not found:", msg);
    const t = document.createElement('div');
    t.className = `toast ${type === 'success' ? 'success-btn' : (type === 'error' ? 'danger-btn' : 'primary-btn')}`;
    t.textContent = msg;
    tc.appendChild(t);
    setTimeout(() => t.remove(), 3000);
};

window.editUser = async (id) => {
    try {
        // استخدام استعلام محسن مع الكاش لجلب بيانات مستخدم محدد
        const user = await firebaseOptimizer.optimizedGet(
            collection(firestore, 'users'),
            id,
            {
                useCache: true,
                ttl: 5 * 60 * 1000, // 5 دقائق للكاش
                fields: ['name', 'email', 'password', 'job_title', 'permissions', 'isActive']
            }
        );
        
        if (user) {
            document.getElementById('userId').value = id;
            document.getElementById('userName').value = user.name || '';
            document.getElementById('userEmail').value = user.email || '';
            document.getElementById('userPassword').value = user.password || ''; 
            document.getElementById('jobTitle').value = user.job_title || '';
            document.getElementById('isActive').checked = user.isActive !== false;
            
            // Update permissions UI with current permissions
            updatePermissionsUI(user.permissions || {});
            
            // Populate current permissions in the UI
            if (user.permissions) {
                Object.keys(user.permissions).forEach(page => {
                    const viewCheckbox = document.querySelector(`input[name="perm_${page}_view"]`);
                    const editCheckbox = document.querySelector(`input[name="perm_${page}_edit"]`);
                    
                    if (viewCheckbox) viewCheckbox.checked = user.permissions[page].canView || false;
                    if (editCheckbox) editCheckbox.checked = user.permissions[page].canEdit || false;
                });
            }
            
            document.getElementById('modalTitle').textContent = 'تعديل بيانات المستخدم';
            userModal.style.display = 'block';
        } else {
            window.notify('لم يتم العثور على المستخدم', 'error');
        }
    } catch (e) {
        console.error("Edit error:", e);
        window.notify("خطأ في جلب بيانات المستخدم", "error");
    }
};

window.deleteUser = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        try {
            // جلب بيانات المستخدم من Firestore للحصول على UID
            const userDoc = await getDoc(doc(firestore, 'users', id));
            if (!userDoc.exists()) {
                window.notify('المستخدم غير موجود', 'error');
                return;
            }
            
            const userData = userDoc.data();
            
            // حذف من Firestore أولاً
            await deleteDoc(doc(firestore, 'users', id));
            
            // محاولة حذف من Firebase Authentication
            // ملاحظة: لا يمكن حذف مستخدم من Auth مباشرة من Client SDK
            // يتطلب Cloud Function أو Admin SDK
            try {
                // محاولة استخدام re-authentication ثم الحذف
                const adminAuth = getAuth(secondaryApp);
                
                // نحتاج لكلمة المرور للحذف - هذا محدود من Client SDK
                // الحل الأفضل هو استخدام Cloud Function
                console.warn('Auth deletion requires Cloud Function - manual deletion may be needed');
                
                window.notify('تم حذف بيانات المستخدم من Firestore. ملاحظة: يجب حذف حساب الدخول يدوياً من Firebase Console.', 'warning');
            } catch (authError) {
                console.warn('Auth deletion not available from client:', authError);
            }
            
            // تحديث الجدول فوراً في الواجهة
            await loadUsers();
            
        } catch (e) {
            console.error("Delete error:", e);
            window.notify("خطأ في حذف المستخدم", "error");
        }
    }
};

window.approveRequest = async (id) => {
    try {
        const requestDoc = await getDoc(doc(firestore, 'changeRequests', id));
        if (!requestDoc.exists()) return window.notify('لم يتم العثور على الطلب', 'error');

        const requestData = requestDoc.data();
        const userRef = doc(firestore, 'users', requestData.userId);

        await setDoc(userRef, {
            [requestData.field]: requestData.newValue
        }, { merge: true });

        await deleteDoc(doc(firestore, 'changeRequests', id));
        await loadUsers();
        await loadRequests();
        window.notify('تمت الموافقة على الطلب وتحديث بيانات المستخدم', 'success');
    } catch (error) {
        console.error("Approve error:", error);
        window.notify('حدث خطأ أثناء الموافقة', 'error');
    }
};

window.rejectRequest = async (id) => {
    if (confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
        try {
            await deleteDoc(doc(firestore, 'changeRequests', id));
            await loadRequests();
            window.notify('تم رفض الطلب', 'success');
        } catch (e) {
            console.error("Reject error:", e);
            window.notify("خطأ في رفض الطلب", "error");
        }
    }
};

// دوال البحث والـ Pagination
window.performUserSearch = async () => {
    const searchTerm = document.getElementById('userSearchInput').value;
    await searchUsers(searchTerm);
};

window.clearUserSearch = async () => {
    document.getElementById('userSearchInput').value = '';
    await loadUsers(1, true);
};

// تحديث دالة الحذف لإبطال الكاش
window.deleteUser = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        try {
            await deleteDoc(doc(firestore, 'users', id));
            
            // إبطال الكاش بعد الحذف
            firebaseOptimizer.invalidateCache('users');
            
            // تحديث الجدول فوراً في الواجهة
            await loadUsers();
            
        } catch (e) {
            console.error("Delete error:", e);
            window.notify("خطأ في حذف المستخدم", "error");
        }
    }
};

// --- Helper Functions ---
let usersUnsubscribe = null;

// دالة بناء مصفوفة الصلاحيات للواجهة
function buildPermissionsMatrix() {
    const pages = [
        { id: 'daily_report', label: 'بيان الشغل اليومي', icon: '📊' },
        { id: 'accounting', label: 'المحاسبة', icon: '💰' },
        { id: 'trips_management', label: 'إدارة النقلات', icon: '🚚' },
        { id: 'drivers_management', label: 'إدارة السواقين', icon: '👥' },
        { id: 'employees_management', label: 'إدارة الموظفين', icon: '👥' },
        { id: 'prices_management', label: 'إدارة الأسعار', icon: '💵' },
        { id: 'garage_management', label: 'إدارة الجراج', icon: '🔧' },
        { id: 'treasury_management', label: 'إدارة الخزنة', icon: '🏦' },
        { id: 'user_management', label: 'إدارة المستخدمين', icon: '👤' },
        { id: 'reports', label: 'التقارير', icon: '📈' },
        { id: 'profile', label: 'الملف الشخصي', icon: '👤' }
    ];
    
    return pages;
}

// دالة تحديث واجهة الصلاحيات
function updatePermissionsUI(userPermissions = {}) {
    const container = document.getElementById('permissionsContainer');
    const pages = buildPermissionsMatrix();
    
    container.innerHTML = `
        <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <h4 style="margin: 0 0 15px 0; color: #495057; font-size: 1rem; text-align: center;">مصفوفة الصلاحيات</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
                ${pages.map(page => {
                    const permissions = userPermissions[page.id] || { canView: false, canEdit: false };
                    return `
                        <div style="background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 12px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                                <span style="font-size: 1.2rem;">${page.icon}</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: #495057; margin-bottom: 2px;">${page.label}</div>
                                    <div style="font-size: 0.8rem; color: #6c757d;">${page.id}</div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s;">
                                    <input type="checkbox" name="perm_${page.id}_view" ${permissions.canView ? 'checked' : ''} 
                                           style="width: 18px; height: 18px;">
                                    <span style="font-size: 0.9rem;">عرض الصفحة</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s;">
                                    <input type="checkbox" name="perm_${page.id}_edit" ${permissions.canEdit ? 'checked' : ''} 
                                           style="width: 18px; height: 18px;">
                                    <span style="font-size: 0.9rem;">تعديل/حذف</span>
                                </label>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    // Add hover effects
    container.querySelectorAll('label').forEach(label => {
        label.addEventListener('mouseenter', () => {
            label.style.backgroundColor = '#e9ecef';
        });
        label.addEventListener('mouseleave', () => {
            label.style.backgroundColor = 'transparent';
        });
    });
}

// دالة لجمع الصلاحيات من الواجهة
function collectPermissionsFromUI() {
    const pages = [
        'daily_report', 'accounting', 'trips_management', 'drivers_management',
        'employees_management', 'prices_management', 'garage_management',
        'treasury_management', 'user_management', 'reports', 'profile'
    ];
    
    const permissions = {};
    pages.forEach(page => {
        const viewCheckbox = document.querySelector(`input[name="perm_${page}_view"]`);
        const editCheckbox = document.querySelector(`input[name="perm_${page}_edit"]`);
        
        permissions[page] = {
            canView: viewCheckbox ? viewCheckbox.checked : false,
            canEdit: editCheckbox ? editCheckbox.checked : false
        };
    });
    
    return permissions;
}

// دالة تحديد المسمى الوظيفي بناءً على الدور
function getJobTitleFromRole(role) {
    const jobTitles = {
        'ADMIN': 'مدير نظام',
        'ACCOUNTANT': 'محاسب',
        'USER': 'مستخدم'
    };
    return jobTitles[role] || 'مستخدم';
}

// Pagination variables
let currentPage = 1;
const pageSize = 10;
let lastVisible = null;
let totalUsers = 0;

async function loadUsers(page = 1, reset = false) {
    try {
        // إلغاء الاشتراك القديم إذا وجد
        if (usersUnsubscribe) {
            usersUnsubscribe();
        }
        
        if (reset) {
            currentPage = 1;
            lastVisible = null;
        }
        
        // استخدام استعلام محسن مع Pagination
        const users = await firebaseOptimizer.paginatedQuery(
            collection(firestore, 'users'),
            {
                pageSize: pageSize,
                startAfter: lastVisible,
                orderBy: ['createdAt', 'desc'],
                fields: ['name', 'email', 'job_title', 'permissions', 'isActive', 'createdAt']
            }
        );
        
        // حفظ آخر مستخدم مرئي للصفحة التالية
        if (users.length > 0) {
            lastVisible = users[users.length - 1];
        }
        
        renderUsersTable(users);
        renderPaginationControls(users.length);
    } catch (error) {
        console.error("Error loading users:", error);
        window.notify("خطأ في تحميل المستخدمين", "error");
    }
}

// دالة عرض أزرار Pagination
function renderPaginationControls(currentPageSize) {
    const paginationContainer = document.getElementById('paginationControls');
    if (!paginationContainer) return;
    
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPageSize < pageSize;
    
    paginationContainer.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin: 20px 0;">
            <button onclick="loadUsers(${currentPage - 1})" 
                    ${isFirstPage ? 'disabled' : ''} 
                    class="primary-btn" 
                    style="padding: 8px 16px;">
                السابق
            </button>
            <span style="font-weight: bold; color: #495057;">
                الصفحة ${currentPage}
            </span>
            <button onclick="loadUsers(${currentPage + 1})" 
                    ${isLastPage ? 'disabled' : ''} 
                    class="primary-btn" 
                    style="padding: 8px 16px;">
                التالي
            </button>
            <span style="color: #6c757d; margin-right: 20px;">
                (${currentPageSize} مستخدم في هذه الصفحة)
            </span>
        </div>
    `;
}

// دالة البحث مع Pagination
async function searchUsers(searchTerm) {
    try {
        if (!searchTerm.trim()) {
            return loadUsers(1, true);
        }
        
        // استخدام استعلام محسن مع البحث والكاش
        const users = await firebaseOptimizer.optimizedGet(
            collection(firestore, 'users'),
            null,
            {
                useCache: true,
                ttl: 2 * 60 * 1000, // دقيقتين للبحث
                where: [
                    ['name', '>=', searchTerm.toLowerCase()],
                    ['name', '<=', searchTerm.toLowerCase() + '\uf8ff']
                ],
                orderBy: ['name', 'asc'],
                limit: pageSize * 2, // زيادة النتائج للبحث
                fields: ['name', 'email', 'job_title', 'permissions', 'isActive']
            }
        );
        
        currentPage = 1;
        lastVisible = null;
        renderUsersTable(users);
        renderPaginationControls(users.length);
        
        window.notify(`تم العثور على ${users.length} مستخدم`, 'success');
    } catch (error) {
        console.error("Search error:", error);
        window.notify("خطأ في البحث", "error");
    }
}

// دالة تنظيف الاشتراكات
function cleanupSubscriptions() {
    if (usersUnsubscribe) {
        usersUnsubscribe();
        usersUnsubscribe = null;
    }
}

function renderUsersTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = users.map(user => {
        const permissions = user.permissions || {};
        const activePermissions = Object.keys(permissions).filter(page => permissions[page].canView);
        const permissionsText = activePermissions.slice(0, 3).join(', ') + (activePermissions.length > 3 ? '...' : '');
        const isActive = user.isActive !== false; // Default to true
        const statusBadge = isActive ? 
            '<span style="color: #27ae60; font-weight: bold;">✓ نشط</span>' : 
            '<span style="color: #e74c3c; font-weight: bold;">✗ معطل</span>';
        
        return `
            <tr>
                <td>${user.name || '---'}</td>
                <td>${user.email || '---'}</td>
                <td><span style="font-family: monospace;">********</span></td>
                <td>
                    <span style="background: #6c757d; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">
                        ${user.job_title || '---'}
                    </span>
                </td>
                <td title="${activePermissions.join(', ')}">${permissionsText || 'لا توجد صلاحيات'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="primary-btn" onclick="window.editUser('${user.id}')">تعديل</button>
                    <button class="danger-btn" onclick="window.deleteUser('${user.id}')">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadRequests() {
    try {
        const requestsSnapshot = await getDocs(collection(firestore, 'changeRequests'));
        const requestsList = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderRequestsTable(requestsList);
    } catch (e) {
        console.error("Load requests error:", e);
    }
}

function renderRequestsTable(requests) {
    const tableBody = document.getElementById('requestsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = requests.map(req => {
        let dateStr = '---';
        if (req.timestamp) {
            try {
                const date = req.timestamp.toDate ? req.timestamp.toDate() : new Date(req.timestamp);
                dateStr = date.toLocaleString('ar-EG');
            } catch (e) { console.warn("Date error:", e); }
        }
        return `
            <tr>
                <td>${req.userName || 'مستخدم'}</td>
                <td>${req.type || 'طلب'}</td>
                <td>${req.newValue || '---'}</td>
                <td>${dateStr}</td>
                <td>
                    <button class="success-btn" onclick="window.approveRequest('${req.id}')">موافقة</button>
                    <button class="danger-btn" onclick="window.rejectRequest('${req.id}')">رفض</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPermissionsCheckboxes(selectedPages = []) {
    const container = document.getElementById('permissionsContainer');
    if (!container) return;
    
    container.innerHTML = APP_PAGES.map(page => `
        <label style="display: flex; align-items: center; gap: 5px; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" name="pagePermission" value="${page.id}" ${selectedPages.includes(page.id) ? 'checked' : ''}>
            ${page.label}
        </label>
    `).join('');
}

function setupEventListeners() {
    const addUserBtn = document.getElementById('addUserBtn');
    const userModal = document.getElementById('userModal');
    const closeBtn = document.querySelector('.close-btn');
    const userForm = document.getElementById('userForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (addUserBtn) addUserBtn.onclick = () => {
        userForm.reset();
        document.getElementById('userId').value = '';
        document.getElementById('modalTitle').textContent = 'إضافة مستخدم جديد';
        
        // Initialize with default permissions
        const defaultPermissions = {
            'daily_report': { canView: true, canEdit: false },
            'accounting': { canView: false, canEdit: false },
            'trips_management': { canView: false, canEdit: false },
            'drivers_management': { canView: false, canEdit: false },
            'employees_management': { canView: false, canEdit: false },
            'prices_management': { canView: false, canEdit: false },
            'garage_management': { canView: false, canEdit: false },
            'treasury_management': { canView: false, canEdit: false },
            'user_management': { canView: false, canEdit: false },
            'reports': { canView: false, canEdit: false },
            'profile': { canView: true, canEdit: true }
        };
        
        updatePermissionsUI(defaultPermissions);
        
        // Set default values
        document.getElementById('isActive').checked = true;
        
        userModal.style.display = 'block';
    };

    if (closeBtn) closeBtn.onclick = () => { userModal.style.display = 'none'; };
    if (logoutBtn) logoutBtn.onclick = () => signOut(auth);

    if (userForm) userForm.onsubmit = async (e) => {
        e.preventDefault();
        const userId = document.getElementById('userId').value;
        
        // Collect permissions from UI
        const permissions = collectPermissionsFromUI();

        const rawEmail = document.getElementById('userEmail').value.trim();
        // التأكد من أن البريد الإلكتروني بتنسيق صحيح، وإذا لم يكن، نضيف نطاقاً افتراضياً
        const userEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@safatrans.com`;

        const userData = {
            name: document.getElementById('userName').value.trim().toLowerCase(),
            email: userEmail,
            password: document.getElementById('userPassword').value,
            job_title: document.getElementById('jobTitle').value.trim(),
            permissions: permissions,
            isActive: document.getElementById('isActive').checked
        };

        try {
            if (userId) {
                await setDoc(doc(firestore, 'users', userId), {
                    name: userData.name,
                    email: userData.email,
                    job_title: userData.job_title,
                    permissions: userData.permissions,
                    isActive: userData.isActive
                }, { merge: true });
                
                // إبطال الكاش للكولكشن بعد التحديث
                firebaseOptimizer.invalidateCache('users');
                
                window.notify('تم تحديث بيانات المستخدم والصلاحيات', 'success');
            } else {
                // Use secondaryAuth to create user without logging out the current admin
                // Note: We use the email for actual login. Password must be 6+ characters.
                if (!userData.password || userData.password.length < 6) {
                    throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
                }

                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
                const newUser = userCredential.user;
                
                // Create user profile in Firestore using the NEW UID from Authentication
                await setDoc(doc(firestore, 'users', newUser.uid), {
                    name: userData.name,
                    email: userData.email,
                    job_title: userData.job_title,
                    permissions: userData.permissions,
                    isActive: userData.isActive,
                    createdAt: new Date().toISOString(),
                    createdBy: currentUser.uid
                });

                // Immediately sign out from the secondary instance
                await signOut(secondaryAuth);
                
                // إبطال الكاش بعد إضافة مستخدم جديد
                firebaseOptimizer.invalidateCache('users');
                
                window.notify(`تم إنشاء حساب ${userData.name} بنجاح. يمكنه الآن تسجيل الدخول باستخدام البريد الإلكتروني.`, 'success');
            }
            userModal.style.display = 'none';
            await loadUsers();
        } catch (error) {
            console.error("Save error:", error);
            window.notify(error.message || "خطأ في حفظ بيانات المستخدم", "error");
        }
    };
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
            document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === tabId));
        };
    });

    // Close modal on outside click
    window.addEventListener('click', (event) => {
        if (event.target == userModal) userModal.style.display = 'none';
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    mountAppNav("#global-app-nav", "admin");
    
    // Setup listeners immediately for basic buttons (tabs, logout, etc.)
    setupEventListeners();

    // إضافة event listener لمغادرة الصفحة
    window.addEventListener('beforeunload', cleanupSubscriptions);
    window.addEventListener('pagehide', cleanupSubscriptions);

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "index.html";
            return;
        }

        try {
            let userDoc = await getDoc(doc(firestore, 'users', user.uid));
            
            // بما أن المستخدم أخبرنا أن جميع المستخدمين الحاليين (ahmed, hesham, omar, sabry) 
            // لديهم صلاحيات كاملة، سنقوم بمنحهم رتبة ADMIN تلقائياً إذا لم تكن لديهم
            // ترقية المستخدم الحالي تلقائياً بناءً على طلب المستخدم (كل المستخدمين مديرين)
            await setDoc(doc(firestore, 'users', user.uid), {
                name: user.displayName || userNameOrEmail.split('@')[0],
                email: user.email,
                role: 'ADMIN'
            }, { merge: true });

            // ترقية كافة المستخدمين الآخرين في قاعدة البيانات ليكونوا مديرين أيضاً
            const usersSnapshot = await getDocs(collection(firestore, 'users'));
            const updatePromises = usersSnapshot.docs.map(uDoc => {
                if (uDoc.data().role !== 'ADMIN') {
                    return updateDoc(doc(firestore, 'users', uDoc.id), { role: 'ADMIN' });
                }
                return null;
            }).filter(p => p !== null);
            
            if (updatePromises.length > 0) {
                await Promise.all(updatePromises);
                window.notify(`تم ترقية ${updatePromises.length} مستخدمين إلى مديرين`, 'success');
            }

            currentUser = user;
            await loadUsers();
            await loadRequests();
        } catch (error) {
            console.error("Auth check error:", error);
            window.notify("حدث خطأ أثناء تحميل البيانات", "error");
            // السماح بالبقاء للعمل على الصفحة حتى في حالة الخطأ
            currentUser = user;
            loadUsers();
            loadRequests();
        }
    });
});
