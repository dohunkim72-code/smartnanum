const db = require('../config/db');

/**
 * 기부금 신청 초기 데이터 조회
 * - 사용자 정보 (cust)
 * - 당해년도/전년도 신청 내역 (donation_master, donation_detail)
 * - 마감일자 (endDate)
 */
exports.getInitData = async (req, res) => {
  const { id } = req.query;
  const currentYear = new Date().getFullYear().toString();
  const lastYear = (new Date().getFullYear() - 1).toString();

  try {
    const [user] = await db.execute('SELECT * FROM cust WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: '사용자 정보를 찾을 수 없습니다.' });
    }
    const custNo = user[0].cust_no;

    const [endDateInfo] = await db.execute('SELECT endDate AS end_date FROM endDate WHERE dona_yy = ?', [currentYear]);
    
    // 마감 여부 체크
    let isClosed = false;
    if (endDateInfo.length > 0 && endDateInfo[0].end_date) {
      // 오늘 날짜 (YYYY-MM-DD) - DB 데이터와 형식을 맞추기 위해 replace 제거 또는 일관된 형식으로 변환
      const todayStr = new Date().toISOString().slice(0, 10); 
      const end_date = endDateInfo[0].end_date;
      
      // 하이픈, 점 등 구분자를 제거하고 숫자만 비교하여 정확성 확보
      if (todayStr.replace(/\D/g, '') > end_date.replace(/\D/g, '')) {
        isClosed = true;
      }
    }

    // 전년도 미납 체크 (이전 모든 연도에 대해 goods_amt > deposit_amt 인 건이 있는지 확인)
    const [unpaidResult] = await db.execute(
      'SELECT COUNT(*) as count FROM donation_detail WHERE cust_no = ? AND dona_yy < ? AND goods_amt > deposit_amt',
      [custNo, currentYear]
    );
    const hasUnpaid = unpaidResult[0].count > 0;

    // 당해년도 마스터 조회
    const [currentMaster] = await db.execute(
      'SELECT * FROM donation_master WHERE cust_no = ? AND dona_yy = ?', 
      [custNo, currentYear]
    );

    // 당해년도 상세 내역 리스트 조회 (아라부장님 요청: 하단 리스트용)
    const [currentDetails] = await db.execute(
      'SELECT * FROM donation_detail WHERE cust_no = ? AND dona_yy = ? ORDER BY seq_no DESC',
      [custNo, currentYear]
    );

    // 전년도 마스터 조회 (신규 신청 시 기본 정보 참고용)
    const [lastMaster] = await db.execute(
      'SELECT * FROM donation_master WHERE cust_no = ? AND dona_yy = ?',
      [custNo, lastYear]
    );

    // 응답할 마스터 정보 가공
    let master = null;
    if (currentMaster.length > 0) {
      master = currentMaster[0];
    } else if (lastMaster.length > 0) {
      // 전년도 데이터가 있으면 기본 인적 정보는 가져오되, 금액 정보는 0으로 초기화 (금년도 신규 신청용)
      master = {
        ...lastMaster[0],
        total_dona_amt: 0,
        total_real_amt: 0,
        total_refund_amt: 0,
        last_amt: 0 // 전월이월금액도 신규 신청시에는 0으로 표시하는 것이 일반적
      };
      // 년도는 금년도로 표시되도록 설정 (프론트에서 처리할 수도 있지만 백엔드에서 명시 가능)
      master.dona_yy = currentYear;
    }

    res.json({
      user: user[0],
      endDate: endDateInfo.length > 0 ? endDateInfo[0].end_date : null,
      isClosed: isClosed,
      hasUnpaid: hasUnpaid,
      master: master,
      details: currentDetails, // 금년도 상세 내역들
      isCurrentYear: currentMaster.length > 0
    });

  } catch (error) {
    console.error('getInitData Error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

exports.applyDonation = async (req, res) => {
  console.log('--- 기부 신청 요청 수신 ---');
  console.log('사용자 ID:', req.body.id);
  console.log('기부자 번호:', req.body.cust_no);
  console.log('금액:', req.body.amount);
  console.log('서명 데이터 존재 여부:', !!req.body.signature);
  if (req.body.signature) {
    console.log('서명 데이터 길이:', req.body.signature.length);
  }
  
  const { 
    cust_no, name, residentIdFront, residentIdBack, addressZip, addressBasic, addressDetail, 
    phone, amount, company, cashReceipt, seq_no,
    agree1, agree2, agree3, agree4, agree5, agree6, agree7, agree8, agree9, agree10, agree11, agree12, agree13,
    signature
  } = req.body;
  
  const currentYear = new Date().getFullYear().toString();
  const userId = req.body.id;
  const cleanAmount = parseInt(String(amount || '0').replace(/,/g, '')) || 0;
  const receipt_yn = (cashReceipt === true || cashReceipt === 'Y') ? 'Y' : 'N';

  // 휴대폰 번호 정제 (010... 형식으로)
  let cleanPhone = phone ? String(phone).replace(/[^0-9+]/g, '') : '';
  if (cleanPhone.startsWith('+82')) {
    cleanPhone = '0' + cleanPhone.slice(3);
  } else if (cleanPhone.startsWith('82')) {
    cleanPhone = '0' + cleanPhone.slice(2);
  }
  const finalPhone = cleanPhone || '';

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    console.log('트랜잭션 시작...');

    // 1. 마감일 체크
    const [endDateInfo] = await connection.execute('SELECT endDate AS end_date FROM endDate WHERE dona_yy = ?', [currentYear]);
    if (endDateInfo.length > 0 && endDateInfo[0].end_date) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const end_date = endDateInfo[0].end_date;
      
      // 숫자만 추출하여 비교 (YYYYMMDD 형식)
      if (todayStr.replace(/\D/g, '') > end_date.replace(/\D/g, '')) {
        console.warn('신청 마감됨:', end_date);
        await connection.rollback();
        return res.status(400).json({ message: `신청 기간이 마감되었습니다. (${end_date}까지)` });
      }
    }

    // 2. 전년도 미납 체크
    const [unpaidResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM donation_detail WHERE cust_no = ? AND dona_yy < ? AND goods_amt > deposit_amt',
      [cust_no, currentYear]
    );
    if (unpaidResult[0].count > 0) {
      console.warn('미납 내역 존재:', cust_no);
      await connection.rollback();
      return res.status(400).json({ message: '이전 연도 기부금의 입금이 완료 되어야 신청이 가능 합니다.' });
    }

    // 3. 합계 금액 체크 (1,000만원 이상)
    const [masterRows] = await connection.execute(
      'SELECT total_dona_amt FROM donation_master WHERE cust_no = ? AND dona_yy = ?',
      [cust_no, currentYear]
    );
    const existingTotal = masterRows.length > 0 ? masterRows[0].total_dona_amt : 0;
    
    let projectedTotal = existingTotal + cleanAmount;
    if (seq_no) {
      const [existingDetail] = await connection.execute(
        'SELECT dona_amt FROM donation_detail WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?',
        [cust_no, currentYear, seq_no]
      );
      if (existingDetail.length > 0) {
        projectedTotal = existingTotal - existingDetail[0].dona_amt + cleanAmount;
      }
    }

    if (projectedTotal < 10000000) {
      console.warn('총 합계 금액 미달 (1,000만원 미만):', projectedTotal);
      await connection.rollback();
      return res.status(400).json({ message: '해당 년도 총 기부 합계 금액은 1,000만원 이상이어야 합니다.' });
    }

    if (seq_no) {
      console.log('수정 모드 실행 (seq_no:', seq_no, ')');
      // --- [수정 모드] ---
      // 1. 기존 데이터 조회 및 상태 체크
      const [existing] = await connection.execute(
        'SELECT * FROM donation_detail WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?',
        [cust_no, currentYear, seq_no]
      );

      if (existing.length === 0) {
        throw new Error('수정할 내역을 찾을 수 없습니다.');
      }
      if (existing[0].step_code !== '01') {
        throw new Error('진행 상태가 "신청완료(01)"인 경우만 수정이 가능합니다.');
      }

      const oldAmount = existing[0].dona_amt;

      // 2. 상세 내역 업데이트
      await connection.execute(`
        UPDATE donation_detail SET
          dona_amt = ?, company_name = ?, receipt_yn = ?, upd_id = ?, upd_date = NOW(),
          agree1 = ?, agree2 = ?, agree3 = ?, agree4 = ?, agree5 = ?, agree6 = ?, agree7 = ?, 
          agree8 = ?, agree9 = ?, agree10 = ?, agree11 = ?, agree12 = ?, agree13 = ?,
          signature = ?
        WHERE cust_no = ? AND dona_yy = ? AND seq_no = ?
      `, [
        cleanAmount, company || '기부처 미지정', receipt_yn, userId,
        agree1 || 'N', agree2 || 'N', agree3 || 'N', agree4 || 'N', agree5 || 'N', agree6 || 'N', agree7 || 'N',
        agree8 || 'N', agree9 || 'N', agree10 || 'N', agree11 || 'N', agree12 || 'N', agree13 || 'N',
        signature || null,
        cust_no, currentYear, seq_no
      ]);

      // 3. 마스터 금액 보정 (기존 금액 차감 후 새 금액 가산)
      await connection.execute(`
        UPDATE donation_master SET
          name = ?, jmin1 = ?, jmin2 = ?, zipcode = ?, address = ?, address_detail = ?, hpno = ?,
          total_dona_amt = total_dona_amt - ? + ?,
          upd_id = ?, upd_date = NOW()
        WHERE cust_no = ? AND dona_yy = ?
      `, [
        name, residentIdFront, residentIdBack, addressZip || '', addressBasic || '', addressDetail || '', finalPhone,
        oldAmount, cleanAmount, userId, cust_no, currentYear
      ]);

    } else {
      console.log('신규 신청 모드 실행');
      // --- [신규 신청 모드] ---
      // 1. 마스터 저장 (합산 로직 적용) - 부모 테이블이 먼저 존재해야 함
      await connection.execute(`
        INSERT INTO donation_master (
          cust_no, dona_yy, name, jmin1, jmin2, zipcode, address, address_detail, hpno, 
          total_dona_amt, reg_id, upd_id, reg_date, upd_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          jmin1 = VALUES(jmin1),
          jmin2 = VALUES(jmin2),
          zipcode = VALUES(zipcode),
          address = VALUES(address),
          address_detail = VALUES(address_detail),
          hpno = VALUES(hpno),
          total_dona_amt = total_dona_amt + VALUES(total_dona_amt),
          upd_id = VALUES(upd_id),
          upd_date = NOW()
      `, [
        cust_no, currentYear, name, residentIdFront, residentIdBack, addressZip || '', addressBasic || '', addressDetail || '', finalPhone,
        cleanAmount, userId, userId
      ]);

      // 2. 상세 내역 seq_no 채번
      const [seqResult] = await connection.execute(
        'SELECT COALESCE(MAX(seq_no), 0) + 1 as next_seq FROM donation_detail WHERE cust_no = ? AND dona_yy = ?',
        [cust_no, currentYear]
      );
      const nextSeq = seqResult[0].next_seq;

      // 3. 상세 내역 추가 (13개 동의 항목 포함)
      await connection.execute(`
        INSERT INTO donation_detail (
          cust_no, dona_yy, seq_no, client_no, dona_amt, company_name, receipt_yn, step_code, 
          reg_id, upd_id, reg_date, upd_date, issuance_yn, goods_yn, 
          agree1, agree2, agree3, agree4, agree5, agree6, agree7, agree8, agree9, agree10, agree11, agree12, agree13,
          signature
        ) VALUES (?, ?, ?, 'C0001', ?, ?, ?, '01', ?, ?, NOW(), NOW(), 'N', 'N', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        cust_no, currentYear, nextSeq, cleanAmount, company || '기부처 미지정', receipt_yn, userId, userId,
        agree1 || 'N', agree2 || 'N', agree3 || 'N', agree4 || 'N', agree5 || 'N', agree6 || 'N', agree7 || 'N',
        agree8 || 'N', agree9 || 'N', agree10 || 'N', agree11 || 'N', agree12 || 'N', agree13 || 'N',
        signature || null
      ]);
    }

    await connection.commit();
    console.log('데이터 저장 완료! 🎉');
    res.json({ message: seq_no ? '기부 내역이 수정되었습니다.' : '기부금 신청이 완료되었습니다. 감사합니다! ❤️' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('--- applyDonation 저장 중 오류 발생 ---');
    console.error('에러 내용:', error);
    res.status(500).json({ 
      message: '저장 중 오류가 발생했습니다.', 
      detail: error.message 
    });
  } finally {
    if (connection) connection.release();
    console.log('--- 기부 신청 처리 종료 ---');
  }
};

/**
 * 전체 기부 내역 조회 (년도별 그룹화) ✨
 */
exports.getDonationHistory = async (req, res) => {
  const { id } = req.query;

  try {
    const [user] = await db.execute('SELECT cust_no FROM cust WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    const custNo = user[0].cust_no;

    // 1. 마스터 조회 (년도별 합산 정보)
    const [masters] = await db.execute(
      'SELECT * FROM donation_master WHERE cust_no = ? ORDER BY dona_yy DESC', 
      [custNo]
    );

    // 2. 상세 내역 조회 (건별 내역)
    const [details] = await db.execute(
      'SELECT * FROM donation_detail WHERE cust_no = ? ORDER BY dona_yy DESC, seq_no DESC',
      [custNo]
    );

    // 년도별로 데이터 구조화
    const historyByYear = masters.map(master => {
      const yearDetails = details.filter(detail => detail.dona_yy === master.dona_yy);
      return {
        ...master,
        details: yearDetails
      };
    });

    res.json(historyByYear);

  } catch (error) {
    console.error('getDonationHistory Error:', error);
    res.status(500).json({ message: '내역 조회 중 오류가 발생했습니다.' });
  }
};

/**
 * 기부 상세 내역 상세 조회 (마스터 + 상세 + 선입금 정보 통합) 🔍
 */
exports.getDonationDetail = async (req, res) => {
  const { id, year, seqNo } = req.query;

  try {
    const [user] = await db.execute('SELECT cust_no FROM cust WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    const custNo = user[0].cust_no;

    const query = `
      SELECT 
        d.dona_yy, m.name, m.jmin1, m.jmin2, m.zipcode, m.address, m.address_detail, m.hpno,
        d.dona_amt, d.receipt_yn, d.step_code, m.last_amt, d.real_amt, d.refund_amt, d.goods_amt,
        (SELECT IFNULL(SUM(deposit_amt), 0) FROM pre_deposit WHERE cust_no = d.cust_no AND dona_yy = d.dona_yy AND seq_no = d.seq_no AND deposit_type = 'pre') as pre_deposit_req_amt,
        (SELECT IFNULL(SUM(deposit_amt), 0) FROM pre_deposit WHERE cust_no = d.cust_no AND dona_yy = d.dona_yy AND seq_no = d.seq_no AND deposit_type = 'payment') as deposit_amt,
        d.goods_yn, m.total_real_amt, d.issuance_yn,
        p.bank_name, p.account_no, p.account_holder
      FROM donation_detail d
      JOIN donation_master m ON d.cust_no = m.cust_no AND d.dona_yy = m.dona_yy
      LEFT JOIN pre_deposit p ON d.cust_no = p.cust_no AND d.dona_yy = p.dona_yy AND d.seq_no = p.seq_no
      WHERE d.cust_no = ? AND d.dona_yy = ? AND d.seq_no = ?
    `;

    const [rows] = await db.execute(query, [custNo, year, seqNo]);

    if (rows.length === 0) {
      return res.status(404).json({ message: '상세 내역을 찾을 수 없습니다.' });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error('getDonationDetail Error:', error);
    res.status(500).json({ message: '상세 조회 중 오류가 발생했습니다.' });
  }
};

/**
 * 연도별 기부 합산 내역 조회 (마스터 정보 + 하위 상세 합산) 📊
 */
exports.getDonationYearlySummary = async (req, res) => {
  const { id, year } = req.query;

  try {
    const [user] = await db.execute('SELECT cust_no FROM cust WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    const custNo = user[0].cust_no;

    // 마스터 정보와 상세 합계 정보를 가져오는 쿼리
    const query = `
      SELECT 
        m.dona_yy, m.name, m.jmin1, m.jmin2, m.zipcode, m.address, m.address_detail, m.hpno,
        m.total_dona_amt as dona_amt, -- 마스터의 총 신청금액
        (SELECT CASE WHEN COUNT(*) > 0 THEN 'Y' ELSE 'N' END FROM donation_detail WHERE cust_no = m.cust_no AND dona_yy = m.dona_yy AND receipt_yn = 'Y') as receipt_yn,
        'YEARLY' as step_code, -- 연도 합산임을 표시
        m.last_amt, 
        m.total_real_amt as real_amt, 
        m.total_refund_amt as refund_amt,
        IFNULL(SUM(d.goods_amt), 0) as goods_amt,
        (SELECT IFNULL(SUM(deposit_amt), 0) FROM pre_deposit WHERE cust_no = m.cust_no AND dona_yy = m.dona_yy AND deposit_type = 'pre') as pre_deposit_req_amt,
        (SELECT IFNULL(SUM(deposit_amt), 0) FROM pre_deposit WHERE cust_no = m.cust_no AND dona_yy = m.dona_yy AND deposit_type = 'payment') as deposit_amt,
        (SELECT CASE WHEN COUNT(*) > 0 THEN 'Y' ELSE 'N' END FROM donation_detail WHERE cust_no = m.cust_no AND dona_yy = m.dona_yy AND goods_yn = 'Y') as goods_yn,
        m.total_real_amt, 
        (SELECT CASE WHEN COUNT(*) > 0 THEN 'Y' ELSE 'N' END FROM donation_detail WHERE cust_no = m.cust_no AND dona_yy = m.dona_yy AND issuance_yn = 'Y') as issuance_yn,
        p.bank_name, p.account_no, p.account_holder
      FROM donation_master m
      LEFT JOIN donation_detail d ON m.cust_no = d.cust_no AND m.dona_yy = d.dona_yy
      LEFT JOIN pre_deposit p ON m.cust_no = p.cust_no AND m.dona_yy = p.dona_yy
      WHERE m.cust_no = ? AND m.dona_yy = ?
      GROUP BY m.cust_no, m.dona_yy
      LIMIT 1
    `;

    const [rows] = await db.execute(query, [custNo, year]);

    if (rows.length === 0) {
      return res.status(404).json({ message: '해당 연도의 정보를 찾을 수 없습니다.' });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error('getDonationYearlySummary Error:', error);
    res.status(500).json({ message: '연도별 합산 조회 중 오류가 발생했습니다.' });
  }
};
