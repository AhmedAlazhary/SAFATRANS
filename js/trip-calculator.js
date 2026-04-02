// Utility Functions for Trip Calculations
class TripCalculator {
    /**
     * Calculate actual trips based on count and size
     * @param {number} count - Raw trip count
     * @param {string} size - Container size ('20' or '2*20')
     * @returns {number} - Actual trips after calculation
     */
    static getActualTrips(count, size) {
        if (!count || count <= 0) return 0;
        
        // For size 20, apply the division logic: (count / 2) with ceiling
        if (size === "20") {
            return Math.ceil(count / 2);
        }
        
        // For size 2*20, keep as is
        return count;
    }

    /**
     * Calculate total revenue for a record
     * @param {number} count - Raw trip count
     * @param {string} size - Container size
     * @param {number} price - Price per trip
     * @returns {number} - Total revenue
     */
    static calculateRevenue(count, size, price) {
        const actualTrips = this.getActualTrips(count, size);
        return actualTrips * (price || 0);
    }

    /**
     * Process an array of records and calculate actual trips
     * @param {Array} records - Array of trip records
     * @returns {Array} - Processed records with actual trips
     */
    static processRecords(records) {
        return records.map(record => {
            const actualTrips = this.getActualTrips(record.count, record.size);
            return {
                ...record,
                actualTrips: actualTrips,
                actualRevenue: this.calculateRevenue(record.count, record.size, record.price)
            };
        });
    }

    /**
     * Aggregate records by period (daily, monthly, quarterly)
     * @param {Array} records - Array of trip records
     * @param {string} period - Aggregation period
     * @returns {Object} - Aggregated data
     */
    static aggregateByPeriod(records, period = 'daily') {
        const processedRecords = this.processRecords(records);
        
        // Group by period
        const grouped = {};
        processedRecords.forEach(record => {
            const key = this.getGroupKey(record, period);
            if (!grouped[key]) {
                grouped[key] = {
                    period: key,
                    rawCount: 0,
                    actualTrips: 0,
                    revenue: 0,
                    records: []
                };
            }
            
            grouped[key].rawCount += record.count || 0;
            grouped[key].actualTrips += record.actualTrips || 0;
            grouped[key].revenue += record.actualRevenue || 0;
            grouped[key].records.push(record);
        });
        
        return Object.values(grouped);
    }

    /**
     * Get grouping key based on period
     * @param {Object} record - Trip record
     * @param {string} period - Period type
     * @returns {string} - Grouping key
     */
    static getGroupKey(record, period) {
        const date = record.date ? new Date(record.date) : new Date();
        
        switch(period) {
            case 'daily':
                return date.toISOString().split('T')[0]; // YYYY-MM-DD
            case 'monthly':
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            case 'quarterly':
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                return `${date.getFullYear()}-Q${quarter}`;
            default:
                return date.toISOString().split('T')[0];
        }
    }

    /**
     * Calculate monthly totals from daily records
     * @param {Array} dailyRecords - Array of daily records
     * @param {string} month - Target month (YYYY-MM)
     * @returns {Object} - Monthly totals
     */
    static calculateMonthlyTotals(dailyRecords, month) {
        const monthRecords = dailyRecords.filter(record => {
            const recordMonth = record.date ? record.date.substring(0, 7) : '';
            return recordMonth === month;
        });

        const aggregated = this.aggregateByPeriod(monthRecords, 'daily');
        
        return {
            month: month,
            totalRawCount: aggregated.reduce((sum, day) => sum + day.rawCount, 0),
            totalActualTrips: aggregated.reduce((sum, day) => sum + day.actualTrips, 0),
            totalRevenue: aggregated.reduce((sum, day) => sum + day.revenue, 0),
            dailyBreakdown: aggregated
        };
    }

    /**
     * Validate calculation consistency
     * @param {Array} dailyRecords - Daily records
     * @param {Object} monthlyTotal - Calculated monthly total
     * @returns {boolean} - True if calculations are consistent
     */
    static validateCalculations(dailyRecords, monthlyTotal) {
        const calculated = this.calculateMonthlyTotals(dailyRecords, monthlyTotal.month);
        
        return calculated.totalActualTrips === monthlyTotal.totalActualTrips &&
               calculated.totalRevenue === monthlyTotal.totalRevenue;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TripCalculator;
}

// Global access
window.TripCalculator = TripCalculator;
