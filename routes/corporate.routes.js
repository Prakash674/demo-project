const express = require('express');
const {
  getCorporateDataByParams,
  getSalaryReport,
} = require('../controller/getCorporate');
const router = express.Router();

router.get('/corporate-data-params', getCorporateDataByParams);
router.get('/salary-report', getSalaryReport);
module.exports = router;
