// Real-time Listeners Optimization
// تحسين أو استبدال Real-time Listeners لتقليل استهلاك Firebase

class RealtimeOptimizer {
    constructor() {
        this.activeListeners = new Map();
        this.pollingIntervals = new Map();
        this.lastUpdateTimes = new Map();
        this.pollingInterval = 30000; // 30 ثانية افتراضي
    }

    // استبدال real-time listener بـ polling ذكي
    createSmartPolling(collection, options = {}) {
        const {
            docId = null,
            callback = null,
            pollingInterval = this.pollingInterval,
            useCache = true,
            fields = null,
            where = null,
            orderBy = null,
            limit = null
        } = options;

        const listenerKey = this.generateKey(collection, docId, where, orderBy, limit);

        // إلغاء أي listener أو قديم
        this.removeSmartPolling(listenerKey);

        let lastData = null;
        let isPolling = true;

        const poll = async () => {
            if (!isPolling) return;

            try {
                const newData = await firebaseOptimizer.optimizedGet(
                    collection,
                    docId,
                    {
                        useCache: useCache,
                        ttl: Math.min(pollingInterval / 2, 60000), // نصف مدة polling أو دقيقة كحد أقصى
                        fields: fields,
                        where: where,
                        orderBy: orderBy,
                        limit: limit
                    }
                );

                // مقارنة البيانات وتشغيل callback فقط عند التغيير
                if (this.hasDataChanged(lastData, newData)) {
                    lastData = newData;
                    this.lastUpdateTimes.set(listenerKey, Date.now());
                    
                    if (callback) {
                        callback(newData);
                    }
                }
            } catch (error) {
                console.error('Smart polling error:', error);
            }
        };

        // بدء polling
        const intervalId = setInterval(poll, pollingInterval);
        
        // استدعاء فوري لأول مرة
        poll();

        // تخزين الـ interval للإلغاء لاحقاً
        this.pollingIntervals.set(listenerKey, {
            intervalId: intervalId,
            stop: () => {
                isPolling = false;
                clearInterval(intervalId);
            }
        });

        return {
            stop: () => this.removeSmartPolling(listenerKey),
            key: listenerKey
        };
    }

    // إنشاء real-time listener محسن (للحالات التي تحتاجه حقاً)
    createOptimizedListener(collection, options = {}) {
        const {
            docId = null,
            callback = null,
            onError = null,
            fields = null,
            where = null,
            orderBy = null,
            limit = null,
            maxUpdates = 10, // أقصى عدد من التحديثات في الدقيقة
            timeWindow = 60000 // نافذة زمنية (دقيقة)
        } = options;

        const listenerKey = this.generateKey(collection, docId, where, orderBy, limit);

        // إلغاء أي listener قديم
        this.removeOptimizedListener(listenerKey);

        let updateCount = 0;
        let windowStart = Date.now();

        const throttledCallback = (data) => {
            const now = Date.now();
            
            // إعادة تعيين العداد كل دقيقة
            if (now - windowStart > timeWindow) {
                updateCount = 0;
                windowStart = now;
            }

            // تجاهل التحديثات الزائدة
            if (updateCount >= maxUpdates) {
                console.warn(`Rate limit exceeded for ${listenerKey}`);
                return;
            }

            updateCount++;
            
            if (callback) {
                callback(data);
            }
        };

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
                        throttledCallback(data);
                    },
                    (error) => {
                        console.error('Optimized listener error:', error);
                        if (onError) onError(error);
                    }
                ) :
                onSnapshot(query,
                    (snapshot) => {
                        const data = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        throttledCallback(data);
                    },
                    (error) => {
                        console.error('Optimized listener error:', error);
                        if (onError) onError(error);
                    }
                );

            // تخزين الـ listener للإلغاء لاحقاً
            this.activeListeners.set(listenerKey, unsubscribe);

            return unsubscribe;
        } catch (error) {
            console.error('Error creating optimized listener:', error);
            throw error;
        }
    }

    // إلغاء smart polling
    removeSmartPolling(listenerKey) {
        const polling = this.pollingIntervals.get(listenerKey);
        if (polling) {
            polling.stop();
            this.pollingIntervals.delete(listenerKey);
            this.lastUpdateTimes.delete(listenerKey);
        }
    }

    // إلغاء optimized listener
    removeOptimizedListener(listenerKey) {
        const unsubscribe = this.activeListeners.get(listenerKey);
        if (unsubscribe) {
            unsubscribe();
            this.activeListeners.delete(listenerKey);
        }
    }

    // إلغاء كل الـ listeners و polling
    removeAll() {
        // إلغاء optimized listeners
        this.activeListeners.forEach(unsubscribe => unsubscribe());
        this.activeListeners.clear();

        // إلغاء smart polling
        this.pollingIntervals.forEach(polling => polling.stop());
        this.pollingIntervals.clear();
        this.lastUpdateTimes.clear();
    }

    // مقارنة البيانات للكشف عن التغييرات
    hasDataChanged(oldData, newData) {
        if (!oldData && newData) return true;
        if (oldData && !newData) return true;
        if (!oldData && !newData) return false;

        // إذا كانت مصفوفة
        if (Array.isArray(oldData) && Array.isArray(newData)) {
            if (oldData.length !== newData.length) return true;
            
            return oldData.some((oldItem, index) => {
                const newItem = newData[index];
                return !this.deepEqual(oldItem, newItem);
            });
        }

        // إذا كانت object
        return !this.deepEqual(oldData, newData);
    }

    // مقارنة عميقة بين objects
    deepEqual(obj1, obj2) {
        if (obj1 === obj2) return true;
        
        if (obj1 == null || obj2 == null) return false;
        
        if (typeof obj1 !== typeof obj2) return false;
        
        if (typeof obj1 !== 'object') return obj1 === obj2;
        
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        
        if (keys1.length !== keys2.length) return false;
        
        for (let key of keys1) {
            if (!keys2.includes(key)) return false;
            
            if (!this.deepEqual(obj1[key], obj2[key])) return false;
        }
        
        return true;
    }

    // إنشاء مفتاح فريد
    generateKey(collection, docId, where, orderBy, limit) {
        let key = collection;
        if (docId) key += `:${docId}`;
        if (where) key += `:${JSON.stringify(where)}`;
        if (orderBy) key += `:${JSON.stringify(orderBy)}`;
        if (limit) key += `:${limit}`;
        return key;
    }

    // الحصول على إحصائيات الأداء
    getStats() {
        return {
            activeListeners: this.activeListeners.size,
            activePolling: this.pollingIntervals.size,
            lastUpdates: Object.fromEntries(this.lastUpdateTimes)
        };
    }

    // تحديث مدة polling ديناميكياً بناءً على النشاط
    adjustPollingInterval(listenerKey, newInterval) {
        const polling = this.pollingIntervals.get(listenerKey);
        if (polling) {
            polling.stop();
            
            // إعادة إنشاء polling بالفترة الجديدة
            // (هنا نحتاج لمعرفة الإعدادات الأصلية)
            console.log(`Polling interval adjusted for ${listenerKey}: ${newInterval}ms`);
        }
    }

    // إيقاف polling تلقائياً عند عدم النشاط
    enableAutoStop(collection, options = {}) {
        const { inactivityTimeout = 300000 } = options; // 5 دقائق افتراضي
        
        const listenerKey = this.generateKey(collection, options.docId, options.where, options.orderBy, options.limit);
        
        const checkInactivity = () => {
            const lastUpdate = this.lastUpdateTimes.get(listenerKey);
            if (lastUpdate && (Date.now() - lastUpdate) > inactivityTimeout) {
                this.removeSmartPolling(listenerKey);
                console.log(`Auto-stopped polling for ${listenerKey} due to inactivity`);
            }
        };

        // فحص عدم النشاط كل دقيقة
        setInterval(checkInactivity, 60000);
    }
}

// Hybrid Listener System - يجمع بين Real-time و Polling
class HybridListenerSystem {
    constructor() {
        this.realtimeOptimizer = new RealtimeOptimizer();
        this.hybridListeners = new Map();
    }

    // إنشاء hybrid listener
    createHybridListener(collection, options = {}) {
        const {
            docId = null,
            callback = null,
            realtimePriority = false, // هل نفضل real-time أم polling؟
            switchThreshold = 5, // عدد التحديثات قبل التبديل
            timeWindow = 60000, // نافذة زمنية للتبديل
            ...otherOptions
        } = options;

        const listenerKey = this.realtimeOptimizer.generateKey(collection, docId, otherOptions.where, otherOptions.orderBy, otherOptions.limit);

        // إلغاء أي listener قديم
        this.removeHybridListener(listenerKey);

        let updateCount = 0;
        let windowStart = Date.now();
        let currentMode = realtimePriority ? 'realtime' : 'polling';
        let currentListener = null;

        const switchMode = (newMode) => {
            if (currentMode === newMode) return;

            console.log(`Switching ${listenerKey} from ${currentMode} to ${newMode}`);

            // إلغاء الـ listener الحالي
            if (currentListener) {
                currentListener.stop();
            }

            // إنشاء listener جديد بالوضع الجديد
            if (newMode === 'realtime') {
                currentListener = this.realtimeOptimizer.createOptimizedListener(collection, {
                    docId,
                    callback: (data) => {
                        updateCount++;
                        if (callback) callback(data);
                        
                        // التحقق من الحاجة للتبديل إلى polling
                        if (updateCount > switchThreshold && (Date.now() - windowStart) < timeWindow) {
                            switchMode('polling');
                        }
                    },
                    ...otherOptions
                });
            } else {
                currentListener = this.realtimeOptimizer.createSmartPolling(collection, {
                    docId,
                    callback: (data) => {
                        updateCount++;
                        if (callback) callback(data);
                        
                        // التحقق من الحاجة للتبديل إلى realtime
                        if (updateCount < switchThreshold / 2 && (Date.now() - windowStart) > timeWindow) {
                            switchMode('realtime');
                        }
                    },
                    ...otherOptions
                });
            }

            currentMode = newMode;
            updateCount = 0;
            windowStart = Date.now();
        };

        // بدء بالوضع المفضل
        switchMode(currentMode);

        // تخزين الـ listener للإلغاء لاحقاً
        this.hybridListeners.set(listenerKey, {
            stop: () => {
                if (currentListener) {
                    currentListener.stop();
                }
                this.hybridListeners.delete(listenerKey);
            },
            getMode: () => currentMode,
            switchTo: switchMode
        });

        return this.hybridListeners.get(listenerKey);
    }

    // إلغاء hybrid listener
    removeHybridListener(listenerKey) {
        const hybrid = this.hybridListeners.get(listenerKey);
        if (hybrid) {
            hybrid.stop();
        }
    }

    // إلغاء كل الـ hybrid listeners
    removeAll() {
        this.hybridListeners.forEach(hybrid => hybrid.stop());
        this.hybridListeners.clear();
        this.realtimeOptimizer.removeAll();
    }
}

// Global instances
window.realtimeOptimizer = new RealtimeOptimizer();
window.hybridListenerSystem = new HybridListenerSystem();

// Export للـ classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RealtimeOptimizer,
        HybridListenerSystem
    };
}
