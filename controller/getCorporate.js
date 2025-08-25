const pool = require('../db');

const getCorporateNameData = async (req, res) => {
  try {
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
      return res
        .status(400)
        .json({
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

module.exports = {
  getCorporateNameData,
  getFactoryNames,
  getMonths,
  getCorporateData,
};
