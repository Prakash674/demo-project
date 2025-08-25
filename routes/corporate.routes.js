const express = require('express');
const {
  getFactoryNames,
  getCorporateNameData,
  getMonths,
  getCorporateData,
} = require('../controller/getCorporate');
const router = express.Router();

// Route → Controller call
router.get('/corporates', getCorporateNameData);

router.get('/factories', getFactoryNames);

router.get('/months', getMonths);

router.get('/corporate-data', getCorporateData);

module.exports = router;
