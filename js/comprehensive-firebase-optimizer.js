// Comprehensive Firebase Optimization System
// نظام تحسينات Firebase الشامل لكل صفحات المشروع

class ComprehensiveFirebaseOptimizer {
    constructor() {
        this.firebaseOptimizer = window.firebaseOptimizer;
        this.realtimeOptimizer = window.realtimeOptimizer;
        this.pageOptimizers = new Map();
        this.globalCache = new Map();
        this.performanceMetrics = {
            reads: 0,
            writes: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }

    // تهيئة التحسينات لصفحة معينة
    initializePageOptimization(pageName, options = {}) {
        const defaultOptions = {
            enableCaching: true,
            enablePagination: true,
            enableSmartPolling: true,
            cacheTTL: 5 * 60 * 1000, // 5 دقائق
            pageSize: 20,
            pollingInterval: 30000, // 30 ثانية
            fields: null, // حقول محددة
            orderBy: null,
            where: null
        };

        const pageOptions = { ...defaultOptions, ...options };
        this.pageOptimizers.set(pageName, pageOptions);

        console.log(`🚀 Initialized optimization for ${pageName}`, pageOptions);
        return pageOptions;
    }

    // تحسين استعلام البيانات العامة
    async optimizedQuery(collection, options = {}) {
        const {
            pageName = 'default',
            useCache = true,
            ttl = 5 * 60 * 1000,
            fields = null,
            where = null,
            orderBy = null,
            limit = null,
            docId = null
        } = options;

        // تسجيل عدد القراءات
        this.performanceMetrics.reads++;

        try {
            const result = await this.firebaseOptimizer.optimizedGet(
                collection,
                docId,
                {
                    useCache: useCache,
                    ttl: ttl,
                    fields: fields,
                    where: where,
                    orderBy: orderBy,
                    limit: limit
                }
            );

            // تسجيل cache hit/miss
            if (useCache) {
                const cacheKey = this.firebaseOptimizer.cache.generateCacheKey(collection, docId, { fields, where, orderBy, limit });
                if (this.firebaseOptimizer.cache.has(cacheKey)) {
                    this.performanceMetrics.cacheHits++;
                } else {
                    this.performanceMetrics.cacheMisses++;
                }
            }

            return result;
        } catch (error) {
            console.error('Optimized query error:', error);
            throw error;
        }
    }

    // تحسين pagination لقوائم البيانات
    async paginatedQuery(collection, options = {}) {
        const {
            pageName = 'default',
            pageSize = 20,
            startAfter = null,
            orderBy = ['createdAt', 'desc'],
            where = null,
            fields = null
        } = options;

        try {
            const result = await this.firebaseOptimizer.paginatedQuery(
                collection,
                {
                    pageSize: pageSize,
                    startAfter: startAfter,
                    orderBy: orderBy,
                    where: where,
                    fields: fields
                }
            );

            return result;
        } catch (error) {
            console.error('Paginated query error:', error);
            throw error;
        }
    }

    // إنشاء smart polling للبيانات التي تحتاج تحديث دوري
    createSmartPolling(collection, options = {}) {
        const {
            pageName = 'default',
            callback = null,
            pollingInterval = 30000,
            useCache = true,
            ttl = 2 * 60 * 1000, // دقيقتين للـ polling
            fields = null,
            where = null,
            orderBy = null,
            limit = null
        } = options;

        return this.realtimeOptimizer.createSmartPolling(
            collection,
            {
                callback: (data) => {
                    if (callback) callback(data);
                    this.logPerformance(`${pageName} polling updated`, data?.length || 0);
                },
                pollingInterval: pollingInterval,
                useCache: useCache,
                ttl: ttl,
                fields: fields,
                where: where,
                orderBy: orderBy,
                limit: limit
            }
        );
    }

    // تحسين عمليات الكتابة
    async optimizedWrite(collection, docId, data, options = {}) {
        const { merge = true, invalidateCache = true } = options;

        this.performanceMetrics.writes++;

        try {
            await setDoc(doc(collection, docId), data, { merge });

            // إبطال الكاش بعد الكتابة
            if (invalidateCache) {
                this.firebaseOptimizer.invalidateCache(collection.path, docId);
            }

            return true;
        } catch (error) {
            console.error('Optimized write error:', error);
            throw error;
        }
    }

    // تحسين عمليات الحذف
    async optimizedDelete(collection, docId, options = {}) {
        const { invalidateCache = true } = options;

        this.performanceMetrics.writes++;

        try {
            await deleteDoc(doc(collection, docId));

            // إبطال الكاش بعد الحذف
            if (invalidateCache) {
                this.firebaseOptimizer.invalidateCache(collection.path, docId);
            }

            return true;
        } catch (error) {
            console.error('Optimized delete error:', error);
            throw error;
        }
    }

    // تحسين batch operations
    async optimizedBatch(operations, options = {}) {
        const { invalidateCache = true } = options;
        const batch = writeBatch(firestore);

        operations.forEach(op => {
            const { type, collection, docId, data } = op;
            const docRef = doc(collection, docId);

            switch (type) {
                case 'set':
                    batch.set(docRef, data, { merge: true });
                    break;
                case 'update':
                    batch.update(docRef, data);
                    break;
                case 'delete':
                    batch.delete(docRef);
                    break;
            }
        });

        this.performanceMetrics.writes += operations.length;

        try {
            await batch.commit();

            // إبطال الكاش للكولكشنات المتأثرة
            if (invalidateCache) {
                const affectedCollections = new Set(operations.map(op => op.collection.path));
                affectedCollections.forEach(collection => {
                    this.firebaseOptimizer.invalidateCache(collection);
                });
            }

            return true;
        } catch (error) {
            console.error('Optimized batch error:', error);
            throw error;
        }
    }

    // تحسين بيانات المستخدمين
    async getUsers(options = {}) {
        return this.optimizedQuery(
            collection(firestore, 'users'),
            {
                fields: ['name', 'email', 'job_title', 'permissions', 'isActive', 'createdAt'],
                orderBy: ['createdAt', 'desc'],
                limit: options.limit || 50,
                useCache: true,
                ttl: 3 * 60 * 1000,
                ...options
            }
        );
    }

    // تحسين بيانات النقلات
    async getTransportData(options = {}) {
        return this.optimizedQuery(
            collection(firestore, 'TransportData'),
            {
                fields: ['customerName', 'settlementNumber', 'settlementSequence', 'createdAt', 'updatedAt'],
                orderBy: ['createdAt', 'desc'],
                limit: options.limit || 100,
                useCache: true,
                ttl: 2 * 60 * 1000,
                ...options
            }
        );
    }

    // تحسين بيانات الشغل اليومي
    async getDailyData(date, options = {}) {
        return this.optimizedQuery(
            collection(firestore, 'daily'),
            date,
            {
                fields: ['rows'],
                useCache: true,
                ttl: 1 * 60 * 1000, // دقيقة واحدة للبيانات اليومية
                ...options
            }
        );
    }

    // تحسين بيانات المحاسبة
    async getAccountingData(options = {}) {
        return this.optimizedQuery(
            collection(firestore, 'accounting'),
            null,
            {
                fields: ['date', 'description', 'debit', 'credit', 'accountId', 'createdAt'],
                orderBy: ['date', 'desc'],
                limit: options.limit || 200,
                useCache: true,
                ttl: 5 * 60 * 1000,
                ...options
            }
        );
    }

    // تحسين بيانات السواقين
    async getDriversData(options = {}) {
        return this.optimizedQuery(
            collection(firestore, 'drivers'),
            null,
            {
                fields: ['name', 'phone', 'license', 'status', 'createdAt'],
                orderBy: ['name', 'asc'],
                limit: options.limit || 100,
                useCache: true,
                ttl: 10 * 60 * 1000, // 10 دقائق للبيانات الثابتة
                ...options
            }
        );
    }

    // تحسين بيانات الخزنة
    async getTreasuryData(options = {}) {
        return this.optimizedQuery(
            collection(firestore, 'treasury'),
            null,
            {
                fields: ['date', 'type', 'amount', 'description', 'createdAt'],
                orderBy: ['date', 'desc'],
                limit: options.limit || 200,
                useCache: true,
                ttl: 3 * 60 * 1000,
                ...options
            }
        );
    }

    // تحسين بيانات الجراج
    async getGarageData(options = {}) {
        return this.optimizedQuery(
            collection(firestore, 'garage'),
            null,
            {
                fields: ['carNumber', 'driverName', 'maintenanceType', 'cost', 'date', 'status'],
                orderBy: ['date', 'desc'],
                limit: options.limit || 100,
                useCache: true,
                ttl: 5 * 60 * 1000,
                ...options
            }
        );
    }

    // تحسين البحث المتقدم
    async advancedSearch(collection, searchOptions) {
        const {
            searchTerm = '',
            searchFields = ['name'],
            filters = {},
            orderBy = ['name', 'asc'],
            limit = 50
        } = searchOptions;

        try {
            let query = collection;

            // تطبيق الفلاتر
            Object.entries(filters).forEach(([field, value]) => {
                if (value !== undefined && value !== '') {
                    query = query.where(field, '==', value);
                }
            });

            // تطبيق البحث النصي
            if (searchTerm && searchFields.length > 0) {
                // استخدام compound query للبحث
                query = query.where(searchFields[0], '>=', searchTerm.toLowerCase());
                query = query.where(searchFields[0], '<=', searchTerm.toLowerCase() + '\uf8ff');
            }

            // تطبيق الترتيب والحد
            query = query.orderBy(...orderBy);
            query = query.limit(limit);

            const snapshot = await getDocs(query);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Advanced search error:', error);
            throw error;
        }
    }

    // الحصول على إحصائيات الأداء
    getPerformanceStats() {
        const cacheStats = this.firebaseOptimizer.getPerformanceStats();
        const realtimeStats = this.realtimeOptimizer.getStats();

        return {
            reads: this.performanceMetrics.reads,
            writes: this.performanceMetrics.writes,
            cacheHits: this.performanceMetrics.cacheHits,
            cacheMisses: this.performanceMetrics.cacheMisses,
            cacheHitRate: this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) || 0,
            firebaseCache: cacheStats,
            realtimeStats: realtimeStats,
            pageOptimizers: Object.fromEntries(this.pageOptimizers)
        };
    }

    // تسجيل الأداء
    logPerformance(action, data) {
        console.log(`📊 Performance: ${action}`, {
            timestamp: new Date().toISOString(),
            data: data,
            metrics: this.getPerformanceStats()
        });
    }

    // تنظيف جميع الموارد
    cleanup() {
        this.realtimeOptimizer.removeAll();
        this.firebaseOptimizer.cache.clear();
        this.pageOptimizers.clear();
        this.globalCache.clear();
        
        console.log('🧹 Comprehensive cleanup completed');
    }

    // إعادة تعيين المقاييس
    resetMetrics() {
        this.performanceMetrics = {
            reads: 0,
            writes: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }
}

// Page-specific optimizers
class PageOptimizers {
    constructor() {
        this.comprehensive = new ComprehensiveFirebaseOptimizer();
    }

    // تحسين صفحة Dashboard
    async optimizeDashboard() {
        this.comprehensive.initializePageOptimization('dashboard', {
            enableCaching: true,
            cacheTTL: 3 * 60 * 1000,
            enableSmartPolling: true,
            pollingInterval: 60000 // دقيقة واحدة للـ dashboard
        });

        try {
            // تحميل البيانات الأساسية للـ dashboard
            const [users, stats] = await Promise.all([
                this.comprehensive.getUsers({ limit: 10 }),
                this.comprehensive.getTransportData({ limit: 5 })
            ]);

            return { users, stats };
        } catch (error) {
            console.error('Dashboard optimization error:', error);
            throw error;
        }
    }

    // تحسين صفحة Daily
    async optimizeDaily(date) {
        this.comprehensive.initializePageOptimization('daily', {
            enableCaching: true,
            cacheTTL: 1 * 60 * 1000, // دقيقة واحدة للبيانات اليومية
            enableSmartPolling: true,
            pollingInterval: 15000 // 15 ثانية للبيانات اليومية
        });

        try {
            const dailyData = await this.comprehensive.getDailyData(date);
            return dailyData;
        } catch (error) {
            console.error('Daily optimization error:', error);
            throw error;
        }
    }

    // تحسين صفحة Accounting
    async optimizeAccounting(options = {}) {
        this.comprehensive.initializePageOptimization('accounting', {
            enableCaching: true,
            cacheTTL: 5 * 60 * 1000,
            enablePagination: true,
            pageSize: 50
        });

        try {
            const accountingData = await this.comprehensive.paginatedQuery(
                collection(firestore, 'accounting'),
                {
                    pageSize: options.pageSize || 50,
                    startAfter: options.startAfter,
                    orderBy: ['date', 'desc'],
                    fields: ['date', 'description', 'debit', 'credit', 'accountId']
                }
            );

            return accountingData;
        } catch (error) {
            console.error('Accounting optimization error:', error);
            throw error;
        }
    }

    // تحسين صفحة Transport Data
    async optimizeTransportData(options = {}) {
        this.comprehensive.initializePageOptimization('transport', {
            enableCaching: true,
            cacheTTL: 2 * 60 * 1000,
            enablePagination: true,
            pageSize: 20
        });

        try {
            const transportData = await this.comprehensive.paginatedQuery(
                collection(firestore, 'TransportData'),
                {
                    pageSize: options.pageSize || 20,
                    startAfter: options.startAfter,
                    orderBy: ['createdAt', 'desc'],
                    fields: ['customerName', 'settlementNumber', 'settlementSequence', 'createdAt']
                }
            );

            return transportData;
        } catch (error) {
            console.error('Transport optimization error:', error);
            throw error;
        }
    }

    // تحسين صفحة Drivers
    async optimizeDrivers(options = {}) {
        this.comprehensive.initializePageOptimization('drivers', {
            enableCaching: true,
            cacheTTL: 10 * 60 * 1000, // 10 دقائق للبيانات الثابتة
            enablePagination: true,
            pageSize: 25
        });

        try {
            const driversData = await this.comprehensive.paginatedQuery(
                collection(firestore, 'drivers'),
                {
                    pageSize: options.pageSize || 25,
                    startAfter: options.startAfter,
                    orderBy: ['name', 'asc'],
                    fields: ['name', 'phone', 'license', 'status']
                }
            );

            return driversData;
        } catch (error) {
            console.error('Drivers optimization error:', error);
            throw error;
        }
    }

    // تحسين صفحة Treasury
    async optimizeTreasury(options = {}) {
        this.comprehensive.initializePageOptimization('treasury', {
            enableCaching: true,
            cacheTTL: 3 * 60 * 1000,
            enablePagination: true,
            pageSize: 30
        });

        try {
            const treasuryData = await this.comprehensive.paginatedQuery(
                collection(firestore, 'treasury'),
                {
                    pageSize: options.pageSize || 30,
                    startAfter: options.startAfter,
                    orderBy: ['date', 'desc'],
                    fields: ['date', 'type', 'amount', 'description']
                }
            );

            return treasuryData;
        } catch (error) {
            console.error('Treasury optimization error:', error);
            throw error;
        }
    }

    // تحسين صفحة Garage
    async optimizeGarage(options = {}) {
        this.comprehensive.initializePageOptimization('garage', {
            enableCaching: true,
            cacheTTL: 5 * 60 * 1000,
            enablePagination: true,
            pageSize: 20
        });

        try {
            const garageData = await this.comprehensive.paginatedQuery(
                collection(firestore, 'garage'),
                {
                    pageSize: options.pageSize || 20,
                    startAfter: options.startAfter,
                    orderBy: ['date', 'desc'],
                    fields: ['carNumber', 'driverName', 'maintenanceType', 'cost', 'status']
                }
            );

            return garageData;
        } catch (error) {
            console.error('Garage optimization error:', error);
            throw error;
        }
    }
}

// Global instances
window.comprehensiveFirebaseOptimizer = new ComprehensiveFirebaseOptimizer();
window.pageOptimizers = new PageOptimizers();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Comprehensive Firebase Optimizer initialized');
    
    // تنظيف عند الخروج من الصفحة
    window.addEventListener('beforeunload', () => {
        window.comprehensiveFirebaseOptimizer.cleanup();
    });
});

// Export للـ classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ComprehensiveFirebaseOptimizer,
        PageOptimizers
    };
}
