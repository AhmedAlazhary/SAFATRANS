// Global Permission System
class PermissionManager {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.permissions = [];
    this.userProfile = {};
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.currentUser = null;
          this.userRole = null;
          this.permissions = [];
          this.userProfile = {};
          reject(new Error('User not authenticated'));
          return;
        }

        this.currentUser = user;
        await this.loadUserPermissions(user);
        resolve(this);
      });
    });
  }

  async loadUserPermissions(user) {
    try {
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userRole = userData.role || 'USER';
        this.permissions = userData.allowedPages || [];
        this.userProfile = userData;
      } else {
        // Fallback to Staff collection
        const staffDoc = await getDoc(doc(firestore, "Staff", user.uid));
        if (staffDoc.exists()) {
          const staffData = staffDoc.data();
          this.userRole = staffData.role || 'viewer';
          this.permissions = this.getDefaultPermissions(staffData.role);
          this.userProfile = staffData;
        } else {
          this.userRole = 'viewer';
          this.permissions = [];
          this.userProfile = {};
        }
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
      this.userRole = 'viewer';
      this.permissions = [];
    }
  }

  getDefaultPermissions(role) {
    const permissions = {
      'ADMIN': ['transport-data', 'prices', 'daily', 'drivers-roles', 'treasury-system', 'garage', 'accounting', 'admin-users', 'profile'],
      'MANAGER': ['transport-data', 'prices', 'daily', 'drivers-roles', 'treasury-system', 'profile'],
      'EDITOR': ['daily', 'profile'],
      'VIEWER': ['profile']
    };
    return permissions[role] || [];
  }

  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  hasRole(role) {
    return this.userRole === role;
  }

  canAccess(page) {
    const pagePermissions = {
      'transport-data.html': 'transport-data',
      'prices.html': 'prices',
      'daily.html': 'daily',
      'drivers-roles-page.html': 'drivers-roles',
      'treasury-system.html': 'treasury-system',
      'garage.html': 'garage',
      'accounting.html': 'accounting',
      'admin-users.html': 'admin-users',
      'profile.html': 'profile'
    };
    
    const requiredPermission = pagePermissions[page];
    return requiredPermission ? this.hasPermission(requiredPermission) : false;
  }

  applyPagePermissions() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!this.canAccess(currentPage)) {
      alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      window.location.href = 'dashboard.html';
      return false;
    }
    
    return true;
  }

  hideElementsWithoutPermission() {
    // Hide navigation elements
    document.querySelectorAll('[data-permission]').forEach(element => {
      const requiredPermission = element.dataset.permission;
      if (!this.hasPermission(requiredPermission)) {
        element.style.display = 'none';
      }
    });

    // Hide navigation cards
    const pagePermissions = {
      'transport-data.html': 'transport-data',
      'prices.html': 'prices',
      'daily.html': 'daily',
      'drivers-roles-page.html': 'drivers-roles',
      'treasury-system.html': 'treasury-system',
      'garage.html': 'garage',
      'accounting.html': 'accounting',
      'admin-users.html': 'admin-users',
      'profile.html': 'profile'
    };

    document.querySelectorAll('.nav-card').forEach(card => {
      const button = card.querySelector('button');
      if (!button) return;

      const targetPage = button.dataset.target;
      const requiredPermission = pagePermissions[targetPage];

      if (requiredPermission && !this.hasPermission(requiredPermission)) {
        card.style.display = 'none';
      } else {
        card.style.display = 'block';
      }
    });

    // Special case for admin users
    const adminCard = document.querySelector('[data-target="admin-users.html"]');
    if (adminCard && !this.hasRole('ADMIN')) {
      adminCard.style.display = 'none';
    }
  }

  getRoleLabel(role) {
    const labels = {
      'ADMIN': 'مدير نظام',
      'MANAGER': 'مدير',
      'EDITOR': 'محرر',
      'VIEWER': 'مشاهد',
      'USER': 'مستخدم'
    };
    return labels[role] || 'مستخدم';
  }
}

// Global instance
window.permissionManager = new PermissionManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PermissionManager;
}
