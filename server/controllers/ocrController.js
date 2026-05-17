const axios = require('axios');

/**
 * 근로소득원천징수 영수증 이미지 분석 및 세무 정보 추출 컨트롤러
 */
exports.scanReceipt = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: '분석할 근로소득원천징수 영수증 이미지 데이터(Base64)가 전송되지 않았습니다.'
      });
    }

    // 1. OpenAI API 키 유효성 체크
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_openai_api_key')) {
      console.warn('⚠️ [OCR API WARNING] server/.env 파일에 OPENAI_API_KEY가 구성되지 않았습니다.');
      return res.status(400).json({
        success: false,
        code: 'MISSING_API_KEY',
        message: '서버 환경설정(.env)에 OpenAI API 키가 등록되지 않았습니다. 호스팅 서버의 .env 파일에 OPENAI_API_KEY=sk-... 설정을 추가해 주세요!'
      });
    }

    // 2. Base64 이미지 포맷팅 정제 (접두사 제거 및 포맷 확인)
    let base64Data = image;
    let mimeType = 'image/jpeg'; // 기본값

    if (image.startsWith('data:')) {
      const parts = image.split(';base64,');
      if (parts.length === 2) {
        mimeType = parts[0].replace('data:', '');
        base64Data = parts[1];
      }
    }

    console.log(`[OCR] GPT-4o Vision 스캔 시작... (MimeType: ${mimeType}, Size: ${Math.round(base64Data.length / 1024)} KB)`);

    // 3. OpenAI Chat Completions API 요청 (GPT-4o Vision 모델)
    const openAiUrl = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o',
      response_format: { type: 'json_object' }, // 출력을 강제로 JSON으로 받도록 지정
      messages: [
        {
          role: 'system',
          content: `너는 대한민국 국세청 근로소득 원천징수영수증 전문 세무 AI 비서야.
제공된 이미지에서 딱 두 가지 세무 항목만 찾아내서 아래의 JSON 포맷으로 정확하게 응답해줘.
그 외의 설명, 인사말, 마크다운 기호 등은 절대 작성하지 말고 오직 JSON만 반환해야 해.

{
  "salary": "23. 근로소득금액에 해당하는 금액 (예: 54000000)",
  "decisionTax": "72. 결정세액에 해당하는 금액 (예: 2100000)"
}

* 아주 중요 규칙:
1. 금액 항목에 쉼표(,)나 원화 표시가 들어있다면 전부 숫자로만 구성된 정수 형태로 변환해줘 (예: "26,211,273" -> 26211273).
2. 근로소득 원천징수영수증에서 세액 항목은 세 개의 열 [소득세, 지방소득세, 농어촌특별세]로 구성되어 있어.
   - 우리는 **오직 첫 번째 열인 "소득세" 금액**만 추출해야 해!
   - 72. 결정세액 행의 첫 번째 열인 **"결정세액 소득세"** 금액을 정확히 추출해줘 (예: 소득세 26,211,273 / 지방소득세 2,621,127 / 농어촌특별세 72,767이 있다면 26211273이 정답이야).
   - 절대 두 번째 열(지방소득세)이나 세 번째 열(농어촌특별세) 금액을 가져오면 안 돼!
3. 결정세액(72번)을 추출할 때, **71. 세액공제계** 행이나 **73. 차감징수세액** 행의 금액을 가져오지 않도록 극도로 주의해줘. 반드시 행 레이블이 **"72. 결정세액" 또는 "72. 결정세액(49-54-71)"**인 행의 **첫 번째 열(소득세)** 금액을 가져와야 해 (예: 71. 세액공제계에 3,509,234가 있고 72. 결정세액(49-54-71)에 26,211,273이 있다면 26211273이 정답이야).
4. 만약 영수증 이미지 상태가 불량하거나 아예 관련 항목이 식별되지 않는 경우 해당 항목을 0으로 채워줘 (예: "salary": 0, "decisionTax": 0).`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '이 근로소득원천징수 영수증 이미지를 정밀 분석해서 세무 정보를 JSON으로 알려줘.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    };

    // 4. Axios를 활용한 OpenAI 호출
    const response = await axios.post(openAiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000 // 30초 타임아웃
    });

    // 5. 결과 파싱 및 안전 검증
    const choice = response.data.choices[0];
    const rawResultText = choice.message.content;
    console.log('[OCR] GPT-4o 원본 응답:', rawResultText);

    let ocrData;
    try {
      ocrData = JSON.parse(rawResultText);
    } catch (parseErr) {
      console.error('[OCR] 응답 JSON 파싱 실패:', parseErr);
      return res.status(500).json({
        success: false,
        message: 'AI가 반환한 데이터를 파싱하는 데 실패했습니다.'
      });
    }

    // 금액 필드 숫자형 정제 (안전장치)
    const cleanNumber = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseInt(val.replace(/[^0-9-]/g, ''), 10);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const salary = cleanNumber(ocrData.salary);
    const decisionTax = cleanNumber(ocrData.decisionTax);

    console.log(`[OCR RESULT] 파싱 완료 -> 근로소득금액: ${salary.toLocaleString()}원, 결정세액: ${decisionTax.toLocaleString()}원`);

    return res.json({
      success: true,
      salary,
      decisionTax,
      message: '성공적으로 근로소득원천징수 영수증을 분석 완료했습니다.'
    });

  } catch (error) {
    console.error('❌ [OCR ERROR] GPT-4o 스캔 실패:', error.message);
    if (error.response) {
      console.error('OpenAI API 에러 상세:', error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: `OpenAI API 에러가 발생했습니다: ${error.response.data.error?.message || error.message}`
      });
    }
    return res.status(500).json({
      success: false,
      message: '서버에서 근로소득원천징수 영수증을 분석하는 과정 중 예외가 발생했습니다.'
    });
  }
};
