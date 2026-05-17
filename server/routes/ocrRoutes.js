const express = require('express');
const router = express.Router();
const ocrController = require('../controllers/ocrController');

// POST /api/ocr/scan - 영수증 이미지 OCR 분석
router.post('/scan', ocrController.scanReceipt);

module.exports = router;
