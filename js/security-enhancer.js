// Security Enhancement Module for SAFATRANS
// وحدة تحسين الأمان للنظام

class SecurityEnhancer {
    constructor() {
        this.xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*<\/script>/gi,
            /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*<\/iframe>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\s*\(/gi,
            /document\.write\s*\(/gi,
            /innerHTML\s*=\s*`/gi,
            /innerHTML\s*=\s*\$\{/gi
        ];
        
        this.sqlInjectionPatterns = [
            /('|(\\-\\-)|(;)|(\\|\\|)|(\\||)|(\\*|\\*)/i,
            /(exec(\s|\+)+(s|x)p\w)/i,
            /(union|select|insert|update|delete|drop|create|alter)\s+/i
        ];
        
        this.dangerousFunctions = [
            'eval',
            'Function',
            'setTimeout',
            'setInterval',
            'document.write',
            'innerHTML',
            'outerHTML',
            'insertAdjacentHTML'
        ];
    }
    
    // Sanitize HTML content
    sanitizeHTML(input) {
        if (!input) return '';
        
        let sanitized = String(input);
        
        // Remove script tags and dangerous content
        this.xssPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        
        // Escape HTML entities
        const div = document.createElement('div');
        div.textContent = sanitized;
        return div.innerHTML;
    }
    
    // Validate input for SQL injection
    validateSQLInput(input) {
        if (!input) return true;
        
        const testInput = String(input).toLowerCase();
        return !this.sqlInjectionPatterns.some(pattern => 
            pattern.test(testInput)
        );
    }
    
    // Check for dangerous function calls
    validateFunctionCall(code) {
        if (!code) return true;
        
        const testCode = String(code).toLowerCase();
        return !this.dangerousFunctions.some(func => 
            testCode.includes(func.toLowerCase())
        );
    }
    
    // Safe innerHTML replacement
    safeSetHTML(element, content) {
        if (!element || !content) return;
        
        const sanitized = this.sanitizeHTML(content);
        element.innerHTML = sanitized;
    }
    
    // Safe event listener attachment
    safeAddEventListener(element, event, handler, options) {
        if (!element || !event || !handler) return;
        
        const safeHandler = (e) => {
            try {
                // Validate event data
                if (e.target && e.target.value) {
                    if (!this.validateSQLInput(e.target.value)) {
                        console.warn('SQL injection attempt blocked:', e.target.value);
                        e.preventDefault();
                        return false;
                    }
                }
                handler(e);
            } catch (error) {
                console.error('Error in event handler:', error);
                e.preventDefault();
            }
        };
        
        element.addEventListener(event, safeHandler, options);
    }
    
    // Secure form submission
    secureForm(formElement, submitHandler) {
        if (!formElement || !submitHandler) return;
        
        const secureHandler = (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(formElement);
                const data = {};
                
                // Validate all form data
                for (let [key, value] of formData.entries()) {
                    if (typeof value === 'string') {
                        if (!this.validateSQLInput(value)) {
                            console.warn('SQL injection attempt blocked in form field:', key);
                            return;
                        }
                        data[key] = this.sanitizeHTML(value);
                    } else {
                        data[key] = value;
                    }
                }
                
                submitHandler(data);
            } catch (error) {
                console.error('Error in form submission:', error);
            }
        };
        
        formElement.addEventListener('submit', secureHandler);
    }
    
    // Content Security Policy helper
    generateCSP() {
        return {
            'default-src': ["'self'"],
            'script-src': ["'self'", "https://www.gstatic.com", "https://www.googleapis.com"],
            'style-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            'img-src': ["'self'", "data:", "https:"],
            'connect-src': ["'self'", "*.firebaseio.com", "*.googleapis.com"],
            'font-src': ["'self'", "https://cdn.jsdelivr.net"],
            'object-src': ["'none'"],
            'media-src': ["'self'"],
            'frame-src': ["'self'"]
        };
    }
    
    // Apply security headers
    applySecurityHeaders() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        const csp = Object.entries(this.generateCSP())
            .map(([key, value]) => `${key} ${value.join(' ')}`)
            .join('; ');
        meta.content = csp;
        document.head.appendChild(meta);
        
        // Add other security headers
        const xFrameOptions = document.createElement('meta');
        xFrameOptions.httpEquiv = 'X-Frame-Options';
        xFrameOptions.content = 'DENY';
        document.head.appendChild(xFrameOptions);
        
        const xContentType = document.createElement('meta');
        xContentType.httpEquiv = 'X-Content-Type-Options';
        xContentType.content = 'nosniff';
        document.head.appendChild(xContentType);
    }
    
    // Initialize security measures
    initialize() {
        console.log('🔒 Initializing security enhancements...');
        
        // Apply CSP headers
        this.applySecurityHeaders();
        
        // Override dangerous functions
        this.secureDangerousFunctions();
        
        // Add global error handling
        this.setupGlobalErrorHandling();
        
        console.log('✅ Security enhancements initialized');
    }
    
    // Secure dangerous global functions
    secureDangerousFunctions() {
        const originalWrite = document.write;
        document.write = function(content) {
            const security = new SecurityEnhancer();
            const sanitized = security.sanitizeHTML(content);
            return originalWrite.call(this, sanitized);
        };
        
        // Monitor innerHTML usage
        const originalLog = console.log;
        console.log = function(...args) {
            const content = args.join(' ');
            if (content.includes('innerHTML') || content.includes('document.write')) {
                originalLog.call(console, '⚠️ Potential XSS detected:', content);
            }
            originalLog.apply(console, args);
        };
    }
    
    // Setup global error handling
    setupGlobalErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error caught:', e.error);
            // Send error to logging service if needed
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
    }
}

// Auto-initialize security
const securityEnhancer = new SecurityEnhancer();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        securityEnhancer.initialize();
    });
} else {
    securityEnhancer.initialize();
}

// Export for global use
window.SecurityEnhancer = SecurityEnhancer;
window.securityEnhancer = securityEnhancer;
