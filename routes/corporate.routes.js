const express = require('express');
const {
  getFactoryNames,
  getCorporateNameData,
  getMonths,
  getCorporateData,
  getCorporateDataByParams,
} = require('../controller/getCorporate');
const router = express.Router();

// Route → Controller call
router.get('/corporates', getCorporateNameData);

router.get('/factories', getFactoryNames);

router.get('/months', getMonths);

router.get('/corporate-data', getCorporateData);
router.get('/corporate-data-params', getCorporateDataByParams);

module.exports = router;
