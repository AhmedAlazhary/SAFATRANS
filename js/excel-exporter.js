// Excel Library for Garage Management System
// Simple XLSX export functionality without external dependencies

class ExcelExporter {
    static exportToExcel(data, filename) {
        // Create CSV content (Excel compatible)
        let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
        
        // Get headers from first object
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            csvContent += headers.join(',') + '\n';
            
            // Add data rows
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header] || '';
                    // Escape commas and quotes
                    const escapedValue = String(value).replace(/"/g, '""');
                    return `"${escapedValue}"`;
                });
                csvContent += values.join(',') + '\n';
            });
        }
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename.endsWith('.xlsx') ? filename : `${filename}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('تم تصدير الملف بنجاح', 'success');
    }
    
    static exportTableToExcel(tableId, filename) {
        const table = document.getElementById(tableId);
        if (!table) {
            showNotification('الجدول غير موجود', 'danger');
            return;
        }
        
        const rows = table.querySelectorAll('tr');
        const data = [];
        
        // Get headers
        const headerRow = rows[0];
        const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent.trim());
        
        // Get data rows
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
            
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = cells[index] || '';
            });
            
            data.push(rowData);
        }
        
        this.exportToExcel(data, filename);
    }
}

// Make it globally available
window.ExcelExporter = ExcelExporter;
window.XLSX = {
    utils: {
        json_to_sheet: (data) => data,
        book_new: () => ({ SheetNames: [], Sheets: {} }),
        book_append_sheet: (wb, ws, name) => {
            wb.SheetNames.push(name);
            wb.Sheets[name] = ws;
        }
    },
    writeFile: (wb, filename) => {
        ExcelExporter.exportToExcel(wb.Sheets[Object.keys(wb.Sheets)[0]], filename);
    }
};
