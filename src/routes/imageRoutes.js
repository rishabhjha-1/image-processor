const express = require('express');
const router = express.Router();
const { uploadCSV, getStatus } = require('../controller/imageController');

router.post('/upload', uploadCSV);
router.get('/status/:requestID', getStatus);

module.exports = router;
