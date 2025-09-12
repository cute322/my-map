document.addEventListener('DOMContentLoaded', () => {
    const mindMapContainer = document.getElementById('mind-map-container');
    const exportPngBtn = document.getElementById('export-png-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    // تصدير كصورة PNG
    exportPngBtn.addEventListener('click', () => {
        // إزالة حدود الحاوية مؤقتًا للحصول على صورة نظيفة
        mindMapContainer.style.border = 'none';

        html2canvas(mindMapContainer, {
            backgroundColor: '#f4f7f9', // خلفية متناسقة
            scale: 2 // زيادة الدقة
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'mind-map.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            // إعادة الحدود بعد التصدير
            mindMapContainer.style.border = '2px dashed #bdc3c7';
        });
    });

    // تصدير كملف PDF
    exportPdfBtn.addEventListener('click', () => {
        // إزالة حدود الحاوية مؤقتًا
        mindMapContainer.style.border = 'none';
        const { jsPDF } = window.jspdf;

        html2canvas(mindMapContainer, {
            backgroundColor: '#f4f7f9',
            scale: 2
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('mind-map.pdf');

            // إعادة الحدود بعد التصدير
            mindMapContainer.style.border = '2px dashed #bdc3c7';
        });
    });
});