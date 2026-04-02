// Trip Calculation Validation System
class TripCalculationValidator {
    /**
     * Validate that daily totals match monthly totals
     * @param {Object} dailyData - Daily data object
     * @param {string} month - Month to validate (YYYY-MM)
     * @returns {Object} - Validation results
     */
    static validateMonthlyConsistency(dailyData, month) {
        const results = {
            month: month,
            isValid: true,
            errors: [],
            dailyTotals: {},
            monthlyTotal: 0,
            calculatedMonthlyTotal: 0
        };

        // Calculate daily totals using actual trips
        Object.keys(dailyData).forEach(date => {
            if (!date.startsWith(month)) return;
            
            const dayData = dailyData[date] || [];
            let dayTotal = 0;
            
            dayData.forEach(row => {
                const count = Number(row.containerCount || 0);
                const size = row.size || "";
                
                if (count > 0 && size) {
                    dayTotal += this.getActualTrips(count, size);
                }
            });
            
            results.dailyTotals[date] = dayTotal;
            results.calculatedMonthlyTotal += dayTotal;
        });

        // Get the system's monthly total
        results.monthlyTotal = this.getSystemMonthlyTotal(dailyData, month);

        // Validate consistency
        if (results.calculatedMonthlyTotal !== results.monthlyTotal) {
            results.isValid = false;
            results.errors.push(
                `Monthly totals don't match: System=${results.monthlyTotal}, Calculated=${results.calculatedMonthlyTotal}`
            );
        }

        return results;
    }

    /**
     * Get actual trips count based on size
     * @param {number} count - Raw count
     * @param {string} size - Container size
     * @returns {number} - Actual trips
     */
    static getActualTrips(count, size) {
        if (size === "20") {
            return Math.ceil(count / 2);
        }
        return count;
    }

    /**
     * Get system's monthly total (simulating the current system calculation)
     * @param {Object} dailyData - Daily data
     * @param {string} month - Month
     * @returns {number} - System monthly total
     */
    static getSystemMonthlyTotal(dailyData, month) {
        let total = 0;
        let officeTotal = 0;
        let marketTotal = 0;

        Object.keys(dailyData).forEach(date => {
            if (!date.startsWith(month)) return;
            (dailyData[date] || []).forEach(row => {
                const count = Number(row.containerCount || 0);
                const size = row.size || "";
                
                // This simulates the updated system calculation
                const actualTrips = this.getActualTrips(count, size);
                
                total += actualTrips;
                if (row.carType === "مكتب") {
                    officeTotal += actualTrips;
                } else if (row.carType === "سوق") {
                    marketTotal += actualTrips;
                }
            });
        });

        return total;
    }

    /**
     * Generate detailed validation report
     * @param {Object} dailyData - Daily data
     * @param {string} month - Month to validate
     * @returns {string} - HTML report
     */
    static generateValidationReport(dailyData, month) {
        const validation = this.validateMonthlyConsistency(dailyData, month);
        
        let report = `
            <div style="font-family: Arial, sans-serif; padding: 20px; direction: rtl;">
                <h2 style="color: ${validation.isValid ? '#27ae60' : '#e74c3c'};">
                    ${validation.isValid ? '✅ تقرير التحقق الناجح' : '❌ تقرير التحقق - وجود أخطاء'}
                </h2>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3>ملخص الشهر: ${month}</h3>
                    <p><strong>إجمالي الشهر (النظام):</strong> ${validation.monthlyTotal}</p>
                    <p><strong>إجمالي الشهر (محسوب):</strong> ${validation.calculatedMonthlyTotal}</p>
                    <p><strong>الحالة:</strong> ${validation.isValid ? 'متطابق' : 'غير متطابق'}</p>
                </div>
                
                <div style="background: #e9ecef; padding: 15px; border-radius: 8px;">
                    <h3>تفاصيل الأيام:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #dee2e6;">
                                <th style="padding: 8px; border: 1px solid #adb5bd;">التاريخ</th>
                                <th style="padding: 8px; border: 1px solid #adb5bd;">إجمالي النقلات الفعلية</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        Object.keys(validation.dailyTotals).sort().forEach(date => {
            const total = validation.dailyTotals[date];
            report += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #adb5bd;">${date}</td>
                    <td style="padding: 8px; border: 1px solid #adb5bd; text-align: center;">${total}</td>
                </tr>
            `;
        });

        report += `
                        </tbody>
                    </table>
                </div>
        `;

        if (validation.errors.length > 0) {
            report += `
                <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h3 style="color: #721c24;">الأخطاء:</h3>
                    <ul style="color: #721c24;">
                        ${validation.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        report += `
                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        طباعة التقرير
                    </button>
                </div>
            </div>
        `;

        return report;
    }

    /**
     * Run comprehensive validation for all months
     * @param {Object} dailyData - Daily data
     * @returns {Object} - All validation results
     */
    static validateAllMonths(dailyData) {
        const months = new Set();
        
        // Extract all months from data
        Object.keys(dailyData).forEach(date => {
            const month = date.substring(0, 7);
            months.add(month);
        });

        const results = {};
        
        Array.from(months).sort().forEach(month => {
            results[month] = this.validateMonthlyConsistency(dailyData, month);
        });

        return results;
    }
}

// Global access
window.TripCalculationValidator = TripCalculationValidator;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TripCalculationValidator;
}
