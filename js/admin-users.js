
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
        const userDoc = await getDoc(doc(firestore, 'users', id));
        if (userDoc.exists()) {
            const user = userDoc.data();
            document.getElementById('userId').value = id;
            document.getElementById('userName').value = user.name || '';
            document.getElementById('userEmail').value = user.email || '';
            document.getElementById('userPassword').value = user.password || ''; 
            document.getElementById('userRole').value = user.role || 'USER';
            
            // Update permissions UI based on role
            updatePermissionsUI(user.role || 'USER');
            
            document.getElementById('modalTitle').textContent = 'تعديل بيانات المستخدم';
            userModal.style.display = 'block';
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

// --- Helper Functions ---
let usersUnsubscribe = null;

// دالة تحديد الصلاحيات بناءً على الدور
function getRolePermissions(role) {
    const permissions = {
        'ADMIN': ['transport-data', 'prices', 'daily', 'drivers-roles', 'treasury-system', 'garage', 'accounting', 'admin-users', 'profile'],
        'ACCOUNTANT': ['daily', 'accounting', 'profile'], // حسابات: قراءة فقط للشغل اليومي والمحاسبة
        'USER': ['profile'] // مستخدم عادي: بروفايل فقط
    };
    return permissions[role] || [];
}

// دالة تحديث الصلاحيات في الواجهة عند تغيير الدور
function updatePermissionsUI(role) {
    const permissions = getRolePermissions(role);
    const container = document.getElementById('permissionsContainer');
    
    if (role === 'ADMIN') {
        // للمدير: إظهار جميع الصلاحيات للاختيار
        container.innerHTML = APP_PAGES.map(page => `
            <label style="display: flex; align-items: center; gap: 5px; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" name="pagePermission" value="${page.id}" checked>
                ${page.label}
            </label>
        `).join('');
    } else {
        // للحسابات والمستخدمين: إخفاء اختيار الصلاحيات وعرض رسالة
        container.innerHTML = `
            <div style="padding: 15px; background: #e3f2fd; border-radius: 6px; color: #1976d2; font-size: 0.9rem; text-align: center;">
                <strong>الصلاحيات محددة مسبقاً بناءً على الدور</strong><br>
                ${role === 'ACCOUNTANT' ? 
                    'دور الحسابات: صلاحية قراءة للشغل اليومي والمحاسبة فقط' : 
                    'دور المستخدم: صلاحية الملف الشخصي فقط'
                }
            </div>
        `;
    }
}

async function loadUsers() {
    try {
        // إلغاء الاشتراك القديم إذا وجد
        if (usersUnsubscribe) {
            usersUnsubscribe();
        }
        
        // استخدام real-time listener لتحديث فوري
        usersUnsubscribe = onSnapshot(collection(firestore, 'users'), (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderUsersTable(usersList);
        }, (error) => {
            console.error("Real-time users listener error:", error);
            // fallback to one-time fetch
            getDocs(collection(firestore, 'users')).then(snapshot => {
                const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderUsersTable(usersList);
            });
        });
    } catch (e) {
        console.error("Load users error:", e);
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
        const permissions = user.allowedPages || [];
        const permissionsText = permissions.length > 0 ? permissions.slice(0, 3).join(', ') + (permissions.length > 3 ? '...' : '') : 'لا توجد صلاحيات';
        const isActive = user.isActive !== false; // Default to true
        const statusBadge = isActive ? 
            '<span style="color: #27ae60; font-weight: bold;">✓ نشط</span>' : 
            '<span style="color: #e74c3c; font-weight: bold;">✗ معطل</span>';
        
        // تحديد لون الدور
        const getRoleColor = (role) => {
            switch(role) {
                case 'ADMIN': return '#e74c3c';
                case 'ACCOUNTANT': return '#f39c12';
                case 'USER': return '#3498db';
                default: return '#95a5a6';
            }
        };
        
        const getRoleLabel = (role) => {
            switch(role) {
                case 'ADMIN': return 'مدير';
                case 'ACCOUNTANT': return 'حسابات';
                case 'USER': return 'مستخدم';
                default: return 'غير محدد';
            }
        };
        
        return `
            <tr>
                <td>${user.name || '---'}</td>
                <td>${user.email || '---'}</td>
                <td><span style="font-family: monospace;">********</span></td>
                <td>
                    <span style="background: ${getRoleColor(user.role)}; 
                                   color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">
                        ${getRoleLabel(user.role)}
                    </span>
                </td>
                <td title="${permissions.join(', ')}">${permissionsText}</td>
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
        updatePermissionsUI('ADMIN'); // Default to admin for new users
        userModal.style.display = 'block';
    };

    // Add event listener for role change
    const roleSelect = document.getElementById('userRole');
    if (roleSelect) {
        roleSelect.onchange = (e) => {
            updatePermissionsUI(e.target.value);
        };
    }

    if (closeBtn) closeBtn.onclick = () => { userModal.style.display = 'none'; };
    if (logoutBtn) logoutBtn.onclick = () => signOut(auth);

    if (userForm) userForm.onsubmit = async (e) => {
        e.preventDefault();
        const userId = document.getElementById('userId').value;
        
        // Collect selected permissions (only for admin)
        let selectedPermissions = [];
        if (document.getElementById('userRole').value === 'ADMIN') {
            selectedPermissions = Array.from(document.querySelectorAll('input[name="pagePermission"]:checked'))
                .map(cb => cb.value);
        } else {
            selectedPermissions = getRolePermissions(document.getElementById('userRole').value);
        }

        const rawEmail = document.getElementById('userEmail').value.trim();
        // التأكد من أن البريد الإلكتروني بتنسيق صحيح، وإذا لم يكن، نضيف نطاقاً افتراضياً
        const userEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@safatrans.com`;

        const userData = {
            name: document.getElementById('userName').value.trim().toLowerCase(),
            email: userEmail,
            password: document.getElementById('userPassword').value,
            role: document.getElementById('userRole').value,
            allowedPages: selectedPermissions
        };

        try {
            if (userId) {
                await setDoc(doc(firestore, 'users', userId), {
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    allowedPages: userData.allowedPages
                }, { merge: true });
                window.notify('تم تحديث بيانات المستخدم والصلاحيات', 'success');
            } else {
                // Use secondaryAuth to create user without logging out the current admin
                // Note: We use the email for actual login. Password must be 6+ characters.
                if (!userData.password || userData.password.length < 6) {
                    throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
                }

                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
                const newUser = userCredential.user;
                
                // التأكد من وجود صلاحيات للمستخدم الجديد
                const defaultRole = userData.role || 'USER';
                const defaultPages = getRolePermissions(defaultRole);
                
                // Create user profile in Firestore using the NEW UID from Authentication
                await setDoc(doc(firestore, 'users', newUser.uid), {
                    name: userData.name,
                    email: userData.email,
                    role: defaultRole,
                    allowedPages: defaultPages,
                    createdAt: new Date().toISOString(),
                    createdBy: currentUser.uid,
                    isActive: true
                });

                // Immediately sign out from the secondary instance
                await signOut(secondaryAuth);
                
                window.notify(`تم إنشاء حساب ${userData.name} بنجاح. يمكنه الآن تسجيل الدخول باستخدام اسم المستخدم أو البريد الإلكتروني.`, 'success');
            }
            userModal.style.display = 'none';
            await loadUsers();
        } catch (error) {
            console.error("Form error:", error);
            window.notify(`حدث خطأ: ${error.message}`, 'error');
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
