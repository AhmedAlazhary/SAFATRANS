
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

document.addEventListener('DOMContentLoaded', () => {
    mountAppNav("#global-app-nav", "admin");

    onAuthStateChanged(auth, async (user) => {
        try {
            if (user) {
                // Check if the user is an ADMIN
                let userDoc = await getDoc(doc(firestore, 'users', user.uid));
                
                // Fallback: If no users exist at all, make the first logged-in user an ADMIN
                const usersSnapshot = await getDocs(collection(firestore, 'users'));
                if (usersSnapshot.empty && !userDoc.exists()) {
                    await setDoc(doc(firestore, 'users', user.uid), {
                        name: user.displayName || 'Admin',
                        email: user.email,
                        role: 'ADMIN'
                    });
                    userDoc = await getDoc(doc(firestore, 'users', user.uid));
                }

                if (userDoc.exists() && userDoc.data().role === 'ADMIN') {
                    currentUser = user;
                    await loadUsers();
                    await loadRequests();
                    setupEventListeners();
                } else {
                    // If not an admin, redirect to dashboard or show an error
                    notify('ليس لديك صلاحية الوصول لهذه الصفحة', 'error');
                    setTimeout(() => window.location.href = "dashboard.html", 2000);
                }
            } else {
                window.location.href = "index.html";
            }
        } catch (error) {
            console.error("Auth initialization error:", error);
            notify("حدث خطأ في التحقق من الصلاحيات", "error");
            // If check fails (e.g. no internet), we still want the UI to be somewhat responsive or at least not crash
            setupEventListeners();
        }
    });
});

function setupEventListeners() {
    const addUserBtn = document.getElementById('addUserBtn');
    const userModal = document.getElementById('userModal');
    const closeBtn = document.querySelector('.close-btn');
    const userForm = document.getElementById('userForm');

    // Show modal to add a new user
    addUserBtn.onclick = () => {
        userForm.reset();
        document.getElementById('userId').value = '';
        document.getElementById('modalTitle').textContent = 'إضافة مستخدم جديد';
        userModal.style.display = 'block';
    };

    // Close modal
    closeBtn.onclick = () => {
        userModal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == userModal) {
            userModal.style.display = 'none';
        }
    };

    // Handle form submission for adding/editing users
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('userId').value;
        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value, // Note: Storing plain text passwords is not secure. Required for new users.
            role: document.getElementById('userRole').value,
        };

        if (userId) {
            // Update existing user
            await updateUser(userId, userData);
        } else {
            // Add new user
            await addUser(userData);
        }

        userModal.style.display = 'none';
        await loadUsers();
    });
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
            document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === tabId));
        };
    });

    document.getElementById('logoutBtn').onclick = () => signOut(auth);
}

async function loadUsers() {
    const usersCollection = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderUsersTable(usersList);
}

function renderUsersTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span style="font-family: monospace;">********</span></td>
            <td>${user.role}</td>
            <td>
                <button class="primary-btn" onclick="window.editUser('${user.id}')">تعديل</button>
                <button class="danger-btn" onclick="window.deleteUser('${user.id}')">حذف</button>
            </td>
        </tr>
    `).join('');
}

async function loadRequests() {
    const requestsCollection = collection(firestore, 'changeRequests');
    const requestsSnapshot = await getDocs(requestsCollection);
    const requestsList = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderRequestsTable(requestsList);
}

function renderRequestsTable(requests) {
    const tableBody = document.getElementById('requestsTableBody');
    tableBody.innerHTML = requests.map(req => {
        let dateStr = 'N/A';
        try {
            if (req.timestamp) {
                dateStr = new Date(req.timestamp.toDate ? req.timestamp.toDate() : req.timestamp).toLocaleString();
            }
        } catch (e) {
            console.error("Date formatting error:", e);
        }

        return `
            <tr>
                <td>${req.userName || 'Unknown'}</td>
                <td>${req.type || 'N/A'}</td>
                <td>${req.newValue || 'N/A'}</td>
                <td>${dateStr}</td>
                <td>
                    <button class="success-btn" onclick="window.approveRequest('${req.id}')">موافقة</button>
                    <button class="danger-btn" onclick="window.rejectRequest('${req.id}')">رفض</button>
                </td>
            </tr>
        `;
    }).join('');
}

// --- Global Functions for inline onclick events ---

window.editUser = async (id) => {
    const userDoc = await getDoc(doc(firestore, 'users', id));
    if (userDoc.exists()) {
        const user = userDoc.data();
        document.getElementById('userId').value = id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPassword').value = user.password;
        document.getElementById('userRole').value = user.role;
        document.getElementById('modalTitle').textContent = 'تعديل بيانات المستخدم';
        document.getElementById('userModal').style.display = 'block';
    }
};

window.deleteUser = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        await deleteDoc(doc(firestore, 'users', id));
        await loadUsers();
        notify('تم حذف المستخدم بنجاح', 'success');
    }
};

async function addUser(userData) {
    try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const newUser = userCredential.user;

        // Now, save the additional user data to Firestore
        await setDoc(doc(firestore, 'users', newUser.uid), {
            name: userData.name,
            email: userData.email,
            role: userData.role
            // Do NOT store the password here
        });

        notify('تمت إضافة المستخدم بنجاح', 'success');
    } catch (error) {
        console.error("Error adding user:", error);
        notify(`حدث خطأ: ${error.message}`, 'error');
    }
}

async function updateUser(id, userData) {
    await setDoc(doc(firestore, 'users', id), userData);
    notify('تم تحديث بيانات المستخدم بنجاح', 'success');
}

window.approveRequest = async (id) => {
    try {
        const requestDoc = await getDoc(doc(firestore, 'changeRequests', id));
        if (!requestDoc.exists()) {
            notify('لم يتم العثور على الطلب', 'error');
            return;
        }

        const requestData = requestDoc.data();
        const userRef = doc(firestore, 'users', requestData.userId);

        // Update the user's document with the new value (using setDoc with merge for safety)
        await setDoc(userRef, {
            [requestData.field]: requestData.newValue
        }, { merge: true });

        // In a real scenario, you'd also handle email/password changes via Firebase Auth Admin SDK
        // For now, we just update the Firestore document.

        // Delete the request after approval
        await deleteDoc(doc(firestore, 'changeRequests', id));

        await loadUsers();
        await loadRequests();
        notify('تمت الموافقة على الطلب وتحديث بيانات المستخدم', 'success');

    } catch (error) {
        console.error("Error approving request:", error);
        notify('حدث خطأ أثناء الموافقة على الطلب', 'error');
    }
};

window.rejectRequest = async (id) => {
    if (confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
        await deleteDoc(doc(firestore, 'changeRequests', id));
        await loadRequests();
        notify('تم رفض الطلب', 'success');
    }
};

function notify(msg, type) {
    const tc = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type === 'success' ? 'success-btn' : (type === 'error' ? 'danger-btn' : 'primary-btn')}`;
    t.textContent = msg;
    tc.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
