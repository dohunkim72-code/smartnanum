const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const dayjs = require('dayjs');
const numberToKorean = require('../utils/numberToKorean');

// 엑셀 셀 값 설정을 위한 헬퍼 함수 (병합된 셀 대응)
function setValueToMergedStartCell(ws, cellRef, value) {
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
 * 물품공급계약서 관련 컨트롤러
 */
const adminContractController = {
  // 계약서 대상 리스트 조회
  getContractDocList: async (req, res) => {
    try {
      const { dona_yy, referral_code, status } = req.body;
      const targetYear = dona_yy || dayjs().format('YYYY');
      const prevYear = parseInt(targetYear) - 1;

      let referralClause = '';
      const params = [targetYear, targetYear, targetYear]; // curr, prev, status_check

      if (referral_code) {
        referralClause = 'AND c.referral_code = ?';
        params.push(referral_code);
      }

      // 최적화된 쿼리: 현재년도와 전년도 데이터를 JOIN하여 상태(신규/신청/미신청)를 한 번에 파악
      const query = `
        SELECT 
          c.cust_no, 
          c.name, 
          r.name AS referral_name,
          curr.total_dona_amt AS curr_dona_amt,
          prev.total_dona_amt AS prev_dona_amt,
          IFNULL(curr.total_dona_amt, prev.total_dona_amt) as display_dona_amt,
          IFNULL(prm.real_amt, 0) as real_amt,
          CASE 
            WHEN curr.cust_no IS NOT NULL AND prev.cust_no IS NULL THEN '신규'
            WHEN curr.cust_no IS NOT NULL AND prev.cust_no IS NOT NULL THEN '신청'
            WHEN curr.cust_no IS NULL AND prev.cust_no IS NOT NULL THEN '미신청'
            ELSE '기타'
          END AS remark
        FROM cust c
        LEFT JOIN referral r ON c.referral_code = r.referral_code
        LEFT JOIN donation_master curr ON c.cust_no = curr.cust_no AND curr.dona_yy = ?
        LEFT JOIN donation_master prev ON c.cust_no = prev.cust_no AND prev.dona_yy = ?
        LEFT JOIN (
          SELECT cust_no, dona_yy, SUM(total_amount) as real_amt 
          FROM product_release_master 
          WHERE dona_yy = ? 
          GROUP BY cust_no
        ) prm ON c.cust_no = prm.cust_no
        WHERE (curr.cust_no IS NOT NULL OR prev.cust_no IS NOT NULL)
        ${referralClause}
        ORDER BY c.name
      `;

      const [rows] = await db.execute(query, params);

      // 상태 필터링 (메모리 상에서 처리)
      let filteredRows = rows;
      if (status && status !== 'ALL') {
        filteredRows = rows.filter(row => {
          if (status === 'NEW' && row.remark === '신규') return true;
          if (status === 'APPLY' && row.remark === '신청') return true;
          if (status === 'NOT_APPLY' && row.remark === '미신청') return true;
          return false;
        });
      }

      res.json(filteredRows);
    } catch (err) {
      console.error('[getContractDocList 오류]', err);
      res.status(500).json({ message: err.message });
    }
  },

  // 계약서 생성 (엑셀)
  generateContractDocs: async (req, res) => {
    try {
      const { customers, dona_yy } = req.body; // [{ cust_no }]
      if (!customers || customers.length === 0) {
        return res.status(400).json({ message: '선택된 회원이 없습니다.' });
      }

      // 경로 설정 (환경에 따라 조정될 수 있음)
      const baseDir = '/volume1/docker/admin-web/excels/contract';
      const signDir = '/volume1/homes/hanwool/donation-server/signatures';
      const templatePath = '/volume1/docker/admin-web/sample/contract.xlsx';

      // 윈도우 환경 테스트를 위한 폴더 생성 방어 코드
      try {
        if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
      } catch (e) {
        console.warn('Base directory access error, might be environment issue:', e.message);
      }

      const today = dayjs().format('YYYYMMDD_HHmm');
      const summaryWorkbook = new ExcelJS.Workbook();
      const summarySheet = summaryWorkbook.addWorksheet('공급계약서 리스트');

      // 요약 시트 헤더
      summarySheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: '고객번호', key: 'cust_no', width: 15 },
        { header: '성명', key: 'name', width: 15 },
        { header: '추천인', key: 'referral', width: 15 },
        { header: '기부년도', key: 'year', width: 10 },
        { header: '기부금액', key: 'amount', width: 15 },
        { header: '예상환급금', key: 'refund', width: 15 },
        { header: '선입금', key: 'pre_deposit', width: 15 }
      ];

      const results = [];

      for (let i = 0; i < customers.length; i++) {
        const { cust_no } = customers[i];

        // 상세 정보 조회
        const [rows] = await db.execute(`
          SELECT dm.*, c.referral_code,
                 r.name AS referral_name, bk.bank_name, bk.account_no, bk.account_holder,
                 IFNULL(prm.real_amt, 0) AS real_amt
          FROM donation_master dm
          JOIN cust c ON dm.cust_no = c.cust_no
          LEFT JOIN referral r ON c.referral_code = r.referral_code
          LEFT JOIN (
            SELECT cust_no, dona_yy, SUM(total_amount) as real_amt 
            FROM product_release_master 
            GROUP BY cust_no, dona_yy
          ) prm ON prm.cust_no = dm.cust_no AND prm.dona_yy = dm.dona_yy
          LEFT JOIN bankinfo bk ON r.referral_code = bk.referral_code  
          WHERE dm.dona_yy = ? AND dm.cust_no = ?
          GROUP BY dm.cust_no
        `, [dona_yy, cust_no]);

        if (rows.length === 0) continue;
        const row = rows[0];

        // 환급금 및 선입금 계산 로직
        const baseAmount = row.real_amt > 0 ? row.real_amt : (row.total_dona_amt || 0);
        
        function calcRefund(amt = 0) {
          const a = Math.max(0, Number(amt));
          if (a <= 10000000) return a * 0.15;
          return (a - 10000000) * 0.30 + 1500000;
        }

        const 예상환급금 = Math.round(calcRefund(baseAmount));
        const 선입금 = Math.round((예상환급금 * 0.05) / 10000) * 10000;

        // 개별 엑셀 생성 (템플릿 기반)
        if (fs.existsSync(templatePath)) {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.readFile(templatePath);
          const sheet = workbook.getWorksheet(1); // 'sheet1' 대신 첫 번째 시트

          // 템플릿 매핑
          sheet.getCell('E11').value = row.name;
          sheet.getCell('E12').value = `(${row.zipcode}) ${row.address} ${row.address_detail}`;
          sheet.getCell('E13').value = row.hpno;
          
          const jmin1 = row.jmin1 || '';
          const jmin2 = row.jmin2 || '';
          const maskedJmin2 = jmin2.length > 0 ? jmin2[0] + '******' : '*******';
          sheet.getCell('E14').value = `${jmin1}-${maskedJmin2}`;
          
          sheet.getCell('F20').value = `\u20A9${baseAmount.toLocaleString()}`;
          sheet.getCell('I20').value = `(${numberToKorean(baseAmount)}원)`;
          sheet.getCell('F21').value = `\u20A9${예상환급금.toLocaleString()}`;
          sheet.getCell('I21').value = `(${numberToKorean(예상환급금)}원)`;
          sheet.getCell('H24').value = `\u20A9${선입금.toLocaleString()}`;
          sheet.getCell('J24').value = `(${numberToKorean(선입금)}원)`;
          
          sheet.getCell('E28').value = row.bank_name;
          sheet.getCell('E29').value = row.account_no;
          sheet.getCell('E30').value = row.account_holder;
          sheet.getCell('H42').value = dayjs().format('YYYY년 MM월 DD일');
          sheet.getCell('F45').value = row.name;

          // 서명 이미지 삽입
          const signPath = path.join(signDir, `${row.cust_no}_${dona_yy}.png`);
          if (fs.existsSync(signPath)) {
            const imageId = workbook.addImage({ filename: signPath, extension: 'png' });
            sheet.addImage(imageId, { tl: { col: 8.5, row: 44 }, ext: { width: 120, height: 50 } });
          }

          // 파일 저장
          const referralFolder = row.referral_code || 'unknown';
          const folderPath = path.join(baseDir, referralFolder);
          if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

          const fileName = `${row.name}_${dona_yy}_공급계약서.xlsx`;
          const filePath = path.join(folderPath, fileName);
          await workbook.xlsx.writeFile(filePath);
        }

        // 요약 정보 추가
        summarySheet.addRow({
          no: i + 1,
          cust_no: row.cust_no,
          name: row.name,
          referral: row.referral_name || '',
          year: row.dona_yy,
          amount: baseAmount,
          refund: 예상환급금,
          pre_deposit: 선입금
        });
      }

      // 요약 리스트 저장
      const summaryFileName = `공급계약서리스트_${today}.xlsx`;
      const summaryPath = path.join(baseDir, summaryFileName);
      await summaryWorkbook.xlsx.writeFile(summaryPath);

      res.json({ 
        success: true, 
        message: `${customers.length}건의 계약서 생성이 완료되었습니다.`,
        summary: summaryPath 
      });

    } catch (err) {
      console.error('[generateContractDocs 오류]', err);
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = adminContractController;
