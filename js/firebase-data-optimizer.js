// Firebase Data Structure Optimization
// إعادة هيكلة البيانات لتجنب Nested Data الكبيرة

class FirebaseDataOptimizer {
    constructor() {
        this.firestore = null;
    }

    // تحسين هيكلة بيانات النقلات
    optimizeTransportData() {
        return {
            // الهيكل القديم (مشكلة):
            // TransportData/{docId} = {
            //   trips: [ {...}, {...}, {...} ], // 1000+ trip
            //   receipts: [ {...}, {...} ], // 500+ receipt
            //   settlements: [ {...} ] // 200+ settlement
            // }

            // الهيكل الجديد (محسن):
            
            // 1. بيانات النقلات الرئيسية
            'TransportData': {
                '{transportId}': {
                    id: 'transportId',
                    customerName: 'اسم العميل',
                    settlementNumber: 123,
                    settlementSequence: 1,
                    // حقول أساسية فقط
                    createdAt: 'timestamp',
                    updatedAt: 'timestamp',
                    createdBy: 'uid'
                }
            },

            // 2. تفاصيل النقلات (منفصلة)
            'TransportTrips': {
                '{tripId}': {
                    id: 'tripId',
                    transportId: 'transportId', // ربط بالبيانات الرئيسية
                    permitType: 'إذن',
                    permitNumber: '123',
                    billType: 'بوليصة',
                    billNumber: '456',
                    transportType: 'نوع',
                    loadingLocation: 'مكان التحميل',
                    dischargeLocation: 'مكان التفريغ',
                    containerSize: '20',
                    driverName: 'السائق',
                    carNumber: 'رقم السيارة',
                    containerNumber: 'رقم الحاوية',
                    containerCount: 1,
                    // بيانات مالية
                    deposit: 1000,
                    totalFreight: 2000,
                    expenses: 500,
                    invoiceValue: 2500,
                    createdAt: 'timestamp'
                }
            },

            // 3. الإيصالات (منفصلة)
            'TransportReceipts': {
                '{receiptId}': {
                    id: 'receiptId',
                    transportId: 'transportId',
                    receiptType: 'إيصال',
                    receiptAmount: 500,
                    permitNumber: '123',
                    billNumber: '456',
                    date: '2024-01-01',
                    description: 'وصف',
                    createdAt: 'timestamp'
                }
            },

            // 4. التسويات (منفصلة)
            'TransportSettlements': {
                '{settlementId}': {
                    id: 'settlementId',
                    transportId: 'transportId',
                    settlementDate: '2024-01-01',
                    totalAmount: 2000,
                    status: 'pending|completed',
                    createdAt: 'timestamp'
                }
            }
        };
    }

    // تحسين هيكلة بيانات الشغل اليومي
    optimizeDailyData() {
        return {
            // الهيكل القديم:
            // daily/{date} = {
            //   rows: [ {...}, {...}, {...} ] // 100+ rows
            // }

            // الهيكل الجديد:
            
            // 1. بيانات اليوم الرئيسية
            'DailyData': {
                '{date}': {
                    date: '2024-01-01',
                    totalTrips: 25,
                    totalRevenue: 50000,
                    status: 'open|closed',
                    createdBy: 'uid',
                    createdAt: 'timestamp'
                }
            },

            // 2. تفاصيل النقلات اليومية (منفصلة)
            'DailyTrips': {
                '{tripId}': {
                    id: 'tripId',
                    date: '2024-01-01',
                    containerCount: 1,
                    size: '20',
                    place: 'المكان',
                    move: 'النقلة',
                    carType: 'مكتب|سوق',
                    agency: 'الوكالة',
                    type: 'النوع',
                    client: 'العميل',
                    notes: 'ملاحظات',
                    order: 1,
                    createdAt: 'timestamp'
                }
            }
        };
    }

    // تحسين هيكلة بيانات المستخدمين
    optimizeUserData() {
        return {
            // الهيكل الحالي (جيد بالفعل):
            'users': {
                '{userId}': {
                    name: 'اسم المستخدم',
                    email: 'email@example.com',
                    job_title: 'المسمى الوظيفي',
                    permissions: {
                        'daily_report': { canView: true, canEdit: false },
                        // ... صلاحيات أخرى
                    },
                    isActive: true,
                    createdAt: 'timestamp'
                }
            },

            // إضافة سجل النشاط (منفصل)
            'UserActivity': {
                '{activityId}': {
                    id: 'activityId',
                    userId: 'userId',
                    action: 'login|create|update|delete',
                    resource: 'users|transport|daily',
                    resourceId: 'resourceId',
                    timestamp: 'timestamp',
                    ipAddress: 'ip',
                    userAgent: 'browser info'
                }
            }
        };
    }

    // دالة ترحيل البيانات من الهيكل القديم إلى الجديد
    async migrateTransportData(firestore) {
        const batch = writeBatch(firestore);
        const batchSize = 500; // Firebase batch limit
        let operations = 0;

        try {
            // 1. جلب البيانات القديمة
            const oldDataSnapshot = await getDocs(collection(firestore, 'TransportData'));
            
            for (const oldDoc of oldDataSnapshot.docs) {
                const oldData = oldDoc.data();
                const transportId = oldDoc.id;

                // 2. إنشاء بيانات النقل الرئيسية
                const mainTransportData = {
                    id: transportId,
                    customerName: oldData.customerName || '',
                    settlementNumber: oldData.settlementNumber || 0,
                    settlementSequence: oldData.settlementSequence || 1,
                    createdAt: oldData.createdAt || new Date(),
                    updatedAt: oldData.updatedAt || new Date(),
                    createdBy: oldData.createdBy || ''
                };

                batch.set(doc(firestore, 'TransportData', transportId), mainTransportData);
                operations++;

                // 3. ترحيل النقلات التفصيلية
                if (oldData.trips && Array.isArray(oldData.trips)) {
                    oldData.trips.forEach((trip, index) => {
                        const tripId = `${transportId}_trip_${index}`;
                        const tripData = {
                            id: tripId,
                            transportId: transportId,
                            ...trip,
                            createdAt: trip.createdAt || new Date()
                        };

                        batch.set(doc(firestore, 'TransportTrips', tripId), tripData);
                        operations++;

                        if (operations >= batchSize) {
                            await batch.commit();
                            batch = writeBatch(firestore);
                            operations = 0;
                        }
                    });
                }

                // 4. ترحيل الإيصالات
                if (oldData.receipts && Array.isArray(oldData.receipts)) {
                    oldData.receipts.forEach((receipt, index) => {
                        const receiptId = `${transportId}_receipt_${index}`;
                        const receiptData = {
                            id: receiptId,
                            transportId: transportId,
                            ...receipt,
                            createdAt: receipt.createdAt || new Date()
                        };

                        batch.set(doc(firestore, 'TransportReceipts', receiptId), receiptData);
                        operations++;

                        if (operations >= batchSize) {
                            await batch.commit();
                            batch = writeBatch(firestore);
                            operations = 0;
                        }
                    });
                }
            }

            // تنفيذ العمليات المتبقية
            if (operations > 0) {
                await batch.commit();
            }

            console.log('تم ترحيل بيانات النقلات بنجاح');
            return true;
        } catch (error) {
            console.error('خطأ في ترحيل البيانات:', error);
            throw error;
        }
    }

    // دالة ترحيل بيانات الشغل اليومي
    async migrateDailyData(firestore) {
        const batch = writeBatch(firestore);
        let operations = 0;

        try {
            // 1. جلب البيانات القديمة
            const oldDataSnapshot = await getDocs(collection(firestore, 'daily'));
            
            for (const oldDoc of oldDataSnapshot.docs) {
                const date = oldDoc.id;
                const oldData = oldDoc.data();

                // 2. إنشاء بيانات اليوم الرئيسية
                const mainDailyData = {
                    date: date,
                    totalTrips: oldData.rows ? oldData.rows.length : 0,
                    totalRevenue: this.calculateDailyRevenue(oldData.rows || []),
                    status: oldData.status || 'open',
                    createdBy: oldData.createdBy || '',
                    createdAt: oldData.createdAt || new Date()
                };

                batch.set(doc(firestore, 'DailyData', date), mainDailyData);
                operations++;

                // 3. ترحيل تفاصيل النقلات اليومية
                if (oldData.rows && Array.isArray(oldData.rows)) {
                    oldData.rows.forEach((row, index) => {
                        const tripId = `${date}_trip_${index}`;
                        const tripData = {
                            id: tripId,
                            date: date,
                            ...row,
                            createdAt: row.createdAt || new Date()
                        };

                        batch.set(doc(firestore, 'DailyTrips', tripId), tripData);
                        operations++;

                        if (operations >= 500) {
                            await batch.commit();
                            batch = writeBatch(firestore);
                            operations = 0;
                        }
                    });
                }
            }

            // تنفيذ العمليات المتبقية
            if (operations > 0) {
                await batch.commit();
            }

            console.log('تم ترحيل بيانات الشغل اليومي بنجاح');
            return true;
        } catch (error) {
            console.error('خطأ في ترحيل بيانات الشغل اليومي:', error);
            throw error;
        }
    }

    // حساب إجمالي الإيرادات اليومية
    calculateDailyRevenue(rows) {
        return rows.reduce((total, row) => {
            // منطق حساب الإيرادات بناءً على البيانات المتاحة
            return total + (row.revenue || 0);
        }, 0);
    }

    // دالة الحصول على بيانات النقلات المحسنة
    async getOptimizedTransportData(firestore, transportId) {
        try {
            // جلب البيانات الرئيسية فقط
            const mainData = await firebaseOptimizer.optimizedGet(
                collection(firestore, 'TransportData'),
                transportId,
                {
                    fields: ['customerName', 'settlementNumber', 'settlementSequence', 'createdAt']
                }
            );

            if (!mainData) return null;

            // جلب البيانات التفصيلية عند الحاجة فقط
            const trips = await firebaseOptimizer.optimizedGet(
                collection(firestore, 'TransportTrips'),
                null,
                {
                    where: [['transportId', '==', transportId]],
                    orderBy: ['createdAt', 'desc'],
                    limit: 50
                }
            );

            return {
                ...mainData,
                trips: trips || []
            };
        } catch (error) {
            console.error('خطأ في جلب بيانات النقلات المحسنة:', error);
            throw error;
        }
    }

    // دالة الحصول على بيانات الشغل اليومي المحسنة
    async getOptimizedDailyData(firestore, date) {
        try {
            // جلب البيانات الرئيسية فقط
            const mainData = await firebaseOptimizer.optimizedGet(
                collection(firestore, 'DailyData'),
                date,
                {
                    fields: ['date', 'totalTrips', 'totalRevenue', 'status', 'createdAt']
                }
            );

            if (!mainData) return null;

            // جلب التفاصيل عند الحاجة فقط
            const trips = await firebaseOptimizer.paginatedQuery(
                collection(firestore, 'DailyTrips'),
                {
                    where: [['date', '==', date]],
                    orderBy: ['order', 'asc'],
                    pageSize: 20
                }
            );

            return {
                ...mainData,
                trips: trips
            };
        } catch (error) {
            console.error('خطأ في جلب بيانات الشغل اليومي المحسنة:', error);
            throw error;
        }
    }
}

// Export للـ class
window.FirebaseDataOptimizer = FirebaseDataOptimizer;

// إنشاء instance عام
window.firebaseDataOptimizer = new FirebaseDataOptimizer();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseDataOptimizer;
}
