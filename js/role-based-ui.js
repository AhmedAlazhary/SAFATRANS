// Role-based UI Control System
class RoleBasedUI {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.permissions = [];
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.currentUser = null;
          this.userRole = null;
          this.permissions = [];
          reject(new Error('User not authenticated'));
          return;
        }

        this.currentUser = user;
        await this.loadUserRole(user);
        this.applyUIControls();
        resolve(this);
      });
    });
  }

  async loadUserRole(user) {
    try {
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userRole = userData.role || 'USER';
        this.permissions = userData.allowedPages || [];
      } else {
        // Fallback
        this.userRole = 'USER';
        this.permissions = ['profile'];
      }
    } catch (error) {
      console.error("Error loading user role:", error);
      this.userRole = 'USER';
      this.permissions = ['profile'];
    }
  }

  applyUIControls() {
    // Hide/show elements based on role
    this.hideAdminElements();
    this.hideAccountantElements();
    this.hideUserElements();
    this.showAllowedElements();
  }

  hideAdminElements() {
    if (this.userRole !== 'ADMIN') {
      // Hide admin-only elements
      document.querySelectorAll('[data-admin-only]').forEach(el => {
        el.style.display = 'none';
      });

      // Hide admin navigation
      const adminNav = document.querySelector('[data-target="admin-users.html"]');
      if (adminNav) adminNav.style.display = 'none';

      // Hide edit/delete buttons for non-admins
      document.querySelectorAll('[data-requires-admin]').forEach(el => {
        el.style.display = 'none';
      });
    }
  }

  hideAccountantElements() {
    if (this.userRole === 'USER') {
      // Hide accountant-only elements
      document.querySelectorAll('[data-accountant-only]').forEach(el => {
        el.style.display = 'none';
      });

      // Hide accounting navigation
      const accountingNav = document.querySelector('[data-target="accounting.html"]');
      if (accountingNav) accountingNav.style.display = 'none';
    }
  }

  hideUserElements() {
    if (this.userRole === 'USER') {
      // Hide management tabs completely
      document.querySelectorAll('[data-hide-from-user]').forEach(el => {
        el.style.display = 'none';
      });

      // Hide all management navigation
      const managementNavs = [
        '[data-target="admin-users.html"]',
        '[data-target="transport-data.html"]',
        '[data-target="prices.html"]',
        '[data-target="drivers-roles-page.html"]',
        '[data-target="treasury-system.html"]',
        '[data-target="garage.html"]',
        '[data-target="accounting.html"]'
      ];

      managementNavs.forEach(selector => {
        const nav = document.querySelector(selector);
        if (nav) nav.style.display = 'none';
      });
    }
  }

  showAllowedElements() {
    // Show elements based on permissions
    document.querySelectorAll('[data-permission]').forEach(el => {
      const requiredPermission = el.dataset.permission;
      if (this.permissions.includes(requiredPermission)) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  }

  // Check if user can perform action
  canEdit() {
    return this.userRole === 'ADMIN';
  }

  canDelete() {
    return this.userRole === 'ADMIN';
  }

  canViewAccounting() {
    return ['ADMIN', 'ACCOUNTANT'].includes(this.userRole);
  }

  canViewDaily() {
    return ['ADMIN', 'ACCOUNTANT'].includes(this.userRole);
  }

  // Get role display name
  getRoleDisplayName() {
    const roleNames = {
      'ADMIN': 'مدير',
      'ACCOUNTANT': 'حسابات',
      'USER': 'مستخدم'
    };
    return roleNames[this.userRole] || 'مستخدم';
  }
}

// Global instance
window.roleBasedUI = new RoleBasedUI();

// Helper functions for backward compatibility
window.canEdit = () => roleBasedUI.canEdit();
window.canDelete = () => roleBasedUI.canDelete();
window.canViewAccounting = () => roleBasedUI.canViewAccounting();
window.canViewDaily = () => roleBasedUI.canViewDaily();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoleBasedUI;
}
