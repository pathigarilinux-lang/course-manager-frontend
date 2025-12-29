// src/utils/printGenerator.js

// Helper to determine Category (Old/New) from Conf No
const getCat = (conf) => {
    if (!conf) return '-';
    const s = conf.toUpperCase();
    return (s.startsWith('O') || s.startsWith('S')) ? 'OLD' : 'NEW';
};

/**
 * ✅ 1. INDIVIDUAL TOKEN PRINT
 * - CSS: STRICTLY restored from your original reference code.
 * - Content: Updated to DHAMMA SEAT format.
 */
export const printStudentToken = (student) => {
    if (!student) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>Token-${student.conf_no}</title>
            <style>
                /* ✅ ORIGINAL CSS RESTORATION */
                @page { size: 58mm 40mm; margin: 0; }
                body { 
                    margin: 0; 
                    padding: 5px; 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                }
                .token-box { 
                    border: 2px solid black; 
                    padding: 5px; 
                    border-radius: 8px; 
                    height: 38mm; /* Fixed height from original */
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                h2 { margin: 0; font-size: 16px; text-transform: uppercase; font-weight: 900; }
                .divider { border-bottom: 2px solid black; margin: 2px 0; }
                .seat { font-size: 36px; font-weight: 900; margin: 2px 0; }
                .name { font-size: 12px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .details { font-size: 10px; display: flex; justify-content: space-between; margin-top: 5px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="token-box">
                <div>
                    <h2>DHAMMA SEAT</h2>
                    <div class="divider"></div>
                </div>
                
                <div class="seat">${student.dhamma_hall_seat_no || '-'}</div>
                
                <div>
                    <div class="name">${student.full_name}</div>
                    <div class="details">
                        <span>${student.pagoda_cell_no ? `P:${student.pagoda_cell_no}` : ''}</span>
                        <span>${getCat(student.conf_no)}</span>
                        <span>Age:${student.age}</span>
                        <span>Rm:${student.room_no || '-'}</span>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
};

/**
 * ✅ 2. BULK TOKEN PRINT
 * - Uses the exact same structure as above.
 * - Adds page-break-after for continuous printing.
 */
export const printBulkTokens = (students) => {
    if (!students || students.length === 0) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    
    const tokensHtml = students.map(student => `
        <div class="token-wrapper">
            <div class="token-box">
                <div>
                    <h2>DHAMMA SEAT</h2>
                    <div class="divider"></div>
                </div>
                <div class="seat">${student.dhamma_hall_seat_no || '-'}</div>
                <div>
                    <div class="name">${student.full_name}</div>
                    <div class="details">
                        <span>${student.pagoda_cell_no ? `P:${student.pagoda_cell_no}` : ''}</span>
                        <span>${getCat(student.conf_no)}</span>
                        <span>Age:${student.age}</span>
                        <span>Rm:${student.room_no || '-'}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    doc.open();
    doc.write(`
        <html>
        <head>
            <title>Bulk Tokens</title>
            <style>
                /* ✅ ORIGINAL CSS RESTORATION */
                @page { size: 58mm 40mm; margin: 0; }
                body { 
                    margin: 0; 
                    padding: 0; 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                }
                .token-wrapper {
                    padding: 5px;
                    page-break-after: always;
                }
                .token-wrapper:last-child {
                    page-break-after: avoid;
                }
                .token-box { 
                    border: 2px solid black; 
                    padding: 5px; 
                    border-radius: 8px; 
                    height: 38mm; 
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                h2 { margin: 0; font-size: 16px; text-transform: uppercase; font-weight: 900; }
                .divider { border-bottom: 2px solid black; margin: 2px 0; }
                .seat { font-size: 36px; font-weight: 900; margin: 2px 0; }
                .name { font-size: 12px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .details { font-size: 10px; display: flex; justify-content: space-between; margin-top: 5px; font-weight: bold; }
            </style>
        </head>
        <body>
            ${tokensHtml}
        </body>
        </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 2000); // 2s delay for bulk
    }, 1000);
};

// ... (Rest of the file: printArrivalPass, printList, printCombinedList - Keep as is) ...
export const printArrivalPass = (data) => {
    if (!data) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<html><head><title>Pass-${data.confNo}</title><style>@page { size: 72mm auto; margin: 0; } body { margin: 0; padding: 5px; font-family: Helvetica, Arial, sans-serif; color: black; width: 70mm; } .container { padding: 5px; border: 3px solid black; border-radius: 8px; box-sizing: border-box; } .header { text-align: center; font-weight: bold; margin-bottom: 5px; } .divider { border-bottom: 2px solid black; margin: 5px 0; } table { width: 100%; font-size: 11px; margin-bottom: 5px; line-height: 1.3; border-collapse: collapse; } .main-seat { font-size: 45px; font-weight: 900; line-height: 1; margin: 5px 0; } .info-table td { border: 1px solid black; padding: 4px; font-size: 11px; }</style></head><body><div class="container"><div class="header"><div style="font-size:16px">VIPASSANA</div><div style="font-size:10px">International Meditation Center</div><div style="font-size:12px">Dhamma Nagajjuna 2</div></div><div class="divider"></div><table><tr><td style="font-weight:bold; width:50px; vertical-align:top">Course:</td><td>${data.courseName}</td></tr><tr><td style="font-weight:bold; width:50px; vertical-align:top">Teacher:</td><td>${data.teacherName}</td></tr><tr><td style="font-weight:bold; width:50px; vertical-align:top">Date:</td><td>${data.from} to ${data.to}</td></tr></table><div class="divider"></div><div style="text-align:center"><div style="font-size:14px; font-weight:900; text-transform:uppercase; margin:5px 0">CHECK-IN PASS</div><div class="main-seat">${data.roomNo || '-'}</div><div style="font-size:14px; font-weight:bold; margin:5px 0; word-wrap:break-word; line-height:1.2">${data.studentName}</div><div style="font-size:12px; font-weight:bold">${data.confNo}</div></div><table class="info-table" style="margin-top:10px; border:2px solid black"><tr><td style="width:50%">Dining: <strong>${data.seatNo || '-'}</strong></td><td style="width:50%">Mobile: <strong>${data.mobile}</strong></td></tr><tr><td>Valuables: <strong>${data.valuables}</strong></td><td>Lang: <strong>${data.language}</strong></td></tr>${(data.laundry || data.pagoda) ? `<tr><td colspan="2" style="font-weight:bold; text-align:center; background:#f0f0f0">${data.laundry ? `Laundry: ${data.laundry} ` : ''} ${data.pagoda ? `Pagoda: ${data.pagoda}` : ''}</td></tr>` : ''}</table><div style="text-align:center; font-size:9px; font-style:italic; margin-top:5px">*** Student Copy ***</div></div></body></html>`);
    doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 500);
};

export const printList = (title, list, courseName) => {
    if (!list || list.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Popup blocked.");
    const rows = list.map((p, i) => `<tr><td style="text-align: center;">${i + 1}</td><td style="text-align: center; font-weight: bold;">${p.dhamma_hall_seat_no || p.dining_seat_no || p.pagoda_cell_no || '-'}</td><td style="padding-left: 5px;">${p.full_name}</td><td style="text-align: center;">${p.conf_no}</td><td style="text-align: center;">${p.gender ? p.gender.charAt(0) : '-'}</td><td style="text-align: center;">${p.room_no || '-'}</td><td style="text-align: center;">${p.pagoda_cell_no || '-'}</td><td style="text-align: center;">${p.status === 'Attending' ? '✔️' : '❌'}</td></tr>`).join('');
    printWindow.document.write(`<html><head><title>${title}</title><style>@page { size: A4; margin: 10mm; } body { font-family: Arial, sans-serif; font-size: 12px; } table { width: 100%; border-collapse: collapse; margin-top: 10px; } th, td { border: 1px solid black; padding: 4px; } th { background-color: #f0f0f0; }</style></head><body><h1 style="text-align:center">${title} LIST - ${courseName}</h1><table><thead><tr><th>SN</th><th>Seat</th><th>Name</th><th>Conf</th><th>Gen</th><th>Room</th><th>Pagoda</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.print();
};

export const printCombinedList = (type, males, females, courseName) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Popup blocked.");
    const renderTable = (list, title) => {
        if (!list || list.length === 0) return '';
        const rows = list.map((p, i) => `<tr><td style="text-align:center">${i+1}</td><td style="text-align:center;font-weight:bold">${type==='PAGODA'?p.pagoda_cell_no:p.dining_seat_no}</td><td style="padding-left:5px">${p.full_name}</td><td style="text-align:center">${p.conf_no}</td><td style="text-align:center">${p.room_no||'-'}</td></tr>`).join('');
        return `<div style="flex:1; padding:10px;"><h3>${title} (${list.length})</h3><table style="width:100%; border-collapse:collapse; font-size:11px;"><thead><tr style="background:#eee"><th style="border:1px solid #ccc; padding:4px">SN</th><th style="border:1px solid #ccc; padding:4px">${type==='PAGODA'?'Cell':'Seat'}</th><th style="border:1px solid #ccc; padding:4px">Name</th><th style="border:1px solid #ccc; padding:4px">Conf</th><th style="border:1px solid #ccc; padding:4px">Room</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    };
    printWindow.document.write(`<html><head><title>${type} Master</title><style>@page { size: A4 landscape; margin: 10mm; } body { font-family: Arial; }</style></head><body><h1 style="text-align:center">${type} MASTER LIST - ${courseName}</h1><div style="display:flex; gap:20px;">${renderTable(males, "MALE")}${renderTable(females, "FEMALE")}</div></body></html>`);
    printWindow.document.close();
    printWindow.print();
};
