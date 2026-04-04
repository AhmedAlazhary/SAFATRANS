// Enhanced Security Module for SAFATRANS
// وحدة تحسينات الأمان المتقدمة للنظام

class AdvancedSecurity {
    constructor() {
        this.securityHeaders = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Content-Security-Policy': this.generateCSP()
        };
        
        this.xssPatterns = {
            script: /<script[^>]*>.*?<\/script>/gi,
            iframe: /<iframe[^>]*>.*?<\/iframe>/gi,
            javascript: /javascript:/gi,
            onEvent: /on\w+\s*=/gi,
            eval: /eval\s*\(/gi,
            documentWrite: /document\.write\s*\(/gi,
            innerHTML: /innerHTML\s*=\s*`/gi,
            innerHTMLDollar: /innerHTML\s*=\s*\$\{/gi
        };
        
        this.sqlPatterns = {
            union: /union\s+select/gi,
            select: /select\s+.*\s+from/gi,
            insert: /insert\s+.*\s+into/gi,
            update: /update\s+.*\s+set/gi,
            delete: /delete\s+.*\s+from/gi,
            drop: /drop\s+(table|database|index)/gi,
            create: /create\s+(table|database|index)/gi,
            alter: /alter\s+(table|database|index)/gi,
            exec: /exec(\s|\+)+(s|x)p\w/gi,
            comment: /(--|#|\/\*|\*\/)/gi
        };
        
        this.rateLimiting = new Map();
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    }
    
    // Generate Content Security Policy
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
            'frame-src': ["'self'"],
            'frame-ancestors': ["'none'"],
            'form-action': ["'self'"],
            'base-uri': ["'self'"]
        };
    }
    
    // Apply security headers
    applySecurityHeaders() {
        var _this = this;
        Object.keys(this.securityHeaders).forEach(function(key) {
            var value = _this.securityHeaders[key];
            if (key === 'ContentSecurityPolicy') {
                var meta = document.createElement('meta');
                meta.httpEquiv = key;
                meta.content = value;
                document.head.appendChild(meta);
            } else {
                var meta = document.createElement('meta');
                meta.httpEquiv = key;
                meta.content = value;
                document.head.appendChild(meta);
            }
        });
    }
    
    // Advanced XSS protection
    sanitizeHTML(input, options) {
        if (!input) return '';
        
        var sanitized = String(input);
        
        // Remove dangerous HTML tags and attributes
        sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
        sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
        sanitized = sanitized.replace(/<object[^>]*>/gi, '');
        sanitized = sanitized.replace(/<embed[^>]*>/gi, '');
        sanitized = sanitized.replace(/<link[^>]*>/gi, '');
        sanitized = sanitized.replace(/<meta[^>]*>/gi, '');
        
        // Remove dangerous attributes
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/data:text\/html/gi, '');
        
        // Escape HTML entities
        var div = document.createElement('div');
        div.textContent = sanitized;
        sanitized = div.innerHTML;
        
        // Allow safe HTML if specified
        if (options && options.allowSafeHTML) {
            var safeTags = ['p', 'br', 'strong', 'em', 'span', 'div'];
            var safeAttributes = ['class', 'id'];
            
            // Reconstruct safe HTML
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = sanitized;
            
            var walker = document.createTreeWalker(
                tempDiv,
                NodeFilter.SHOW_ELEMENT,
                null,
                false
            );
            
            var node;
            var safeHTML = [];
            while (node = walker.nextNode()) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (safeTags.indexOf(node.tagName.toLowerCase()) !== -1) {
                        var attrs = node.attributes;
                        var safeAttrs = '';
                        for (var i = 0; i < attrs.length; i++) {
                            if (safeAttributes.indexOf(attrs[i].name.toLowerCase()) !== -1) {
                                safeAttrs += ' ' + attrs[i].name + '="' + this.escapeHtml(attrs[i].value) + '"';
                            }
                        }
                        safeHTML.push('<' + node.tagName.toLowerCase() + safeAttrs + '>');
                    }
                } else if (node.nodeType === Node.TEXT_NODE) {
                    safeHTML.push(this.escapeHtml(node.textContent));
                }
            }
            
            return safeHTML.join('');
        }
        
        return sanitized;
    }
    
    // SQL Injection protection
    preventSQLInjection(input) {
        if (!input) return true;
        
        var testInput = String(input).toLowerCase();
        
        // Check for SQL patterns
        for (var name in this.sqlPatterns) {
            var pattern = this.sqlPatterns[name];
            if (pattern.test(testInput)) {
                console.warn('SQL injection attempt detected: ' + name + ' pattern');
                return false;
            }
        }
        
        return true;
    }
    
    // Rate limiting
    checkRateLimit(identifier, action) {
        var now = Date.now();
        var key = identifier + ':' + action;
        
        if (!this.rateLimiting.has(key)) {
            this.rateLimiting.set(key, []);
        }
        
        var attempts = this.rateLimiting.get(key);
        var recentAttempts = attempts.filter(function(time) { return now - time < 60000; }); // Last minute
        
        if (recentAttempts.length >= 10) { // Max 10 attempts per minute
            console.warn('Rate limit exceeded for: ' + key);
            return false;
        }
        
        attempts.push(now);
        this.rateLimiting.set(key, attempts);
        return true;
    }
    
    // Session security
    validateSession(user) {
        if (!user || !user.lastActivity) {
            return false;
        }
        
        var now = Date.now();
        var timeSinceLastActivity = now - user.lastActivity;
        
        if (timeSinceLastActivity > this.sessionTimeout) {
            console.warn('Session expired for user: ' + user.email);
            return false;
        }
        
        // Update last activity
        user.lastActivity = now;
        return true;
    }
    
    // Input validation
    validateInput(input, type, options) {
        if (!type) type = 'text';
        if (!options) options = {};
        
        var validations = {
            text: {
                maxLength: 1000,
                allowedChars: /^[a-zA-Z0-9\s\-_.,!@#$%^&*()+=\[\]{}|\\:"'<>?\/]*$/
            },
            email: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                maxLength: 255
            },
            number: {
                pattern: /^-?\d*\.?\d+$/,
                min: options.min || 0,
                max: options.max || Number.MAX_SAFE_INTEGER
            },
            date: {
                pattern: /^\d{4}-\d{2}-\d{2}$/,
                min: new Date('1900-01-01'),
                max: new Date()
            }
        };
        
        var validation = validations[type];
        if (!validation) return { valid: true };
        
        var result = { valid: true, errors: [] };
        
        // Check SQL injection
        if (!this.preventSQLInjection(input)) {
            result.valid = false;
            result.errors.push('Invalid characters detected');
        }
        
        // Check XSS
        if (this.xssPatterns.script.test(input) || 
            this.xssPatterns.javascript.test(input) || 
            this.xssPatterns.onEvent.test(input)) {
            result.valid = false;
            result.errors.push('Invalid content detected');
        }
        
        // Type-specific validation
        if (validation.pattern && !validation.pattern.test(input)) {
            result.valid = false;
            result.errors.push('Invalid format');
        }
        
        if (validation.maxLength && input.length > validation.maxLength) {
            result.valid = false;
            result.errors.push('Maximum length is ' + validation.maxLength);
        }
        
        if (validation.min && parseFloat(input) < validation.min) {
            result.valid = false;
            result.errors.push('Minimum value is ' + validation.min);
        }
        
        if (validation.max && parseFloat(input) > validation.max) {
            result.valid = false;
            result.errors.push('Maximum value is ' + validation.max);
        }
        
        return result;
    }
    
    // Secure localStorage
    secureStorage() {
        var originalSetItem = localStorage.setItem;
        var originalGetItem = localStorage.getItem;
        var originalRemoveItem = localStorage.removeItem;
        var _this = this;
        
        localStorage.setItem = function(key, value) {
            try {
                // Encrypt sensitive data
                if (key.indexOf('password') !== -1 || key.indexOf('token') !== -1) {
                    value = btoa(JSON.stringify({
                        data: value,
                        timestamp: Date.now(),
                        checksum: btoa(value).slice(0, 10)
                    }));
                }
                return originalSetItem.call(this, key, value);
            } catch (error) {
                console.error('localStorage.setItem error:', error);
            }
        };
        
        localStorage.getItem = function(key) {
            try {
                var value = originalGetItem.call(this, key);
                
                // Decrypt sensitive data
                if (key.indexOf('password') !== -1 || key.indexOf('token') !== -1) {
                    try {
                        var decoded = JSON.parse(atob(value));
                        if (decoded.checksum === btoa(decoded.data).slice(0, 10)) {
                            return decoded.data;
                        }
                    } catch (e) {
                        return null;
                    }
                }
                
                return value;
            } catch (error) {
                console.error('localStorage.getItem error:', error);
                return null;
            }
        };
    }
    
    // CSRF protection
    generateCSRFToken() {
        var token = btoa(Date.now().toString() + Math.random().toString(36));
        sessionStorage.setItem('csrfToken', token);
        return token;
    }
    
    validateCSRFToken(token) {
        var storedToken = sessionStorage.getItem('csrfToken');
        return token && storedToken && token === storedToken;
    }
    
    // Secure form handling
    secureForm(form, options) {
        if (!form) return;
        if (!options) options = {};
        
        // Add CSRF token
        if (options.csrfProtection) {
            var token = this.generateCSRFToken();
            var tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'csrfToken';
            tokenInput.value = token;
            form.appendChild(tokenInput);
        }
        
        // Secure form submission
        var originalSubmit = form.onsubmit;
        var _this = this;
        form.onsubmit = function(e) {
            e.preventDefault();
            
            // Validate CSRF
            if (options.csrfProtection) {
                var formData = new FormData(form);
                var submittedToken = formData.get('csrfToken');
                if (!_this.validateCSRFToken(submittedToken)) {
                    console.error('CSRF token validation failed');
                    return false;
                }
            }
            
            // Validate all inputs
            var inputs = form.querySelectorAll('input, textarea, select');
            var isValid = true;
            
            inputs.forEach(function(input) {
                var value = input.value;
                var type = input.type || 'text';
                var validation = _this.validateInput(value, type, input.dataset);
                
                if (!validation.valid) {
                    isValid = false;
                    _this.showFieldError(input, validation.errors);
                } else {
                    _this.clearFieldError(input);
                }
            });
            
            if (isValid && originalSubmit) {
                return originalSubmit.call(form, e);
            }
        };
    }
    
    // Field error handling
    showFieldError(field, errors) {
        this.clearFieldError(field);
        
        var errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = 'red';
        errorDiv.style.fontSize = '0.8em';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = errors.join(', ');
        
        field.parentNode.appendChild(errorDiv);
        field.style.borderColor = 'red';
    }
    
    clearFieldError(field) {
        var errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        field.style.borderColor = '';
    }
    
    // Initialize security
    initialize() {
        console.log(' Initializing advanced security...');
        
        // Apply security headers
        this.applySecurityHeaders();
        
        // Secure storage
        this.secureStorage();
        
        // Monitor for security violations
        this.setupSecurityMonitoring();
        
        console.log(' Advanced security initialized');
    }
    
    // Security monitoring
    setupSecurityMonitoring() {
        var _this = this;
        
        // Monitor XSS attempts
        document.addEventListener('input', function(e) {
            if (e.target.value && (_this.xssPatterns.javascript.test(e.target.value) || _this.xssPatterns.onEvent.test(e.target.value))) {
                console.warn('XSS attempt detected:', e.target.value);
                e.target.value = _this.sanitizeHTML(e.target.value);
            }
        });
        
        // Monitor console access
        var originalLog = console.log;
        console.log = function() {
            var content = Array.prototype.slice.call(arguments).join(' ');
            if (content.indexOf('innerHTML') !== -1 || content.indexOf('document.write') !== -1) {
                originalLog.call(console, ' Potential XSS detected:', content);
            }
            originalLog.apply(console, arguments);
        };
        
        // Monitor for script injection attempts
        var originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            var element = originalCreateElement.call(this, tagName);
            
            if (tagName.toLowerCase() === 'script') {
                console.warn('Script element creation detected:', tagName);
                // Add monitoring to script elements
                var originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name, value) {
                    if (name === 'src' && value && value.indexOf('https://') !== 0) {
                        console.warn('Suspicious script source:', value);
                        return;
                    }
                    return originalSetAttribute.call(this, name, value);
                };
            }
            
            return element;
        };
    }
    
    // Utility function to escape HTML
    escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialize
var advancedSecurity = new AdvancedSecurity();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        advancedSecurity.initialize();
    });
} else {
    advancedSecurity.initialize();
}

// Export for global use
window.AdvancedSecurity = AdvancedSecurity;
window.advancedSecurity = advancedSecurity;
