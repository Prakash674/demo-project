// function buildTableRows(rows) {
//   return rows
//     .map((row, index) => {
//       const earnings = JSON.parse(row.earning_details);
//       const deductions = JSON.parse(row.deduction_details);

//       return `
//       <tr>
//         <!-- Column 1: Employee info -->
//         <td style="border: 1px solid #000000">
//           <table>
//             <tr>
//               <td>${index + 1}.</td>
//               <td>${row.employee_name}</td>
//               <td>0.0</td>
//               <td>30.0</td>
//             </tr>
//             <tr>
//               <td>${row.factory_employee_id}</td>
//               <td>${row.father_name}</td>
//               <td>OTH</td>
//               <td>WO</td>
//             </tr>
//             <tr>
//               <td>${row.joining_date || '-'}</td>
//               <td>${row.location || '-'}</td>
//               <td>${row.gender?.charAt(0) || '-'}</td>
//               <td>PR</td>
//             </tr>
//             <tr>
//               <td>${row.department || '-'}</td>
//               <td>${row.uan || '-'}</td>
//               <td>${row.aadhar}</td>
//               <td>AB</td>
//             </tr>
//             <tr>
//               <td>-</td>
//               <td>${row.corporate_employee_id}</td>
//               <td>${row.esic_number || '-'}</td>
//               <td>LV</td>
//             </tr>
//             <tr>
//               <td colspan="4">${row.designation || '-'}</td>
//             </tr>
//           </table>
//         </td>

//         <!-- Column 2: Rate -->
//         <td style="border: 1px solid #000000">
//           <table>
//             <tr><td>${
//               earnings.find((e) => e.title === 'BASIC')?.answer || 0
//             }</td></tr>
//             <tr><td>${
//               earnings.find((e) => e.title === 'HRA')?.answer || 0
//             }</td></tr>
//             <tr><td>${
//               earnings.find((e) => e.title === 'SPECIAL ALLOWANCE')?.answer || 0
//             }</td></tr>
//             <tr><td>-</td></tr>
//             <tr><td style="text-align:right;font-weight:bold">${
//               row.gross_salary_structure
//             }</td></tr>
//           </table>
//         </td>

//         <!-- Column 3: Payable -->
//         <td style="border: 1px solid #000000">
//           <table>
//             <tr><td>${
//               earnings.find((e) => e.title === 'BASIC')?.answer || 0
//             }</td><td style="text-align:right">Arrear</td></tr>
//             <tr><td>${
//               earnings.find((e) => e.title === 'HRA')?.answer || 0
//             }</td><td style="text-align:right">Overtime</td></tr>
//             <tr><td>${
//               earnings.find((e) => e.title === 'SPECIAL ALLOWANCE')?.answer || 0
//             }</td></tr>
//             <tr><td>-</td></tr>
//             <tr><td colspan="2" style="text-align:right;font-weight:bold">${
//               row.net_payable
//             }</td></tr>
//           </table>
//         </td>

//         <!-- Column 4: Deduction -->
//         <td style="border: 1px solid #000000">
//           <table>
//             <tr><td>Canteen</td><td style="text-align:right">${
//               deductions.find((d) => d.title === 'PF')?.answer || 0
//             }</td></tr>
//             <tr><td colspan="2" align="right">${
//               deductions.find((d) => d.title === 'ESIC')?.answer || 0
//             }</td></tr>
//             <tr><td colspan="2" align="right">${
//               deductions.find((d) => d.title === 'Professional Tax')?.answer ||
//               0
//             }</td></tr>
//             <tr><td colspan="2" style="text-align:right;font-weight:bold">${
//               row.expense_details
//                 ? JSON.parse(row.expense_details)
//                     .reduce((sum, e) => sum + parseFloat(e.amount), 0)
//                     .toFixed(2)
//                 : 0
//             }</td></tr>
//           </table>
//         </td>

//         <!-- Column 5: Wages -->
//         <td style="border: 1px solid #000000">
//           <table>
//             <tr><td align="right">${
//               row.pf_esic_details ? JSON.parse(row.pf_esic_details).PF : 0
//             }</td></tr>
//             <tr><td align="right">${
//               row.pf_esic_details ? JSON.parse(row.pf_esic_details).ESIC : 0
//             }</td></tr>
//             <tr><td align="right">${row.net_payable}</td></tr>
//             <tr><td align="right">${row.gross_salary_structure}</td></tr>
//           </table>
//         </td>

//         <!-- Column 6: Employer Part -->
//         <td style="border: 1px solid #000000">
//           <table>
//             <tr><td>Cash</td></tr>
//             <tr><td>-</td><td align="right">-</td></tr>
//             <tr><td>-</td><td align="right">-</td></tr>
//             <tr><td>-</td><td align="right">-</td></tr>
//             <tr><td colspan="2" style="text-align:right;font-weight:bold">${
//               row.net_payable
//             }</td></tr>
//           </table>
//         </td>
//       </tr>
//     `;
//     })
//     .join('');
// }

// function buildHtml(rows) {
//   const tableRows = buildTableRows(rows);

//   return `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta charset="UTF-8" />
//         <title>Wages Count</title>
//         <style>
//           table { border-collapse: collapse; width: 100%; }
//           th, td { font-size: 10px; color: #000; }
//           th { border: 1px solid #000; text-align: center; font-weight: 500; }
//         </style>
//       </head>
//       <body>
//         <table border="1">
//           <thead>
//             <tr>
//               <th>Month Day</th>
//               <th>Rate</th>
//               <th>Payable</th>
//               <th>Deduction</th>
//               <th>Wages</th>
//               <th>Employer Part</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${tableRows}
//           </tbody>
//         </table>
//       </body>
//     </html>
//   `;
// }

// module.exports = { buildHtml };
