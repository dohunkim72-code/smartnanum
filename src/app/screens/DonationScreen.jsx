import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SignaturePadModule from 'react-signature-canvas';
import BottomNav from '../components/BottomNav';

// 라이브러리 구조에 따른 대응 (Vite/ESM 대응 최적화)
let SignatureCanvas = SignaturePadModule;
if (SignaturePadModule && SignaturePadModule.default) {
  SignatureCanvas = SignaturePadModule.default;
}

// 만약 그래도 함수가 아니라면 (드문 경우 대비)
if (typeof SignatureCanvas !== 'function' && SignaturePadModule && typeof SignaturePadModule === 'object') {
  // 모듈 객체 내에서 첫 번째 함수형 속성을 찾거나 하는 등의 폴백 (보통은 위에서 해결됨)
}

console.log('SignatureCanvas 로드 상태:', typeof SignatureCanvas, SignatureCanvas);

/**
 * 기부금 신청 화면 컴포넌트입니다.
 * 아라부장님의 요청에 따라 DB 연동 및 로직을 대폭 강화했습니다! ✨
 */
const DonationScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const userId = localStorage.getItem('userId');

  // 폼 상태 관리 (localStorage에서 사용자 정보를 즉시 가져와 초기화)
  const [formData, setFormData] = useState(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const savedTemp = localStorage.getItem('donation_temp_form');
    const parsedTemp = savedTemp ? JSON.parse(savedTemp) : {};
    
    // 기본 사용자 정보 (로그인 시 저장된 데이터 활용)
    return {
      cust_no: user.cust_no || parsedTemp.cust_no || '',
      name: user.name || localStorage.getItem('userName') || parsedTemp.name || '',
      residentIdFront: parsedTemp.residentIdFront || '',
      residentIdBack: parsedTemp.residentIdBack || '',
      addressZip: parsedTemp.addressZip || '',
      addressBasic: parsedTemp.addressBasic || '',
      addressDetail: parsedTemp.addressDetail || '',
      phone: user.hpno || localStorage.getItem('userHpno') || parsedTemp.phone || '',
      company: parsedTemp.company || '',
      amount: parsedTemp.amount || '', // 기부 금액 (임시 저장된 값이 있으면 복원)
      cashReceipt: false, // 현금영수증 신청 기능 비활성화로 인한 false 고정 (한글 주석)
      termsAgreed: localStorage.getItem('termsAgreed_status') === 'true',
      note: user.note || localStorage.getItem('userNote') || parsedTemp.note || '', // 사인자(소개자) 성명
      seq_no: null // 수정 시 사용할 일련번호
    };
  });

  const [initData, setInitData] = useState({
    user: null,
    endDate: null,
    master: null,
    details: [], // 금년도 상세 내역 리스트
    isCurrentYear: false
  });

  const [isClosed, setIsClosed] = useState(false);
  const [hasUnpaid, setHasUnpaid] = useState(false);

  // 서버에서 데이터 가져오기
  const fetchInitData = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/donation/init-data?id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        
        // 메타 데이터 저장 (마감일, 마스터, 상세 리스트 등)
        setInitData({
          user: data.user,
          endDate: data.endDate,
          master: data.master,
          details: data.details || [],
          isCurrentYear: data.isCurrentYear
        });

        setIsClosed(!!data.isClosed);
        setHasUnpaid(!!data.hasUnpaid);

        setFormData(prev => {
          const user = data.user || {};
          const master = data.master;
          
          // 서버 데이터가 있다면 업데이트 (없다면 기존 로컬 데이터 유지)
          // 단, 현재 수정 중(seq_no 존재)인 경우에는 덮어쓰지 않음
          if (prev.seq_no) return prev;

          return {
            ...prev,
            cust_no: user.cust_no || prev.cust_no,
            name: user.name || prev.name,
            phone: user.hpno || prev.phone,
            note: user.note || prev.note,
            
            // 마스터 정보가 있고, 현재 주소 정보가 없는 경우에만 자동 채우기 (기본 정보 세팅용)
            ...(!prev.addressBasic && master ? {
              residentIdFront: master.jmin1 || prev.residentIdFront,
              residentIdBack: master.jmin2 || prev.residentIdBack,
              addressZip: master.zipcode || prev.addressZip,
              addressBasic: master.address || prev.addressBasic,
              addressDetail: master.address_detail || prev.addressDetail,
              phone: master.hpno || prev.phone
            } : {})
          };
        });
      }
    } catch (error) {
      console.error('초기 데이터 로딩 실패:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchInitData();
    }
    
    // 외부(신청 내역 조회 등)에서 수정 모드로 진입한 경우 처리 ✏️
    if (location.state?.editItem) {
      handleDetailClick(location.state.editItem);
      // 처리가 끝나면 state 초기화 (뒤로가기 시 중복 방지)
      window.history.replaceState({}, document.title);
    }
  }, [location.pathname]); // 화면 진입 시마다 실행

  // 약관 동의 상태는 수동으로도 체크 (탭 이동 시 반영)
  useEffect(() => {
    const isAgreed = localStorage.getItem('termsAgreed_status') === 'true';
    if (isAgreed !== formData.termsAgreed) {
      setFormData(prev => ({ ...prev, termsAgreed: isAgreed }));
    }
  }, [location, formData.termsAgreed]);

  // 서명 레퍼런스 및 상태
  const sigCanvas = useRef({});
  const [isSigned, setIsSigned] = useState(false);

  // 서명 초기화 함수
  const clearSignature = () => {
    sigCanvas.current.clear();
    setIsSigned(false);
  };

  const handleSignatureEnd = () => {
    if (!sigCanvas.current.isEmpty()) {
      setIsSigned(true);
    }
  };

  const formatComma = (val) => {
    const num = val.replace(/[^0-9]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 주민등록번호 정합성 체크 함수
  const validateResidentId = (front, back) => {
    if (!/^\d{6}$/.test(front) || !/^\d{7}$/.test(back)) return false;
    const id = front + back;
    const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(id[i]) * weights[i];
    }
    const check = (11 - (sum % 11)) % 10;
    return check === parseInt(id[12]);
  };

  const handleInputChange = (e) => {
    if (isClosed) return; // 마감 시 입력 차단

    const { name, value, type, checked } = e.target;
    
    // 수정 모드인데 step_code가 01이 아닌 경우(사실 리스트에서 막겠지만 한번 더 체크)
    // 여기선 일단 seq_no가 있을 때 필드 수정을 허용할지 결정
    
    if (name === 'amount') {
      setFormData(prev => ({ ...prev, [name]: formatComma(value) }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // 내역 클릭 시 폼에 데이터 세팅 (수정 모드)
  const handleDetailClick = (detail) => {
    if (isClosed) return;

    // 01(신청완료) 상태만 수정 가능, 나머지는 알림 후 조회만
    if (detail.step_code !== '01') {
      showAlert('알림', '이미 처리가 진행된 내역(승인/반려 등)은 수정할 수 없습니다. 🔒', 'info');
      
      // 조회 모드로 세팅 (seq_no는 넣지 않음으로써 저장을 막거나 조회 전용 처리 가능)
      // 여기서는 그냥 값만 보여줌
    }

    setFormData(prev => ({
      ...prev,
      seq_no: detail.step_code === '01' ? detail.seq_no : null,
      amount: formatComma(detail.dona_amt.toString()),
      company: detail.company_name,
      cashReceipt: false, // 수정 모드에서도 현금영수증 신청은 강제 false 처리 (한글 주석)
      // 마스터 정보는 기존 폼 데이터에 이미 있을 확률이 높지만, 확실히 하기 위해 
      // 만약 마스터 정보가 필요하다면 여기서 더 보강 가능
    }));

    // 화면 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 폼 초기화 (신규 신청 모드로 전환)
  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      seq_no: null,
      amount: '',
      company: '',
      cashReceipt: false
    }));
    clearSignature();
  };

  const handleAddressSearch = () => {
    if (isClosed) return;
    new window.daum.Postcode({
      oncomplete: (data) => {
        let fullAddr = data.address;
        setFormData(prev => ({
          ...prev,
          addressZip: data.zonecode,
          addressBasic: fullAddr
        }));
      },
    }).open();
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => {
    setModal({ show: true, title, message, type });
  };

  const closeAlert = () => {
    setModal(prev => ({ ...prev, show: false }));
  };

  const handleSubmit = async () => {
    if (isClosed) {
      showAlert('알림', '신청 기간이 마감되었습니다. 🛑', 'error');
      return;
    }

    if (hasUnpaid) {
      showAlert('알림', '이전 연도 기부금의 입금이 완료 되어야 신청이 가능 합니다. 💰', 'info');
      return;
    }
    
    // 필수 항목 검증
    if (!formData.residentIdFront || !formData.residentIdBack) {
      showAlert('알림', '주민등록번호를 입력해 주세요! 🪪', 'info');
      return;
    }
    if (!validateResidentId(formData.residentIdFront, formData.residentIdBack)) {
      showAlert('오류', '올바른 주민등록번호가 아닙니다. 다시 확인해 주세요! ❌', 'error');
      return;
    }
    if (!formData.addressBasic || !formData.addressDetail) {
      showAlert('알림', '주소를 정확히 입력해 주세요! 🏠', 'info');
      return;
    }
    if (!formData.phone) {
      showAlert('알림', '휴대폰 번호를 입력해 주세요! 📱', 'info');
      return;
    }
    if (!formData.amount || formData.amount === '0') {
      showAlert('알림', '기부 금액을 입력해 주세요! 💰', 'info');
      return;
    }

    // --- 기부금 최소 금액 검증 (1,000만원 이상) ---
    const currentAmount = parseInt(formData.amount.replace(/,/g, '')) || 0;
    const existingTotal = initData.master ? initData.master.total_dona_amt : 0;
    let projectedTotal = existingTotal + currentAmount;
    
    // 수정 모드일 경우 기존 금액을 차감하고 계산
    if (formData.seq_no) {
      const oldItem = initData.details.find(d => d.seq_no === formData.seq_no);
      const oldAmount = oldItem ? oldItem.dona_amt : 0;
      projectedTotal = existingTotal - oldAmount + currentAmount;
    }

    if (projectedTotal < 10000000) {
      showAlert('알림', '해당 년도 총 기부 합계 금액은 1,000만원 이상이어야 합니다. 💰', 'info');
      return;
    }
    // ------------------------------------------

    if (!formData.termsAgreed) {
      showAlert('알림', '약관 내용보기를 클릭하여 전체 동의를 완료해 주세요! 📋', 'info');
      return;
    }
    if (!isSigned) {
      showAlert('알림', '서명을 완료해 주세요! ✍️', 'info');
      return;
    }
    
    if (!formData.cust_no) {
      showAlert('알림', '회원 정보(회원번호)를 불러오지 못했습니다. 다시 로그인해 주세요. 👤', 'error');
      return;
    }
    
    try {
      // 상세 동의 내역 가져오기
      const agreementDetailsStr = localStorage.getItem('termsAgreed_details');
      const agreementDetails = agreementDetailsStr ? JSON.parse(agreementDetailsStr) : {};
      
      // 서명 데이터 추출 (정밀 진단 로그 추가)
      console.log('handleSubmit 시작 - 서명 데이터 추출 시도');
      console.log('sigCanvas.current 상태:', sigCanvas.current);
      
      if (!sigCanvas.current) {
        throw new Error('서명 패드 인스턴스를 찾을 수 없습니다.');
      }

      let signatureData = '';
      try {
        // 라이브러리 내부에서 에러가 나는 getTrimmedCanvas 대신,
        // 원본 캔버스 객체에 직접 접근하여 데이터를 가져옵니다. (가장 확실한 방법!)
        const canvas = sigCanvas.current.getCanvas();
        if (canvas && typeof canvas.toDataURL === 'function') {
          console.log('원본 캔버스에서 데이터 추출 시도');
          signatureData = canvas.toDataURL('image/png');
        } else {
          // 최후의 수단: 내부 변수 _canvas에 직접 접근
          const internalCanvas = sigCanvas.current._canvas;
          if (internalCanvas && typeof internalCanvas.toDataURL === 'function') {
            console.log('내부 _canvas에서 데이터 추출 시도');
            signatureData = internalCanvas.toDataURL('image/png');
          } else {
            throw new Error('캔버스 객체를 찾을 수 없습니다.');
          }
        }
      } catch (sigError) {
        console.error('서명 데이터 추출 중 에러:', sigError);
        throw new Error(`서명 처리 중 오류 발생: ${sigError.message}`);
      }
      
      console.log('서명 데이터 추출 성공 (길이):', signatureData.length);
      
      const payload = { 
        ...formData, 
        id: userId,
        signature: signatureData, // 서명 데이터 추가
        // agree1 ~ agree13 매핑
        agree1: agreementDetails.term1 ? 'Y' : 'N',
        agree2: agreementDetails.term2 ? 'Y' : 'N',
        agree3: agreementDetails.term3 ? 'Y' : 'N',
        agree4: agreementDetails.term4 ? 'Y' : 'N',
        agree5: agreementDetails.term5 ? 'Y' : 'N',
        agree6: agreementDetails.term6 ? 'Y' : 'N',
        agree7: agreementDetails.term7 ? 'Y' : 'N',
        agree8: agreementDetails.term8 ? 'Y' : 'N',
        agree9: agreementDetails.term9 ? 'Y' : 'N',
        agree10: agreementDetails.term10 ? 'Y' : 'N',
        agree11: agreementDetails.term11 ? 'Y' : 'N',
        agree12: agreementDetails.term12 ? 'Y' : 'N',
        agree13: agreementDetails.term13 ? 'Y' : 'N'
      };

      const response = await fetch('/api/donation/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const resData = await response.json();
      
      if (response.ok) {
        setShowSuccess(true);
        localStorage.removeItem('donation_temp_form');
        localStorage.removeItem('termsAgreed_status');
        
        // 2초 후 대시보드로 이동 (아라부장님 요청사항)
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/dashboard');
        }, 2000);
      } else {
        showAlert('오류', resData.message + (resData.detail ? `\n(${resData.detail})` : ''), 'error');
      }
    } catch (error) {
      showAlert('오류', `서버 통신 실패: ${error.message}\n(네트워크 연결이나 서버 용량 설정을 확인해 주세요)`, 'error');
    }
  };

  // 기부 신청 취소 처리 함수 (한글 주석)
  const handleCancelClick = async (item) => {
    if (item.step_code !== '01') {
      showAlert('알림', '기부요청 상태인 경우만 취소할 수 있습니다. 🔒', 'info');
      return;
    }

    if (window.confirm(`${item.company_name}의 ${formatComma(item.dona_amt.toString())}원 기부 신청을 취소하시겠습니까?`)) {
      try {
        const response = await fetch('/api/donation/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userId,
            year: item.dona_yy,
            seqNo: item.seq_no
          })
        });

        const resData = await response.json();

        if (response.ok) {
          showAlert('성공', '기부 신청이 성공적으로 취소되었습니다. 🗑️', 'success');
          // 현재 취소한 항목이 수정 폼에 올라와 있다면 폼 초기화 (한글 주석)
          if (formData.seq_no === item.seq_no) {
            resetForm();
          }
          // 초기 데이터 다시 불러와 화면 갱신 (한글 주석)
          fetchInitData();
        } else {
          showAlert('오류', resData.message, 'error');
        }
      } catch (error) {
        showAlert('오류', `취소 처리 중 오류가 발생했습니다: ${error.message}`, 'error');
      }
    }
  };

  return (

    <div className="bg-background-light min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden pb-40">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center text-[#100d1b] active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">기부금 신청하기</h2>
      </header>

      <main className="p-4 flex flex-col gap-8">
        {/* 마감 안내 배너 */}
        {isClosed ? (
          <section className="rounded-3xl bg-red-500 p-6 text-white shadow-lg animate-pulse">
            <h3 className="text-lg font-black leading-tight">신청 기간이 마감되었습니다 🛑</h3>
            <p className="mt-1 text-sm font-medium text-white/90">올해 기부금 신청이 종료되었습니다. ({initData.endDate})</p>
          </section>
        ) : (
          <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-lg">
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-black leading-tight">연말정산 기부금<br/>간편 발급 서비스</h3>
              {hasUnpaid ? (
                <p className="mt-2 text-sm font-medium text-amber-300 animate-pulse">
                  이전 연도 미납 내역이 있습니다. 입금 후 신청 가능합니다. ⚠️
                </p>
              ) : (
                <p className="mt-2 text-sm font-medium text-white/80">
                  {initData.endDate ? `마감일: ${initData.endDate} ⏳` : '소득공제를 위한 정보를 입력해 주세요.'}
                </p>
              )}
            </div>
          </section>
        )}

        {/* 기부자 정보 섹션 */}
        <section className="flex flex-col gap-4 opacity-100 transition-opacity">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-primary">person</span>
            <h4 className="text-base font-bold text-slate-800">기부자 정보</h4>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-5">
            {/* 이름 (읽기전용) */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 font-bold px-1">기부자 성명</p>
              <input 
                type="text"
                value={formData.name}
                readOnly
                className="w-full h-14 bg-slate-100 border-none rounded-2xl px-4 font-bold text-slate-500 cursor-not-allowed"
                title="성명은 수정할 수 없습니다."
              />
            </div>

            {/* 주민번호 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 font-bold px-1">주민등록번호</p>
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  name="residentIdFront"
                  maxLength={6}
                  value={formData.residentIdFront}
                  onChange={handleInputChange}
                  readOnly={isClosed}
                  autoComplete="off"
                  className="w-[120px] h-14 bg-slate-50 border-none rounded-2xl px-4 text-center font-bold text-slate-700 focus:ring-2 focus:ring-primary/20"
                  placeholder="앞 6자리"
                />
                <span className="text-slate-300">-</span>
                <input 
                  type="password"
                  name="residentIdBack"
                  maxLength={7}
                  value={formData.residentIdBack}
                  onChange={handleInputChange}
                  readOnly={isClosed}
                  autoComplete="new-password"
                  className="w-[140px] h-14 bg-slate-50 border-none rounded-2xl px-4 text-center font-bold text-slate-700 focus:ring-2 focus:ring-primary/20"
                  placeholder="뒤 7자리"
                />
              </div>
            </div>

            {/* 주소 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 font-bold px-1">주소</p>
              <div className="flex gap-2">
                <input 
                  type="text"
                  name="addressZip"
                  value={formData.addressZip}
                  readOnly
                  className="w-24 h-14 bg-slate-50 border-none rounded-2xl px-4 text-center font-bold text-slate-700"
                  placeholder="우편번호"
                />
                <button 
                  onClick={handleAddressSearch}
                  disabled={isClosed}
                  className="flex-1 h-14 bg-slate-100 text-slate-600 font-bold rounded-2xl text-sm active:scale-95 transition-all hover:bg-slate-200 disabled:opacity-50"
                >
                  주소 검색
                </button>
              </div>
              <input 
                type="text"
                name="addressBasic"
                value={formData.addressBasic}
                readOnly
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-medium text-slate-700"
                placeholder="기본 주소"
              />
              <input 
                type="text"
                name="addressDetail"
                value={formData.addressDetail}
                onChange={handleInputChange}
                readOnly={isClosed}
                className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-4 font-medium text-slate-700 focus:ring-2 focus:ring-primary/20"
                placeholder="상세 주소 입력"
              />
            </div>

            {/* 연락처 및 소개자 */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-slate-500 font-bold px-1">휴대폰 번호</p>
                  <input 
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    readOnly={isClosed}
                    className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary/20"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-500 font-bold px-1">회사명 (선택)</p>
                <input 
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  readOnly={isClosed}
                  className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-4 font-medium text-slate-700 focus:ring-2 focus:ring-primary/20"
                  placeholder="근무 중인 회사명 입력"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 기부 정보 섹션 */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-primary">redeem</span>
            <h4 className="text-base font-bold text-slate-800">기부 상세 정보</h4>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 font-bold px-1">기부 금액</p>
              <div className="relative">
                <input 
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  readOnly={isClosed}
                  className="w-full h-16 bg-slate-50 border-none rounded-2xl px-5 text-xl font-black text-primary text-right pr-12 focus:ring-2 focus:ring-primary/20"
                  placeholder="0"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">원</span>
              </div>
            </div>

            {/* 현금영수증 신청 기능 화면 숨김 처리 (한글 주석) */}
            {/* 
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-2xl hover:bg-slate-50 transition-colors">
              <input 
                type="checkbox"
                name="cashReceipt"
                checked={formData.cashReceipt}
                onChange={handleInputChange}
                disabled={isClosed}
                className="size-6 rounded-lg border-slate-200 text-primary focus:ring-primary"
              />
              <span className="text-sm font-bold text-slate-700">현금영수증 신청</span>
            </label>
            */}

            {/* 수정 모드 알림 뱃지 */}
            {formData.seq_no && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-700">
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span className="text-xs font-bold">기존 내역 수정 중</span>
                </div>
                <button 
                  onClick={resetForm}
                  className="text-xs font-black text-amber-800 underline underline-offset-2"
                >
                  취소하고 신규 신청
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 유의사항 섹션 (이미지 기반 정확한 문구 및 글자 크기 확대) */}
        <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 shadow-sm">
          <h5 className="text-[16px] font-black text-slate-800 mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600 text-[20px]">info</span>
            유의사항
          </h5>
          <ul className="flex flex-col gap-4">
            <li className="text-[16px] text-primary leading-relaxed flex gap-2 font-black">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>해당 년도 총 기부 합계 금액은 최소 1,000만원 이상이어야 합니다.</span>
            </li>
            <li className="text-[16px] text-slate-600 leading-relaxed flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>타 기부금이 있으신 경우 기부신청시 기부금액 만큼 제외 후 신청해 주세요.</span>
            </li>
            <li className="text-[16px] text-slate-600 leading-relaxed flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>기부 신청금액이 결정 세액보다 많은 경우, 기부금이 이월 될 수 있습니다.</span>
            </li>
            <li className="text-[16px] text-slate-600 leading-relaxed flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>기부금 외 타 공제율이 높은 경우, 기부금이 이월 될 수 있습니다.</span>
            </li>
            <li className="text-[16px] text-slate-600 leading-relaxed flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>이월된 기부금에 대해서는 본인 책임으로, 물품대금은 완납하셔야 합니다.</span>
            </li>
          </ul>
        </div>

        {/* 하단 동의 및 서명 섹션 */}
        <div className="flex flex-col gap-6 mt-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  name="termsAgreed"
                  checked={formData.termsAgreed}
                  readOnly
                  className="size-6 rounded-lg border-slate-200 text-primary focus:ring-primary transition-all pointer-events-none"
                />
                <span className="text-base font-black text-slate-800">약관 동의</span>
              </label>
              <button 
                onClick={() => {
                  // 현재 입력 데이터 임시 저장
                  localStorage.setItem('donation_temp_form', JSON.stringify(formData));
                  navigate('/terms');
                }}
                className="text-[13px] text-slate-400 font-bold underline underline-offset-4 hover:text-primary transition-colors"
              >
                내용보기
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 font-bold px-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">draw</span>
              신청인 서명
            </p>

            <div className="mb-1 space-y-1 px-1">
              <p className="text-slate-400 text-[13px] font-medium">날짜: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: '2-digit' })}</p>
              <p className="text-[#100d1b] text-[15px] font-bold">기부자 성명 : {formData.name}</p>
            </div>

            <div className="relative group">
              <div 
                className={`w-full h-40 rounded-3xl border-2 border-dashed overflow-hidden transition-all ${
                  isSigned 
                  ? 'bg-primary/5 border-primary shadow-inner' 
                  : 'bg-slate-50 border-slate-200 hover:border-primary/30'
                }`}
              >
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="#3713ec"
                  canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                  onEnd={handleSignatureEnd}
                />
                {!isSigned && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-2 opacity-40">
                    <span className="material-symbols-outlined text-4xl">gesture</span>
                    <p className="text-sm font-bold">여기에 서명해 주세요</p>
                  </div>
                )}
              </div>
              <button 
                onClick={clearSignature}
                disabled={isClosed}
                className="absolute right-4 top-4 size-10 bg-white/90 backdrop-blur-md rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:shadow-lg transition-all active:scale-90 z-10 disabled:opacity-0"
              >
                <span className="material-symbols-outlined text-[22px]">refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button 
            onClick={handleSubmit}
            disabled={isClosed}
            className={`w-full h-16 rounded-3xl font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] ${
              isClosed 
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
              : formData.seq_no 
                ? 'bg-amber-500 text-white hover:bg-amber-600' 
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {isClosed ? '신청 기간 마감' : formData.seq_no ? '기부 내역 수정하기 ✏️' : '기부금 신청하기 🚀'}
          </button>
        </div>

        {/* 금년도 신청 내역 리스트 (아라부장님 요청) */}
        <section className="mt-12 -mx-4 px-6 py-10 bg-white rounded-t-[48px] shadow-[0_-12px_40px_-15px_rgba(0,0,0,0.05)] border-t border-slate-50">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex flex-col">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">금년도 신청 리스트</h4>
              <p className="text-[11px] text-slate-400 font-medium">내역을 클릭하면 수정할 수 있습니다. (접수완료 건만 가능)</p>
            </div>
            {initData.master && (
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold mb-0.5">총 합계</p>
                <p className="text-[13px] font-black text-primary">{formatComma(initData.master.total_dona_amt.toString())}원</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-4">
            {initData.details && initData.details.length > 0 ? (
              initData.details.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => handleDetailClick(item)}
                  className={`group p-5 rounded-[28px] border transition-all active:scale-95 cursor-pointer flex items-center justify-between ${
                    formData.seq_no === item.seq_no 
                    ? 'bg-primary/5 border-primary shadow-md' 
                    : 'bg-white border-slate-100 hover:border-primary/20 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-12 rounded-2xl flex items-center justify-center ${
                      formData.seq_no === item.seq_no ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-[24px]">
                        {item.step_code === '01' ? 'edit_note' : 'task_alt'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-slate-800 mb-0.5">{item.company_name}</p>
                      <p className="text-[11px] text-slate-400 font-bold">
                        {new Date(item.reg_date).toLocaleDateString()} · {item.receipt_yn === 'Y' ? '영수증O' : '영수증X'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-[15px] font-black text-slate-900 mb-0.5">
                      {formatComma(item.dona_amt.toString())}원
                    </p>
                    <div className="flex items-center gap-1.5">
                      {item.step_code === '01' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // 수정 모드 전환 방지 (한글 주석)
                            handleCancelClick(item);
                          }}
                          className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-black border border-red-200 transition-colors"
                        >
                          취소
                        </button>
                      )}
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-md ${
                        item.step_code === '01' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        <span className="text-[9px] font-black">
                          {item.step_code === '01' ? '기부요청' : item.step_code === '02' ? '승인완료' : '처리중'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-40">
                <span className="material-symbols-outlined text-5xl">inventory_2</span>
                <p className="text-sm font-bold">올해 신청 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {isLoggedIn && <BottomNav />}

      {/* 성공 팝업 */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"></div>
          <div className="relative bg-white rounded-[40px] p-10 shadow-2xl flex flex-col items-center gap-6 w-full max-w-[340px] animate-zoom-in border border-white/20">
            <div className="relative size-24 bg-gradient-to-tr from-primary to-[#6e4ff5] rounded-full flex items-center justify-center shadow-xl">
              <span className="material-symbols-outlined text-white text-5xl font-bold animate-bounce">volunteer_activism</span>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">신청 완료!</h3>
              <p className="text-[15px] font-medium text-slate-500 leading-relaxed">기부 신청이 정상 접수되었습니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 알림 모달 */}
      {modal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAlert}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-[340px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                modal.type === 'success' ? 'bg-green-100 text-green-500' : 
                modal.type === 'error' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'
              }`}>
                <span className="material-symbols-outlined text-4xl">{modal.type === 'success' ? 'check_circle' : modal.type === 'error' ? 'error' : 'info'}</span>
              </div>
              <h3 className="text-xl font-bold text-[#100d1b] mb-2">{modal.title}</h3>
              <p className="text-[#594c9a] text-sm whitespace-pre-wrap">{modal.message}</p>
            </div>
            <button onClick={closeAlert} className="w-full py-4 bg-slate-50 text-[#100d1b] font-bold border-t">확인</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationScreen;
