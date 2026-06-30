const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

// 기부금 신청 초기 데이터 조회
router.get('/init-data', donationController.getInitData);

// 기부금 신청 저장
router.post('/apply', donationController.applyDonation);

// 기부 내역 전체 조회
router.get('/history', donationController.getDonationHistory);

// 기부 내역 상세 조회
router.get('/detail', donationController.getDonationDetail);

// 연도별 합산 내역 조회
router.get('/yearly-summary', donationController.getDonationYearlySummary);

// 기부금 신청 취소
router.post('/cancel', donationController.cancelDonation);

module.exports = router;

