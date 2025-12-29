// src/utils/printGenerator.js

// ✅ 1. RESTORED TOKEN PRINT LOGIC (Matches ParticipantList(3).jsx exactly)
export const printStudentToken = (student, courseName) => {
    if (!student) return;

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // EXACT HTML STRUCTURE FROM PREVIOUS VERSION
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>Token-${student.conf_no}</title>
            <style>
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
                    height: 38mm; /* Fixed height for label */
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                h2 { margin: 0; font-size: 16px; text-transform: uppercase; }
                .seat { font-size: 36px; font-weight: 900; margin: 2px 0; }
                .name { font-size: 12px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .details { font-size: 10px; display: flex; justify-content: space-between; margin-top: 5px; font-weight: bold; }
                .footer { font-size: 8px; margin-top: 2px; }
            </style>
        </head>
        <body>
            <div class="token-box">
                <div>
                    <h2>${courseName || 'DHAMMA COURSE'}</h2>
                    <div style="border-bottom: 1px solid black; margin: 2px 0;"></div>
                </div>
                
                <div class="seat">${student.dhamma_hall_seat_no || '-'}</div>
                
                <div>
                    <div class="name">${student.full_name}</div>
                    <div class="details">
                        <span>${student.conf_no}</span>
                        <span>${student.gender}</span>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    doc.close();

    // Print and Cleanup
    iframe.contentWindow.focus();
    setTimeout(() => {
        iframe.contentWindow.print();
        // Remove iframe after print dialog closes (approximate delay)
        setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
};

// ✅ 2. RESTORED LIST PRINT LOGIC (Matches ParticipantList(3).jsx exactly)
export const printList = (title, list, courseName) => {
    if (!list || list.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Popup blocked. Please allow popups.");

    const headers = `
        <tr>
            <th style="width: 5%;">S.N.</th>
            <th style="width: 10%;">Seat</th>
            <th style="width: 35%;">Name</th>
            <th style="width: 10%;">Conf</th>
            <th style="width: 10%;">Gen</th>
            <th style="width: 10%;">Room</th>
            <th style="width: 10%;">Pagoda</th>
            <th style="width: 10%;">Status</th>
        </tr>
    `;

    const rows = list.map((p, i) => `
        <tr>
            <td style="text-align: center;">${i + 1}</td>
            <td style="text-align: center; font-weight: bold;">${p.dhamma_hall_seat_no || p.dining_seat_no || p.pagoda_cell_no || '-'}</td>
            <td style="padding-left: 5px;">${p.full_name}</td>
            <td style="text-align: center;">${p.conf_no}</td>
            <td style="text-align: center;">${p.gender ? p.gender.charAt(0) : '-'}</td>
            <td style="text-align: center;">${p.room_no || '-'}</td>
            <td style="text-align: center;">${p.pagoda_cell_no || '-'}</td>
            <td style="text-align: center;">${p.status === 'Attending' ? '✔️' : '❌'}</td>
        </tr>
    `).join('');

    printWindow.document.write(`
        <html>
        <head>
            <title>${title} - ${courseName}</title>
            <style>
                @page { size: A4; margin: 10mm; }
                body { font-family: Arial, sans-serif; font-size: 12px; }
                h1 { text-align: center; margin-bottom: 5px; font-size: 18px; }
                h3 { text-align: center; margin-top: 0; font-size: 14px; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid black; padding: 4px; }
                th { background-color: #f0f0f0; text-transform: uppercase; font-size: 10px; }
                tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
        </head>
        <body>
            <h1>${title} LIST</h1>
            <h3>${courseName}</h3>
            <table>
                <thead>${headers}</thead>
                <tbody>${rows}</tbody>
            </table>
            <div style="margin-top: 10px; font-size: 10px; text-align: right;">
                Printed on: ${new Date().toLocaleString()} | Total: ${list.length}
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
};

// ✅ 3. COMBINED LIST PRINT (New helper, kept simple and consistent)
export const printCombinedList = (type, males, females, courseName) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Popup blocked.");

    const renderTable = (list, title) => {
        if (!list || list.length === 0) return '';
        const rows = list.map((p, i) => `
            <tr>
                <td style="text-align: center;">${i + 1}</td>
                <td style="text-align: center; font-weight: bold;">${type === 'PAGODA' ? p.pagoda_cell_no : p.dining_seat_no}</td>
                <td style="padding-left: 5px;">${p.full_name}</td>
                <td style="text-align: center;">${p.conf_no}</td>
                <td style="text-align: center;">${p.room_no || '-'}</td>
            </tr>
        `).join('');
        
        return `
            <div style="flex: 1; padding: 10px;">
                <h3 style="text-align: center; border-bottom: 2px solid black; padding-bottom: 5px;">${title} (${list.length})</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 10%;">SN</th>
                            <th style="width: 15%;">${type === 'PAGODA' ? 'Cell' : 'Seat'}</th>
                            <th style="width: 45%;">Name</th>
                            <th style="width: 15%;">Conf</th>
                            <th style="width: 15%;">Room</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    };

    printWindow.document.write(`
        <html>
        <head>
            <title>${type} Master List</title>
            <style>
                @page { size: A4 landscape; margin: 10mm; }
                body { font-family: Arial, sans-serif; font-size: 11px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ccc; padding: 4px; }
                th { background-color: #eee; font-size: 10px; }
                h1 { text-align: center; margin: 0 0 10px 0; }
            </style>
        </head>
        <body>
            <h1>${type} MASTER LIST - ${courseName}</h1>
            <div style="display: flex; gap: 20px;">
                ${renderTable(males, "MALE STUDENTS")}
                ${renderTable(females, "FEMALE STUDENTS")}
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
};
