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

function buildTableRows(rows) {
  return rows
    .map((row, index) => {
      const earnings = JSON.parse(row.earning_details);
      const deductions = JSON.parse(row.deduction_details);

      return `
      <tr>
        <!-- Column 1: Employee info -->
        <td style="border: 1px solid #000000">
          <table>
            <tr>
              <td>${index + 1}.</td>
              <td>${row.employee_name}</td>
              <td>0.0</td>
              <td>30.0</td>
            </tr>
            <tr>
              <td>${row.factory_employee_id}</td>
              <td>${row.father_name}</td>
              <td>OTH</td>
              <td>WO</td>
            </tr>
            <tr>
              <td>${row.joining_date || '-'}</td>
              <td>${row.location || '-'}</td>
              <td>${row.gender?.charAt(0) || '-'}</td>
              <td>PR</td>
            </tr>
            <tr>
              <td>${row.department || '-'}</td>
              <td>${row.uan || '-'}</td>
              <td>${row.aadhar}</td>
              <td>AB</td>
            </tr>
            <tr>
              <td>-</td>
              <td>${row.corporate_employee_id}</td>
              <td>${row.esic_number || '-'}</td>
              <td>LV</td>
            </tr>
            <tr>
              <td colspan="4">${row.designation || '-'}</td>
            </tr>
          </table>
        </td>

        <!-- Column 2: Rate -->
        <td style="border: 1px solid #000000">
          <table>
            <tr><td>${
              earnings.find((e) => e.title === 'BASIC')?.answer || 0
            }</td></tr>
            <tr><td>${
              earnings.find((e) => e.title === 'HRA')?.answer || 0
            }</td></tr>
            <tr><td>${
              earnings.find((e) => e.title === 'SPECIAL ALLOWANCE')?.answer || 0
            }</td></tr>
            <tr><td>-</td></tr>
            <tr><td style="text-align:right;font-weight:bold">${
              row.gross_salary_structure
            }</td></tr>
          </table>
        </td>

        <!-- Column 3: Payable -->
        <td style="border: 1px solid #000000">
          <table>
            <tr><td>${
              earnings.find((e) => e.title === 'BASIC')?.answer || 0
            }</td><td style="text-align:right">Arrear</td></tr>
            <tr><td>${
              earnings.find((e) => e.title === 'HRA')?.answer || 0
            }</td><td style="text-align:right">Overtime</td></tr>
            <tr><td>${
              earnings.find((e) => e.title === 'SPECIAL ALLOWANCE')?.answer || 0
            }</td></tr>
            <tr><td>-</td></tr>
            <tr><td colspan="2" style="text-align:right;font-weight:bold">${
              row.net_payable
            }</td></tr>
          </table>
        </td>

        <!-- Column 4: Deduction -->
        <td style="border: 1px solid #000000">
          <table>
            <tr><td>Canteen</td><td style="text-align:right">${
              deductions.find((d) => d.title === 'PF')?.answer || 0
            }</td></tr>
            <tr><td colspan="2" align="right">${
              deductions.find((d) => d.title === 'ESIC')?.answer || 0
            }</td></tr>
            <tr><td colspan="2" align="right">${
              deductions.find((d) => d.title === 'Professional Tax')?.answer ||
              0
            }</td></tr>
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
            <tr><td align="right">${row.net_payable}</td></tr>
            <tr><td align="right">${row.gross_salary_structure}</td></tr>
          </table>
        </td>

        <!-- Column 6: Employer Part -->
        <td style="border: 1px solid #000000">
          <table>
            <tr><td>Cash</td></tr>
            <tr><td>-</td><td align="right">-</td></tr>
            <tr><td>-</td><td align="right">-</td></tr>
            <tr><td>-</td><td align="right">-</td></tr>
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
  const tableRows = buildTableRows(rows);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Wages Count</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { font-size: 10px; color: #000; }
          th { border: 1px solid #000; text-align: center; font-weight: 500; }
        </style>
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              <th>Month Day</th>
              <th>Rate</th>
              <th>Payable</th>
              <th>Deduction</th>
              <th>Wages</th>
              <th>Employer Part</th>
            </tr>
          </thead>
          <tbody>
              <tr>
          <td style="border: 1px solid #000000">
            <table>
              <tr>
                <td>S.No.</td>
                <td>Employee Name</td>
                <td>Arr Day</td>
                <td>PD</td>
              </tr>
              <tr>
                <td>Peer No.</td>
                <td>Father Name</td>
                <td>OTH</td>
                <td>WO</td>
              </tr>
              <tr>
                <td>DOJ</td>
                <td>Location</td>
                <td>M/F</td>
                <td>PR</td>
              </tr>
              <tr>
                <td>Department</td>
                <td>UAN</td>
                <td>AADHAR</td>
                <td>AB</td>
              </tr>
              <tr>
                <td>EPF NO.</td>
                <td>EMP.NO</td>
                <td>ESI NO.</td>
                <td>LV</td>
              </tr>
              <tr>
                <td colspan="4">Designation</td>
              </tr>
            </table>
          </td>

          <td style="border: 1px solid #000000">
            <table>
              <tr>
                <td>Basic</td>
              </tr>
              <tr>
                <td>HRA</td>
              </tr>
              <tr>
                <td>Other</td>
              </tr>
              <tr>
                <td>Att Once</td>
              </tr>
              <tr>
                <td style="text-align: right; font-weight: bold">Gross</td>
              </tr>
            </table>
          </td>

          <td style="border: 1px solid #000000">
            <table>
              <tr>
                <td>Basic</td>
                <td style="text-align: right">Arrear</td>
              </tr>
              <tr>
                <td>HRA</td>
                <td style="text-align: right">Overtime</td>
              </tr>
              <tr>
                <td>Other</td>
              </tr>
              <tr>
                <td>Att Once</td>
              </tr>
              <tr>
                <td colspan="2" style="text-align: right; font-weight: bold">
                  Payable
                </td>
              </tr>
            </table>
          </td>

          <td style="border: 1px solid #000000">
            <table>
              <tr>
                <td>Canteen</td>
                <td style="text-align: right">PF</td>
              </tr>
              <tr>
                <td colspan="2" align="right">ESI</td>
              </tr>
              <tr>
                <td colspan="2" align="right">LWF</td>
              </tr>
              <tr>
                <td
                  colspan="2"
                  style="
                    text-align: right;
                    font-weight: bold;
                    padding-top: 11px;
                  ">
                  Deduction
                </td>
              </tr>
            </table>
          </td>

          <td style="border: 1px solid #000000">
            <table>
              <tr>
                <td align="right">PF</td>
              </tr>
              <tr>
                <td align="right">Pension</td>
              </tr>
              <tr>
                <td align="right">ESI</td>
              </tr>
              <tr>
                <td align="right">LWF</td>
              </tr>
            </table>
          </td>

          <td style="border: 1px solid #000000">
            <table>
              <tr>
                <td>Payment Mode</td>
              </tr>
              <tr>
                <td>Pension</td>
                <td align="right">EPF</td>
              </tr>
              <tr>
                <td>ER-ESI</td>
                <td align="right">Fine</td>
              </tr>
              <tr>
                <td>ER-LWF</td>
                <td align="right">Damage</td>
              </tr>
              <tr>
                <td
                  colspan="2"
                  style="
                    text-align: right;
                    font-weight: bold;
                    padding-top: 14px;
                  ">
                  Net Payable
                </td>
              </tr>
            </table>
          </td>
        </tr>
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
    printBackground: true,
  });

  await browser.close();
  return outputPath;
};

const getCorporateDataByParams = async (req, res) => {
  try {
    const { COMPANY_ID, FACTORY_ID, MONTH } = req.query;

    // ✅ Validate required params
    if (!COMPANY_ID || !FACTORY_ID || !MONTH) {
      return res.status(400).json({
        success: false,
        message: 'COMPANY_ID, FACTORY_ID, and MONTH are required.',
      });
    }

    const sqlQuery = `
      SELECT
          T1.COMPANY_ID AS company_id,
          T1.NAME AS corporate_name,
          T2.FACTORY_ID AS factory_id,
          T2.FACTORY_NAME AS factory_name,
          T3.MONTH AS month,
          T4.FACTORY_EMPLOYEE_ID AS factory_employee_id,
          T4.CORPORATE_EMPLOYEE_ID AS corporate_employee_id,
          T4.NAME AS employee_name,
          T4.FATHER_NAME AS father_name,
          T4.JOINING_DATE AS joining_date,
          T4.UAN AS uan,
          T4.ESIC_NUMBER AS esic_number,
          T4.AADHAR AS aadhar,
          T4.SALARY AS salary,
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
      LIMIT 10;   -- 🔹 adjust limit for safety
    `;

    const [rows] = await pool.execute(sqlQuery, [
      COMPANY_ID,
      FACTORY_ID,
      MONTH,
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
