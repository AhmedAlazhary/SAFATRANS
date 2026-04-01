
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { mountAppNav } from "./app-nav.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

let currentUser = null;
let userData = null;

document.addEventListener('DOMContentLoaded', () => {
    mountAppNav("#global-app-nav", "profile");

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadUserProfile();
            setupEventListeners();
        } else {
            window.location.href = "index.html";
        }
    });
});

async function loadUserProfile() {
    try {
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (userDoc.exists()) {
            userData = userDoc.data();
            
            // Display current info
            document.getElementById('displayName').textContent = userData.name || 'مستخدم';
            document.getElementById('displayEmail').textContent = userData.email || currentUser.email;
            
            // Pre-fill form
            document.getElementById('userName').value = userData.name || '';
            document.getElementById('userEmail').value = userData.email || currentUser.email;
            
            // Set avatar if exists
            if (userData.photoURL) {
                document.getElementById('avatarImage').src = userData.photoURL;
            } else {
                // Default avatar
                document.getElementById('avatarImage').src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.name || 'User') + '&background=random';
            }
        } else {
            console.warn("User document not found in Firestore.");
            document.getElementById('displayName').textContent = currentUser.displayName || 'مستخدم';
            document.getElementById('displayEmail').textContent = currentUser.email;
            document.getElementById('avatarImage').src = 'https://ui-avatars.com/api/?name=User&background=random';
        }
    } catch (error) {
        console.error("Error loading profile:", error);
        notify("حدث خطأ أثناء تحميل البيانات", "error");
    }
}

function setupEventListeners() {
    document.getElementById('logoutBtn').onclick = () => signOut(auth);

    // Avatar upload click handler
    const avatarContainer = document.getElementById('avatarContainer');
    const avatarUpload = document.getElementById('avatarUpload');
    
    avatarContainer.onclick = () => {
        avatarUpload.click();
    };

    avatarUpload.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // In a real app, you would upload this to Firebase Storage
            // For now, we'll just show a preview and notify that it needs admin approval
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('avatarImage').src = e.target.result;
                submitChangeRequest('photoURL', e.target.result, 'تغيير الصورة الشخصية');
            };
            reader.readAsDataURL(file);
        }
    };

    // Form submission
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newName = document.getElementById('userName').value;
        const newEmail = document.getElementById('userEmail').value;
        const newPassword = document.getElementById('userPassword').value;

        let changesRequested = false;

        if (newName !== (userData?.name || '')) {
            await submitChangeRequest('name', newName, 'تغيير الاسم');
            changesRequested = true;
        }

        if (newEmail !== (userData?.email || currentUser.email)) {
            await submitChangeRequest('email', newEmail, 'تغيير البريد الإلكتروني');
            changesRequested = true;
        }

        if (newPassword) {
            await submitChangeRequest('password', newPassword, 'تغيير كلمة المرور');
            changesRequested = true;
            document.getElementById('userPassword').value = ''; // Clear password field
        }

        if (changesRequested) {
            notify('تم إرسال طلبات التغيير للمدير للموافقة عليها', 'success');
        } else {
            notify('لم تقم بإجراء أي تغييرات', 'info');
        }
    });
}

async function submitChangeRequest(field, newValue, typeDescription) {
    try {
        await addDoc(collection(firestore, 'changeRequests'), {
            userId: currentUser.uid,
            userName: userData?.name || currentUser.email,
            field: field,
            newValue: newValue,
            type: typeDescription,
            status: 'pending',
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error submitting request:", error);
        notify("حدث خطأ أثناء إرسال الطلب", "error");
    }
}

function notify(msg, type) {
    const tc = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type === 'success' ? 'success-btn' : (type === 'error' ? 'danger-btn' : 'primary-btn')}`;
    t.textContent = msg;
    tc.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
