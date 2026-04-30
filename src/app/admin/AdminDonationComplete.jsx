import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Search,
  Calendar,
  User,
  UserCheck,
  RefreshCw,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';

/**
 * 기부 완료 처리 관리 페이지 (상태 03 -> 04)
 */
const AdminDonationComplete = () => {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [filters, setFilters] = useState({
    dona_yy: new Date().getFullYear().toString(),
    name: '',
    referral_code: ''
  });

  // 개별 행의 수정 금액 상태 관리
  const [modAmts, setModAmts] = useState({});

  // 상태 모달 제어
  const [statusModal, setStatusModal] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null,
    actionLabel: ''
  });

  const showStatus = (type, title, message, onConfirm = null, actionLabel = '') => {
    setStatusModal({ show: true, type, title, message, onConfirm, actionLabel });
  };

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/donation-complete/list?${query}`);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setTargets(data);
        setSelectedIds([]);
        // 초기 modAmts 설정
        const initialAmts = {};
        data.forEach(t => {
          initialAmts[`${t.cust_no}-${t.dona_yy}-${t.seq_no}`] = t.real_amt;
        });
        setModAmts(initialAmts);
      } else {
        setTargets([]);
      }
    } catch (error) {
      console.error('대상 목록 조회 오류:', error);
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/admin/referrals');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) setReferrals(data);
    } catch (error) {
      console.error('추천인 조회 오류:', error);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [filters.dona_yy]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    fetchTargets();
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (targets.length === 0) return;
    if (selectedIds.length === targets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(targets.map(t => `${t.cust_no}-${t.dona_yy}-${t.seq_no}`));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleModAmtChange = (id, value) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setModAmts(prev => ({ ...prev, [id]: numValue }));
  };

  const processComplete = async () => {
    try {
      setProcessing(true);
      const selectedCustomers = targets
        .filter(t => selectedIds.includes(`${t.cust_no}-${t.dona_yy}-${t.seq_no}`))
        .map(t => ({
          cust_no: t.cust_no,
          dona_yy: t.dona_yy,
          seq_no: t.seq_no,
          mod_amt: modAmts[`${t.cust_no}-${t.dona_yy}-${t.seq_no}`]
        }));

      const response = await fetch('/api/admin/donation-complete/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: selectedCustomers })
      });

      const data = await response.json();
      if (response.ok) {
        fetchTargets();
        showStatus('success', '처리 완료', data.message);
      } else {
        showStatus('error', '처리 실패', data.message || '처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('기부 완료 처리 오류:', error);
      showStatus('error', '오류 발생', '처리 중 예기치 못한 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcess = () => {
    if (selectedIds.length === 0) {
      showStatus('error', '선택 필요', '완료 처리할 대상을 선택해주세요.');
      return;
    }

    showStatus(
      'confirm', 
      '기부 완료 처리 확인', 
      `${selectedIds.length}건의 기부를 완료 처리하시겠습니까?\n환급액 및 물품가액이 자동 계산되어 저장되며 알림톡이 발송됩니다.`,
      processComplete,
      '지금 완료하기'
    );
  };

  const formatAmt = (amt) => Number(amt || 0).toLocaleString();

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= 2025; y--) years.push(y.toString());

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 헤더 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
              <CheckCircle2 size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">기부 완료 처리</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">최종 기부 금액을 확정하고 환급액 계산 및 정산 데이터를 생성합니다.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTargets}
            className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="새로고침"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleProcess}
            disabled={processing || selectedIds.length === 0}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-2xl active:scale-95 ${
              selectedIds.length > 0 
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {processing ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
            {selectedIds.length > 0 ? `${selectedIds.length}건 기부 완료하기` : '처리할 대상 선택'}
          </button>
        </div>
      </div>

      {/* 검색 필터 */}
      <form onSubmit={handleSearch} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2 min-w-[120px]">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">기부 년도</label>
          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
            <select
              value={filters.dona_yy}
              onChange={(e) => setFilters({ ...filters, dona_yy: e.target.value })}
              className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer text-slate-700"
            >
              {years.map(y => <option key={y} value={y}>{y}년도</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">추천인</label>
          <div className="relative group">
            <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
            <select
              value={filters.referral_code}
              onChange={(e) => setFilters({ ...filters, referral_code: e.target.value })}
              className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer text-slate-700"
            >
              <option value="">전체 추천인</option>
              {referrals.map(r => <option key={r.referral_code} value={r.referral_code}>{r.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">고객명</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
            <input
              type="text"
              placeholder="고객명으로 검색..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all outline-none font-bold placeholder:text-slate-300 text-slate-700"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-8 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2"
        >
          <Search size={20} />
          조회하기
        </button>
      </form>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200/50 flex items-center justify-between group">
          <div>
            <p className="text-sm font-bold opacity-60 mb-1">총 대기 건수</p>
            <h3 className="text-3xl font-black">{targets.length}<span className="text-sm ml-1">건</span></h3>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Clock size={28} className="text-slate-400 group-hover:rotate-12 transition-transform" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between group">
          <div>
            <p className="text-sm font-bold text-slate-400 mb-1">총 기부 금액</p>
            <h3 className="text-3xl font-black text-slate-900">
              {formatAmt(targets.reduce((acc, cur) => acc + (cur.real_amt || 0), 0))}원
            </h3>
          </div>
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
            <TrendingUp size={28} className="text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between group">
          <div>
            <p className="text-sm font-bold text-slate-400 mb-1">선택된 금액</p>
            <h3 className="text-3xl font-black text-indigo-600">
              {formatAmt(targets.filter(t => selectedIds.includes(`${t.cust_no}-${t.dona_yy}-${t.seq_no}`)).reduce((acc, cur) => acc + Number(modAmts[`${cur.cust_no}-${cur.dona_yy}-${cur.seq_no}`] || 0), 0))}원
            </h3>
          </div>
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <CreditCard size={28} className="text-indigo-600 group-hover:rotate-12 transition-transform" />
          </div>
        </div>
      </div>

      {/* 메인 테이블 */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-6 w-20 text-center">
                  <button 
                    onClick={handleSelectAll}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      targets.length > 0 && selectedIds.length === targets.length 
                        ? 'bg-slate-900 shadow-lg shadow-slate-200' 
                        : 'bg-white border-2 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {targets.length > 0 && selectedIds.length === targets.length && <Check size={14} className="text-white" strokeWidth={4} />}
                  </button>
                </th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">기부자</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">추천인</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">신청금액</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">실 기부금액(수정가능)</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">상태</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">동작</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="animate-spin text-slate-900" size={40} />
                      <p className="text-slate-400 font-bold">대상 목록을 불러오는 중입니다...</p>
                    </div>
                  </td>
                </tr>
              ) : targets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <CheckCircle2 size={32} />
                      </div>
                      <p className="text-slate-400 font-bold">기부 완료 처리가 필요한 건이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                targets.map((t) => {
                  const id = `${t.cust_no}-${t.dona_yy}-${t.seq_no}`;
                  const isSelected = selectedIds.includes(id);
                  return (
                    <tr 
                      key={id} 
                      className={`group transition-all cursor-pointer ${isSelected ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'}`}
                      onClick={() => handleSelectOne(id)}
                    >
                      <td className="px-8 py-6 text-center">
                        <div className={`mx-auto w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-slate-900 shadow-lg shadow-slate-200' 
                            : 'bg-white border-2 border-slate-300 group-hover:border-slate-400'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[15px] font-black text-slate-900 leading-none">{t.name}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase mt-1.5 tracking-tighter">ID: {t.cust_no}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-black">
                          <UserCheck size={12} />
                          {t.referral_name || '일반'}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <p className="text-sm font-bold text-slate-400 line-through decoration-slate-300">
                          {formatAmt(t.dona_amt)}원
                        </p>
                      </td>
                      <td className="px-6 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2 bg-white border-2 border-slate-100 rounded-xl px-4 py-2 focus-within:border-slate-900 transition-all shadow-sm">
                          <input 
                            type="text" 
                            className="w-32 text-right font-black text-slate-900 outline-none bg-transparent"
                            value={modAmts[id] ? Number(modAmts[id]).toLocaleString() : ''}
                            onChange={(e) => handleModAmtChange(id, e.target.value)}
                          />
                          <span className="text-xs font-black text-slate-400">원</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black">
                          <Clock size={12} />
                          서류 완료
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button className="p-2.5 text-slate-300 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm">
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 프리미엄 상태 모달 */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !statusModal.onConfirm && setStatusModal({ ...statusModal, show: false })} />
          <div className="relative bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300 border border-slate-50">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce ${
              statusModal.type === 'success' 
                ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-emerald-200' 
                : statusModal.type === 'confirm'
                ? 'bg-gradient-to-tr from-slate-800 to-slate-900 shadow-slate-200'
                : 'bg-gradient-to-tr from-rose-400 to-pink-500 shadow-rose-200'
            }`}>
              {statusModal.type === 'success' ? (
                <Check size={48} className="text-white" />
              ) : statusModal.type === 'confirm' ? (
                <CheckCircle2 size={48} className="text-white" />
              ) : (
                <X size={48} className="text-white" />
              )}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{statusModal.title}</h3>
            <p className="text-slate-500 font-bold leading-relaxed whitespace-pre-line mb-10">{statusModal.message}</p>
            
            <div className="flex gap-3">
              {statusModal.type === 'confirm' ? (
                <>
                  <button 
                    onClick={() => setStatusModal({ ...statusModal, show: false })}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    취소
                  </button>
                  <button 
                    onClick={() => {
                      setStatusModal({ ...statusModal, show: false });
                      if (statusModal.onConfirm) statusModal.onConfirm();
                    }}
                    className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
                  >
                    {statusModal.actionLabel || '확인'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setStatusModal({ ...statusModal, show: false })}
                  className={`w-full py-4 font-black rounded-2xl transition-all active:scale-95 shadow-lg ${
                    statusModal.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-100 hover:bg-emerald-600' : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
                  }`}
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

export default AdminDonationComplete;
