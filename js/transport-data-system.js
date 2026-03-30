/**
 * نظام بيانات النقلات المتقدم - مكتب الصفا
 * يتعامل مع المنطق المعقد للتسويات والإيصالات والمطابقة
 */

class TransportDataSystem {
  constructor(firestore, auth) {
    this.firestore = firestore;
    this.auth = auth;
    this.currentUser = null;
    this.transportData = [];
    this.receiptsData = [];
    this.settlementsData = [];
    this.customersData = [];
    
    // أنواع الإيصالات المتاحة
    this.receiptTypes = [
      'جيش', 'هيئة', 'تخصيص', 'تحميل', 'تعتيق', 'ميزان', 
      'فوارغ', 'كارته', 'تحويل', 'بيات', 'عطله', 
      'عطله اكس راى', 'إكرامية سائق', 'نقل داخلى', 
      'بدل كارته', 'سيل', 'بوصلة', 'أخرى'
    ];
    
    this.init();
  }

  async init() {
    this.currentUser = this.auth.currentUser;
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }
    
    // تحميل البيانات الأساسية
    await this.loadBasicData();
  }

  /**
   * تحميل البيانات الأساسية من Firestore
   */
  async loadBasicData() {
    try {
      // تحميل بيانات النقلات
      const transportSnapshot = await this.firestore.collection('TransportData').get();
      this.transportData = transportSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // تحميل الإيصالات
      const receiptsSnapshot = await this.firestore.collection('TransportReceipts').get();
      this.receiptsData = receiptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // تحميل التسويات
      const settlementsSnapshot = await this.firestore.collection('TransportSettlements').get();
      this.settlementsData = settlementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // تحميل العملاء
      const customersSnapshot = await this.firestore.collection('Customers').get();
      this.customersData = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error('Error loading basic data:', error);
      throw error;
    }
  }

  /**
   * إنشاء صف نقل جديد
   */
  createNewTransportRow(overrides = {}) {
    const newTransport = {
      // معلومات أساسية
      id: this.firestore.collection('TransportData').doc().id,
      date: overrides.date || new Date().toISOString().split('T')[0],
      
      // معلومات التسوية
      settlementNumber: overrides.settlementNumber || null,
      settlementSequence: overrides.settlementSequence || 1,
      customerName: overrides.customerName || '',
      
      // معلومات الإذن والبوليصة
      permitType: overrides.permitType || '',
      permitNumber: overrides.permitNumber || '',
      billType: overrides.billType || '',
      billNumber: overrides.billNumber || '',
      
      // معلومات النقلة
      transportType: overrides.transportType || '',
      loadingLocation: overrides.loadingLocation || '',
      dischargeLocation: overrides.dischargeLocation || '',
      containerSize: overrides.containerSize || '',
      
      // معلومات التوكيل
      agencyName: overrides.agencyName || '',
      
      // معلومات السائق والسيارة
      driverName: overrides.driverName || '',
      carNumber: overrides.carNumber || '',
      containerNumber: overrides.containerNumber || '',
      containerCount: overrides.containerCount || 1,
      
      // المعلومات المالية
      deposit: overrides.deposit || 0,
      totalFreight: overrides.totalFreight || 0,
      expenses: overrides.expenses || 0,
      invoiceValue: overrides.invoiceValue || 0,
      customerExpenses: overrides.customerExpenses || 0,
      vat: overrides.vat || 0,
      transportProfit: overrides.transportProfit || 0,
      remaining: overrides.remaining || 0,
      commission: overrides.commission || 0,
      netFreight: overrides.netFreight || 0,
      paymentMethod: overrides.paymentMethod || '',
      other: overrides.other || '',
      
      // معلومات النظام
      status: overrides.status || 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: this.currentUser.uid,
      updatedBy: this.currentUser.uid
    };

    // حساب القيم المالية تلقائيًا
    this.calculateFinancialValues(newTransport);

    return newTransport;
  }

  /**
   * حساب القيم المالية تلقائيًا
   */
  calculateFinancialValues(transport) {
    // الباقي = النولون الكامل - العهدة
    transport.remaining = transport.totalFreight - transport.deposit;
    
    // النولون الصافي = النولون الكامل - المصروف
    transport.netFreight = transport.totalFreight - transport.expenses;
    
    // ربحية عملية النقل = النولون الصافي - القومسيون
    transport.transportProfit = transport.netFreight - transport.commission;
    
    // تحديث الإيصالات المرتبطة
    this.updateLinkedReceipts(transport);
  }

  /**
   * تحديث الإيصالات المرتبطة بنقل معين
   */
  updateLinkedReceipts(transport) {
    const linkedReceipts = this.receiptsData.filter(receipt => 
      receipt.permitNumber === transport.permitNumber || 
      receipt.billNumber === transport.billNumber
    );
    
    // جمع قيم الإيصالات
    const totalReceipts = linkedReceipts.reduce((sum, receipt) => sum + (receipt.receiptAmount || 0), 0);
    
    // تحديث قيمة الإيصالات في بيان النقلات
    transport.expenses = totalReceipts;
    
    // إعادة حساب القيم المالية
    this.calculateFinancialValues(transport);
  }

  /**
   * إنشاء إيصال جديد
   */
  createNewReceipt(overrides = {}) {
    const newReceipt = {
      id: this.firestore.collection('TransportReceipts').doc().id,
      receiptType: overrides.receiptType || '',
      receiptAmount: overrides.receiptAmount || 0,
      permitNumber: overrides.permitNumber || '',
      billNumber: overrides.billNumber || '',
      date: overrides.date || new Date().toISOString().split('T')[0],
      description: overrides.description || '',
      createdAt: new Date(),
      createdBy: this.currentUser.uid
    };

    return newReceipt;
  }

  /**
   * الحصول على رقم التسوية التالي للعميل
   */
  async getNextSettlementNumber(customerName, year = new Date().getFullYear()) {
    try {
      const customerSettlements = this.settlementsData.filter(settlement => 
        settlement.customerName === customerName && 
        settlement.year === year
      );
      
      if (customerSettlements.length === 0) {
        return 1; // أول تسوية للعميل في السنة
      }
      
      // البحث عن أكبر رقم تسوية للعميل
      const maxSettlement = Math.max(...customerSettlements.map(s => s.settlementNumber));
      return maxSettlement + 1;
      
    } catch (error) {
      console.error('Error getting next settlement number:', error);
      return 1;
    }
  }

  /**
   * الحصول على مسلسل النقلة التالي داخل التسوية
   */
  async getNextSettlementSequence(customerName, settlementNumber) {
    try {
      const settlementTransports = this.transportData.filter(transport => 
        transport.customerName === customerName && 
        transport.settlementNumber === settlementNumber
      );
      
      if (settlementTransports.length === 0) {
        return 1; // أول نقلة في التسوية
      }
      
      // البحث عن أكبر مسلسل في التسوية
      const maxSequence = Math.max(...settlementTransports.map(t => t.settlementSequence));
      return maxSequence + 1;
      
    } catch (error) {
      console.error('Error getting next settlement sequence:', error);
      return 1;
    }
  }

  /**
   * حفظ صف النقلات
   */
  async saveTransportRow(transportData) {
    try {
      // تحديث الوقت والمستخدم
      transportData.updatedAt = new Date();
      transportData.updatedBy = this.currentUser.uid;
      
      // حساب القيم المالية
      this.calculateFinancialValues(transportData);
      
      // حفظ في Firestore
      await this.firestore.collection('TransportData').doc(transportData.id).set(transportData);
      
      // تحديث البيانات المحلية
      const existingIndex = this.transportData.findIndex(t => t.id === transportData.id);
      if (existingIndex >= 0) {
        this.transportData[existingIndex] = transportData;
      } else {
        this.transportData.push(transportData);
      }
      
      return transportData;
    } catch (error) {
      console.error('Error saving transport row:', error);
      throw error;
    }
  }

  /**
   * حفظ الإيصال
   */
  async saveReceipt(receiptData) {
    try {
      // حفظ في Firestore
      await this.firestore.collection('TransportReceipts').doc(receiptData.id).set(receiptData);
      
      // تحديث البيانات المحلية
      const existingIndex = this.receiptsData.findIndex(r => r.id === receiptData.id);
      if (existingIndex >= 0) {
        this.receiptsData[existingIndex] = receiptData;
      } else {
        this.receiptsData.push(receiptData);
      }
      
      // تحديث جميع بيانات النقلات المرتبطة
      await this.updateAllLinkedTransports(receiptData.permitNumber, receiptData.billNumber);
      
      return receiptData;
    } catch (error) {
      console.error('Error saving receipt:', error);
      throw error;
    }
  }

  /**
   * تحديث جميع بيانات النقلات المرتبطة بإذن أو بوليصة
   */
  async updateAllLinkedTransports(permitNumber, billNumber) {
    try {
      const linkedTransports = this.transportData.filter(transport => 
        transport.permitNumber === permitNumber || 
        transport.billNumber === billNumber
      );
      
      for (const transport of linkedTransports) {
        this.updateLinkedReceipts(transport);
        await this.saveTransportRow(transport);
      }
    } catch (error) {
      console.error('Error updating linked transports:', error);
      throw error;
    }
  }

  /**
   * حذف صف النقلات
   */
  async deleteTransportRow(transportId) {
    try {
      await this.firestore.collection('TransportData').doc(transportId).delete();
      
      // تحديث البيانات المحلية
      this.transportData = this.transportData.filter(t => t.id !== transportId);
      
      return true;
    } catch (error) {
      console.error('Error deleting transport row:', error);
      throw error;
    }
  }

  /**
   * حذف إيصال
   */
  async deleteReceipt(receiptId) {
    try {
      const receipt = this.receiptsData.find(r => r.id === receiptId);
      if (!receipt) {
        throw new Error('Receipt not found');
      }
      
      await this.firestore.collection('TransportReceipts').doc(receiptId).delete();
      
      // تحديث البيانات المحلية
      this.receiptsData = this.receiptsData.filter(r => r.id !== receiptId);
      
      // تحديث جميع بيانات النقلات المرتبطة
      await this.updateAllLinkedTransports(receipt.permitNumber, receipt.billNumber);
      
      return true;
    } catch (error) {
      console.error('Error deleting receipt:', error);
      throw error;
    }
  }

  /**
   * الحصول على بيانات النقلات حسب التاريخ
   */
  getTransportDataByDate(date) {
    return this.transportData.filter(transport => transport.date === date);
  }

  /**
   * الحصول على الإيصالات المرتبطة بنقل معين
   */
  getLinkedReceipts(permitNumber, billNumber) {
    return this.receiptsData.filter(receipt => 
      receipt.permitNumber === permitNumber || 
      receipt.billNumber === billNumber
    );
  }

  /**
   * الحصول على ملخص التسويات للعميل
   */
  getCustomerSettlementSummary(customerName, year = new Date().getFullYear()) {
    const customerTransports = this.transportData.filter(transport => 
      transport.customerName === customerName
    );
    
    const settlements = {};
    
    customerTransports.forEach(transport => {
      if (!settlements[transport.settlementNumber]) {
        settlements[transport.settlementNumber] = {
          settlementNumber: transport.settlementNumber,
          customerName: transport.customerName,
          year: year,
          totalTransports: 0,
          totalAmount: 0,
          totalFreight: 0,
          totalExpenses: 0,
          totalProfit: 0
        };
      }
      
      const settlement = settlements[transport.settlementNumber];
      settlement.totalTransports++;
      settlement.totalAmount += transport.totalFreight || 0;
      settlement.totalFreight += transport.totalFreight || 0;
      settlement.totalExpenses += transport.expenses || 0;
      settlement.totalProfit += transport.transportProfit || 0;
    });
    
    return Object.values(settlements);
  }

  /**
   * تصدير البيانات للطباعة
   */
  exportForPrinting(date) {
    const transportData = this.getTransportDataByDate(date);
    
    return {
      date: date,
      transportData: transportData,
      summary: this.calculateDailySummary(transportData),
      printedAt: new Date()
    };
  }

  /**
   * حساب ملخص اليومي
   */
  calculateDailySummary(transportData) {
    return {
      totalTransports: transportData.length,
      totalFreight: transportData.reduce((sum, t) => sum + (t.totalFreight || 0), 0),
      totalExpenses: transportData.reduce((sum, t) => sum + (t.expenses || 0), 0),
      totalProfit: transportData.reduce((sum, t) => sum + (t.transportProfit || 0), 0),
      totalDeposits: transportData.reduce((sum, t) => sum + (t.deposit || 0), 0),
      totalRemaining: transportData.reduce((sum, t) => sum + (t.remaining || 0), 0)
    };
  }
}

// التصدير للاستخدام في الموديولات
window.TransportDataSystem = TransportDataSystem;
