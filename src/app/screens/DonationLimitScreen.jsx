import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

/**
 * 기부 한도 및 환급액 계산 화면 컴포넌트 (영수증 OCR 스캔 및 세액공제 계산기 탑재)
 * 
 * 주요 기능:
 * 1. 국세청 근로소득 원천징수영수증 이미지 업로드 & 실시간 OCR 스캔 (23. 근로소득금액, 72. 결정세액 자동 인식)
 * 2. OCR 진행바 및 빛 번짐 레이저 빔 스캔 애니메이션 시각 효과 제공
 * 3. 23. 근로소득금액 기준 기부 한도 30% 산출
 * 4. 근로소득금액의 28% 추천 기부 예정 금액 간편 대입 및 예상 환급액 자동 산출 (1천만원 이하 15% / 초과분 30%)
 * 5. 72. 결정세액 기준 환급 한도 비교: 결정세액 초과 시 친절한 한도 제한 경고 피드백 제공 (실제 환급액 = Math.min(환급액, 결정세액))
 * 6. 스캔된 원본 사진 크게 보기(이미지 비교 모달) 기능
 */
const DonationLimitScreen = () => {
  const navigate = useNavigate();
  
  // 상태 변수 정의 (초기값을 빈 값으로 수정하여 아직 스캔하지 않았을 때 이미 추출된 것처럼 착각하는 것 방지)
  const [salary, setSalary] = useState(''); // 처음에 빈값으로 시작 (한글 주석)
  const [decisionTax, setDecisionTax] = useState(''); // 처음에 빈값으로 시작 (한글 주석)
  const [plannedDonation, setPlannedDonation] = useState(''); // 처음에 빈값으로 시작 (한글 주석)
  const [donationType, setDonationType] = useState('annual'); // 'annual' or 'monthly'
  const [isLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [showGuide, setShowGuide] = useState(false);

  // OCR 및 이미지 관련 상태
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResultAlert, setScanResultAlert] = useState(null); // 스캔 성공/실패 메시지 상태
  const [showImageModal, setShowImageModal] = useState(false); // 이미지 확대 모달 상태

  // 포커스 및 강조 관련 상태 추가 (한글 주석)
  const [salaryHighlighted, setSalaryHighlighted] = useState(false);
  const [decisionTaxHighlighted, setDecisionTaxHighlighted] = useState(false);

  // 실제로 이미지를 통해 소득 및 세액이 정상 스캔/추출 완료 되었는지 추적하는 별도 상태 추가 (한글 주석)
  const [salaryExtracted, setSalaryExtracted] = useState(false);
  const [decisionTaxExtracted, setDecisionTaxExtracted] = useState(false);

  // 포커스 및 스크롤 강조 핸들러 함수 (한글 주석)
  const highlightField = (fieldName) => {
    if (fieldName === 'salary') {
      setSalaryHighlighted(true);
      setTimeout(() => setSalaryHighlighted(false), 2000);
      
      const element = document.getElementById('salary-input-container');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Input 포커스
        const input = element.querySelector('input');
        if (input) {
          setTimeout(() => input.focus(), 300);
        }
      }
    } else if (fieldName === 'decisionTax') {
      setDecisionTaxHighlighted(true);
      setTimeout(() => setDecisionTaxHighlighted(false), 2000);
      
      const element = document.getElementById('decision-tax-input-container');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Input 포커스
        const input = element.querySelector('input');
        if (input) {
          setTimeout(() => input.focus(), 300);
        }
      }
    }
  };

  // 숫자에 콤마 추가/제거 핸들러 (수동 수정 시 스캔 배지를 리셋하기 위해 extraSetter 매개변수 적용)
  const handleMoneyChange = (value, setter, extraSetter) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setter(numValue ? parseInt(numValue).toLocaleString() : '');
    if (extraSetter) {
      extraSetter(false); // 사용자가 임의로 직접 수정하면 스캔 완료 배지 제거 (한글 주석)
    }
  };

  // 수동 입력 데이터 파싱
  const getBaseIncome = () => {
    const numSalary = parseInt(salary.replace(/,/g, '')) || 0;
    return donationType === 'annual' ? numSalary : numSalary * 12;
  };

  const getDecisionTaxVal = () => {
    return parseInt(decisionTax.replace(/,/g, '')) || 0;
  };

  // 1. 기부 한도: 소득의 30%
  const calculateLimit = () => {
    const baseIncome = getBaseIncome();
    return Math.floor(baseIncome * 0.3);
  };

  // 2. 추천 기부 한도: 기부 한도의 95% (기존 로직 유지)
  const calculateRecommendLimit = () => {
    const limit = calculateLimit();
    return Math.floor(limit * 0.95);
  };

  // 3. 기부금 예상 환급액 산출 공식 (누진 적용)
  // - 10,000,000원 이하: 15%
  // - 10,000,000원 초과분: 30%
  const calculateRefund = (amountStr) => {
    const amount = parseInt(amountStr.replace(/,/g, '')) || 0;
    if (amount <= 10000000) {
      return Math.floor(amount * 0.15);
    } else {
      const basicRefund = 10000000 * 0.15; // 150만원
      const excessRefund = (amount - 10000000) * 0.3;
      return Math.floor(basicRefund + excessRefund);
    }
  };

  // 예상 환급액 (결정세액 반영 전)
  const expectedRefundRaw = calculateRefund(plannedDonation);

  // 결정세액 한도 비교 및 최종 예상 환급액 산출
  const finalRefund = Math.min(expectedRefundRaw, getDecisionTaxVal());
  const isTaxOver = expectedRefundRaw > getDecisionTaxVal(); // 결정세액 한도 초과 여부
  const overAmount = expectedRefundRaw - getDecisionTaxVal(); // 초과 금액

  // 4. 예상 물품 대금 (로그인 고객 전용): 실제 예상 환급액의 53%
  const calculateGoodsPayment = () => {
    return Math.floor(finalRefund * 0.53);
  };

  // 28% 추천 기부금 대입 핸들러
  const handleApply28Percent = () => {
    const baseIncome = getBaseIncome();
    if (baseIncome === 0) {
      setScanResultAlert({
        type: 'warning',
        title: '소득 정보를 먼저 입력해 주세요! 💡',
        message: '23. 근로소득금액이 0원 혹은 빈 값인 상태에서는 추천 기부금을 산출할 수 없습니다. 소득금액을 직접 입력하거나 영수증을 업로드해 주세요.'
      });
      setTimeout(() => setScanResultAlert(null), 3500);
      highlightField('salary');
      return;
    }
    const recom28 = Math.floor(baseIncome * 0.28);
    setPlannedDonation(recom28.toLocaleString());
    
    // 알림 표시
    setScanResultAlert({
      type: 'info',
      title: '추천 기부금 적용 완료',
      message: `근로소득금액의 28%에 해당하는 금액인 ${recom28.toLocaleString()}원이 기부 예정 금액으로 대입되었습니다.`
    });
    setTimeout(() => setScanResultAlert(null), 3500);
  };

  // 파일을 Base64 데이터로 변환하는 헬퍼 함수 (한글 주석)
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // 이미지 업로드 및 서버 GPT-4o OCR 엔진 가동 (한글 주석 작성)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 프리뷰 이미지 생성
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    setIsScanning(true);
    setScanProgress(5);
    setScanResultAlert(null);
    setSalaryExtracted(false); // 새 스캔 시작 시 상태 초기화
    setDecisionTaxExtracted(false);

    let progressInterval = null;

    try {
      // 1. 이미지를 Base64 스트링으로 변환
      const base64Image = await fileToBase64(file);
      
      // 2. 스캔 진척바 애니메이션 시뮬레이션 (최대 95%까지 부드럽게 상승)
      let currentProgress = 5;
      progressInterval = setInterval(() => {
        currentProgress += (95 - currentProgress) * 0.15;
        setScanProgress(Math.floor(currentProgress));
      }, 250);

      // 3. 서버의 GPT-4o OCR API 호출
      const response = await fetch('/api/ocr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      clearInterval(progressInterval);
      const data = await response.json();

      if (!response.ok || !data.success) {
        // API 키 누락 등 특수 코드 처리
        if (data.code === 'MISSING_API_KEY') {
          throw new Error('MISSING_API_KEY');
        }
        throw new Error(data.message || '서버 이미지 스캔 실패');
      }

      setScanProgress(100);

      const extractedIncome = data.salary || 0;
      const extractedTax = data.decisionTax || 0;

      // 4. 값 갱신 및 사용자 피드백 제공
      if (extractedIncome > 0 || extractedTax > 0) {
        if (extractedIncome > 0) {
          setSalary(extractedIncome.toLocaleString());
          setSalaryExtracted(true);
        }
        if (extractedTax > 0) {
          setDecisionTax(extractedTax.toLocaleString());
          setDecisionTaxExtracted(true);
        }

        // 28% 추천 기부금도 자동 세팅 계산
        const targetIncome = extractedIncome > 0 ? extractedIncome : getBaseIncome();
        const autoPlanned = Math.floor(targetIncome * 0.28);
        setPlannedDonation(autoPlanned.toLocaleString());

        setScanResultAlert({
          type: 'success',
          title: '초정밀 AI 스캔 완료! 🎉',
          message: `원천징수영수증에서 세무 정보를 정상적으로 인식했습니다.\n• 근로소득금액: ${extractedIncome > 0 ? extractedIncome.toLocaleString() + '원' : '인식 실패 (직접 입력)'}\n• 결정세액: ${extractedTax > 0 ? extractedTax.toLocaleString() + '원' : '인식 실패 (직접 입력)'}\n\n추천 기부액(28%)인 ${autoPlanned.toLocaleString()}원이 자동 설정되었습니다.`
        });
      } else {
        // 성공 응답이지만 금액을 추출하지 못한 경우 리셋 및 실패 경고
        setSalary('');
        setDecisionTax('');
        setSalaryExtracted(false);
        setDecisionTaxExtracted(false);
        setScanResultAlert({
          type: 'warning',
          title: '자동 스캔 결과 미흡 ⚠️',
          message: '이미지의 선명도나 폰트 문제로 금액을 자동으로 추출하지 못했습니다. 아래의 입력란에 직접 금액을 기입해 주세요!'
        });
      }

    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      console.error('OCR 스캔 오류:', error);
      
      // 예외 발생 시 안전하게 화면 리셋
      setSalary('');
      setDecisionTax('');
      setSalaryExtracted(false);
      setDecisionTaxExtracted(false);

      if (error.message === 'MISSING_API_KEY') {
        setScanResultAlert({
          type: 'warning',
          title: 'OpenAI API 키 설정 필요 ⚙️',
          message: '서버 환경 설정(.env)에 OPENAI_API_KEY가 등록되지 않았습니다. 현재 데모 또는 테스트 모드입니다. 수동으로 근로소득금액과 결정세액을 아래 필드에 입력해 주세요!\n\n💡 관리자분께서는 server/.env 파일에 발급받으신 OpenAI API Key를 등록하시면 실시간 AI 스캔 기능이 즉시 활성화됩니다.'
        });
      } else {
        setScanResultAlert({
          type: 'danger',
          title: '스캔 실패 ❌',
          message: '서버에서 영수증을 분석하는 중 에러가 발생했습니다. 직접 소득 금액과 결정세액을 입력해 주세요.'
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden pb-32 font-display relative">
      {/* 레이저 스캔용 인라인 CSS 스타일 삽입 */}
      <style>{`
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
        .scan-laser-line {
          animation: scan-laser 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 p-4 flex items-center h-16 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center text-slate-800 active:scale-90 transition-all hover:bg-slate-50 rounded-full"
        >
          <span className="material-symbols-outlined font-bold text-2xl">arrow_back_ios_new</span>
        </button>
        <h2 className="text-[17px] font-black flex-1 text-center pr-10 text-slate-900 tracking-tight">기부 한도 및 환급액 산출</h2>
      </header>

      <main className="p-5 flex flex-col gap-6">
        {/* 로그인 전 AI OCR 스캐너 유도 안내 카드 */}
        {!isLoggedIn && (
          <section className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-[2rem] p-6 shadow-md border border-indigo-100 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary bg-white p-2.5 rounded-2xl text-xl font-bold shadow-xs">photo_camera</span>
              <div className="flex flex-col">
                <h3 className="text-[15px] font-black text-slate-900 tracking-tight">AI 자동 스캔으로 간편하게 시작하세요!</h3>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">근로소득원천징수 사진 한 장으로 끝</p>
              </div>
            </div>
            <p className="text-[12px] text-slate-600 font-semibold leading-relaxed">
              로그인 후 근로소득원천징수 사진을 업로드하시면, 복잡한 세무 데이터(소득금액 및 결정세액)를 AI가 전광석화처럼 자동으로 읽어 분석해 드립니다!
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-11 bg-white hover:bg-slate-50 text-primary border border-indigo-200 active:scale-95 transition-all rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm font-bold">login</span>
              로그인하고 자동 스캔 사용하기
            </button>
          </section>
        )}

        {/* 국세청 원천징수영수증 이미지 스캔 영역 - 로그인 시에만 노출 */}
        {isLoggedIn && (
          <section className="bg-white rounded-[2rem] p-6 shadow-md border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-black flex items-center gap-2 text-slate-900">
                <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-lg font-bold">photo_camera</span>
                근로소득원천징수 사진 올리고 자동 스캔
              </h3>
              <span className="text-[11px] font-black bg-indigo-50 text-primary border border-indigo-100 px-2 py-0.5 rounded-full">AI 스캐너</span>
            </div>

            {/* 파일 드롭 및 프리뷰 영역 */}
            <div className="relative w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center min-h-[160px] p-4">
              {uploadedImage ? (
                <div className="relative w-full flex flex-col items-center gap-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm max-h-[140px] max-w-[200px]">
                    <img
                      src={uploadedImage}
                      alt="업로드된 원천징수영수증"
                      className="w-full h-auto object-cover"
                    />
                    {/* 스캔 중 빔 애니메이션 */}
                    {isScanning && (
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent scan-laser-line shadow-[0_0_12px_#3713EC]"></div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 w-full justify-center">
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-700 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">zoom_in</span> 크게보기
                    </button>
                    <label className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-sm">cached</span> 재업로드
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isScanning}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center gap-3 py-4 cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-black text-slate-800">근로소득원천징수 사진 업로드</p>
                    <p className="text-[11px] text-slate-400 font-bold mt-1">여기를 클릭하여 사진을 추가해 주세요 (JPG, PNG)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}

              {/* 실시간 스캔 프로그레스 오버레이 */}
              {isScanning && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white z-20">
                  <span className="material-symbols-outlined text-4xl text-primary bg-white p-3 rounded-full animate-bounce mb-3 shadow-[0_0_20px_rgba(255,255,255,0.4)]">center_focus_strong</span>
                  <p className="text-sm font-black tracking-tight mb-2">근로소득원천징수 이미지 분석 중...</p>
                  <div className="w-40 bg-white/20 h-2 rounded-full overflow-hidden shadow-inner mb-2">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300 shadow-[0_0_8px_#3713EC]"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-[11px] font-black text-white/60">{scanProgress}% 스캔 중</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 실시간 알림창 및 피드백 */}
        {scanResultAlert && (
          <div className="flex flex-col gap-4">
            <div className={`rounded-2xl p-4 border animate-in fade-in slide-in-from-top-3 duration-500 shadow-sm ${
              scanResultAlert.type === 'success' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-800' :
              scanResultAlert.type === 'warning' ? 'bg-amber-50/90 border-amber-100 text-amber-800' :
              scanResultAlert.type === 'danger' ? 'bg-rose-50/90 border-rose-100 text-rose-800' :
              'bg-indigo-50/90 border-indigo-100 text-indigo-800'
            }`}>
              <div className="flex gap-2.5">
                <span className="material-symbols-outlined text-xl font-bold shrink-0">
                  {scanResultAlert.type === 'success' ? 'verified' : 
                   scanResultAlert.type === 'warning' ? 'warning' :
                   scanResultAlert.type === 'danger' ? 'error' : 'info'}
                </span>
                <div className="flex-1">
                  <h4 className="text-[14px] font-black tracking-tight">{scanResultAlert.title}</h4>
                  <p className="text-[12px] font-semibold mt-1 whitespace-pre-line leading-relaxed">{scanResultAlert.message}</p>
                </div>
              </div>
            </div>

            {/* 스캔 결과 미흡(warning) 시 나타나는 프리미엄 직접 입력 도우미 컴포넌트 추가 */}
            {scanResultAlert.type === 'warning' && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 flex flex-col gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded-lg text-lg">receipt_long</span>
                  원천징수영수증 항목 위치 도우미 🗺️
                </div>
                
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  원천징수영수증에서 아래의 두 항목을 찾아 수동으로 입력해 주세요. 항목 이름을 누르시면 해당 입력창으로 순간이동(포커싱)합니다!
                </p>

                {/* 미니 가상 영수증 레이아웃 */}
                <div className="relative border border-slate-200 bg-white rounded-2xl p-4 flex flex-col gap-2.5 text-xs font-mono shadow-xs overflow-hidden">
                  <div className="border-b border-dashed border-slate-200 pb-2 text-center font-black text-slate-600 tracking-wider">
                    근로소득 원천징수영수증 양식
                  </div>
                  
                  {/* 근로소득금액 행 */}
                  <div 
                    onClick={() => highlightField('salary')}
                    className="flex justify-between items-center p-2 rounded-xl cursor-pointer bg-primary/[0.03] hover:bg-primary/[0.07] border border-primary/10 hover:border-primary/30 transition-all group"
                  >
                    <span className="font-black text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      [23] 근로소득금액
                    </span>
                    <span className="text-[10px] text-primary font-black bg-primary/10 px-2 py-1 rounded-lg group-hover:translate-x-1 transition-all flex items-center gap-0.5">
                      위치 확인 <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </span>
                  </div>
                  
                  {/* 결정세액 행 */}
                  <div 
                    onClick={() => highlightField('decisionTax')}
                    className="flex justify-between items-center p-2 rounded-xl cursor-pointer bg-rose-500/[0.03] hover:bg-rose-500/[0.07] border border-rose-500/10 hover:border-rose-500/30 transition-all group"
                  >
                    <span className="font-black text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      [72] 결정세액
                    </span>
                    <span className="text-[10px] text-rose-500 font-black bg-rose-50 px-2 py-1 rounded-lg group-hover:translate-x-1 transition-all flex items-center gap-0.5">
                      위치 확인 <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </span>
                  </div>
                </div>
                
                {/* 빠른 샘플 입력 뱃지 */}
                <div className="flex flex-col gap-2 bg-white/60 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-black px-0.5">💡 연습용 샘플 데이터 자동 채우기</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSalary('54,000,000');
                        setDecisionTax('2,100,000');
                        setSalaryExtracted(true); // 샘플 데이터를 추출된 것처럼 상태 설정 (한글 주석)
                        setDecisionTaxExtracted(true);
                        const recom28 = Math.floor(54000000 * 0.28);
                        setPlannedDonation(recom28.toLocaleString());
                        setScanResultAlert({
                          type: 'success',
                          title: '5,400만원 근로자 샘플 적용 완료 💡',
                          message: '23. 근로소득금액: 5,400만원 / 72. 결정세액: 210만원 데이터가 적용되었습니다.'
                        });
                        setTimeout(() => setScanResultAlert(null), 4000);
                      }}
                      className="flex-1 h-9 bg-white border border-slate-200 hover:border-primary/20 hover:bg-primary/[0.02] text-slate-700 rounded-xl text-xs font-black transition-all active:scale-95 shadow-xs"
                    >
                      연소득 5,400만
                    </button>
                    <button
                      onClick={() => {
                        setSalary('88,000,000');
                        setDecisionTax('7,800,000');
                        setSalaryExtracted(true); // 샘플 데이터를 추출된 것처럼 상태 설정 (한글 주석)
                        setDecisionTaxExtracted(true);
                        const recom28 = Math.floor(88000000 * 0.28);
                        setPlannedDonation(recom28.toLocaleString());
                        setScanResultAlert({
                          type: 'success',
                          title: '8,800만원 근로자 샘플 적용 완료 💡',
                          message: '23. 근로소득금액: 8,800만원 / 72. 결정세액: 780만원 데이터가 적용되었습니다.'
                        });
                        setTimeout(() => setScanResultAlert(null), 4000);
                      }}
                      className="flex-1 h-9 bg-white border border-slate-200 hover:border-primary/20 hover:bg-primary/[0.02] text-slate-700 rounded-xl text-xs font-black transition-all active:scale-95 shadow-xs"
                    >
                      연소득 8,800만
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 세무 소득 정보 수동 입력/검증 폼 */}
        <section className="bg-white rounded-[2rem] p-6 shadow-md border border-slate-100 flex flex-col gap-5">
          <h3 className="text-[16px] font-black flex items-center gap-2 text-slate-900">
            <span className="material-symbols-outlined text-indigo-500 bg-indigo-50 p-1.5 rounded-lg text-lg font-bold">feed</span>
            세무 데이터 입력 및 검증
          </h3>

          <div className="flex flex-col gap-4">
            {/* 23. 근로소득금액 */}
            <div id="salary-input-container" className="flex flex-col gap-2 transition-all duration-300">
              <label className="text-[13px] text-slate-500 font-bold px-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  23. 근로소득금액 (세전 비과세 제외)
                </span>
                {salaryExtracted ? (
                  <span className="text-[10px] text-primary bg-primary/5 px-1.5 py-0.5 rounded font-black border border-primary/10 animate-fade-in flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[10px] font-black">check</span> 스캔 추출 완료 🎉
                  </span>
                ) : (
                  salary && salary !== '0' && <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded font-bold border border-slate-200">직접 입력됨</span>
                )}
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => handleMoneyChange(e.target.value, setSalary, setSalaryExtracted)}
                  className={`w-full h-14 bg-slate-50 border-2 rounded-xl px-5 text-xl font-black text-slate-900 focus:bg-white transition-all outline-none ${
                    salaryHighlighted 
                      ? 'border-primary ring-4 ring-primary/10 shadow-[0_0_15px_rgba(55,19,236,0.2)] animate-pulse' 
                      : 'border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5'
                  }`}
                  placeholder="0"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">원</span>
              </div>
            </div>

            {/* 72. 결정세액 */}
            <div id="decision-tax-input-container" className="flex flex-col gap-2 transition-all duration-300">
              <label className="text-[13px] text-slate-500 font-bold px-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                  72. 결정세액 (실제 납부하는 세금)
                </span>
                {decisionTaxExtracted ? (
                  <span className="text-[10px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded font-black border border-rose-100 animate-fade-in flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[10px] font-black">check</span> 스캔 추출 완료 🎉
                  </span>
                ) : (
                  decisionTax && decisionTax !== '0' && <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded font-bold border border-slate-200">직접 입력됨</span>
                )}
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={decisionTax}
                  onChange={(e) => handleMoneyChange(e.target.value, setDecisionTax, setDecisionTaxExtracted)}
                  className={`w-full h-14 bg-slate-50 border-2 rounded-xl px-5 text-xl font-black text-slate-900 focus:bg-white transition-all outline-none ${
                    decisionTaxHighlighted 
                      ? 'border-rose-500 ring-4 ring-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)] animate-pulse' 
                      : 'border-transparent focus:border-rose-500/20 focus:ring-4 focus:ring-rose-500/5'
                  }`}
                  placeholder="0"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">원</span>
              </div>
            </div>
          </div>
        </section>

        {/* 입력 가이드 토글 */}
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
          <div className="flex flex-col gap-4">
            <div 
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center justify-between cursor-pointer group"
            >
              <h3 className="text-[15px] font-black flex items-center gap-2 text-slate-800">
                <span className="material-symbols-outlined text-amber-500 bg-amber-50 p-1.5 rounded-lg text-lg font-bold">tips_and_updates</span>
                원천징수영수증 보는 법 가이드
              </h3>
              <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${showGuide ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </div>

            {showGuide && (
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500 flex flex-col gap-4">
                <div className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                  <img
                    src="/annual_guide.png"
                    alt="원천징수영수증 보는법 가이드"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="flex gap-2.5 bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs text-xs font-semibold text-slate-600 leading-relaxed">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-black text-[10px] shrink-0 h-fit">Tip</span>
                  <p>
                    원천징수영수증의 첫 페이지에서 <span className="text-primary font-black underline">23. 근로소득금액</span>과 두 번째 페이지(혹은 맨 아래)의 <span className="text-rose-500 font-black underline">72. 결정세액</span>을 입력하시면 가장 오차 없는 예상 환급액 산출이 가능합니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 결과 분석 및 환급 대시보드 카드 */}
        <section className="bg-[#111322] rounded-[2.5rem] p-7 shadow-xl text-white relative overflow-hidden group">
          {/* 장식용 그라디언트 구체 */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-primary/20 rounded-full blur-[70px] group-hover:bg-primary/30 transition-all duration-1000"></div>
          <div className="absolute -bottom-20 -left-20 w-36 h-36 bg-indigo-500/15 rounded-full blur-[60px]"></div>

          <div className="flex flex-col gap-6 relative z-10">
            {/* 나의 기부 한도 (30%) 정보 */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-white/40 text-[11px] font-black tracking-widest uppercase">세법상 나의 기부금 한도 (30%)</p>
                <div className="flex items-baseline gap-1.5">
                  <h4 className="text-2xl font-black text-white tracking-tight">{calculateLimit().toLocaleString()}</h4>
                  <span className="text-sm font-bold text-white/30">원</span>
                </div>
              </div>
              <div className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <span className="text-[10px] font-black text-white/60">30% Max</span>
              </div>
            </div>

            {/* 추천 기부액 (28%) 원클릭 적용 */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <p className="text-indigo-400 text-[11px] font-black tracking-widest uppercase mb-1">스마트나눔 추천 기부액 (소득의 28%)</p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-2xl font-black text-indigo-400 tracking-tight">
                      {Math.floor(getBaseIncome() * 0.28).toLocaleString()}
                    </h4>
                    <span className="text-xs font-bold text-indigo-400/80">원</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleApply28Percent}
                className="w-full h-11 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 active:scale-95 transition-all text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] font-bold">auto_awesome</span>
                28% 추천 기부액 자동 적용하기
              </button>
            </div>

            <div className="h-px bg-white/5 w-full"></div>

            {/* 기부 예정 금액 입력 */}
            <div className="flex flex-col gap-3">
              <p className="text-white/40 text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                기부 예정 금액 설정
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={plannedDonation}
                  onChange={(e) => handleMoneyChange(e.target.value, setPlannedDonation)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-2xl font-black text-white focus:bg-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
                  placeholder="0"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-white/30 text-base">원</span>
              </div>
            </div>

            <div className="h-px bg-white/5 w-full"></div>

            {/* 환급액 및 결정세액 한도 비교 분석 */}
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-white/40 text-[11px] font-black tracking-widest uppercase mb-1">세액공제 예상 환급액</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white tracking-tighter">+{expectedRefundRaw.toLocaleString()}</span>
                  <span className="text-sm font-black text-white/30">원</span>
                </div>
              </div>

              {/* 결정세액 한도 검증 피드백 카드 */}
              {isTaxOver ? (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <span className="material-symbols-outlined text-rose-400 text-xl font-black shrink-0">error</span>
                  <div className="flex flex-col gap-1">
                    <p className="text-rose-300 font-black text-[13px]">환급 한도 초과 경고 ⚠️</p>
                    <p className="text-slate-300 text-[11px] font-semibold leading-relaxed">
                      예상 환급액({expectedRefundRaw.toLocaleString()}원)이 고객님의 결정세액({getDecisionTaxVal().toLocaleString()}원)을 초과했습니다. 세법상 기부금 환급은 결정세액 내에서만 가능하므로, 최종 환급액은 결정세액만큼 제한됩니다.
                    </p>
                    <div className="flex items-baseline gap-1 mt-1 bg-rose-500/20 p-2 rounded-lg w-fit">
                      <span className="text-slate-400 text-[10px] font-bold">최종 환급 예상:</span>
                      <span className="text-rose-400 font-black text-sm">{getDecisionTaxVal().toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <span className="material-symbols-outlined text-emerald-400 text-xl font-black shrink-0">check_circle</span>
                  <div className="flex flex-col gap-1">
                    <p className="text-emerald-300 font-black text-[13px]">환급 한도 내 안전 지대 🎉</p>
                    <p className="text-slate-300 text-[11px] font-semibold leading-relaxed">
                      예상 환급액이 고객님의 결정세액({getDecisionTaxVal().toLocaleString()}원) 범위 내에 존재합니다. 세액공제 혜택 {expectedRefundRaw.toLocaleString()}원을 100% 전액 환급(예상)받으실 수 있습니다!
                    </p>
                  </div>
                </div>
              )}

              {/* 최종 실 수령 예상 뱃지 */}
              <div className="bg-gradient-to-r from-primary/30 to-indigo-500/10 border border-primary/30 rounded-2xl p-5 flex justify-between items-center mt-2 shadow-[0_4px_15px_rgba(55,19,236,0.15)]">
                <div>
                  <p className="text-white/40 text-[10px] font-black tracking-widest uppercase">실제 적용 예상 환급액</p>
                  <p className="text-[15px] font-black text-white mt-0.5">최종 세액공제 금액</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-white drop-shadow-[0_0_12px_rgba(55,19,236,0.5)]">
                    {finalRefund.toLocaleString()}
                  </span>
                  <span className="text-xs font-black text-white/50 ml-1">원</span>
                </div>
              </div>

              {/* 로그인 고객 전용 혜택: 예상 물품 대금 */}
              {isLoggedIn && (
                <div className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-4 border border-amber-500/20 relative overflow-hidden group/benefit mt-1">
                  <div className="absolute -right-4 -bottom-4 w-14 h-14 bg-amber-500/5 rounded-full blur-xl"></div>
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="material-symbols-outlined text-[13px] text-amber-400 font-bold">verified</span>
                        <p className="text-amber-400/80 text-[10px] font-black uppercase tracking-widest">Member Reward</p>
                      </div>
                      <p className="text-white/90 text-[14px] font-black">예상 물품 대금 (53%)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                        {calculateGoodsPayment().toLocaleString()}
                      </span>
                      <span className="text-xs font-black text-white/40 ml-1">원</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 안내 사항 */}
        <div className="bg-slate-100/50 rounded-2xl p-5 border border-slate-200/50">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-slate-400 text-lg shrink-0">info</span>
            <div className="flex flex-col gap-1">
              <p className="text-[12px] text-slate-600 font-black">꼭 확인해 주세요!</p>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                * 환급액 산출: 1,000만원 이하 15%, 초과분 30% 적용 기준 (소득세법상 법정/지정기부금 세액공제율 기준)<br />
                * 기부금 예상 환급은 고객의 해당 연도 소득공제 및 세액공제 한도 내(결정세액 한도)에서 최종 확정됩니다.<br />
                * 홈택스 최종 연말정산 시 개인별 세무 요건에 따라 실제 환급액과 일부 차이가 발생할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 하단 탭바 (로그인 시 노출) */}
      {isLoggedIn && <BottomNav />}

      {/* 업로드 이미지 확대 확인 모달 */}
      {showImageModal && uploadedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col justify-between p-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center text-white mt-4">
            <span className="text-sm font-bold">원본 영수증 확인</span>
            <button
              onClick={() => setShowImageModal(false)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* 이미지 컨테이너 (핀치줌 대응 또는 일반 중앙 배치) */}
          <div className="flex-1 flex items-center justify-center overflow-hidden my-4">
            <img
              src={uploadedImage}
              alt="확대된 영수증"
              className="max-w-full max-h-[75dvh] object-contain rounded-lg border border-white/10 shadow-2xl"
            />
          </div>

          <div className="text-center text-white/60 text-xs font-semibold mb-6 flex flex-col gap-2">
            <p>💡 영수증에서 23번 근로소득금액과 72번 결정세액을 눈으로 확인하고</p>
            <p>언제든지 화면의 데이터 입력창에 수동으로 수정 입력하실 수 있습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationLimitScreen;
