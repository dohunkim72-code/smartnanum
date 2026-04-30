/**
 * 숫자를 한글 금액 읽기로 변환하는 함수
 * @param {number} num 변환할 숫자
 * @returns {string} 한글 금액 읽기 결과
 */
function numberToKorean(num) {
  if (!num || isNaN(num)) return '영';
  
  const units = ['', '만', '억', '조', '경'];
  const nums = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const posUnits = ['', '십', '백', '천'];
  
  let result = '';
  let unitIdx = 0;
  
  while (num > 0) {
    let part = num % 10000;
    let partResult = '';
    
    for (let i = 0; i < 4; i++) {
      let digit = part % 10;
      if (digit > 0) {
        partResult = nums[digit] + posUnits[i] + partResult;
      }
      part = Math.floor(part / 10);
    }
    
    if (partResult !== '') {
      result = partResult + units[unitIdx] + result;
    }
    
    num = Math.floor(num / 10000);
    unitIdx++;
  }
  
  return result;
}

module.exports = numberToKorean;
