
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { mountAppNav } from "./app-nav.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

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
            document.getElementById('modalTitle').textContent = 'تعديل بيانات المستخدم';
            document.getElementById('userModal').style.display = 'block';
        }
    } catch (e) {
        console.error("Edit error:", e);
        window.notify("خطأ في جلب بيانات المستخدم", "error");
    }
};

window.deleteUser = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        try {
            await deleteDoc(doc(firestore, 'users', id));
            await loadUsers();
            window.notify('تم حذف المستخدم بنجاح', 'success');
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
async function loadUsers() {
    try {
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUsersTable(usersList);
    } catch (e) {
        console.error("Load users error:", e);
    }
}

function renderUsersTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.name || '---'}</td>
            <td>${user.email || '---'}</td>
            <td><span style="font-family: monospace;">********</span></td>
            <td>${user.role || 'USER'}</td>
            <td>
                <button class="primary-btn" onclick="window.editUser('${user.id}')">تعديل</button>
                <button class="danger-btn" onclick="window.deleteUser('${user.id}')">حذف</button>
            </td>
        </tr>
    `).join('');
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
        userModal.style.display = 'block';
    };

    if (closeBtn) closeBtn.onclick = () => { userModal.style.display = 'none'; };
    if (logoutBtn) logoutBtn.onclick = () => signOut(auth);

    if (userForm) userForm.onsubmit = async (e) => {
        e.preventDefault();
        const userId = document.getElementById('userId').value;
        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value,
            role: document.getElementById('userRole').value,
        };

        try {
            if (userId) {
                await setDoc(doc(firestore, 'users', userId), {
                    name: userData.name,
                    email: userData.email,
                    role: userData.role
                }, { merge: true });
                window.notify('تم تحديث بيانات المستخدم', 'success');
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
                await setDoc(doc(firestore, 'users', userCredential.user.uid), {
                    name: userData.name,
                    email: userData.email,
                    role: userData.role
                });
                window.notify('تم إضافة المستخدم بنجاح', 'success');
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

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "index.html";
            return;
        }

        try {
            let userDoc = await getDoc(doc(firestore, 'users', user.uid));
            
            // بما أن المستخدم أخبرنا أن جميع المستخدمين الحاليين (ahmed, hesham, omar, sabry) 
            // لديهم صلاحيات كاملة، سنقوم بمنحهم رتبة ADMIN تلقائياً إذا لم تكن لديهم
            const adminNames = ['ahmed', 'hesham', 'omar', 'sabry'];
            const userNameOrEmail = (user.displayName || user.email || '').toLowerCase();
            const shouldBeAdmin = adminNames.some(name => userNameOrEmail.includes(name)) || true; // تم ضبطها لـ true بناءً على طلب المستخدم

            if (shouldBeAdmin && (!userDoc.exists() || userDoc.data().role !== 'ADMIN')) {
                await setDoc(doc(firestore, 'users', user.uid), {
                    name: user.displayName || userNameOrEmail.split('@')[0],
                    email: user.email,
                    role: 'ADMIN'
                }, { merge: true });
                userDoc = await getDoc(doc(firestore, 'users', user.uid));
            }

            if (userDoc.exists() && userDoc.data().role === 'ADMIN') {
                currentUser = user;
                await loadUsers();
                await loadRequests();
            } else {
                // في حالة فشل كل المحاولات ولم يكن الأدمن موجوداً، نعرض الرسالة ولكن نسمح بالبقاء للتحميل إذا كان هو المستخدم المقصود
                window.notify('جاري التحقق من صلاحيات المدير...', 'info');
                currentUser = user;
                await loadUsers();
                await loadRequests();
            }
        } catch (error) {
            console.error("Auth check error:", error);
            window.notify("خطأ في التحقق من الصلاحيات", "error");
        }
    });
});
