const fs = require('fs').promises;
const path = require('path');

/**
 * Base64 형태의 서명 이미지 데이터를 파일로 저장하고 파일명을 반환합니다.
 * @param {string} signatureData - Base64 서명 이미지 데이터 (data:image/png;base64,...)
 * @param {string} cust_no - 기부자 번호
 * @param {string} dona_yy - 기부 연도
 * @param {number|string} seq_no - 순번
 * @returns {Promise<string|null>} 저장된 파일명 또는 null
 */
async function saveSignatureImage(signatureData, cust_no, dona_yy, seq_no) {
  if (!signatureData) return null;
  
  // 이미 파일명 형식인 경우(예: '12345_2026_1.png')에는 추가 저장 없이 파일명 그대로 리턴
  if (typeof signatureData === 'string' && !signatureData.startsWith('data:image') && !signatureData.includes('base64')) {
    return signatureData;
  }
  
  try {
    // Base64 헤더가 포함된 경우 데이터 부분만 추출
    const matches = signatureData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = 'png'; // 기본 확장자 png
    
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
      const mime = matches[1];
      if (mime === 'image/jpeg' || mime === 'image/jpg') {
        ext = 'jpg';
      }
    } else {
      // 순수 Base64 데이터인 경우
      buffer = Buffer.from(signatureData, 'base64');
    }
    
    // 파일명 형식: cust_no + dona_yy + seq_no (언더바 제거)
    const fileName = `${cust_no}${dona_yy}${seq_no}.${ext}`;
    
    // signatures 폴더는 루트 경로에 존재 (server/utils 기준 상위의 상위인 smartnanum/signatures)
    const dirPath = path.join(__dirname, '../../signatures');
    
    // signatures 폴더가 존재하지 않으면 생성
    await fs.mkdir(dirPath, { recursive: true });
    
    const filePath = path.join(dirPath, fileName);
    await fs.writeFile(filePath, buffer);
    
    console.log(`[서명 저장] 파일 저장 완료: ${filePath}`);
    return fileName;
  } catch (error) {
    console.error('[서명 저장 에러] 서명 이미지 저장 중 오류 발생:', error);
    throw error;
  }
}

module.exports = {
  saveSignatureImage
};
