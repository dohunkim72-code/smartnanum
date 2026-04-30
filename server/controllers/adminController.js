const db = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const dayjs = require('dayjs');
const axios = require('axios');
const numberToKorean = require('../utils/numberToKorean');

// 엑셀 셀 값 설정을 위한 헬퍼 함수 (병합된 셀 대응)
function setValueToMergedStartCell(ws, cellRef, value) {
  // ExcelJS에서 병합된 셀의 왼쪽 상단 셀만 값을 가질 수 있음
  for (const range of ws.mergedCells) {
    if (range.includes(cellRef)) {
      const { top, left } = ws._mergeCells[range];
      ws.getCell(`${String.fromCharCode(65 + left)}${top + 1}`).value = value;
      return;
    }
  }
  ws.getCell(cellRef).value = value;
}

/**
 * 관리자 전용 컨트롤러
 */
const adminController = {
  // SMS 발송 이력 조회
  getSmsLogs: async (req, res) => {
    try {
      const query = `
        SELECT 
          l.*, 
          c.name as cust_name 
        FROM TB_SMS_LOG l
        LEFT JOIN cust c ON l.cust_no = c.cust_no
        ORDER BY l.reg_date DESC
        LIMIT 100
      `;
      const [rows] = await db.execute(query);
      res.json(rows);
    } catch (error) {
      console.error('SMS 로그 조회 중 오류:', error);
      res.status(500).json({ message: '데이터를 가져오는 중 오류가 발생했습니다.' });
    }
  },

  // 대시보드 요약 통계 조회
  getDashboardStats: async (req, res) => {
    try {
      const currentYear = new Date().getFullYear().toString();

      // 1. 총 회원 수
      const [userCount] = await db.execute('SELECT COUNT(*) as count FROM cust');
      
      // 2. 당해년도 기부 요청 금액 합계
      const [requestedAmt] = await db.execute(
        'SELECT SUM(dona_amt) as total FROM donation_detail WHERE dona_yy = ?', 
        [currentYear]
      );

      // 3. 당해년도 기부 완료 금액 합계 (step_code '04'를 완료로 가정)
      const [completedAmt] = await db.execute(
        "SELECT SUM(real_amt) as total FROM donation_detail WHERE dona_yy = ? AND step_code = '04'", 
        [currentYear]
      );
      
      // 4. 승인 대기 건수 (상태코드가 '01'인 경우)
      const [pendingCount] = await db.execute("SELECT COUNT(*) as count FROM donation_detail WHERE step_code = '01'");
      
      // 5. 문자 발송 성공률
      const [smsStats] = await db.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN send_stat = 'SUCCESS' THEN 1 ELSE 0 END) as success
        FROM TB_SMS_LOG
      `);

      // 6. 월별 기부 추이 (최근 7개월, 신청 금액 기준)
      const [monthlyTrend] = await db.execute(`
        SELECT 
          DATE_FORMAT(reg_date, '%m월') as name,
          SUM(dona_amt) as amt
        FROM donation_detail
        WHERE reg_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(reg_date, '%Y-%m'), DATE_FORMAT(reg_date, '%m월')
        ORDER BY DATE_FORMAT(reg_date, '%Y-%m') ASC
      `);

      // 7. 최근 기부 신청 내역 (5건, 신청 금액 기준)
      const [recentDonations] = await db.execute(`
        SELECT 
          d.seq_no as id,
          c.name as user,
          d.dona_amt as amount,
          DATE_FORMAT(d.reg_date, '%Y-%m-%d') as date,
          CASE 
            WHEN d.step_code = '01' THEN '대기중'
            WHEN d.step_code = '04' THEN '완료'
            ELSE '진행중'
          END as status
        FROM donation_detail d
        JOIN cust c ON d.cust_no = c.cust_no
        ORDER BY d.reg_date DESC
        LIMIT 5
      `);

      res.json({
        userCount: userCount[0].count,
        totalRequestedAmt: requestedAmt[0].total || 0,
        totalCompletedAmt: completedAmt[0].total || 0,
        pendingCount: pendingCount[0].count,
        smsSuccessRate: smsStats[0].total > 0 
          ? Math.round((smsStats[0].success / smsStats[0].total) * 100) 
          : 0,
        chartData: monthlyTrend,
        recentRequests: recentDonations.map(req => ({
          ...req,
          amount: `₩${Number(req.amount).toLocaleString()}`
        }))
      });
    } catch (error) {
      console.error('대시보드 통계 조회 중 오류:', error);
      res.status(500).json({ message: '통계 데이터를 가져오는 중 오류가 발생했습니다.' });
    }
  },

  // 기부 신청 목록 조회
  getDonations: async (req, res) => {
    try {
      const query = `
        SELECT 
          d.*, 
          c.name as user_name,
          c.hpno as user_hpno
        FROM donation_detail d
        LEFT JOIN cust c ON d.cust_no = c.cust_no
        ORDER BY d.reg_date DESC
      `;
      const [rows] = await db.execute(query);
      res.json(rows);
    } catch (error) {
      console.error('기부 목록 조회 오류:', error);
      res.status(500).json({ message: '데이터 조회 중 오류가 발생했습니다.' });
    }
  },

  // 기부 신청 상태 변경
  updateDonationStatus: async (req, res) => {
    const { cust_no, dona_yy, seq_no, step_code } = req.body;
    try {
      const query = `
        UPDATE donation_detail 
        SET step_code = ?, upd_date = NOW()
        WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?
      `;
      await db.execute(query, [step_code, cust_no, dona_yy, seq_no]);
      res.json({ message: '상태가 성공적으로 변경되었습니다.' });
    } catch (error) {
      console.error('상태 변경 오류:', error);
      res.status(500).json({ message: '상태 변경 중 오류가 발생했습니다.' });
    }
  },

  // 관리자(추천인) 목록 조회
  getManagers: async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT id, name, referral_code, hpno, email_add, grade FROM referral ORDER BY id DESC');
      res.json(rows);
    } catch (error) {
      console.error('관리자 목록 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  // 관리자 등록
  createManager: async (req, res) => {
    const { name, referral_code, pw, hpno, email_add, grade } = req.body;
    try {
      // 비밀번호 단방향 암호화 (Salt round: 10)
      const hashedPassword = await bcrypt.hash(pw, 10);

      // 다음 ID 채번 (가장 큰 ID + 1)
      const [maxIdResult] = await db.execute('SELECT IFNULL(MAX(id), 0) + 1 as nextId FROM referral');
      const nextId = maxIdResult[0].nextId;

      await db.execute(
        'INSERT INTO referral (id, name, referral_code, pw, hpno, email_add, grade) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nextId, name, referral_code, hashedPassword, hpno, email_add, grade]
      );
      res.json({ message: '관리자가 등록되었습니다.' });
    } catch (error) {
      console.error('관리자 등록 오류:', error);
      res.status(500).json({ message: '등록 중 오류가 발생했습니다.' });
    }
  },

  // 관리자 수정
  updateManager: async (req, res) => {
    const { id, name, referral_code, pw, hpno, email_add, grade } = req.body;
    try {
      let query = 'UPDATE referral SET name = ?, referral_code = ?, hpno = ?, email_add = ?, grade = ?';
      let params = [name, referral_code, hpno, email_add, grade];

      // 비밀번호가 입력된 경우에만 암호화하여 업데이트
      if (pw) {
        const hashedPassword = await bcrypt.hash(pw, 10);
        query += ', pw = ?';
        params.push(hashedPassword);
      }

      query += ' WHERE id = ?';
      params.push(id);

      await db.execute(query, params);
      res.json({ message: '관리자 정보가 수정되었습니다.' });
    } catch (error) {
      console.error('관리자 수정 오류:', error);
      res.status(500).json({ message: '수정 중 오류가 발생했습니다.' });
    }
  },

  // 관리자 삭제
  deleteManager: async (req, res) => {
    const { id } = req.params;
    try {
      await db.execute('DELETE FROM referral WHERE id = ?', [id]);
      res.json({ message: '관리자가 삭제되었습니다.' });
    } catch (error) {
      console.error('관리자 삭제 오류:', error);
      res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
    }
  },

  // 관리자 로그인
  loginManager: async (req, res) => {
    // 프론트엔드의 구/신 버전에 모두 대응하기 위해 adminId와 id 확인
    const adminId = req.body.adminId || req.body.id;
    const password = req.body.password;

    if (!adminId || !password) {
      return res.status(400).json({ success: false, message: '아이디와 비밀번호를 모두 입력해주세요.' });
    }

    try {
      // 1. 아이디로 관리자 조회
      const [rows] = await db.execute(
        'SELECT * FROM referral WHERE referral_code = ?',
        [adminId]
      );

      if (rows.length > 0) {
        const admin = rows[0];
        
        // 2. 비밀번호 존재 여부 확인 (DB에 비어있을 경우 방지)
        if (!admin.pw) {
          return res.status(401).json({ success: false, message: '비밀번호가 설정되지 않은 계정입니다. 관리자에게 문의하세요.' });
        }

        // 3. 비밀번호 비교 (bcrypt 해시와 평문 모두 지원)
        let isMatch = false;
        try {
          // bcrypt.compare에 전달하기 전에 문자열로 변환 (숫자 입력 등 예외 방지)
          isMatch = await bcrypt.compare(String(password), String(admin.pw));
        } catch (e) {
          console.error('Bcrypt compare error:', e);
        }

        // 평문으로 저장된 비밀번호일 경우를 대비한 하위 호환 로직
        if (!isMatch && String(password) === String(admin.pw)) {
          isMatch = true;
        }
        
        if (isMatch) {
          // 4. 성공 응답 (비밀번호 제외)
          const { pw, ...adminInfo } = admin;
          res.json({ 
            success: true, 
            message: '로그인 성공!',
            admin: adminInfo
          });
        } else {
          res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }
      } else {
        res.status(401).json({ success: false, message: '등록되지 않은 관리자 아이디입니다.' });
      }
    } catch (error) {
      console.error('관리자 로그인 오류 상세:', error);
      // 클라이언트에 구체적인 에러를 노출하여 서버에서 발생한 문제를 식별하기 쉽게 함
      res.status(500).json({ success: false, message: `서버 로그인 처리 중 오류: ${error.message}` });
    }
  },

  // 기초코드 목록 조회
  getBasicCodes: async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM basicCode ORDER BY base_code, sub_code');
      res.json(rows);
    } catch (error) {
      console.error('기초코드 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  // 기초코드 등록
  createBasicCode: async (req, res) => {
    const { base_code, sub_code, code_name, note, reg_id } = req.body;
    try {
      await db.execute(
        'INSERT INTO basicCode (base_code, sub_code, code_name, note, reg_id, upd_id) VALUES (?, ?, ?, ?, ?, ?)',
        [base_code, sub_code, code_name, note, reg_id, reg_id]
      );
      res.json({ message: '기초코드가 등록되었습니다.' });
    } catch (error) {
      console.error('기초코드 등록 오류:', error);
      res.status(500).json({ message: '등록 중 오류가 발생했습니다.' });
    }
  },

  // 기초코드 수정
  updateBasicCode: async (req, res) => {
    const { base_code, sub_code, code_name, note, upd_id } = req.body;
    try {
      await db.execute(
        'UPDATE basicCode SET code_name = ?, note = ?, upd_id = ?, upd_date = NOW() WHERE base_code = ? AND sub_code = ?',
        [code_name, note, upd_id, base_code, sub_code]
      );
      res.json({ message: '기초코드가 수정되었습니다.' });
    } catch (error) {
      console.error('기초코드 수정 오류:', error);
      res.status(500).json({ message: '수정 중 오류가 발생했습니다.' });
    }
  },

  // 기초코드 삭제
  deleteBasicCode: async (req, res) => {
    const { base_code, sub_code } = req.params;
    try {
      await db.execute('DELETE FROM basicCode WHERE base_code = ? AND sub_code = ?', [base_code, sub_code]);
      res.json({ message: '기초코드가 삭제되었습니다.' });
    } catch (error) {
      console.error('기초코드 삭제 오류:', error);
      res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
    }
  },

  // 입금계좌 목록 조회
  getBankInfos: async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM bankInfo ORDER BY bank_name');
      res.json(rows);
    } catch (error) {
      console.error('입금계좌 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  // 입금계좌 등록 (bank_code 자동 채번 적용)
  createBankInfo: async (req, res) => {
    const { bank_name, account_no, account_holder, referral_code, reg_id } = req.body;
    try {
      // 다음 bank_code 채번 (3자리 숫자로 포맷팅, 예: 001, 002...)
      const [maxCodeResult] = await db.execute('SELECT MAX(bank_code) as maxCode FROM bankInfo');
      let nextCode = '001';
      if (maxCodeResult[0].maxCode) {
        const currentMax = parseInt(maxCodeResult[0].maxCode, 10);
        nextCode = (currentMax + 1).toString().padStart(3, '0');
      }

      await db.execute(
        'INSERT INTO bankInfo (bank_code, bank_name, account_no, account_holder, referral_code, reg_id, upd_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nextCode, bank_name, account_no, account_holder, referral_code || '', reg_id, reg_id]
      );
      res.json({ message: '입금계좌가 등록되었습니다.' });
    } catch (error) {
      console.error('입금계좌 등록 오류:', error);
      res.status(500).json({ message: '등록 중 오류가 발생했습니다.' });
    }
  },

  // 입금계좌 수정
  updateBankInfo: async (req, res) => {
    const { bank_code, bank_name, account_no, account_holder, referral_code, upd_id } = req.body;
    try {
      await db.execute(
        'UPDATE bankInfo SET bank_name = ?, account_no = ?, account_holder = ?, referral_code = ?, upd_id = ?, upd_date = NOW() WHERE bank_code = ?',
        [bank_name, account_no, account_holder, referral_code || '', upd_id, bank_code]
      );
      res.json({ message: '입금계좌 정보가 수정되었습니다.' });
    } catch (error) {
      console.error('입금계좌 수정 오류:', error);
      res.status(500).json({ message: '수정 중 오류가 발생했습니다.' });
    }
  },

  // 입금계좌 삭제
  deleteBankInfo: async (req, res) => {
    const { bank_code } = req.params;
    try {
      await db.execute('DELETE FROM bankInfo WHERE bank_code = ?', [bank_code]);
      res.json({ message: '입금계좌가 삭제되었습니다.' });
    } catch (error) {
      console.error('입금계좌 삭제 오류:', error);
      res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
    }
  },

  // 추천인 목록 조회 (선택용)
  getReferralList: async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT referral_code, name FROM referral ORDER BY name');
      res.json(rows);
    } catch (error) {
      console.error('추천인 목록 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  // 마감일 목록 조회
  getEndDates: async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT dona_yy AS yy, endDate AS end_date, reg_date, reg_id, upd_date, upd_id FROM endDate ORDER BY dona_yy DESC');
      res.json(rows);
    } catch (error) {
      console.error('마감일 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  // 마감일 저장 (등록/수정 통합)
  saveEndDate: async (req, res) => {
    const { yy, end_date, reg_id } = req.body;
    try {
      // ON DUPLICATE KEY UPDATE를 사용하여 존재하면 업데이트, 없으면 삽입
      await db.execute(
        'INSERT INTO endDate (dona_yy, endDate, reg_id, upd_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE endDate = ?, upd_id = ?, upd_date = NOW()',
        [yy, end_date, reg_id, reg_id, end_date, reg_id]
      );
      res.json({ message: `${yy}년도 마감일이 설정되었습니다.` });
    } catch (error) {
      console.error('마감일 저장 오류:', error);
      res.status(500).json({ message: '저장 중 오류가 발생했습니다.' });
    }
  },

  // 마감일 삭제
  deleteEndDate: async (req, res) => {
    const { yy } = req.params;
    try {
      await db.execute('DELETE FROM endDate WHERE dona_yy = ?', [yy]);
      res.json({ message: `${yy}년도 마감 설정이 삭제되었습니다.` });
    } catch (error) {
      console.error('마감일 삭제 오류:', error);
      res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
    }
  },

  // 기부처 목록 조회
  getClients: async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM client_master ORDER BY client_name');
      res.json(rows);
    } catch (error) {
      console.error('기부처 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  // 기부처 등록 (client_no 자동 채번 보완)
  createClient: async (req, res) => {
    const { 
      client_name, biz_no, representative, zipcode, address, address_detail,
      industry, biz_type, home_page, manager_name, manager_hpno, 
      manager_email_add, manager_tel, note, reg_id 
    } = req.body;
    
    try {
      // 다음 client_no 채번 (C + 5자리 숫자) - 더 안전한 방식으로 변경
      const [rows] = await db.execute("SELECT client_no FROM client_master WHERE client_no LIKE 'C%' ORDER BY client_no DESC LIMIT 1");
      let nextNo = 'C00001';
      
      if (rows.length > 0) {
        const lastNo = rows[0].client_no;
        const lastNum = parseInt(lastNo.substring(1), 10);
        nextNo = 'C' + (lastNum + 1).toString().padStart(5, '0');
      }

      await db.execute(
        `INSERT INTO client_master (
          client_no, client_name, biz_no, representative, zipcode, address, address_detail,
          industry, biz_type, home_page, manager_name, manager_hpno, 
          manager_email_add, manager_tel, note, reg_id, upd_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nextNo, client_name || '', biz_no || '', representative || '', 
          zipcode || '', address || '', address_detail || '',
          industry || '', biz_type || '', home_page || '', 
          manager_name || '', manager_hpno || '', 
          manager_email_add || '', manager_tel || '', 
          note || '', reg_id || 'admin', reg_id || 'admin'
        ]
      );
      res.json({ message: '기부처가 등록되었습니다.' });
    } catch (error) {
      console.error('기부처 등록 상세 오류:', error);
      res.status(500).json({ message: '등록 중 데이터베이스 오류가 발생했습니다.' });
    }
  },

  // 기부처 수정
  updateClient: async (req, res) => {
    const { 
      client_no, client_name, biz_no, representative, zipcode, address, address_detail,
      industry, biz_type, home_page, manager_name, manager_hpno, 
      manager_email_add, manager_tel, note, upd_id 
    } = req.body;

    try {
      await db.execute(
        `UPDATE client_master SET 
          client_name = ?, biz_no = ?, representative = ?, zipcode = ?, address = ?, address_detail = ?,
          industry = ?, biz_type = ?, home_page = ?, manager_name = ?, manager_hpno = ?, 
          manager_email_add = ?, manager_tel = ?, note = ?, upd_id = ?, upd_date = NOW()
        WHERE client_no = ?`,
        [
          client_name, biz_no, representative, zipcode, address, address_detail,
          industry, biz_type, home_page, manager_name, manager_hpno, 
          manager_email_add, manager_tel, note, upd_id, client_no
        ]
      );
      res.json({ message: '기부처 정보가 수정되었습니다.' });
    } catch (error) {
      console.error('기부처 수정 오류:', error);
      res.status(500).json({ message: '수정 중 오류가 발생했습니다.' });
    }
  },

  // 기부처 삭제
  deleteClient: async (req, res) => {
    const { client_no } = req.params;
    try {
      await db.execute('DELETE FROM client_master WHERE client_no = ?', [client_no]);
      res.json({ message: '기부처가 삭제되었습니다.' });
    } catch (error) {
      console.error('기부처 삭제 오류:', error);
      res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
    }
  },

  // --- 상품마스터 관리 ---
  getProducts: async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM product_master ORDER BY product_name');
      res.json(rows);
    } catch (error) {
      console.error('상품 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  createProduct: async (req, res) => {
    const { 
      product_name, product_category, product_spec, unit, 
      cost_price, sale_price, manufacturer, brand, use_yn, reg_id 
    } = req.body;
    try {
      // 다음 product_code 채번 (P + 5자리 숫자)
      const [rows] = await db.execute("SELECT product_code FROM product_master WHERE product_code LIKE 'P%' ORDER BY product_code DESC LIMIT 1");
      let nextNo = 'P00001';
      
      if (rows.length > 0) {
        const lastNo = rows[0].product_code;
        const lastNum = parseInt(lastNo.substring(1), 10);
        nextNo = 'P' + (lastNum + 1).toString().padStart(5, '0');
      }

      await db.execute(
        `INSERT INTO product_master (
          product_code, product_name, product_category, product_spec, unit, 
          cost_price, sale_price, manufacturer, brand, use_yn, reg_id, upd_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nextNo, product_name, product_category || '', product_spec || '', 
          unit || '', cost_price || 0, sale_price || 0, manufacturer || '', 
          brand || '', use_yn || 'Y', reg_id, reg_id
        ]
      );
      res.json({ message: '상품이 등록되었습니다.', product_code: nextNo });
    } catch (error) {
      console.error('상품 등록 오류:', error);
      res.status(500).json({ message: '등록 중 오류가 발생했습니다.' });
    }
  },

  updateProduct: async (req, res) => {
    const { 
      product_code, product_name, product_category, product_spec, unit, 
      cost_price, sale_price, manufacturer, brand, use_yn, upd_id 
    } = req.body;
    try {
      await db.execute(
        `UPDATE product_master SET 
          product_name = ?, product_category = ?, product_spec = ?, unit = ?, 
          cost_price = ?, sale_price = ?, manufacturer = ?, brand = ?, use_yn = ?, 
          upd_id = ?, upd_date = NOW()
        WHERE product_code = ?`,
        [
          product_name, product_category || '', product_spec || '', unit || '', 
          cost_price || 0, sale_price || 0, manufacturer || '', brand || '', 
          use_yn || 'Y', upd_id, product_code
        ]
      );
      res.json({ message: '상품 정보가 수정되었습니다.' });
    } catch (error) {
      console.error('상품 수정 오류:', error);
      res.status(500).json({ message: '수정 중 오류가 발생했습니다.' });
    }
  },

  deleteProduct: async (req, res) => {
    const { product_code } = req.params;
    try {
      await db.execute('DELETE FROM product_master WHERE product_code = ?', [product_code]);
      res.json({ message: '상품이 삭제되었습니다.' });
    } catch (error) {
      console.error('상품 삭제 오류:', error);
      res.status(500).json({ message: '삭제 중 오류가 발생했습니다. (입고 내역 확인 필요)' });
    }
  },

  // --- 상품입고 관리 (재고 연동) ---
  getReceipts: async (req, res) => {
    try {
      const [rows] = await db.execute(`
        SELECT r.*, p.product_name, p.product_spec, p.unit, c.client_name 
        FROM product_receipt_master r
        LEFT JOIN product_master p ON r.product_code = p.product_code
        LEFT JOIN client_master c ON r.client_no = c.client_no
        ORDER BY r.receipt_date DESC, r.seq_no DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('입고 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  createReceipt: async (req, res) => {
    const { client_no, product_code, quantity, unit_price, receipt_date, reg_id } = req.body;
    const yymm = receipt_date.replace(/-/g, '').substring(0, 6);
    
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. 순번(seq_no) 채번
      const [seqResult] = await conn.execute(
        'SELECT IFNULL(MAX(seq_no), 0) + 1 as nextSeq FROM product_receipt_master WHERE receipt_yymm = ? AND client_no = ? AND product_code = ?',
        [yymm, client_no, product_code]
      );
      const nextSeq = seqResult[0].nextSeq;

      // 2. 입고 등록
      const total_amount = (quantity || 0) * (unit_price || 0);
      await conn.execute(
        `INSERT INTO product_receipt_master (
          receipt_yymm, client_no, product_code, seq_no, quantity, unit_price, total_amount, receipt_date, reg_id, upd_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [yymm, client_no, product_code, nextSeq, quantity, unit_price, total_amount, receipt_date, reg_id, reg_id]
      );

      // 3. 재고 업데이트 (INSERT ... ON DUPLICATE KEY UPDATE)
      await conn.execute(
        `INSERT INTO product_stock_master (client_no, product_code, current_stock, last_receipt_date)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         current_stock = current_stock + VALUES(current_stock),
         last_receipt_date = VALUES(last_receipt_date)`,
        [client_no, product_code, quantity, receipt_date]
      );

      await conn.commit();
      res.json({ message: '입고 처리가 완료되었습니다.' });
    } catch (error) {
      await conn.rollback();
      console.error('입고 처리 오류:', error);
      res.status(500).json({ message: '입고 중 오류가 발생했습니다.' });
    } finally {
      conn.release();
    }
  },

  deleteReceipt: async (req, res) => {
    const { receipt_yymm, client_no, product_code, seq_no } = req.params;
    
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. 기존 입고 수량 확인
      const [rows] = await conn.execute(
        'SELECT quantity FROM product_receipt_master WHERE receipt_yymm = ? AND client_no = ? AND product_code = ? AND seq_no = ?',
        [receipt_yymm, client_no, product_code, seq_no]
      );
      
      if (rows.length > 0) {
        const qty = rows[0].quantity;
        // 2. 재고 차감
        await conn.execute(
          'UPDATE product_stock_master SET current_stock = current_stock - ? WHERE client_no = ? AND product_code = ?',
          [qty, client_no, product_code]
        );
      }

      // 3. 입고 데이터 삭제
      await conn.execute(
        'DELETE FROM product_receipt_master WHERE receipt_yymm = ? AND client_no = ? AND product_code = ? AND seq_no = ?',
        [receipt_yymm, client_no, product_code, seq_no]
      );

      await conn.commit();
      res.json({ message: '입고 내역이 삭제되었습니다.' });
    } catch (error) {
      await conn.rollback();
      console.error('입고 삭제 오류:', error);
      res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
    } finally {
      conn.release();
    }
  },

  // --- 재고 현황 ---
  getStockStatus: async (req, res) => {
    try {
      const [rows] = await db.execute(`
        SELECT s.*, p.product_name, p.product_category, p.product_spec, p.unit, c.client_name 
        FROM product_stock_master s
        LEFT JOIN product_master p ON s.product_code = p.product_code
        LEFT JOIN client_master c ON s.client_no = c.client_no
        WHERE s.current_stock > 0
        ORDER BY c.client_name, p.product_name
      `);
      res.json(rows);
    } catch (error) {
      console.error('재고 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  // --- 회원 관리 (cust 테이블) ---
  getUsers: async (req, res) => {
    try {
      const { searchTerm, joinYear, referralCode } = req.query;
      let query = `
        SELECT 
          cust_no, id, name, email_add, hpno, referral_code, note, reg_date,
          YEAR(reg_date) as join_year
        FROM cust 
        WHERE 1=1
      `;
      const params = [];

      if (searchTerm) {
        query += ' AND (name LIKE ? OR hpno LIKE ? OR id LIKE ?)';
        const likeTerm = `%${searchTerm}%`;
        params.push(likeTerm, likeTerm, likeTerm);
      }

      if (joinYear && joinYear !== 'all' && joinYear !== '') {
        query += ' AND YEAR(reg_date) = ?';
        params.push(joinYear);
      }

      if (referralCode) {
        query += ' AND referral_code LIKE ?';
        params.push(`%${referralCode}%`);
      }

      query += ' ORDER BY reg_date DESC';
      
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('회원 조회 오류:', error);
      res.status(500).json({ message: '데이터 조회 중 오류가 발생했습니다.' });
    }
  },

  createUser: async (req, res) => {
    const { id, pw, name, email_add, hpno, referral_code, note, reg_id } = req.body;
    try {
      // 아이디 중복 체크
      const [existing] = await db.execute('SELECT id FROM cust WHERE id = ?', [id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
      }

      // 비번 암호화
      const hashedPassword = await bcrypt.hash(pw || '1234', 10);

      // cust_no 채번
      const [lastCust] = await db.query('SELECT cust_no FROM cust WHERE cust_no LIKE "C%" ORDER BY cust_no DESC LIMIT 1');
      let cust_no;
      if (lastCust.length > 0) {
        const lastNoStr = lastCust[0].cust_no;
        const lastNum = parseInt(lastNoStr.substring(1));
        cust_no = 'C' + (lastNum + 1).toString().padStart(9, '0');
      } else {
        cust_no = 'C000000001';
      }

      await db.execute(
        'INSERT INTO cust (cust_no, id, pw, name, email_add, hpno, referral_code, note, reg_id, upd_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [cust_no, id, hashedPassword, name, email_add || '', hpno || '', referral_code || '', note || '', reg_id || 'admin', reg_id || 'admin']
      );
      res.json({ message: '회원이 등록되었습니다.', cust_no });
    } catch (error) {
      console.error('회원 등록 오류:', error);
      res.status(500).json({ message: '등록 중 오류가 발생했습니다.' });
    }
  },

  updateUser: async (req, res) => {
    const { cust_no, name, email_add, hpno, referral_code, note, pw, upd_id } = req.body;
    try {
      let query = 'UPDATE cust SET name = ?, email_add = ?, hpno = ?, referral_code = ?, note = ?, upd_date = NOW(), upd_id = ?';
      const params = [name, email_add, hpno, referral_code, note, upd_id || 'admin'];

      if (pw) {
        const hashedPassword = await bcrypt.hash(pw, 10);
        query += ', pw = ?';
        params.push(hashedPassword);
      }

      query += ' WHERE cust_no = ?';
      params.push(cust_no);

      await db.execute(query, params);
      res.json({ message: '회원 정보가 수정되었습니다.' });
    } catch (error) {
      console.error('회원 수정 오류:', error);
      res.status(500).json({ message: '수정 중 오류가 발생했습니다.' });
    }
  },

  deleteUser: async (req, res) => {
    const { cust_no } = req.params;
    try {
      await db.execute('DELETE FROM cust WHERE cust_no = ?', [cust_no]);
      res.json({ message: '회원이 삭제되었습니다.' });
    } catch (error) {
      console.error('회원 삭제 오류:', error);
      res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
    }
  },

  // --- 기부 신청 관리 (donation_master, donation_detail) ---
  getDonations: async (req, res) => {
    try {
      const { dona_yy, searchTerm, referral_code, step_code, deposit_yn } = req.query;
      let query = `
        SELECT 
          d.cust_no, d.dona_yy,
          MAX(c.name) as cust_name, MAX(c.hpno) as hpno,
          CASE WHEN MIN(d.step_code) = '02' THEN 'Y' ELSE 'N' END as deposit_yn,
          SUM(d.dona_amt) as dona_amt,
          SUM(d.deposit_amt) as deposit_amt,
          SUM(d.goods_amt) as goods_amt,
          (SUM(d.dona_amt) - SUM(d.deposit_amt)) as unpaid_amt,
          MIN(d.step_code) as step_code,
          MAX(d.reg_date) as reg_date
        FROM donation_detail d
        JOIN cust c ON d.cust_no = c.cust_no
        LEFT JOIN donation_master m ON d.cust_no = m.cust_no AND d.dona_yy = m.dona_yy
        WHERE 1=1
      `;
      const params = [];

      if (dona_yy) {
        query += ' AND d.dona_yy = ?';
        params.push(dona_yy);
      }

      if (searchTerm) {
        query += ' AND (c.name LIKE ? OR c.hpno LIKE ? OR d.company_name LIKE ?)';
        const likeTerm = `%${searchTerm}%`;
        params.push(likeTerm, likeTerm, likeTerm);
      }

      if (referral_code) {
        query += ' AND c.referral_code = ?';
        params.push(referral_code);
      }

      if (step_code && step_code !== 'all') {
        query += ' AND d.step_code = ?';
        params.push(step_code);
      }

      if (deposit_yn) {
        if (deposit_yn === 'Y') {
          query += ' AND NOT EXISTS (SELECT 1 FROM donation_detail d2 WHERE d2.cust_no = d.cust_no AND d2.dona_yy = d.dona_yy AND d2.step_code != "02")';
        } else {
          query += ' AND EXISTS (SELECT 1 FROM donation_detail d2 WHERE d2.cust_no = d.cust_no AND d2.dona_yy = d.dona_yy AND d2.step_code = "04")';
        }
      }

      query += ' GROUP BY d.cust_no, d.dona_yy ORDER BY reg_date DESC';
      
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('기부 내역 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  getRecentDonationInfo: async (req, res) => {
    const { cust_no } = req.params;
    try {
      const [rows] = await db.execute(
        `SELECT m.jmin1, m.jmin2, m.zipcode, m.address, m.address_detail, m.hpno, m.name
         FROM donation_master m
         WHERE m.cust_no = ?
         ORDER BY m.dona_yy DESC
         LIMIT 1`,
        [cust_no]
      );
      
      if (rows.length === 0) {
        // 마스터 정보가 없으면 기본 고객 정보 반환
        const [user] = await db.execute('SELECT name, hpno, jmin1, jmin2, zipcode, address, address_detail FROM cust WHERE cust_no = ?', [cust_no]);
        return res.json(user[0] || null);
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('최근 기부 정보 조회 오류:', error);
      res.status(500).json({ message: '정보 조회 중 오류 발생' });
    }
  },

  createDonation: async (req, res) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const { 
        cust_no, dona_yy, dona_amt, company_name, receipt_yn, step_code,
        name, hpno, jmin1, jmin2, zipcode, address, address_detail,
        agree1, agree2, agree3, agree4, agree5, agree6, agree7, agree8, agree9, agree10, agree11, agree12, agree13,
        signature, reg_id
      } = req.body;

      // 1. 마스터 존재 여부 확인 및 생성/업데이트
      const [masterRows] = await connection.execute(
        'SELECT * FROM donation_master WHERE cust_no = ? AND dona_yy = ?',
        [cust_no, dona_yy]
      );

      if (masterRows.length === 0) {
        await connection.execute(
          `INSERT INTO donation_master (
            cust_no, dona_yy, name, hpno, jmin1, jmin2, zipcode, address, address_detail, 
            total_dona_amt, reg_id, upd_id, reg_date, upd_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NOW(), NOW())`,
          [cust_no, dona_yy, name, hpno, jmin1, jmin2, zipcode, address, address_detail, reg_id, reg_id]
        );
      } else {
        await connection.execute(
          `UPDATE donation_master SET 
            name = ?, hpno = ?, jmin1 = ?, jmin2 = ?, zipcode = ?, address = ?, address_detail = ?,
            upd_id = ?, upd_date = NOW()
          WHERE cust_no = ? AND dona_yy = ?`,
          [name, hpno, jmin1, jmin2, zipcode, address, address_detail, reg_id, cust_no, dona_yy]
        );
      }

      // 2. 상세 번호 채번
      const [seqResult] = await connection.execute(
        'SELECT IFNULL(MAX(seq_no), 0) + 1 as next_seq FROM donation_detail WHERE cust_no = ? AND dona_yy = ?',
        [cust_no, dona_yy]
      );
      const nextSeq = seqResult[0].next_seq;

      // 3. 상세 내역 등록
      await connection.execute(
        `INSERT INTO donation_detail (
          cust_no, dona_yy, seq_no, client_no, dona_amt, real_amt, company_name, 
          receipt_yn, step_code, reg_id, upd_id, reg_date, upd_date, issuance_yn, goods_yn,
          agree1, agree2, agree3, agree4, agree5, agree6, agree7, agree8, agree9, agree10, agree11, agree12, agree13,
          signature
        ) VALUES (?, ?, ?, 'C0001', ?, 0, ?, ?, ?, ?, ?, NOW(), NOW(), 'N', 'N',
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cust_no, dona_yy, nextSeq, dona_amt || 0, company_name || '', receipt_yn, step_code || '01', reg_id, reg_id,
          agree1 || 'N', agree2 || 'N', agree3 || 'N', agree4 || 'N', agree5 || 'N', agree6 || 'N', agree7 || 'N',
          agree8 || 'N', agree9 || 'N', agree10 || 'N', agree11 || 'N', agree12 || 'N', agree13 || 'N',
          signature || null
        ]
      );

      // 4. 마스터 합계 갱신
      await connection.execute(
        `UPDATE donation_master m
         SET total_dona_amt = (SELECT SUM(dona_amt) FROM donation_detail WHERE cust_no = m.cust_no AND dona_yy = m.dona_yy)
         WHERE cust_no = ? AND dona_yy = ?`,
        [cust_no, dona_yy]
      );

      await connection.commit();
      res.json({ success: true, message: '등록되었습니다.' });
    } catch (error) {
      await connection.rollback();
      console.error('기부 등록 오류:', error);
      res.status(500).json({ message: '등록 중 오류가 발생했습니다.' });
    } finally {
      connection.release();
    }
  },

  updateDonation: async (req, res) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const { 
        cust_no, dona_yy, seq_no, dona_amt, real_amt, step_code, company_name, receipt_yn,
        cust_name, name, hpno, jmin1, jmin2, zipcode, address, address_detail,
        agree1, agree2, agree3, agree4, agree5, agree6, agree7, agree8, agree9, agree10, agree11, agree12, agree13,
        signature, upd_id
      } = req.body;
      const finalName = cust_name || name || '관리자';

      // [추가] 수정 가능 상태 확인
      let targetSeqNos = [];
      if (seq_no) {
        const [currentStatus] = await connection.execute(
          'SELECT seq_no, step_code, dona_amt, real_amt FROM donation_detail WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?',
          [cust_no, dona_yy, seq_no]
        );
        if (currentStatus[0] && (currentStatus[0].step_code === '01' || currentStatus[0].step_code === '04')) {
          targetSeqNos.push(currentStatus[0]);
        }
      } else {
        // seq_no가 없으면 해당 기부자의 당해년도 모든 신청완료(01) 또는 입금대기(04) 내역 조회
        const [pendingList] = await connection.execute(
          'SELECT seq_no, step_code, dona_amt, real_amt FROM donation_detail WHERE cust_no = ? AND dona_yy = ? AND step_code IN ("01", "04")',
          [cust_no, dona_yy]
        );
        targetSeqNos = pendingList;
      }

      if (targetSeqNos.length === 0) {
        await connection.rollback();
        // 이미 완료된 건일 수 있으므로 성공으로 응답하거나 상세 메시지 전달
        return res.status(200).json({ success: true, message: '이미 처리되었거나 처리 가능한 내역이 없습니다.' });
      }

      // 1. 입금 완료 처리 로직 (step_code '02'인 경우)
      if (step_code === '02') {
        // (0) 현재 pre_deposit의 최대 seq_no 가져오기
        const [preSeqResult] = await connection.execute(
          'SELECT IFNULL(MAX(seq_no), 0) as max_seq FROM pre_deposit WHERE cust_no = ? AND dona_yy = ?',
          [cust_no, dona_yy]
        );
        let nextPreSeq = preSeqResult[0].max_seq + 1;

        for (const target of targetSeqNos) {
          // (1) 상세 테이블 상태 및 금액 업데이트
          await connection.execute(
            'UPDATE donation_detail SET step_code = "02", deposit_amt = dona_amt, real_amt = dona_amt, upd_date = NOW(), upd_id = ? WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?',
            [upd_id || 'admin', cust_no, dona_yy, target.seq_no]
          );

          // (2) pre_deposit 테이블 저장
          await connection.execute(
            `INSERT INTO pre_deposit (
              dona_yy, cust_no, seq_no, deposit_type, deposit_amt, deposit_date, 
              bank_name, account_no, account_holder, issuance_yn, reg_id, upd_id, reg_date, upd_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              dona_yy, cust_no, nextPreSeq++, '입금확인', target.dona_amt, 
              new Date().toISOString().slice(0, 10).replace(/-/g, ''), 
              '관리자처리', '-', finalName, 'N', upd_id || 'admin', upd_id || 'admin'
            ]
          );
        }

        // (3) 마스터 테이블 업데이트 시간만 갱신 (입금 확인 시에는 마스터 상세 정보를 수정하지 않음)
        await connection.execute(
          'UPDATE donation_master SET upd_date = NOW() WHERE cust_no = ? AND dona_yy = ?',
          [cust_no, dona_yy]
        );
      } else {
        // 일반 수정 (seq_no가 있을 때만 상세 정보 및 마스터 정보 전체 수정)
        if (!seq_no) {
          await connection.rollback();
          return res.status(400).json({ message: '상세 수정을 위해서는 seq_no가 필요합니다.' });
        }
        
        await connection.execute(
          `UPDATE donation_detail SET 
            dona_amt = ?, real_amt = ?, step_code = ?, company_name = ?, receipt_yn = ?, 
            agree1=?, agree2=?, agree3=?, agree4=?, agree5=?, agree6=?, agree7=?, agree8=?, agree9=?, agree10=?, agree11=?, agree12=?, agree13=?,
            signature=?, upd_id = ?, upd_date = NOW()
          WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?`,
          [
            dona_amt, real_amt, step_code, company_name, receipt_yn, 
            agree1, agree2, agree3, agree4, agree5, agree6, agree7, agree8, agree9, agree10, agree11, agree12, agree13,
            signature, upd_id, cust_no, dona_yy, seq_no
          ]
        );

        // 마스터 정보 수정 (일반 수정일 때만 실행)
        await connection.execute(
          `UPDATE donation_master SET 
            name = ?, hpno = ?, jmin1 = ?, jmin2 = ?, zipcode = ?, address = ?, address_detail = ?,
            upd_id = ?, upd_date = NOW()
          WHERE cust_no = ? AND dona_yy = ?`,
          [name || finalName, hpno, jmin1, jmin2, zipcode, address, address_detail, upd_id, cust_no, dona_yy]
        );
      }

      // 3. 합계 갱신
      await connection.execute(
        `UPDATE donation_master m
         SET total_dona_amt = (SELECT IFNULL(SUM(dona_amt), 0) FROM donation_detail WHERE cust_no = m.cust_no AND dona_yy = m.dona_yy),
             total_real_amt = (SELECT IFNULL(SUM(deposit_amt), 0) FROM donation_detail WHERE cust_no = m.cust_no AND dona_yy = m.dona_yy)
         WHERE cust_no = ? AND dona_yy = ?`,
        [cust_no, dona_yy]
      );

      await connection.commit();
      res.json({ success: true, message: '처리되었습니다.' });
    } catch (error) {
      await connection.rollback();
      console.error('기부 수정/입금처리 오류 상세:', error);
      res.status(500).json({ message: '처리 중 오류가 발생했습니다: ' + error.message });
    } finally {
      connection.release();
    }
  },

  deleteDonation: async (req, res) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const { cust_no, dona_yy, seq_no } = req.params;

      // 1. 기존 데이터 및 상태 확인 ('01' 신청완료 상태만 삭제 가능)
      const [old] = await connection.execute(
        'SELECT dona_amt, step_code FROM donation_detail WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?',
        [cust_no, dona_yy, seq_no]
      );

      if (!old[0]) {
        await connection.rollback();
        return res.status(404).json({ message: '내역을 찾을 수 없습니다.' });
      }

      if (old[0].step_code !== '01') {
        await connection.rollback();
        return res.status(403).json({ message: '신청완료(01) 상태인 내역만 삭제할 수 있습니다.' });
      }

      if (old.length > 0) {
        // 2. 마스터 차감
        await connection.execute(
          'UPDATE donation_master SET total_dona_amt = total_dona_amt - ? WHERE cust_no = ? AND dona_yy = ?',
          [old[0].dona_amt, cust_no, dona_yy]
        );
      }

      // 3. 상세 삭제
      await connection.execute(
        'DELETE FROM donation_detail WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?',
        [cust_no, dona_yy, seq_no]
      );

      await connection.commit();
      res.json({ message: '기부 내역이 삭제되었습니다.' });
    } catch (error) {
      await connection.rollback();
      console.error('기부 삭제 오류:', error);
      res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
    } finally {
      connection.release();
    }
  },
  // --- 기부금 생성 관리 ---
  // 기부금 생성 대상 목록 조회 (step_code '01' 대기중인 건)
  getDonationsForCreate: async (req, res) => {
    try {
      const { dona_yy, referral_code } = req.query;
      let query = `
        SELECT 
          d.*, c.name as cust_name, c.hpno as cust_hpno,
          r.name as referral_name,
          m.last_amt
        FROM donation_detail d
        JOIN cust c ON d.cust_no = c.cust_no
        JOIN donation_master m ON d.cust_no = m.cust_no AND d.dona_yy = m.dona_yy
        LEFT JOIN referral r ON c.referral_code = r.referral_code
        WHERE d.dona_yy = ? AND d.step_code = '01'
      `;
      const params = [dona_yy];
      if (referral_code) {
        query += ' AND c.referral_code = ?';
        params.push(referral_code);
      }
      query += ' ORDER BY c.name ASC';
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('기부금 생성용 목록 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  // 기부금 생성 처리 (재고 매칭 및 상태 변경)
  createDonationRelease: async (req, res) => {
    const { customers, reg_id } = req.body;
    const results = [];
    
    if (!customers || !Array.isArray(customers)) {
      return res.status(400).json({ message: '처리할 대상이 없습니다.' });
    }

    const adminId = reg_id || 'admin';

    for (const cust of customers) {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // 1. 기부 상세 정보 확인 및 잠금
        const [donationRows] = await conn.execute(
          `SELECT d.*, m.last_amt 
           FROM donation_detail d
           JOIN donation_master m ON d.cust_no = m.cust_no AND d.dona_yy = m.dona_yy
           WHERE d.cust_no = ? AND d.dona_yy = ? AND d.seq_no = ? 
           FOR UPDATE`,
          [cust.cust_no, cust.dona_yy, cust.seq_no]
        );
        
        const donation = donationRows[0];
        if (!donation || donation.step_code !== '01') {
          results.push({ cust_no: cust.cust_no, name: cust.cust_name, status: 'SKIP', reason: '이미 처리되었거나 신청 상태가 아닙니다.' });
          await conn.rollback();
          continue;
        }

        // 목표 금액 계산: 신청금액(dona_amt) - 전년이월(last_amt)
        let targetAmt = Math.max(0, Number(donation.dona_amt || 0) - Number(donation.last_amt || 0));

        // 만약 전년이월만으로 이미 신청금액을 채웠다면?
        if (targetAmt <= 0) {
          // 상태만 02로 변경 (전년이월로 충당됨)
          await conn.execute(
            `UPDATE donation_detail 
             SET step_code = '02', real_amt = dona_amt, upd_date = NOW(), upd_id = ? 
             WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?`,
            [adminId, cust.cust_no, cust.dona_yy, cust.seq_no]
          );
          
          // 8. 기부 마스터 총 실기부액 및 환급액 업데이트
          const [sumResult] = await conn.execute(
            `SELECT IFNULL(SUM(real_amt), 0) as total_sum 
             FROM donation_detail 
             WHERE cust_no = ? AND dona_yy = ? AND step_code = '02'`,
            [cust.cust_no, cust.dona_yy]
          );
          const totalRealAmt = sumResult[0].total_sum;

          let totalRefundAmt = 0;
          if (totalRealAmt <= 10000000) {
            totalRefundAmt = Math.floor((totalRealAmt * 0.15) / 10000) * 10000;
          } else {
            totalRefundAmt = Math.floor((1500000 + (totalRealAmt - 10000000) * 0.30) / 10000) * 10000;
          }

          await conn.execute(
            `UPDATE donation_master 
             SET total_real_amt = ?, 
                 total_refund_amt = ?,
                 upd_date = NOW(),
                 upd_id = ?
             WHERE cust_no = ? AND dona_yy = ?`,
            [totalRealAmt, totalRefundAmt, adminId, cust.cust_no, cust.dona_yy]
          );
          
          await conn.commit();
          results.push({ cust_no: cust.cust_no, name: cust.cust_name, status: 'SUCCESS', filledAmt: donation.dona_amt, usedProducts: [], message: '전년이월금으로 자동 처리되었습니다.' });
          continue;
        }

        // 2. 출고 일련번호(seq_no) 확인
        const [seqRow] = await conn.execute(
          `SELECT IFNULL(MAX(seq_no), 0) AS max_seq 
           FROM product_release_master 
           WHERE cust_no = ? AND dona_yy = ?`,
          [cust.cust_no, cust.dona_yy]
        );
        let nextReleaseSeq = Number(seqRow[0].max_seq) + 1;

        // 3. 재고 목록 조회 및 잠금 (판매가 낮은 순으로 우선 매칭)
        const [stockRows] = await conn.execute(`
          SELECT ps.client_no, ps.product_code, ps.current_stock, 
                 pm.product_name, pm.sale_price as unit_price
          FROM product_stock_master ps
          JOIN product_master pm ON ps.product_code = pm.product_code
          WHERE ps.current_stock > 0
          ORDER BY pm.sale_price ASC
          FOR UPDATE
        `);

        if (stockRows.length === 0) {
          results.push({ cust_no: cust.cust_no, name: cust.cust_name, status: 'SKIP', reason: '가용 재고가 없습니다.' });
          await conn.rollback();
          continue;
        }

        let usedProducts = [];
        let matchingAmt = 0;

        for (const stock of stockRows) {
          if (targetAmt <= 0) break;

          const price = Number(stock.unit_price);
          if (!price || price <= 0) continue;

          const available = Math.floor(Number(stock.current_stock));
          if (available <= 0) continue;

          // 이 상품으로 채울 수 있는 최대 수량
          const possibleQty = Math.floor(targetAmt / price);
          const qty = Math.min(available, possibleQty);
          if (qty <= 0) continue;

          // 4. 재고 차감
          const [upd] = await conn.execute(
            `UPDATE product_stock_master
             SET current_stock = current_stock - ?, last_release_date = CURDATE()
             WHERE client_no = ? AND product_code = ? AND current_stock >= ?`,
            [qty, stock.client_no, stock.product_code, qty]
          );

          if (upd.affectedRows === 0) continue;

          const totalAmount = price * qty;

          // 5. 출고 마스터 기록 생성
          await conn.execute(
            `INSERT INTO product_release_master (
               client_no, product_code, cust_no, seq_no, quantity,
               unit_price, total_amount, release_date, dona_yy, reg_id, upd_id
             ) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)`,
            [
              stock.client_no, stock.product_code, cust.cust_no, nextReleaseSeq++, 
              qty, price, totalAmount, cust.dona_yy, adminId, adminId
            ]
          );

          usedProducts.push({
            name: stock.product_name,
            quantity: qty,
            amount: totalAmount
          });

          targetAmt -= totalAmount;
          matchingAmt += totalAmount;
        }

        // 6. 실제 기부 인정 금액 결정 (전년이월 + 매칭금액)
        const finalRealAmt = Number(donation.last_amt || 0) + matchingAmt;

        // 7. 기부 상세 상태(step_code)를 '02'(승인완료)로 업데이트
        await conn.execute(
          `UPDATE donation_detail 
           SET step_code = '02', real_amt = ?, upd_date = NOW(), upd_id = ? 
           WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?`,
          [finalRealAmt, adminId, cust.cust_no, cust.dona_yy, cust.seq_no]
        );

        // 8. 기부 마스터 총 실기부액 및 환급액 업데이트
        const [sumResult] = await conn.execute(
          `SELECT IFNULL(SUM(real_amt), 0) as total_sum 
           FROM donation_detail 
           WHERE cust_no = ? AND dona_yy = ? AND step_code = '02'`,
          [cust.cust_no, cust.dona_yy]
        );
        const totalRealAmt = sumResult[0].total_sum;

        // 환급액 계산: 1천만원 미만 15%, 1천만원 이상은 차액의 30% (만원 미만 버림)
        let totalRefundAmt = 0;
        if (totalRealAmt <= 10000000) {
          totalRefundAmt = Math.floor((totalRealAmt * 0.15) / 10000) * 10000;
        } else {
          totalRefundAmt = Math.floor((1500000 + (totalRealAmt - 10000000) * 0.30) / 10000) * 10000;
        }

        await conn.execute(
          `UPDATE donation_master 
           SET total_real_amt = ?, 
               total_refund_amt = ?,
               upd_date = NOW(),
               upd_id = ?
           WHERE cust_no = ? AND dona_yy = ?`,
          [totalRealAmt, totalRefundAmt, adminId, cust.cust_no, cust.dona_yy]
        );

        await conn.commit();
        results.push({ 
          cust_no: cust.cust_no, 
          name: cust.cust_name, 
          status: 'SUCCESS', 
          filledAmt: finalRealAmt, 
          matchingAmt: matchingAmt,
          usedProducts 
        });
      } catch (error) {
        if (conn) await conn.rollback();
        console.error(`기부 생성 처리 중 오류 (cust_no: ${cust.cust_no}):`, error);
        results.push({ cust_no: cust.cust_no, name: cust.cust_name, status: 'ERROR', reason: error.message });
      } finally {
        if (conn) conn.release();
      }
    }
    res.json({ success: true, results });
  },

  // --- 정산 관리 ---
  // 1. 추천인별 정산 요약 리스트
  getSettlementSummary: async (req, res) => {
    try {
      const { dona_yy, referral_name, referral_code } = req.query;
      console.log('getSettlementSummary 호출됨:', { dona_yy, referral_name, referral_code });
      
      // 공통 필터 구성
      let whereDonation = ' WHERE 1=1';
      const paramsDonation = [];
      if (dona_yy) {
        whereDonation += ' AND d.dona_yy = ?';
        paramsDonation.push(dona_yy);
      }
      if (referral_code) {
        whereDonation += ' AND r.referral_code = ?';
        paramsDonation.push(referral_code);
      }
      if (referral_name) {
        whereDonation += ' AND r.name LIKE ?';
        paramsDonation.push(`%${referral_name}%`);
      }

      // 서브쿼리 1) 추천인별 도네이션 합계 (계산 로직 반영)
      const donationAggSql = `
        SELECT
          r.referral_code,
          r.name AS referral_name,
          IFNULL(SUM(d.dona_amt), 0)    AS total_dona_amt,
          IFNULL(SUM(d.real_amt), 0)    AS total_real_amt,
          -- 환급금액 합계
          IFNULL(SUM(
            CASE
              WHEN IFNULL(d.real_amt, 0) <= 10000000 THEN ROUND(IFNULL(d.real_amt, 0) * 0.15, 0)
              ELSE ROUND(1500000 + (IFNULL(d.real_amt, 0) - 10000000) * 0.30, 0)
            END
          ), 0) AS total_refund_amt,
          -- 물품대금 합계 (환급금액의 53%, 만원 미만 버림)
          IFNULL(SUM(
            TRUNCATE((
              CASE
                WHEN IFNULL(d.real_amt, 0) <= 10000000 THEN ROUND(IFNULL(d.real_amt, 0) * 0.15, 0)
                ELSE ROUND(1500000 + (IFNULL(d.real_amt, 0) - 10000000) * 0.30, 0)
              END
            ) * 0.53, -4)
          ), 0) AS total_goods_amt,
          -- 기입금액 합계
          IFNULL(SUM(d.deposit_amt), 0) AS total_deposit_amt,
          -- 미입금액 합계 (물품대금 - 기입금액)
          IFNULL(SUM(
            TRUNCATE((
              CASE
                WHEN IFNULL(d.real_amt, 0) <= 10000000 THEN ROUND(IFNULL(d.real_amt, 0) * 0.15, 0)
                ELSE ROUND(1500000 + (IFNULL(d.real_amt, 0) - 10000000) * 0.30, 0)
              END
            ) * 0.53, -4) - IFNULL(d.deposit_amt, 0)
          ), 0) AS total_unpaid_amt,
          -- 회사결재대금 합계 (물품대금의 80%, 만원 미만 버림)
          IFNULL(SUM(
            TRUNCATE(
              TRUNCATE((
                CASE
                  WHEN IFNULL(d.real_amt, 0) <= 10000000 THEN ROUND(IFNULL(d.real_amt, 0) * 0.15, 0)
                  ELSE ROUND(1500000 + (IFNULL(d.real_amt, 0) - 10000000) * 0.30, 0)
                END
              ) * 0.53, -4) * 0.8, -4)
          ), 0) AS payment_amt,
          -- 추천인수당 합계 (물품대금 - 회사결재대금)
          IFNULL(SUM(
            TRUNCATE((
              CASE
                WHEN IFNULL(d.real_amt, 0) <= 10000000 THEN ROUND(IFNULL(d.real_amt, 0) * 0.15, 0)
                ELSE ROUND(1500000 + (IFNULL(d.real_amt, 0) - 10000000) * 0.30, 0)
              END
            ) * 0.53, -4) - 
            TRUNCATE(
              TRUNCATE((
                CASE
                  WHEN IFNULL(d.real_amt, 0) <= 10000000 THEN ROUND(IFNULL(d.real_amt, 0) * 0.15, 0)
                  ELSE ROUND(1500000 + (IFNULL(d.real_amt, 0) - 10000000) * 0.30, 0)
                END
              ) * 0.53, -4) * 0.8, -4)
          ), 0) AS total_comm_amt
        FROM donation_detail d
        JOIN cust c     ON d.cust_no = c.cust_no
        JOIN referral r ON c.referral_code = r.referral_code
        ${whereDonation}
        GROUP BY r.referral_code, r.name
      `;

      // 서브쿼리 2) 추천인별 선입금 합계
      const preDepositAggSql = `
        SELECT
          c.referral_code,
          IFNULL(SUM(pd.deposit_amt), 0) AS total_pre_deposit
        FROM pre_deposit pd
        JOIN cust c     ON c.cust_no = pd.cust_no
        JOIN referral r ON c.referral_code = r.referral_code
        ${whereDonation.replace(/d\./g, 'pd.')}
        GROUP BY c.referral_code
      `;

      // 최종 조립
      const finalSql = `
        SELECT
          da.*,
          COALESCE(pa.total_pre_deposit, 0) AS total_pre_deposit
        FROM (${donationAggSql}) da
        LEFT JOIN (${preDepositAggSql}) pa
          ON pa.referral_code = da.referral_code
        ORDER BY da.referral_name
      `;

      const values = [...paramsDonation, ...paramsDonation];
      const [rows] = await db.execute(finalSql, values);
      res.json(rows);
    } catch (error) {
      console.error('정산 요약 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  // 2. 추천인별 상세 정산 내역 (고객별)
  getSettlementDetail: async (req, res) => {
    try {
      const { dona_yy, referral_code } = req.query;
      if (!referral_code) {
        return res.status(400).json({ message: '추천인 코드가 필요합니다.' });
      }

      const query = `
        SELECT
          d.cust_no,
          c.name as cust_name,
          c.hpno as cust_hpno,
          bc.code_name AS step_name,
          r.name AS referral_name,
          IFNULL(d.dona_amt, 0) AS dona_amt,
          IFNULL(d.real_amt, 0) AS real_amt,
          -- 환급금액 계산
          CASE
            WHEN IFNULL(d.real_amt, 0) <= 10000000 THEN ROUND(IFNULL(d.real_amt, 0) * 0.15, 0)
            ELSE ROUND(1500000 + (IFNULL(d.real_amt, 0) - 10000000) * 0.30, 0)
          END AS refund_amt,
          -- 물품대금 계산 (만원 미만 버림)
          TRUNCATE((
            CASE
              WHEN IFNULL(d.real_amt, 0) <= 10000000 THEN ROUND(IFNULL(d.real_amt, 0) * 0.15, 0)
              ELSE ROUND(1500000 + (IFNULL(d.real_amt, 0) - 10000000) * 0.30, 0)
            END
          ) * 0.53, -4) AS goods_amt,
          COALESCE(p.pre_deposit_sum, 0) AS pre_deposit_sum,
          IFNULL(d.deposit_amt, 0) AS deposit_amt,
          -- 미입금액 계산 (물품대금 - 기입금액)
          TRUNCATE((
            CASE
              WHEN IFNULL(d.real_amt, 0) <= 10000000 THEN ROUND(IFNULL(d.real_amt, 0) * 0.15, 0)
              ELSE ROUND(1500000 + (IFNULL(d.real_amt, 0) - 10000000) * 0.30, 0)
            END
          ) * 0.53, -4) - IFNULL(d.deposit_amt, 0) AS unpaid_amt,
          -- 회사결재대금 계산 (물품대금의 80%, 만원 미만 버림)
          TRUNCATE(
            TRUNCATE((
              CASE
                WHEN IFNULL(d.real_amt, 0) <= 10000000 THEN ROUND(IFNULL(d.real_amt, 0) * 0.15, 0)
                ELSE ROUND(1500000 + (IFNULL(d.real_amt, 0) - 10000000) * 0.30, 0)
              END
            ) * 0.53, -4) * 0.8, -4) AS company_amt,
          bi.bank_name,
          bi.account_no,
          bi.account_holder,
          d.step_code
        FROM donation_detail d
        JOIN cust c     ON d.cust_no = c.cust_no
        JOIN referral r ON c.referral_code = r.referral_code
        LEFT JOIN basiccode bc
          ON bc.base_code = 'step_code' AND bc.sub_code = d.step_code
        LEFT JOIN bankinfo bi
          ON bi.bank_code = d.bank_code
        LEFT JOIN (
          SELECT dona_yy, cust_no, SUM(deposit_amt) AS pre_deposit_sum
          FROM pre_deposit
          GROUP BY dona_yy, cust_no
        ) p ON p.dona_yy = d.dona_yy AND p.cust_no = d.cust_no
        WHERE d.dona_yy = ? AND r.referral_code = ?
        ORDER BY c.name
      `;

      const [rows] = await db.execute(query, [dona_yy, referral_code]);
      res.json(rows);
    } catch (error) {
      console.error('정산 상세 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  // 기부 문서 생성용 리스트 조회
  getDonationForDoc: async (req, res) => {
    try {
      const { dona_yy } = req.query; // GET 요청으로 변경

      const query = `
        SELECT 
          d.*, 
          dm.name, 
          dm.jmin1, dm.jmin2, dm.zipcode, dm.address, dm.address_detail, dm.hpno,
          c.id, 
          r.name AS referral_name, 
          bc.code_name AS step_name,
          IFNULL(SUM(prm.total_amount), 0) AS real_amt,
          IFNULL(SUM(prm.quantity), 0) AS release_qty
        FROM donation_detail d
        JOIN donation_master dm ON d.cust_no = dm.cust_no AND d.dona_yy = dm.dona_yy
        JOIN cust c ON d.cust_no = c.cust_no
        LEFT JOIN referral r ON c.referral_code = r.referral_code
        LEFT JOIN basiccode bc ON d.step_code = bc.sub_code AND bc.base_code = 'step_code'
        LEFT JOIN product_release_master prm 
          ON prm.cust_no = d.cust_no AND prm.dona_yy = d.dona_yy
        WHERE d.dona_yy = ? AND d.step_code = '02'
        GROUP BY d.cust_no, d.dona_yy, d.seq_no
      `;

      const [rows] = await db.execute(query, [dona_yy]);
      res.json(rows);
    } catch (err) {
      console.error('[getDonationForDoc 오류]', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 기부 문서 생성 실행
  generateDonationDocuments: async (req, res) => {
    try {
      const { customers } = req.body;
      if (!customers || customers.length === 0) {
        return res.status(400).json({ success: false, message: '선택된 데이터가 없습니다.' });
      }

      // 서버 환경에 맞춰 경로 조정 (사용자 요청 기반 + 로컬 테스트용 폴백)
      const baseDir = path.join(__dirname, '../../excels'); // 프로젝트 루트의 excels 폴더
      const signDir = path.join(__dirname, '../../signatures'); 
      const templateDir = path.join(__dirname, '../../templates');
      
      const runStamp = dayjs().format('YYYYMMDD_HHmm');
      const yearMonth = dayjs().format('YYYYMM');
      const folderPath = path.join(baseDir, yearMonth);

      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

      const summaryWorkbook = new ExcelJS.Workbook();
      const summarySheet = summaryWorkbook.addWorksheet('기부자리스트');

      const headers = ['연번', '이름', '주민번호', '연락처', '주소', '기부금액', '기부수량', '기부일자', '기부처', '비고'];
      headers.forEach((text, index) => {
        const cell = summarySheet.getCell(2, index + 2);
        cell.value = text;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A8D08F' } };
        cell.font = { bold: true };
      });

      let totalAmt = 0;
      let totalQty = 0;

      for (let i = 0; i < customers.length; i++) {
        const { cust_no, dona_yy, seq_no } = customers[i];

        // 기부 상세 및 마스터 정보 조회
        const [[donation]] = await db.execute(`
          SELECT d.*, dm.name, dm.jmin1, dm.jmin2, dm.zipcode, dm.address, dm.address_detail, dm.hpno
          FROM donation_detail d
          JOIN donation_master dm ON d.cust_no = dm.cust_no AND d.dona_yy = dm.dona_yy
          WHERE d.cust_no = ? AND d.dona_yy = ? AND d.seq_no = ?
        `, [cust_no, dona_yy, seq_no]);

        if (!donation) continue;

        // 출고 상품 내역 조회
        const [products] = await db.execute(`
          SELECT prm.*, pm.product_name, pm.sale_price, pm.product_spec
          FROM product_release_master prm
          JOIN product_master pm ON prm.product_code = pm.product_code
          WHERE prm.cust_no = ? AND prm.dona_yy = ?
          ORDER BY prm.seq_no ASC
        `, [cust_no, dona_yy]);

        const clientNo = donation.client_no;
        const [[client]] = await db.execute(`SELECT client_name FROM client_master WHERE client_no = ?`, [clientNo]);

        const totalAmount = products.reduce((sum, p) => sum + p.total_amount, 0);
        const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

        // 템플릿 파일 결정
        let templateFile = path.join(templateDir, 'sample1.xlsx');
        if (clientNo === '0000000002') {
          templateFile = path.join(templateDir, 'sample2.xlsx');
        } else if (clientNo === '0000000003') {
          templateFile = path.join(templateDir, 'sample3.xlsx');
        }

        if (!fs.existsSync(templateFile)) {
          console.warn(`Template not found: ${templateFile}, using default or skipping.`);
          // 실제 서비스에서는 템플릿이 반드시 있어야 함
        }

        const fileName = `${donation.name}_${dona_yy}_${seq_no}.xlsx`;
        const filePath = path.join(folderPath, fileName);
        const workbook = new ExcelJS.Workbook();
        
        try {
          await workbook.xlsx.readFile(templateFile);
        } catch (e) {
          // 템플릿이 없는 경우 빈 워크북 생성 (테스트용)
          workbook.addWorksheet('Sheet1');
        }

        if (clientNo === '0000000002') {
          const sheet1 = workbook.getWorksheet('1.후원 신청서') || workbook.getWorksheet(1);
          const sheet2 = workbook.getWorksheet('2.동의서') || workbook.getWorksheet(2);
          const sheet3 = workbook.getWorksheet('3.단가산정명세서') || workbook.getWorksheet(3);

          if (sheet1) {
            sheet1.getCell('B5').value = donation.name;
            sheet1.getCell('E5').value = `${donation.jmin1}-${donation.jmin2}`;
            sheet1.getCell('B8').value = `자택)(${donation.zipcode}) ${donation.address} ${donation.address_detail}`;
            sheet1.getCell('B10').value = `휴대전화)${donation.hpno}`;
            sheet1.getCell('A20').value = dayjs().format('YYYY년 MM월 DD일');
            sheet1.getCell('A22').value = `신청인 ${donation.name}   (인)`;
            sheet1.getCell('A22').alignment = { horizontal: 'right' };
          }

          if (sheet2) {
            sheet2.getCell('A23').value = dayjs().format('YYYY년 MM월 DD일');
            sheet2.getCell('A24').value = `기부자 ${donation.name}         (인)`;
            sheet2.getCell('A24').alignment = { horizontal: 'center' };
          }

          if (sheet3) {
            let prodRow = 3;
            products.forEach((p) => {
              sheet3.getCell(`A${prodRow}`).value = p.product_name;
              sheet3.getCell(`B${prodRow}`).value = 1;
              sheet3.getCell(`C${prodRow}`).value = p.unit_price;
              sheet3.getCell(`D${prodRow}`).value = p.quantity;
              sheet3.getCell(`E${prodRow}`).value = p.total_amount;
              prodRow++;
            });
            sheet3.getCell('E14').value = totalAmount;
            sheet3.getCell('A20').value = dayjs().format('YYYY. MM. DD');
            sheet3.getCell('A22').value = `후원자(단체) : ${donation.name}         (인)`;
            sheet3.getCell('A22').alignment = { horizontal: 'right' };
          }

          // 서명 이미지 삽입 로직 (파일이 존재하는 경우에만)
          // DB에 저장된 signature (Base64)를 파일로 임시 저장하거나 직접 삽입 가능
          if (donation.signature) {
            try {
              const base64Data = donation.signature.replace(/^data:image\/\w+;base64,/, "");
              const buffer = Buffer.from(base64Data, 'base64');
              const imageId = workbook.addImage({ buffer, extension: 'png' });
              if (sheet1) sheet1.addImage(imageId, { tl: { col: 5.5, row: 21.2 }, ext: { width: 160, height: 50 } });
              if (sheet2) sheet2.addImage(imageId, { tl: { col: 2.5, row: 23.2 }, ext: { width: 160, height: 50 } });
              if (sheet3) sheet3.addImage(imageId, { tl: { col: 5.5, row: 21.2 }, ext: { width: 160, height: 50 } });
            } catch (err) {
              console.error('Signature processing error:', err);
            }
          }

        } else if (clientNo === '0000000003') {
          const sheet = workbook.getWorksheet('지정기탁신청서') || workbook.getWorksheet(1);
          const sheet2 = workbook.getWorksheet('장부가액확인서S') || workbook.getWorksheet(2);

          const fullJumin = `${donation.jmin1}-${donation.jmin2}`;
          const fullAddress = `${donation.address} ${donation.address_detail}`;

          if (sheet) {
            sheet.getCell('B2').value = donation.name;
            sheet.getCell('G2').value = fullJumin;
            sheet.getCell('B4').value = fullAddress;
            sheet.getCell('G4').value = donation.name;
            sheet.getCell('C5').value = donation.name;
            sheet.getCell('C6').value = donation.hpno;
            sheet.getCell('G6').value = donation.email; // donation_detail이나 master에 email이 있는지 확인 필요
            sheet.getCell('B7').value = `금 ${numberToKorean(totalAmount)}원 (${totalAmount.toLocaleString()})`;

            for (let j = 0; j < 4; j++) {
              const p = products[j];
              if (!p) continue;
              const sumamount = p.unit_price * p.quantity;
              sheet.getCell(`B${9 + j}`).value = p.product_name;
              sheet.getCell(`C${9 + j}`).value = p.product_spec;
              sheet.getCell(`D${9 + j}`).value = p.quantity;
              sheet.getCell(`E${9 + j}`).value = p.unit_price;
              sheet.getCell(`F${9 + j}`).value = sumamount;
            }

            sheet.getCell('B14').value = dayjs().format('YYYY년 MM월 DD일');
            sheet.getCell('A25').value = dayjs().format('YYYY년 MM월 DD일');
            sheet.getCell('C26').value = donation.name;
          }

          if (donation.signature && sheet) {
            try {
              const base64Data = donation.signature.replace(/^data:image\/\w+;base64,/, "");
              const buffer = Buffer.from(base64Data, 'base64');
              const imageId = workbook.addImage({ buffer, extension: 'png' });
              sheet.addImage(imageId, { tl: { col: 6.5, row: 25.2 }, ext: { width: 120, height: 50 } });
            } catch (err) {
              console.error('Signature processing error:', err);
            }
          }

          if (sheet2) {
            for (let j = 0; j < 10; j++) {
              const p = products[j];
              if (!p) continue;
              const rowNum = 4 + j;
              const sumBook = p.unit_price * p.quantity;
              const sumSale = p.sale_price * p.quantity;

              sheet2.getCell(`B${rowNum}`).value = p.product_name;
              sheet2.getCell(`C${rowNum}`).value = p.quantity;
              sheet2.getCell(`D${rowNum}`).value = p.unit_price;
              sheet2.getCell(`E${rowNum}`).value = sumBook;
              sheet2.getCell(`F${rowNum}`).value = p.sale_price;
              sheet2.getCell(`G${rowNum}`).value = sumSale;
            }
            sheet2.getCell('A21').value = dayjs().format('YYYY년 MM월 DD일');
            sheet2.getCell('D22').value = donation.name;
            sheet2.getCell('E23').value = fullJumin;
          }

        } else {
          // 기본 템플릿 (기타 기부처)
          const sheet1 = workbook.getWorksheet('1. 물품기부 신청서') || workbook.getWorksheet(1);
          const sheet2 = workbook.getWorksheet('2. 장부가액 확인서') || workbook.getWorksheet(2);
          const krwText = `금 ${numberToKorean(totalAmount)}원 (${totalAmount.toLocaleString()})`;

          if (sheet1) {
            sheet1.getCell('B2').value = donation.name;
            sheet1.getCell('G2').value = `${donation.jmin1}-${donation.jmin2}`;
            sheet1.getCell('B3').value = `${donation.address} ${donation.address_detail}`;
            sheet1.getCell('G4').value = donation.hpno;
            sheet1.getCell('B6').value = krwText;
            sheet1.getCell('B6').font = { bold: true, size: 12 };

            let startRow = 8;
            products.forEach((p, idx) => {
              if (startRow + idx > 14) return; // 시트 범위 제한
              sheet1.getCell(`B${startRow + idx}`).value = p.product_name;
              sheet1.getCell(`C${startRow + idx}`).value = p.quantity;
              sheet1.getCell(`E${startRow + idx}`).value = p.unit_price;
              sheet1.getCell(`G${startRow + idx}`).value = p.total_amount;
              sheet1.getCell(`J${startRow + idx}`).value = p.sale_price;
            });

            sheet1.getCell('C15').value = totalQuantity;
            sheet1.getCell('G15').value = totalAmount;
            sheet1.getCell('A39').value = dayjs().format('YYYY.MM.DD');
            sheet1.getCell('D41').value = `기업명 : ${donation.name}`;
          }

          if (sheet2) {
            sheet2.getCell('B2').value = krwText;
            sheet2.getCell('B2').font = { bold: true, size: 12 };

            products.forEach((p, idx) => {
              if (4 + idx > 15) return;
              sheet2.getCell(`B${4 + idx}`).value = p.product_name;
              sheet2.getCell(`C${4 + idx}`).value = p.quantity;
              sheet2.getCell(`D${4 + idx}`).value = p.unit_price;
              sheet2.getCell(`E${4 + idx}`).value = p.total_amount;
              sheet2.getCell(`H${4 + idx}`).value = p.sale_price;
            });

            sheet2.getCell('C16').value = totalQuantity;
            sheet2.getCell('E16').value = totalAmount;
            sheet2.getCell('A18').value = dayjs().format('YYYY.MM.DD');
            sheet2.getCell('D20').value = donation.name;
          }

          if (donation.signature) {
            try {
              const base64Data = donation.signature.replace(/^data:image\/\w+;base64,/, "");
              const buffer = Buffer.from(base64Data, 'base64');
              const imageId = workbook.addImage({ buffer, extension: 'png' });
              if (sheet1) sheet1.addImage(imageId, { tl: { col: 6.5, row: 40.2 }, ext: { width: 160, height: 50 } });
              if (sheet2) sheet2.addImage(imageId, { tl: { col: 4.5, row: 19.2 }, ext: { width: 160, height: 50 } });
            } catch (err) {
              console.error('Signature processing error:', err);
            }
          }
        }

        await workbook.xlsx.writeFile(filePath);

        // 요약 시트에 기록
        const row = summarySheet.getRow(i + 3);
        row.getCell(2).value = i + 1;
        row.getCell(3).value = donation.name;
        row.getCell(4).value = `${donation.jmin1}-${donation.jmin2}`;
        row.getCell(5).value = donation.hpno;
        row.getCell(6).value = `${donation.address} ${donation.address_detail}`;
        row.getCell(7).value = totalAmount;
        row.getCell(8).value = totalQuantity;
        row.getCell(9).value = dayjs(donation.reg_date).format('YYYY-MM-DD');
        row.getCell(10).value = client?.client_name || '';
        row.getCell(11).value = '';

        totalAmt += totalAmount;
        totalQty += totalQuantity;

        // 상태 업데이트: 02 (서류대기) -> 03 (서류완료)
        await db.execute(`
          UPDATE donation_detail 
          SET step_code = '03', upd_date = NOW()
          WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?
        `, [cust_no, dona_yy, seq_no]);
      }

      // 합계 행 추가
      const totalRow = summarySheet.getRow(customers.length + 4);
      totalRow.getCell(2).value = '합계';
      totalRow.getCell(7).value = totalAmt;
      totalRow.getCell(8).value = totalQty;
      totalRow.font = { bold: true };

      const summaryFileName = `${customers[0].dona_yy}년_기부자리스트_${runStamp}.xlsx`;
      const summaryFile = path.join(folderPath, summaryFileName);
      await summaryWorkbook.xlsx.writeFile(summaryFile);

      // 클라이언트에 결과 반환 (다운로드 경로는 정적 파일 서빙 설정 필요)
      res.json({ 
        success: true, 
        message: '기부 문서가 성공적으로 생성되었습니다.',
        folder: folderPath, 
        summary: summaryFileName,
        count: customers.length
      });
    } catch (err) {
      console.error('[문서 생성 오류]', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 기부 완료 처리용 리스트 조회
  getDonationListForComplete: async (req, res) => {
    try {
      const { dona_yy, name, referral_code } = req.query;
      const params = [dona_yy];
      let where = "WHERE d.dona_yy = ? AND d.step_code = '03'";

      if (name) {
        where += " AND dm.name LIKE ?";
        params.push(`%${name}%`);
      }
      if (referral_code) {
        where += " AND c.referral_code = ?";
        params.push(referral_code);
      }

      const query = `
        SELECT 
          d.cust_no, d.dona_yy, d.seq_no,
          dm.name, 
          bc.code_name AS step_name, 
          r.name AS referral_name,
          d.dona_amt, 
          IFNULL((SELECT SUM(total_amount) FROM product_release_master WHERE cust_no = d.cust_no AND dona_yy = d.dona_yy), 0) AS real_amt
        FROM donation_detail d
        JOIN donation_master dm ON d.cust_no = dm.cust_no AND d.dona_yy = dm.dona_yy
        JOIN cust c ON d.cust_no = c.cust_no
        LEFT JOIN referral r ON c.referral_code = r.referral_code
        LEFT JOIN basiccode bc ON d.step_code = bc.sub_code AND bc.base_code = 'step_code'
        ${where}
        ORDER BY dm.name
      `;

      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (err) {
      console.error('[getDonationListForComplete 오류]', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 기부 완료 처리 실행
  processDonationComplete: async (req, res) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const updates = req.body.customers; // [{ cust_no, dona_yy, seq_no, mod_amt }]
      
      for (const item of updates) {
        const { cust_no, dona_yy, seq_no, mod_amt } = item;

        // 실 기부금액 결정
        let realAmt;
        if (!mod_amt || isNaN(mod_amt) || Number(mod_amt) === 0) {
          // 기존 출고 합계 조회 (donation_detail에 real_amt가 있다면 그것을 사용, 없으면 subquery)
          const [releaseRows] = await connection.execute(
            `SELECT SUM(total_amount) as total FROM product_release_master WHERE cust_no = ? AND dona_yy = ?`,
            [cust_no, dona_yy]
          );
          realAmt = Number(releaseRows[0].total || 0);
        } else {
          realAmt = Number(mod_amt);
        }

        // 환급액 계산 로직
        let refundAmt = 0;
        if (realAmt <= 10000000) refundAmt = realAmt * 0.15;
        else if (realAmt <= 30000000) refundAmt = (realAmt - 10000000) * 0.30 + 1500000;
        else refundAmt = (realAmt - 30000000) * 0.40 + 7500000;

        // 고객 및 추천인 정보 조회
        const [custRows] = await connection.execute(
          `SELECT referral_code, name, hpno FROM cust WHERE cust_no = ?`,
          [cust_no]
        );
        if (custRows.length === 0) continue;
        const cust = custRows[0];

        // 물품가액 계산 (추천인 6561 여부에 따라 요율 상이)
        const referralCode = cust.referral_code;
        const goodsAmt = Math.round(refundAmt * (referralCode === '6561' ? 0.60 : 0.53));

        // 추천인별 입금계좌 조회
        const [bankRows] = await connection.execute(
          `SELECT bank_code FROM bankinfo WHERE referral_code = ? LIMIT 1`,
          [referralCode]
        );
        const bankCode = bankRows.length > 0 ? bankRows[0].bank_code : null;

        // 상태 업데이트: 03 (서류완료) -> 04 (기부완료)
        await connection.execute(
          `UPDATE donation_detail
           SET real_amt = ?, refund_amt = ?, goods_amt = ?, bank_code = ?, step_code = '04', upd_date = NOW()
           WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?`,
          [realAmt, refundAmt, goodsAmt, bankCode, cust_no, dona_yy, seq_no]
        );

        // 알림톡 발송 (설정된 경우에만)
        if (process.env.ITEASY_API_KEY && process.env.ITEASY_SENDER_KEY) {
          try {
            const payload = {
              auth_code: process.env.ITEASY_API_KEY,
              sender_key: process.env.ITEASY_SENDER_KEY,
              phone_number: cust.hpno.replace(/-/g, ''),
              template_code: 'dn005',
              message: `처리 완료\n\n{기부물품 전달 완료}\n\n${cust.name}님\n기부금 ${realAmt.toLocaleString()}원이\n정상 처리 되었습니다.`,
              callback_number: '01035617528',
              tran_type: 'N'
            };
            await axios.post('https://api.mtsco.co.kr/sndng/atk/sendMessage', payload);
          } catch (err) {
            console.error('AlimTalk send error:', err.message);
          }
        }
      }

      await connection.commit();
      res.json({ success: true, message: `${updates.length}건 기부 완료 처리되었습니다.` });
    } catch (err) {
      await connection.rollback();
      console.error('[processDonationComplete 오류]', err);
      res.status(500).json({ success: false, message: err.message });
    } finally {
      connection.release();
    }
  },

  // 현금영수증 처리용 리스트 조회
  getCRReceiptList: async (req, res) => {
    try {
      const { dona_yy, name, referral_code } = req.query;
      const params = [dona_yy];
      let where = "WHERE d.dona_yy = ? AND c.receipt_yn = 'Y'"; // 현금영수증 요청자 중심

      if (name) {
        where += " AND dm.name LIKE ?";
        params.push(`%${name}%`);
      }
      if (referral_code) {
        where += " AND c.referral_code = ?";
        params.push(referral_code);
      }

      const query = `
        SELECT 
          d.cust_no, d.dona_yy, d.seq_no,
          dm.name, 
          bc.code_name AS step_name, 
          r.name AS referral_name,
          d.dona_amt, d.real_amt, d.goods_amt,
          IFNULL(d.deposit_amt, 0) as deposit_amt,
          IFNULL((SELECT SUM(deposit_amt) FROM pre_deposit WHERE cust_no = d.cust_no AND dona_yy = d.dona_yy), 0) as sum_deposit_amt,
          dm.hpno,
          c.receipt_yn,
          IFNULL(d.issuance_yn, 'N') as issuance_yn
        FROM donation_detail d
        JOIN donation_master dm ON d.cust_no = dm.cust_no AND d.dona_yy = dm.dona_yy
        JOIN cust c ON d.cust_no = c.cust_no
        LEFT JOIN referral r ON c.referral_code = r.referral_code
        LEFT JOIN basiccode bc ON d.step_code = bc.sub_code AND bc.base_code = 'step_code'
        ${where}
        ORDER BY dm.name
      `;

      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (err) {
      console.error('[getCRReceiptList 오류]', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 현금영수증 엑셀 내보내기 및 상태 업데이트
  exportCRReceiptExcel: async (req, res) => {
    try {
      const { customers } = req.body;
      if (!customers || customers.length === 0) {
        return res.status(400).json({ success: false, message: '선택된 데이터가 없습니다.' });
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('현금영수증발행대상');

      sheet.columns = [
        { header: '고객명', key: 'name', width: 15 },
        { header: '휴대폰번호', key: 'hpno', width: 20 },
        { header: '실기부금액', key: 'real_amt', width: 15 },
        { header: '발행일자', key: 'date', width: 15 },
        { header: '비고', key: 'memo', width: 20 }
      ];

      for (const item of customers) {
        const [rows] = await db.execute(
          `SELECT dm.name, dm.hpno, d.real_amt 
           FROM donation_detail d 
           JOIN donation_master dm ON d.cust_no = dm.cust_no AND d.dona_yy = dm.dona_yy
           WHERE d.cust_no = ? AND d.dona_yy = ? AND d.seq_no = ?`,
          [item.cust_no, item.dona_yy, item.seq_no]
        );

        if (rows.length > 0) {
          const row = rows[0];
          sheet.addRow({
            name: row.name,
            hpno: row.hpno,
            real_amt: row.real_amt,
            date: dayjs().format('YYYY-MM-DD'),
            memo: '스마트나눔 기부금'
          });

          // 발행 상태 업데이트 (issuance_yn = 'Y')
          await db.execute(
            `UPDATE donation_detail SET issuance_yn = 'Y', upd_date = NOW() 
             WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?`,
            [item.cust_no, item.dona_yy, item.seq_no]
          );
        }
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent('cash_receipts.xlsx'));

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('[exportCRReceiptExcel 오류]', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 추천인 목록 조회
  getReferralList: async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT referral_code, name FROM referral ORDER BY name');
      res.json(rows);
    } catch (error) {
      console.error('추천인 목록 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  },

  // 기부 신청 년도 목록 조회
  getDonationYears: async (req, res) => {
    try {
      // endDate 테이블에서 관리 중인 년도 목록을 가져옵니다.
      const [rows] = await db.execute('SELECT DISTINCT dona_yy AS yy FROM endDate ORDER BY dona_yy DESC');
      
      let years = [];
      if (rows.length > 0) {
        years = rows.map(r => String(r.yy));
      } else {
        // enddate에 데이터가 없다면 donation_master에서 실제 기부 내역이 있는 연도를 가져옵니다.
        const [donRows] = await db.execute('SELECT DISTINCT dona_yy as yy FROM donation_master ORDER BY dona_yy DESC');
        if (donRows.length > 0) {
          years = donRows.map(r => String(r.yy));
        } else {
          // 모든 테이블에 데이터가 없다면 현재 연도를 기본값으로 반환합니다.
          years = [new Date().getFullYear().toString()];
        }
      }
      res.json(years);
    } catch (error) {
      console.error('년도 목록 조회 오류:', error);
      res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
  }
};

module.exports = adminController;
