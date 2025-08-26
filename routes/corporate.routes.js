const express = require('express');
const {getCorporateDataByParams} = require('../controller/getCorporate');
const router = express.Router();


router.get('/corporate-data-params', getCorporateDataByParams);

module.exports = router;
