const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminContractController = require('../controllers/adminContractController');

// 대시보드 통계 API
router.get('/stats', adminController.getDashboardStats);

// SMS 발송 이력 API
router.get('/sms-logs', adminController.getSmsLogs);

// 기부 신청 관리 API
router.get('/donations', adminController.getDonations);
router.put('/donations/status', adminController.updateDonationStatus);

// 관리자(추천인) 관리 API
router.get('/managers', adminController.getManagers);
router.post('/managers', adminController.createManager);
router.put('/managers', adminController.updateManager);
router.delete('/managers/:id', adminController.deleteManager);
router.post('/login', adminController.loginManager);

// 기초코드 관리 API
router.get('/basic-codes', adminController.getBasicCodes);
router.post('/basic-codes', adminController.createBasicCode);
router.put('/basic-codes', adminController.updateBasicCode);
router.delete('/basic-codes/:base_code/:sub_code', adminController.deleteBasicCode);

// 입금계좌 관리 API
router.get('/bank-info', adminController.getBankInfos);
router.post('/bank-info', adminController.createBankInfo);
router.put('/bank-info', adminController.updateBankInfo);
router.delete('/bank-info/:bank_code', adminController.deleteBankInfo);

// 추천인 목록 API
router.get('/referrals', adminController.getReferralList);

// 마감일 관리 API
router.get('/closing-dates', adminController.getEndDates);
router.post('/closing-dates', adminController.saveEndDate);
router.delete('/closing-dates/:yy', adminController.deleteEndDate);

// 기부처 관리 API
router.get('/clients', adminController.getClients);
router.post('/clients', adminController.createClient);
router.put('/clients', adminController.updateClient);
router.delete('/clients/:client_no', adminController.deleteClient);

// 상품마스터 관리
router.get('/products', adminController.getProducts);
router.post('/products', adminController.createProduct);
router.put('/products', adminController.updateProduct);
router.delete('/products/:product_code', adminController.deleteProduct);

// 상품입고 관리
router.get('/receipts', adminController.getReceipts);
router.post('/receipts', adminController.createReceipt);
router.delete('/receipts/:receipt_yymm/:client_no/:product_code/:seq_no', adminController.deleteReceipt);

// 재고 현황
router.get('/stock-status', adminController.getStockStatus);

// 회원 관리
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users', adminController.updateUser);
router.delete('/users/:cust_no', adminController.deleteUser);
router.get('/referrals', adminController.getReferralList);

// 기부 신청 관리
router.get('/donations', adminController.getDonations);
router.get('/donations/recent/:cust_no', adminController.getRecentDonationInfo);
router.post('/donations', adminController.createDonation);
router.put('/donations', adminController.updateDonation);
router.delete('/donations/:cust_no/:dona_yy/:seq_no', adminController.deleteDonation);

// 기부금 생성 관리 (재고 매칭 및 출고 처리)
router.get('/donations/create-list', adminController.getDonationsForCreate);
router.post('/donations/generate-release', adminController.createDonationRelease);

// 정산 관리 API
router.get('/settlement/summary', adminController.getSettlementSummary);
router.get('/settlement/detail', adminController.getSettlementDetail);

// 기부 문서 생성 관리 API
router.get('/donation-doc/list', adminController.getDonationForDoc);
router.post('/donation-doc/generate', adminController.generateDonationDocuments);

// 기부 완료 처리 API
router.get('/donation-complete/list', adminController.getDonationListForComplete);
router.post('/donation-complete/process', adminController.processDonationComplete);

// 현금영수증 처리 API
router.get('/cr-receipt/list', adminController.getCRReceiptList);
router.post('/cr-receipt/export', adminController.exportCRReceiptExcel);

// 물품공급계약서 생성 API
router.post('/contract-doc/list', adminContractController.getContractDocList);
router.post('/contract-doc/generate', adminContractController.generateContractDocs);

module.exports = router;
