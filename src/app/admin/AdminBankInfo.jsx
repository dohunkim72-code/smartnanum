import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  AlertCircle,
  Building2,
  Copy,
  User,
  CreditCard,
  RefreshCcw,
  ShieldAlert
} from 'lucide-react';

/**
 * 입금계좌 관리 페이지
 */
const AdminBankInfo = () => {
  const [bankInfos, setBankInfos] = useState([]);
  const [referrals, setReferrals] = useState([]); // 추천인 목록 상태 추가
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentBank, setCurrentBank] = useState({
    bank_code: '',
    bank_name: '',
    account_no: '',
    account_holder: '',
    referral_code: ''
  });
  const [isNew, setIsNew] = useState(true);

  // 통합 상태 알림 모달
  const [statusModal, setStatusModal] = useState({ 
    show: false, 
    type: 'success', 
    message: '',
    onConfirm: null
  });

  // 데이터 불러오기
  const fetchBankInfos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/bank-info', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setBankInfos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('계좌 조회 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 추천인 목록 불러오기
  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/admin/referrals', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setReferrals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('추천인 조회 오류:', error);
    }
  };

  useEffect(() => {
    fetchBankInfos();
    fetchReferrals(); // 추천인 목록도 함께 호출
  }, []);

  // 저장 처리
  const handleSave = async (e) => {
    e.preventDefault();
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    
    try {
      const method = isNew ? 'POST' : 'PUT';
      const response = await fetch('/api/admin/bank-info', {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...currentBank,
          reg_id: adminInfo.referral_code,
          upd_id: adminInfo.referral_code
        })
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        setStatusModal({
          show: true,
          type: 'success',
          message: isNew ? '새 입금계좌가 등록되었습니다.' : '계좌 정보가 수정되었습니다.'
        });
        fetchBankInfos();
        setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
      } else {
        const result = await response.json();
        setStatusModal({
          show: true,
          type: 'error',
          message: result.message || '저장 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      setStatusModal({
        show: true,
        type: 'error',
        message: '서버와 통신 중 오류가 발생했습니다.'
      });
    }
  };

  // 삭제 처리
  const handleDelete = async (bank_code) => {
    setStatusModal({
      show: true,
      type: 'confirm',
      message: '이 입금계좌 정보를 정말 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/bank-info/${bank_code}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.ok) {
            setStatusModal({
              show: true,
              type: 'success',
              message: '성공적으로 삭제되었습니다.'
            });
            fetchBankInfos();
            setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
          }
        } catch (error) {
          setStatusModal({
            show: true,
            type: 'error',
            message: '삭제 중 오류가 발생했습니다.'
          });
        }
      }
    });
  };

  // 계좌번호 복사 기능
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setStatusModal({
      show: true,
      type: 'success',
      message: '계좌번호가 복사되었습니다.'
    });
    setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 헤더 영역 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="text-blue-600" size={32} />
            입금계좌 관리
          </h1>
          <p className="text-slate-500 mt-1 font-medium ml-11">기부금 수납을 위한 공식 은행 계좌 정보를 관리합니다.</p>
        </div>
        <button 
          onClick={() => {
            setIsNew(true);
            setCurrentBank({ bank_code: '', bank_name: '', account_no: '', account_holder: '', referral_code: '' });
            setIsEditModalOpen(true);
          }}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          <Plus size={20} />
          새 계좌 추가
        </button>
      </div>

      {/* 계좌 카드 리스트 */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">계좌 정보를 불러오는 중입니다...</p>
        </div>
      ) : bankInfos.length === 0 ? (
        <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard size={40} className="text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">등록된 계좌가 없습니다.</h2>
          <p className="text-slate-500 mb-8">기부금을 받을 수 있도록 첫 번째 계좌를 등록해 주세요.</p>
          <button 
            onClick={() => {
              setIsNew(true);
              setCurrentBank({ bank_code: '', bank_name: '', account_no: '', account_holder: '', referral_code: '' });
              setIsEditModalOpen(true);
            }}
            className="text-blue-600 font-bold hover:underline underline-offset-4"
          >
            지금 바로 등록하기 →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bankInfos.map((bank) => (
            <div key={bank.bank_code} className="group bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all relative overflow-hidden">
              {/* 카드 상단 은행 정보 */}
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Building2 size={28} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsNew(false);
                      setCurrentBank(bank);
                      setIsEditModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(bank.bank_code)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* 카드 본문 */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{bank.bank_name}</h3>
                  <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{bank.bank_code}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group-hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CreditCard size={18} className="text-slate-400" />
                      <span className="font-mono text-lg font-bold text-slate-700">{bank.account_no}</span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(bank.account_no)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      title="계좌번호 복사"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 px-1">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={12} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-600">예금주: {bank.account_holder}</span>
                  </div>

                  {bank.referral_code && (
                    <div className="flex items-center gap-3 px-1 mt-1">
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                        <Tag size={12} className="text-amber-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-500">지정 추천인: {bank.referral_code}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 하단 데코레이션 */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-blue-50/50 transition-colors -z-0"></div>
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 모달 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-xl w-full overflow-hidden transform animate-in zoom-in duration-300 border border-white/20">
            <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Building2 size={24} className="text-blue-400" />
                {isNew ? '새 입금계좌 등록' : '계좌 정보 수정'}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!isNew && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">순서 번호</label>
                    <input 
                      type="text"
                      disabled
                      value={currentBank.bank_code}
                      className="w-full px-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-bold text-slate-500"
                    />
                  </div>
                )}
                <div className={`${isNew ? 'col-span-2' : ''} space-y-2`}>
                  <label className="text-sm font-bold text-slate-700 ml-1">은행 명칭</label>
                  <input 
                    type="text"
                    required
                    value={currentBank.bank_name}
                    onChange={(e) => setCurrentBank({...currentBank, bank_name: e.target.value})}
                    placeholder="예: KB국민은행"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">계좌 번호</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    required
                    value={currentBank.account_no}
                    onChange={(e) => setCurrentBank({...currentBank, account_no: e.target.value})}
                    placeholder="하이픈(-) 없이 입력"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">예금주</label>
                  <input 
                    type="text"
                    required
                    value={currentBank.account_holder}
                    onChange={(e) => setCurrentBank({...currentBank, account_holder: e.target.value})}
                    placeholder="예: (주)스마트나눔"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">연결 추천인</label>
                  <select 
                    value={currentBank.referral_code}
                    onChange={(e) => setCurrentBank({...currentBank, referral_code: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer"
                  >
                    <option value="">공용 계좌 (추천인 없음)</option>
                    {Array.isArray(referrals) && referrals.map((ref) => (
                      <option key={ref?.referral_code || Math.random()} value={ref?.referral_code || ''}>
                        {ref?.name || 'Unknown'} ({ref?.referral_code || '-'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  {isNew ? '계좌 등록하기' : '수정 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 통합 상태 알림 모달 */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-[40px] shadow-2xl max-w-sm w-full text-center transform animate-in zoom-in duration-300">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
              statusModal.type === 'success' ? 'bg-blue-500 shadow-blue-200' : 
              statusModal.type === 'error' ? 'bg-rose-500 shadow-rose-200' : 'bg-amber-500 shadow-amber-200'
            }`}>
              {statusModal.type === 'success' ? <Check size={40} className="text-white" /> : 
               statusModal.type === 'error' ? <AlertCircle size={40} className="text-white" /> : <ShieldAlert size={40} className="text-white" />}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {statusModal.type === 'success' ? '완료' : statusModal.type === 'error' ? '오류' : '확인'}
            </h3>
            <p className="text-slate-600 font-medium">{statusModal.message}</p>
            <div className="mt-8 flex gap-3">
              {statusModal.type === 'confirm' ? (
                <>
                  <button 
                    onClick={() => setStatusModal(prev => ({ ...prev, show: false }))}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    취소
                  </button>
                  <button 
                    onClick={() => {
                      statusModal.onConfirm();
                      setStatusModal(prev => ({ ...prev, show: false }));
                    }}
                    className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                  >
                    삭제
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setStatusModal(prev => ({ ...prev, show: false }))}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  확인
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 태그 아이콘 정의 (lucide-react Tag 임포트 대신 직접 정의 가능하나 여기서는 lucide-react 사용 권장)
const Tag = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
);

export default AdminBankInfo;
