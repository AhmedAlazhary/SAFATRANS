// Firebase Performance Optimization - Caching System
class FirebaseCacheManager {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 دقائق افتراضي
        this.maxCacheSize = 100; // أقصى عدد من العناصر في الكاش
    }

    // إنشاء مفتاح فريد للكاش
    generateCacheKey(collection, docId = null, query = null) {
        let key = collection;
        if (docId) key += `:${docId}`;
        if (query) key += `:${JSON.stringify(query)}`;
        return key;
    }

    // تخزين البيانات في الكاش
    set(key, data, ttl = this.defaultTTL) {
        // إذا كان الكاش ممتلئ، احذف أقدم عنصر
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.delete(firstKey);
        }

        this.cache.set(key, data);
        this.cacheExpiry.set(key, Date.now() + ttl);
    }

    // جلب البيانات من الكاش
    get(key) {
        const expiry = this.cacheExpiry.get(key);
        if (!expiry || Date.now() > expiry) {
            this.delete(key);
            return null;
        }
        return this.cache.get(key);
    }

    // حذف عنصر من الكاش
    delete(key) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
    }

    // مسح الكاش بالكامل
    clear() {
        this.cache.clear();
        this.cacheExpiry.clear();
    }

    // التحقق من وجود البيانات في الكاش
    has(key) {
        const expiry = this.cacheExpiry.get(key);
        return expiry && Date.now() <= expiry;
    }

    // تنظيف الكاش من العناصر المنتهية صلاحيتها
    cleanup() {
        const now = Date.now();
        for (const [key, expiry] of this.cacheExpiry.entries()) {
            if (now > expiry) {
                this.delete(key);
            }
        }
    }

    // الحصول على إحصائيات الكاش
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: this.hits / (this.hits + this.misses) || 0
        };
    }
}

// Firebase Query Optimizer
class FirebaseQueryOptimizer {
    constructor() {
        this.cache = new FirebaseCacheManager();
        this.queryCounts = new Map();
        this.hits = 0;
        this.misses = 0;
    }

    // استعلام محسن مع الكاش
    async optimizedGet(collection, docId = null, options = {}) {
        const { 
            useCache = true, 
            ttl = 5 * 60 * 1000, // 5 دقائق
            fields = null, // حقول محددة
            orderBy = null,
            limit = null,
            where = null
        } = options;

        const cacheKey = this.cache.generateCacheKey(collection, docId, { fields, orderBy, limit, where });

        // محاولة جلب البيانات من الكاش أولاً
        if (useCache) {
            const cachedData = this.cache.get(cacheKey);
            if (cachedData) {
                this.hits++;
                return cachedData;
            }
            this.misses++;
        }

        try {
            let query = collection;

            // تطبيق الفلاتر
            if (where) {
                where.forEach(condition => {
                    query = query.where(...condition);
                });
            }

            // تطبيق الترتيب
            if (orderBy) {
                query = query.orderBy(...orderBy);
            }

            // تطبيق الحد الأقصى
            if (limit) {
                query = query.limit(limit);
            }

            // تنفيذ الاستعلام
            const snapshot = docId ? 
                await getDoc(doc(query, docId)) : 
                await getDocs(query);

            let result;
            if (docId) {
                result = snapshot.exists() ? snapshot.data() : null;
            } else {
                result = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }

            // تخزين النتيجة في الكاش
            if (useCache && result) {
                this.cache.set(cacheKey, result, ttl);
            }

            return result;
        } catch (error) {
            console.error('Query error:', error);
            throw error;
        }
    }

    // استعلام مع Pagination
    async paginatedQuery(collection, options = {}) {
        const {
            pageSize = 20,
            startAfter = null,
            orderBy = ['createdAt', 'desc'],
            where = null,
            fields = null
        } = options;

        const cacheKey = this.cache.generateCacheKey(collection, null, {
            pageSize,
            startAfter,
            orderBy,
            where,
            fields
        });

        // محاولة جلب البيانات من الكاش
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            let query = collection;

            // تطبيق الفلاتر
            if (where) {
                where.forEach(condition => {
                    query = query.where(...condition);
                });
            }

            // تطبيق الترتيب
            query = query.orderBy(...orderBy);

            // تطبيق Pagination
            if (startAfter) {
                query = query.startAfter(startAfter);
            }

            query = query.limit(pageSize);

            const snapshot = await getDocs(query);
            const result = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // تخزين النتيجة في الكاش لمدة أقصر (لأنها pagination)
            this.cache.set(cacheKey, result, 2 * 60 * 1000); // دقيقتين

            return result;
        } catch (error) {
            console.error('Pagination error:', error);
            throw error;
        }
    }

    // استعلام حقل محدد فقط
    async getSpecificFields(collection, docId, fields, options = {}) {
        return this.optimizedGet(collection, docId, {
            ...options,
            fields
        });
    }

    // استعلام مجمع (multiple documents)
    async batchGet(collection, docIds, options = {}) {
        const { useCache = true, ttl = 5 * 60 * 1000 } = options;
        const results = [];
        const uncachedIds = [];

        // محاولة جلب من الكاش أولاً
        if (useCache) {
            docIds.forEach(docId => {
                const cacheKey = this.cache.generateCacheKey(collection, docId);
                const cachedData = this.cache.get(cacheKey);
                if (cachedData) {
                    results.push(cachedData);
                } else {
                    uncachedIds.push(docId);
                }
            });
        } else {
            uncachedIds.push(...docIds);
        }

        // جلب البيانات غير المخزنة في الكاش
        if (uncachedIds.length > 0) {
            const promises = uncachedIds.map(docId => 
                this.optimizedGet(collection, docId, { useCache: false })
            );
            
            const fetchedResults = await Promise.all(promises);
            results.push(...fetchedResults);
        }

        return results;
    }

    // تحديث الكاش عند تغيير البيانات
    invalidateCache(collection, docId = null) {
        // حذف كل ما يتعلق بالكولكشن
        for (const key of this.cache.cache.keys()) {
            if (key.startsWith(collection)) {
                if (!docId || key.includes(`:${docId}:`) || key.endsWith(`:${docId}`)) {
                    this.cache.delete(key);
                }
            }
        }
    }

    // الحصول على إحصائيات الأداء
    getPerformanceStats() {
        return {
            cache: this.cache.getStats(),
            queries: {
                hits: this.hits,
                misses: this.misses,
                hitRate: this.hits / (this.hits + this.misses) || 0,
                totalQueries: this.hits + this.misses
            }
        };
    }

    // تنظيف دوري للكاش
    startPeriodicCleanup() {
        setInterval(() => {
            this.cache.cleanup();
        }, 60 * 1000); // كل دقيقة
    }
}

// Firebase Real-time Optimizer
class FirebaseRealtimeOptimizer {
    constructor() {
        this.listeners = new Map();
        this.queryOptimizer = new FirebaseQueryOptimizer();
    }

    // listener محسن مع إلغاء تلقائي
    createOptimizedListener(collection, options = {}) {
        const {
            docId = null,
            where = null,
            orderBy = null,
            limit = null,
            callback = null,
            onData = null,
            onError = null
        } = options;

        const listenerKey = this.generateListenerKey(collection, docId, where, orderBy, limit);

        // إلغاء أي listener قديم
        if (this.listeners.has(listenerKey)) {
            this.removeListener(listenerKey);
        }

        try {
            let query = collection;

            // تطبيق الفلاتر
            if (where) {
                where.forEach(condition => {
                    query = query.where(...condition);
                });
            }

            // تطبيق الترتيب
            if (orderBy) {
                query = query.orderBy(...orderBy);
            }

            // تطبيق الحد الأقصى
            if (limit) {
                query = query.limit(limit);
            }

            const unsubscribe = docId ?
                onDoc(doc(query, docId), 
                    (doc) => {
                        const data = doc.exists() ? { id: doc.id, ...doc.data() } : null;
                        if (onData) onData(data);
                        if (callback) callback(data);
                    },
                    (error) => {
                        console.error('Real-time listener error:', error);
                        if (onError) onError(error);
                    }
                ) :
                onSnapshot(query,
                    (snapshot) => {
                        const data = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        if (onData) onData(data);
                        if (callback) callback(data);
                    },
                    (error) => {
                        console.error('Real-time listener error:', error);
                        if (onError) onError(error);
                    }
                );

            // تخزين الـ listener للإلغاء لاحقاً
            this.listeners.set(listenerKey, unsubscribe);

            return unsubscribe;
        } catch (error) {
            console.error('Error creating listener:', error);
            throw error;
        }
    }

    // إلغاء listener محدد
    removeListener(listenerKey) {
        const unsubscribe = this.listeners.get(listenerKey);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(listenerKey);
        }
    }

    // إلغاء كل الـ listeners
    removeAllListeners() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners.clear();
    }

    // إنشاء مفتاح فريد للـ listener
    generateListenerKey(collection, docId, where, orderBy, limit) {
        let key = collection;
        if (docId) key += `:${docId}`;
        if (where) key += `:${JSON.stringify(where)}`;
        if (orderBy) key += `:${JSON.stringify(orderBy)}`;
        if (limit) key += `:${limit}`;
        return key;
    }

    // الحصول على عدد الـ listeners النشطة
    getActiveListenersCount() {
        return this.listeners.size;
    }
}

// Global instances
window.firebaseCache = new FirebaseCacheManager();
window.firebaseOptimizer = new FirebaseQueryOptimizer();
window.realtimeOptimizer = new FirebaseRealtimeOptimizer();

// بدء التنظيف الدوري للكاش
window.firebaseOptimizer.startPeriodicCleanup();

// Export للـ classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FirebaseCacheManager,
        FirebaseQueryOptimizer,
        FirebaseRealtimeOptimizer
    };
}
