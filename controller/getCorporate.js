const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const pool = require('../db');

const getCorporateNameData = async (req, res) => {
  try {
    const { COMPANY_ID } = req.query;
    const sqlQuery = `
      SELECT DISTINCT NAME AS corporate_name 
      FROM corporate_hrms_company_master
    `;

    const [rows] = await pool.execute(sqlQuery);

    return res.json({
      success: true,
      message: 'Corporate names fetched successfully',
      data: rows,
    });
  } catch (error) {
    console.error('❌ getCorporateData Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

const getFactoryNames = async (req, res) => {
  try {
    const { corporateName } = req.query;
    if (!corporateName) {
      return res
        .status(400)
        .json({ success: false, message: 'Corporate name is required.' });
    }
    const sqlQuery = `
            SELECT DISTINCT T2.FACTORY_NAME AS factory_name
            FROM corporate_hrms_company_master AS T1
            JOIN corporate_hrms_factory AS T2 ON T1.COMPANY_ID = T2.COMPANY_ID
            WHERE T1.NAME = ?
        `;
    const [rows] = await pool.execute(sqlQuery, [corporateName]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching factory names:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getMonths = async (req, res) => {
  try {
    const { corporateName, factoryName } = req.query;
    if (!corporateName || !factoryName) {
      return res.status(400).json({
        success: false,
        message: 'Corporate name and factory name are required.',
      });
    }
    const sqlQuery = `
            SELECT DISTINCT T3.MONTH AS month
            FROM corporate_hrms_company_master AS T1
            JOIN corporate_hrms_factory AS T2 ON T1.COMPANY_ID = T2.COMPANY_ID
            JOIN corporate_hrms_salary_data AS T3 ON T1.COMPANY_ID = T3.COMPANY_ID AND T2.FACTORY_ID = T3.TAG_ID
            WHERE T1.NAME = ? AND T2.FACTORY_NAME = ?
        `;
    const [rows] = await pool.execute(sqlQuery, [corporateName, factoryName]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching months:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getCorporateData = async (req, res) => {
  try {
    const { corporateName, factoryName, month } = req.query;

    if (!corporateName || !factoryName || !month) {
      return res.status(400).json({
        success: false,
        message: 'Corporate name, factory name, and month are required.',
      });
    }

    const sqlQuery = `
        SELECT
            T4.FACTORY_EMPLOYEE_ID AS factory_employee_id,
            T4.CORPORATE_EMPLOYEE_ID AS corporate_employee_id,
            T4.NAME AS name,
            T4.FATHER_NAME AS father_name,
            T4.JOINING_DATE AS joining_date,
            T4.UAN AS uan,
            T4.ESIC_NUMBER AS esic_number,
            T4.AADHAR AS aadhar,
            T4.SALARY AS salary, -- Fetches the full salary JSON from the correct table (T4)
            JSON_UNQUOTE(JSON_EXTRACT(T4.ADDITIONAL_DETAILS, '$.department')) AS department,
            JSON_UNQUOTE(JSON_EXTRACT(T4.ADDITIONAL_DETAILS, '$.designation')) AS designation,
            JSON_UNQUOTE(JSON_EXTRACT(T4.ADDITIONAL_DETAILS, '$.location')) AS location,
            T4.GENDER AS gender,

            T3.GROSS_SALARY AS gross_salary_structure,
            T3.NET_PAYABLE AS net_payable,
            T3.MONTH_DETAILS AS month_details,
            T3.FIXED_INPUT_DETAILS AS fixed_input_details,
            T3.EARNING_DETAILS AS earning_details,
            T3.DEDUCTION_DETAILS AS deduction_details,
            T3.PF_ESIC AS pf_esic_details,
            T3.PF_CHALLAN_DETAILS AS pf_challan_details,
            T3.ESIC_CHALLAN_DETAILS AS esic_challan_details,
            T3.EXPENSE_DETAILS AS expense_details

        FROM corporate_hrms_company_master AS T1
        INNER JOIN corporate_hrms_factory AS T2
            ON T1.COMPANY_ID = T2.COMPANY_ID
        INNER JOIN corporate_hrms_salary_data AS T3
            ON T1.COMPANY_ID = T3.COMPANY_ID
            AND T2.FACTORY_ID = T3.TAG_ID
        INNER JOIN corporate_hrms_employee_master AS T4
            ON T3.EMPLOYEE_ID = T4.EMPLOYEE_ID
        WHERE T1.NAME = ?
        AND T2.FACTORY_NAME = ?
        AND T3.MONTH = ?`;

    const [rows] = await pool.execute(sqlQuery, [
      corporateName,
      factoryName,
      month,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No employee data found for the selected filters.',
      });
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching corporate data:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// const html = buildHtml(rows);

function buildHeader(rows) {
  if (!rows.length) return '';

  const earnings = JSON.parse(rows[0].earning_details || '[]');
  const deductions = JSON.parse(rows[0].deduction_details || '[]');
  const inputs = JSON.parse(rows[0].input_details || '[]');
  const fixed_input_details = JSON.parse(rows[0].fixed_input_details || '[]');
  const expense_details = JSON.parse(rows[0].expense_details || '[]');

  // Extract keys
  const earningKeys = earnings.map((e) => e.title);
  const deductionKeys = deductions.map((d) => d.title);
  const inputKeys = inputs.map((i) => i.title);
  const rateKeys = fixed_input_details.map((i) => i.title || '[]');
  const expenseKeys = expense_details.map((e) => e.title || '[]');

  const exclude = [
    'factory_name',
    'month',
    'company_id',
    'corporate_name',
    'factory_id',
    'gross_salary_structure',
    'net_payable',
    'input_details',
    'esic_challan_details',
    'expense_details',
    'pf_esic_details',
    'earning_details',
    'deduction_details',
    'fixed_input_details',
    'month_details',
    'pf_challan_details',
    'salary',
    'address',
    'district',
    'state',
  ];

  // Filter keys
  const employeeKeys = Object.keys(rows[0]).filter(
    (key) =>
      typeof rows[0][key] !== 'object' &&
      rows[0][key] !== null &&
      !exclude.includes(key)
  );
  employeeKeys.unshift('S.no.');

  let tableRows = '';

  // maximum rows needed
  const maxLen = Math.max(
    Math.ceil(employeeKeys.length / 2),
    Math.ceil(inputKeys.length / 2)
  );

  for (let i = 0; i < maxLen; i++) {
    const empCols = employeeKeys.slice(i * 2, i * 2 + 2);
    const inCols = inputKeys.slice(i * 2, i * 2 + 2);

    let left =
      empCols.length === 1
        ? `<td colspan="2">${empCols[0]}</td>`
        : empCols.map((c) => `<td align="left">${c}</td>`).join('');

    // console.log(left, 'left data');

    let right =
      inCols.length === 1
        ? `<td colspan="2">${inCols[0]}</td>`
        : inCols.map((c) => `<td align="right">${c}</td>`).join('');

    tableRows += `<tr>${left}${right}</tr>`;

    // console.log(right, 'right data');
  }

  // console.log(tableRows, 'tableRows data');
  return `
    <tr>
      <!-- Column 1: Employee Info -->
      <td style="border: 1px solid #000000">
        <table>
             ${tableRows}
        </table>
      </td>

      <!-- Column 2: Rate -->
      <td style="border: 1px solid #000000">
        <table>
          ${rateKeys.map((k) => `<tr><td>${k}</td></tr>`).join('')}
          <tr><td style="text-align:right;font-weight:bold">Gross</td></tr>
        </table>
      </td>

      <!-- Column 3: Payable -->
     <td style="border: 1px solid #000000">
  <table>
    ${(() => {
      let html = '';
      for (let i = 0; i < earningKeys.length; i += 2) {
        const k1 = earningKeys[i];
        const k2 = earningKeys[i + 1]; // may be undefined

        html += `<tr>
                   <td>${k1 || ''}</td>
                   <td align="right">${k2 || ''}</td>
                 </tr>`;
      }
      return html;
    })()}
    <tr><td colspan="2" style="text-align:right;font-weight:bold">Payable</td></tr>
  </table>
</td>


      <!-- Column 4: Deduction -->
      <td style="border: 1px solid #000000">
        <table>
          ${deductionKeys
            .map((k) => `<tr><td colspan="2" align="right">${k}</td></tr>`)
            .join('')}
          <tr><td colspan="2" style="text-align:right;font-weight:bold">Deduction</td></tr>
        </table>
      </td>

      <!-- Column 5: Wages -->
      <td style="border: 1px solid #000000">
        <table>
          <tr><td align="right">${rows[0].pf_esic_details ? 'PF' : ''}</td></tr>
            <tr><td align="right">${
              rows[0].pf_esic_details ? 'ESIC' : ''
            }</td></tr>
        </table>
      </td>

      <!-- Column 6: Employer Part -->
      <td style="border: 1px solid #000000">
        <table>
  <tr><td colspan="2" >Payment Mode</td>
  </tr>
  ${expenseKeys.map((k) => `<tr><td>${k}</td></tr>`).join('')}

          <tr><td colspan="2" style="text-align:right;font-weight:bold">Net Payable</td></tr>
        </table>
      </td>
    </tr>
  `;
}

function buildTableRows(rows) {
  return rows
    .map((row, index) => {
      const earnings = JSON.parse(row.earning_details || '[]');
      const deductions = JSON.parse(row.deduction_details || '[]');
      const inputs = JSON.parse(row.input_details || '[]');
      const fixedInputs = JSON.parse(row.fixed_input_details || '[]');
      const expense_details = JSON.parse(row.expense_details || '[]'); // ✅ per row
      // Extract keys exactly like buildHeader
      const earningKeys = earnings.map((e) => e.title);
      const deductionKeys = deductions.map((d) => d.title);
      const inputKeys = inputs.map((i) => i.title);
      const rateKeys = fixedInputs.map((i) => i.title || '[]');
      const expenseKeys = expense_details.map((e) => e.title); // ✅ fixed
      // console.log(expenseKeys, 'expenseKeys');
      const exclude = [
        'factory_name',
        'month',
        'company_id',
        'corporate_name',
        'factory_id',
        'gross_salary_structure',
        'net_payable',
        'input_details',
        'esic_challan_details',
        'expense_details',
        'pf_esic_details',
        'earning_details',
        'deduction_details',
        'fixed_input_details',
        'month_details',
        'pf_challan_details',
        'salary',
        'address',
        'district',
        'state',
      ];

      const employeeKeys = Object.keys(row).filter(
        (key) =>
          typeof row[key] !== 'object' &&
          row[key] !== null &&
          !exclude.includes(key)
      );
      employeeKeys.unshift('S.no.');

      // maximum rows needed (same as header)
      const maxLen = Math.max(
        Math.ceil(employeeKeys.length / 2),
        Math.ceil(inputKeys.length / 2)
      );

      let empTableRows = '';
      for (let i = 0; i < maxLen; i++) {
        const empCols = employeeKeys.slice(i * 2, i * 2 + 2);
        const inCols = inputKeys.slice(i * 2, i * 2 + 2);

        let left =
          empCols.length === 1
            ? `<td colspan="2">${
                empCols[0] === 'S.no.' ? index + 1 : row[empCols[0]] || '-'
              }</td>`
            : empCols
                .map((c) =>
                  c === 'S.no.'
                    ? `<td>${index + 1}</td>`
                    : `<td align="left" width="100">${row[c] || '-'}</td>`
                )
                .join('');

        let right =
          inCols.length === 1
            ? `<td colspan="2">${
                inputs.find((i) => i.title === inCols[0])?.answer || '-'
              }</td>`
            : inCols
                .map(
                  (c) =>
                    `<td align="right" width="130">${
                      inputs.find((i) => i.title === c)?.answer || '-'
                    }</td>`
                )
                .join('');

        empTableRows += `<tr>${left}${right}</tr>`;
      }

      // console.log(empTableRows, 'empTableRows data');

      return `
        <tr>
          <!-- Column 1: Employee Info -->
          <td style="border: 1px solid #000000">
            <table>${empTableRows}</table>
          </td>

          <!-- Column 2: Rate -->
          <td style="border: 1px solid #000000">
            <table>
              ${rateKeys
                .map(
                  (k) =>
                    `<tr><td>${
                      fixedInputs.find((f) => f.title === k)?.answer || '-'
                    }</td></tr>`
                )
                .join('')}
              <tr><td style="text-align:right;font-weight:bold">${
                row.gross_salary_structure
              }</td></tr>
            </table>
          </td>

          <!-- Column 3: Payable -->
          <td style="border: 1px solid #000000">
  <table>
    ${(() => {
      let html = '';
      for (let i = 0; i < earningKeys.length; i += 2) {
        const k1 = earningKeys[i];
        const k2 = earningKeys[i + 1];

        const v1 = earnings.find((e) => e.title === k1)?.answer || 0;
        const v2 = k2 ? earnings.find((e) => e.title === k2)?.answer || 0 : '';

        html += `<tr>
                   <td>${v1}</td>
                   <td align="right">${v2}</td>
                 </tr>`;
      }
      return html;
    })()}
    <tr>
      <td colspan="2" style="text-align:right;font-weight:bold">
        ${row.net_payable}
      </td>
    </tr>
  </table>
</td>

          <!-- Column 4: Deduction -->
          <td style="border: 1px solid #000000">
            <table>
              ${deductionKeys
                .map(
                  (k) =>
                    `<tr><td colspan="2" align="right">${
                      deductions.find((d) => d.title === k)?.answer || 0
                    }</td></tr>`
                )
                .join('')}
              <tr><td colspan="2" style="text-align:right;font-weight:bold">${
                row.expense_details
                  ? JSON.parse(row.expense_details)
                      .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                      .toFixed(2)
                  : 0
              }</td></tr>
            </table>
          </td>

          <!-- Column 5: Wages -->
          <td style="border: 1px solid #000000">
            <table>
              <tr><td align="right">${
                row.pf_esic_details ? JSON.parse(row.pf_esic_details).PF : 0
              }</td></tr>
              <tr><td align="right">${
                row.pf_esic_details ? JSON.parse(row.pf_esic_details).ESIC : 0
              }</td></tr>
            </table>
          </td>

          <!-- Column 6: Employer Part -->
          <td style="border: 1px solid #000000">
            <table>
              <tr><td> BT-${row.accountno || 'Cash'}</td></tr>
              ${expenseKeys
                .map(
                  (k) =>
                    `<tr><td>${
                      expense_details.find((e) => e.title === k)?.amount || 0
                    }</td></tr>`
                )
                .join('')}

              <tr><td colspan="2" style="text-align:right;font-weight:bold">${
                row.net_payable
              }</td></tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join('');
}

function buildHtml(rows) {
  const headerRow = buildHeader(rows);
  const tableRows = buildTableRows(rows);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Wages Count</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { font-size: 8px; color: #000; }
         td {
    page-break-inside: avoid; 
    break-inside: avoid;     
    vertical-align: top;
  }
  td > table {
    page-break-inside: avoid;
    break-inside: avoid;
  }
        </style>
      </head>
      <body>
     <table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td colspan="2" style="text-align: left; font-weight: bold;">
      ${rows[0].corporate_name}
    </td>
  </tr>
  <tr>
    <td colspan="2" style="text-align: left;">
      ${rows[0].address}, ${rows[0].district}, ${rows[0].state}
    </td>
  </tr>
  <tr>
    <td style="text-align: left; width: 50%;">
     SITE - ${rows[0].factory_name}
    </td>
    <td style="text-align: right; font-weight: bold; width: 50%;">
      ${rows[0].month}
    </td>
  </tr>
</table>
        <table border="1">
          <thead>  
          </thead>
          <tbody>
            <tr>
              <th>Month Day</th>
              <th>Rate</th>
              <th>Payable</th>
              <th>Deduction</th>
              <th>Wages</th>
              <th>Employer Part</th>
            </tr>  
         ${headerRow}
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

const generateDynamicPdf = async (rows, outputPath) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // console.log(rows, 'checking rows');
  const html = buildHtml(rows);

  // const html = await ejs.renderFile(path.join(__dirname, 'template.ejs'), {
  //   username: data.username,
  //   amount: data.amount,
  //   invoiceNo: 'INV-' + Date.now(),
  //   date: new Date().toLocaleDateString(),
  // });

  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Save directly as file
  await page.pdf({
    path: outputPath,
    format: 'A4',
    landscape: true,
    printBackground: false,
    // displayHeaderFooter: true,
    // headerTemplate: `
    //   <div style="font-size:10px; width:100%; text-align:center;">
    //     <span class="title">HANS Enterprises  </span>
    //   </div>
    // `,
    // footerTemplate: `
    //   <div style="font-size:10px; width:100%; text-align:center;">
    //     Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    //   </div>
    // `,
    margin: {
      top: '20px',
      bottom: '30px',
      right: '20px',
      left: '20px',
    },
  });

  await browser.close();
  return outputPath;
};

const getCorporateDataByParams = async (req, res) => {
  try {
    const { COMPANY_ID, FACTORY_ID, MONTH, STRUCTURE_ID } = req.query;

    // ✅ Validate required params
    if (!COMPANY_ID || !FACTORY_ID || !MONTH || !STRUCTURE_ID) {
      return res.status(400).json({
        success: false,
        message:
          'COMPANY_ID, FACTORY_ID, MONTH, and STRUCTURE_ID are required.',
      });
    }

    const sqlQuery = `
      SELECT
          T1.COMPANY_ID AS company_id,
          T1.NAME AS corporate_name,
           T1.ADDRESS AS address,
          T1.DISTRICT AS district,
          T1.STATE AS state,
          T2.FACTORY_ID AS factory_id,
          T2.FACTORY_NAME AS factory_name,
          T3.MONTH AS month,
          T3.INPUT_DETAILS AS input_details,
          T4.FACTORY_EMPLOYEE_ID AS factory_employee_code,
          T4.CORPORATE_EMPLOYEE_ID AS corporate_employee_code,
          T4.NAME AS employee_name,
          T4.FATHER_NAME AS father_name,
          T4.JOINING_DATE AS joining_date,
          T4.UAN AS uan,
          T4.ESIC_NUMBER AS esic_number,
          T4.AADHAR AS aadhar,
          T4.SALARY AS salary,
          T4.BANK_ACCOUNT_NO AS accountno,
          T4.GENDER AS gender,
          T4.EMPLOYEE_TYPE AS department,
          T4.EMPLOYEE_SUBTYPE AS designation, 
          T3.GROSS_SALARY AS gross_salary_structure,
          T3.NET_PAYABLE AS net_payable,
          T3.MONTH_DETAILS AS month_details,
          T3.FIXED_INPUT_DETAILS AS fixed_input_details,
          T3.EARNING_DETAILS AS earning_details,
          T3.DEDUCTION_DETAILS AS deduction_details,
          T3.PF_ESIC AS pf_esic_details,
          T3.PF_CHALLAN_DETAILS AS pf_challan_details,
          T3.ESIC_CHALLAN_DETAILS AS esic_challan_details,
          T3.EXPENSE_DETAILS AS expense_details
      FROM corporate_hrms_company_master AS T1
      LEFT JOIN corporate_hrms_factory AS T2 
          ON T1.COMPANY_ID = T2.COMPANY_ID
      LEFT JOIN corporate_hrms_salary_data AS T3 
          ON T1.COMPANY_ID = T3.COMPANY_ID 
          AND T2.FACTORY_ID = T3.TAG_ID
      LEFT JOIN corporate_hrms_employee_master AS T4 
          ON T3.EMPLOYEE_ID = T4.EMPLOYEE_ID
      WHERE T1.COMPANY_ID = ?
        AND T2.FACTORY_ID = ?
        AND T3.MONTH = ?
        AND T3.STRUCTURE_ID = ?
    `;

    const [rows] = await pool.execute(sqlQuery, [
      COMPANY_ID,
      FACTORY_ID,
      MONTH,
      STRUCTURE_ID,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for the given parameters.',
      });
    }

    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }

    // ✅ Generate unique file name
    const fileName = `corporate-report-${Date.now()}.pdf`;
    const outputPath = path.join(reportsDir, fileName);

    await generateDynamicPdf(rows, outputPath);

    // return res.json({
    //   success: true,
    //   message: 'Corporate data fetched successfully',
    //   count: rows.length,
    //   data: rows,
    // });
    return res.json({
      success: true,
      message: 'Corporate data PDF generated successfully',
      filePath: `/reports/${fileName}`,
    });
  } catch (error) {
    console.error('❌ getCorporateDataByParams Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

module.exports = {
  getCorporateNameData,
  getFactoryNames,
  getMonths,
  getCorporateData,
  getCorporateDataByParams,
};
// /corporate-data-params
