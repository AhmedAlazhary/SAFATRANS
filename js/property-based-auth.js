// Property-Based Auth Guards System
class PropertyBasedAuth {
  constructor() {
    this.currentUser = null;
    this.userPermissions = {};
    this.userRole = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.currentUser = null;
          this.userPermissions = {};
          this.userRole = null;
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
        this.userPermissions = userData.permissions || {};
      } else {
        // Fallback to Staff collection
        const staffDoc = await getDoc(doc(firestore, "Staff", user.uid));
        if (staffDoc.exists()) {
          const staffData = staffDoc.data();
          this.userRole = staffData.role || 'USER';
          this.userPermissions = this.getDefaultPermissions(staffData.role);
        } else {
          this.userRole = 'USER';
          this.userPermissions = this.getDefaultPermissions('USER');
        }
      }
    } catch (error) {
      console.error("Error loading user permissions:", error);
      this.userRole = 'USER';
      this.userPermissions = this.getDefaultPermissions('USER');
    }
  }

  getDefaultPermissions(role) {
    const permissions = {
      'ADMIN': {
        'transport-data': { view: true, edit: true },
        'prices': { view: true, edit: true },
        'daily': { view: true, edit: true },
        'drivers-roles': { view: true, edit: true },
        'treasury-system': { view: true, edit: true },
        'garage': { view: true, edit: true },
        'accounting': { view: true, edit: true },
        'admin-users': { view: true, edit: true },
        'profile': { view: true, edit: true }
      },
      'ACCOUNTANT': {
        'daily': { view: true, edit: false },
        'accounting': { view: true, edit: true },
        'profile': { view: true, edit: true }
      },
      'USER': {
        'profile': { view: true, edit: true }
      }
    };
    return permissions[role] || { 'profile': { view: true, edit: false } };
  }

  // Check if user can view a page
  canView(pagePermission) {
    const permission = this.userPermissions[pagePermission];
    return permission && permission.view;
  }

  // Check if user can edit on a page
  canEdit(pagePermission) {
    const permission = this.userPermissions[pagePermission];
    return permission && permission.edit;
  }

  // Get current page permission from URL
  getCurrentPagePermission() {
    const pageMap = {
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

    const currentPage = window.location.pathname.split('/').pop();
    return pageMap[currentPage];
  }

  // Middleware function to check page access
  checkPageAccess() {
    const currentPagePermission = this.getCurrentPagePermission();
    
    if (!currentPagePermission) {
      console.warn('Unknown page:', window.location.pathname);
      return true; // Allow access to unknown pages
    }

    if (!this.canView(currentPagePermission)) {
      this.redirectToAccessDenied();
      return false;
    }

    return true;
  }

  // Redirect to access denied page
  redirectToAccessDenied() {
    // Create access denied page if it doesn't exist
    const deniedUrl = 'access-denied.html';
    window.location.href = deniedUrl;
  }

  // Apply UI controls based on permissions
  applyUIControls() {
    const currentPagePermission = this.getCurrentPagePermission();
    
    if (!currentPagePermission) return;

    // Hide/show edit buttons based on edit permission
    document.querySelectorAll('[data-requires-edit]').forEach(element => {
      if (!this.canEdit(currentPagePermission)) {
        element.style.display = 'none';
      }
    });

    // Hide/show delete buttons based on edit permission
    document.querySelectorAll('[data-requires-delete]').forEach(element => {
      if (!this.canEdit(currentPagePermission)) {
        element.style.display = 'none';
      }
    });

    // Show read-only message if user can't edit
    if (!this.canEdit(currentPagePermission)) {
      this.showReadOnlyMessage();
    }
  }

  // Show read-only message
  showReadOnlyMessage() {
    const readOnlyMessage = document.createElement('div');
    readOnlyMessage.style.cssText = `
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 10px 15px;
      border-radius: 8px;
      margin: 10px 0;
      text-align: center;
      font-size: 0.9rem;
    `;
    readOnlyMessage.innerHTML = '⚠️ وضع القراءة فقط - ليس لديك صلاحية التعديل في هذه الصفحة';
    
    // Insert at the top of main content
    const mainContent = document.querySelector('main, .container, body');
    if (mainContent) {
      mainContent.insertBefore(readOnlyMessage, mainContent.firstChild);
    }
  }

  // Helper functions for backward compatibility
  hasPermission(permission) {
    return this.canView(permission);
  }

  canPerformAction(action, pagePermission) {
    switch(action) {
      case 'view':
        return this.canView(pagePermission);
      case 'edit':
      case 'delete':
        return this.canEdit(pagePermission);
      default:
        return false;
    }
  }
}

// Global instance
window.propertyBasedAuth = new PropertyBasedAuth();

// Auto-initialize and check page access
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await propertyBasedAuth.initialize();
    propertyBasedAuth.checkPageAccess();
    propertyBasedAuth.applyUIControls();
  } catch (error) {
    console.error('Auth initialization failed:', error);
    // Redirect to login if not authenticated
    if (window.location.pathname !== '/index.html') {
      window.location.href = 'index.html';
    }
  }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PropertyBasedAuth;
}
