// src/utils/printGenerator.js

// --- CONFIGURATION ---
const CENTER_NAME = "DHAMMA NAGAJJUNA";
const CENTER_SUB = "Vipassana International Meditation Center";

// --- CSS STYLES ---
const STYLES = {
  thermal: `
    @page { size: 72mm auto; margin: 0; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 5px; color: black; }
    .ticket { width: 70mm; margin: 0 auto; text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
    .header { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
    .sub-header { font-size: 10px; margin-bottom: 8px; text-transform: uppercase; }
    .divider { border-bottom: 2px solid #000; margin: 5px 0; }
    .big-label { font-size: 10px; font-weight: bold; text-transform: uppercase; margin-top: 5px; }
    .big-value { font-size: 42px; font-weight: 900; line-height: 1; margin: 2px 0; }
    .med-value { font-size: 24px; font-weight: bold; margin: 2px 0; }
    .grid { display: flex; justify-content: space-between; margin-top: 5px; border: 1px solid #000; }
    .cell { flex: 1; border-right: 1px solid #000; padding: 2px; }
    .cell:last-child { border-right: none; }
    .cell-label { font-size: 8px; font-weight: bold; text-transform: uppercase; }
    .cell-val { font-size: 14px; font-weight: bold; }
    .name { font-size: 14px; font-weight: bold; margin: 8px 0; word-wrap: break-word; line-height: 1.2; text-transform: uppercase; }
    .conf { font-size: 12px; font-weight: bold; background: #000; color: #fff; display: inline-block; padding: 2px 6px; border-radius: 4px; }
    .footer { font-size: 9px; font-style: italic; margin-top: 10px; }
  `,
  a4: `
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: 'Segoe UI', sans-serif; font-size: 11pt; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 6px; text-align: left; }
    th { background: #f0f0f0; text-transform: uppercase; font-size: 10pt; }
    h1 { text-align: center; margin: 0 0 10px 0; font-size: 18pt; text-transform: uppercase; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold; }
  `
};

// --- HELPER: PRINT IFRAME ---
const triggerPrint = (htmlContent) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();
    
    iframe.onload = () => {
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        } catch (e) {
            console.error("Print Error", e);
        }
        // Cleanup after print dialog closes (approximate)
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 5000);
    };
};

// --- GENERATORS ---

// 1. INDIVIDUAL STUDENT TOKEN (Thermal)
export const printStudentToken = (student, courseName) => {
    const s = student;
    const cleanCourse = courseName ? courseName.split('/')[0] : '';
    
    const html = `
    <html>
    <head><style>${STYLES.thermal}</style></head>
    <body>
        <div class="ticket">
            <div class="header">${CENTER_NAME}</div>
            <div class="sub-header">${CENTER_SUB}</div>
            <div class="divider"></div>
            
            <div style="margin: 10px 0;">
                <div class="conf">${s.conf_no || '---'}</div>
            </div>
            
            <div class="name">${s.full_name}</div>
            <div style="font-size: 10px;">${cleanCourse}</div>
            
            <div class="divider"></div>
            
            <div class="big-label">Room Allocation</div>
            <div class="big-value">${s.room_no || '-'}</div>
            
            <div class="grid" style="margin-top: 10px;">
                <div class="cell">
                    <div class="cell-label">Dining Seat</div>
                    <div class="med-value">${s.dining_seat_no || '-'}</div>
                </div>
                <div class="cell">
                    <div class="cell-label">Pagoda</div>
                    <div class="med-value">${s.pagoda_cell_no || '-'}</div>
                </div>
            </div>

            <div class="grid">
                <div class="cell">
                    <div class="cell-label">Mobile Lock</div>
                    <div class="cell-val">${s.mobile_locker_no || '-'}</div>
                </div>
                <div class="cell">
                    <div class="cell-label">Valuables</div>
                    <div class="cell-val">${s.valuables_locker_no || '-'}</div>
                </div>
                <div class="cell">
                    <div class="cell-label">Laundry</div>
                    <div class="cell-val">${s.laundry_token_no || '-'}</div>
                </div>
            </div>

            <div class="footer">
                Please keep silence • Be happy
            </div>
        </div>
    </body>
    </html>
    `;
    triggerPrint(html);
};

// 2. KITCHEN / NOTICE BOARD LIST (A4 Landscape)
export const printList = (title, students, courseName) => {
    const rows = students.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td style="font-weight:bold">${s.dining_seat_no || '-'}</td>
            <td style="font-weight:bold">${s.full_name}</td>
            <td>${s.conf_no || ''}</td>
            <td>${s.gender || ''}</td>
            <td>${s.age || ''}</td>
            <td style="font-weight:bold">${s.room_no || '-'}</td>
            <td>${s.pagoda_cell_no || '-'}</td>
            <td>${s.mobile_locker_no || '-'}</td>
            <td>${s.medical_info ? '⚠️' : ''}</td>
        </tr>
    `).join('');

    const html = `
    <html>
    <head><style>${STYLES.a4}</style></head>
    <body>
        <h1>${CENTER_NAME} - ${title}</h1>
        <div class="meta">
            <span>Course: ${courseName}</span>
            <span>Date: ${new Date().toLocaleDateString()}</span>
            <span>Total: ${students.length}</span>
        </div>
        <table>
            <thead>
                <tr>
                    <th width="30">SN</th>
                    <th width="50">Seat</th>
                    <th>Name</th>
                    <th width="60">ID</th>
                    <th width="60">Sex</th>
                    <th width="40">Age</th>
                    <th width="60">Room</th>
                    <th width="60">Pagoda</th>
                    <th width="60">Mob</th>
                    <th width="30">Med</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </body>
    </html>
    `;
    triggerPrint(html);
};
