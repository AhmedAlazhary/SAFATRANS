// Enhanced Dynamic Permissions Matrix System
class EnhancedPermissionsUI {
  constructor() {
    this.currentUser = null;
    this.userPermissions = {};
    this.userJobTitle = '';
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.currentUser = null;
          this.userPermissions = {};
          this.userJobTitle = '';
          reject(new Error('User not authenticated'));
          return;
        }

        this.currentUser = user;
        await this.loadUserData(user);
        this.applyDynamicUI();
        resolve(this);
      });
    });
  }

  async loadUserData(user) {
    try {
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userJobTitle = userData.job_title || '';
        this.userPermissions = userData.permissions || {};
        
        // Check if account is active
        if (userData.isActive === false) {
          this.handleDisabledAccount();
          return;
        }
      } else {
        // Fallback for backward compatibility
        this.userJobTitle = '';
        this.userPermissions = this.getDefaultPermissions();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      this.userJobTitle = '';
      this.userPermissions = this.getDefaultPermissions();
    }
  }

  handleDisabledAccount() {
    // Sign out the user and redirect to login
    signOut(auth).then(() => {
      window.location.href = 'index.html';
    });
  }

  getDefaultPermissions() {
    return {
      'daily_report': { canView: false, canEdit: false },
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
  }

  applyDynamicUI() {
    // Build sidebar navigation dynamically
    this.buildDynamicSidebar();
    
    // Apply page-level controls
    this.applyPageControls();
    
    // Update user info display
    this.updateUserInfo();
  }

  buildDynamicSidebar() {
    const sidebarPages = [
      { id: 'daily_report', label: 'بيان الشغل اليومي', icon: '📊', url: 'daily.html' },
      { id: 'accounting', label: 'المحاسبة', icon: '💰', url: 'accounting.html' },
      { id: 'trips_management', label: 'إدارة النقلات', icon: '🚚', url: 'transport-data.html' },
      { id: 'drivers_management', label: 'إدارة السواقين', icon: '👥', url: 'drivers-roles-page.html' },
      { id: 'employees_management', label: 'إدارة الموظفين', icon: '👥', url: 'employees.html' },
      { id: 'prices_management', label: 'إدارة الأسعار', icon: '💵', url: 'prices.html' },
      { id: 'garage_management', label: 'إدارة الجراج', icon: '🔧', url: 'garage.html' },
      { id: 'treasury_management', label: 'إدارة الخزنة', icon: '🏦', url: 'treasury-system.html' },
      { id: 'user_management', label: 'إدارة المستخدمين', icon: '👤', url: 'admin-users.html' },
      { id: 'reports', label: 'التقارير', icon: '📈', url: 'reports.html' },
      { id: 'profile', label: 'الملف الشخصي', icon: '👤', url: 'profile.html' }
    ];

    // Find or create sidebar container
    let sidebar = document.querySelector('.sidebar, .nav-grid');
    if (!sidebar) {
      // Create sidebar if it doesn't exist
      sidebar = document.createElement('div');
      sidebar.className = 'nav-grid';
      const container = document.querySelector('.container, main');
      if (container) {
        container.insertBefore(sidebar, container.firstChild);
      }
    }

    // Clear existing content
    sidebar.innerHTML = '';

    // Build navigation cards dynamically
    sidebarPages.forEach(page => {
      const permission = this.userPermissions[page.id];
      
      if (permission && permission.canView) {
        const card = document.createElement('article');
        card.className = 'nav-card';
        card.innerHTML = `
          <h3>${page.icon} ${page.label}</h3>
          <p>الوصول إلى ${page.label}</p>
          <button onclick="window.location.href='${page.url}'" 
                  ${!permission.canEdit ? 'data-read-only="true"' : ''}>
            ${permission.canEdit ? 'فتح الصفحة' : 'عرض فقط'}
          </button>
        `;
        
        // Add read-only styling if needed
        if (!permission.canEdit) {
          card.style.border = '1px solid #ffc107';
          card.style.background = '#fff9c4';
        }
        
        sidebar.appendChild(card);
      }
    });
  }

  applyPageControls() {
    const currentPage = this.getCurrentPagePermission();
    if (!currentPage) return;

    const permission = this.userPermissions[currentPage];
    if (!permission) return;

    // Hide/show edit buttons
    document.querySelectorAll('[data-requires-edit]').forEach(element => {
      if (!permission.canEdit) {
        element.style.display = 'none';
      } else {
        element.style.display = '';
      }
    });

    // Hide/show delete buttons
    document.querySelectorAll('[data-requires-delete]').forEach(element => {
      if (!permission.canEdit) {
        element.style.display = 'none';
      } else {
        element.style.display = '';
      }
    });

    // Add read-only indicator
    if (!permission.canEdit) {
      this.addReadOnlyIndicator();
    }
  }

  getCurrentPagePermission() {
    const pageMap = {
      'daily.html': 'daily_report',
      'accounting.html': 'accounting',
      'transport-data.html': 'trips_management',
      'drivers-roles-page.html': 'drivers_management',
      'employees.html': 'employees_management',
      'prices.html': 'prices_management',
      'garage.html': 'garage_management',
      'treasury-system.html': 'treasury_management',
      'admin-users.html': 'user_management',
      'reports.html': 'reports',
      'profile.html': 'profile'
    };

    const currentPage = window.location.pathname.split('/').pop();
    return pageMap[currentPage];
  }

  addReadOnlyIndicator() {
    // Remove existing indicators
    const existing = document.querySelector('.read-only-indicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.className = 'read-only-indicator';
    indicator.style.cssText = `
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 12px 20px;
      border-radius: 8px;
      margin: 10px 0;
      text-align: center;
      font-size: 0.95rem;
      font-weight: bold;
    `;
    indicator.innerHTML = '📖 وضع القراءة فقط - ليس لديك صلاحية التعديل في هذه الصفحة';
    
    // Insert at the top of main content
    const mainContent = document.querySelector('main, .container, body');
    if (mainContent) {
      mainContent.insertBefore(indicator, mainContent.firstChild);
    }
  }

  updateUserInfo() {
    const userInfoElements = document.querySelectorAll('[data-user-info]');
    userInfoElements.forEach(element => {
      element.textContent = this.userJobTitle || 'مستخدم';
    });
  }

  // Helper methods
  canView(pageId) {
    const permission = this.userPermissions[pageId];
    return permission && permission.canView;
  }

  canEdit(pageId) {
    const permission = this.userPermissions[pageId];
    return permission && permission.canEdit;
  }

  getJobTitle() {
    return this.userJobTitle;
  }
}

// Global instance
window.enhancedPermissionsUI = new EnhancedPermissionsUI();

// Auto-initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await enhancedPermissionsUI.initialize();
  } catch (error) {
    console.error('Enhanced UI initialization failed:', error);
    // Redirect to login if not authenticated
    if (window.location.pathname !== '/index.html') {
      window.location.href = 'index.html';
    }
  }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedPermissionsUI;
}
