import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  UserCheck,
  RefreshCw,
  ChevronRight,
  ArrowRight,
  Package,
  History,
  CheckSquare,
  Square,
  Check,
  X,
  PenTool,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  ListFilter
} from 'lucide-react';

/**
 * 기부금 생성 관리 페이지 (재고 매칭 및 출고 처리)
 */
const AdminDonationCreate = () => {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [results, setResults] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [filters, setFilters] = useState({
    dona_yy: new Date().getFullYear().toString(),
    referral_code: '',
    pre_deposit_yn: 'all' // 선수금 입금 여부 필터 (all, Y, N)
  });

  // 상태 모달 제어
  const [statusModal, setStatusModal] = useState({
    show: false,
    type: 'success', // 'success', 'error', 'confirm', 'warning'
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
      const response = await fetch(`/api/admin/donations/create-list?${query}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setTargets(data);
        setSelectedIds([]); // 목록 갱신 시 선택 초기화
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
      const response = await fetch('/api/admin/referrals', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
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
  }, [filters.dona_yy, filters.referral_code, filters.pre_deposit_yn]);

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (targets.length === 0) return;
    
    if (selectedIds.length === targets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(targets.filter(t => t && t.cust_no).map(t => `${t.cust_no}-${t.dona_yy}-${t.seq_no}`));
    }
  };

  const handleSelectOne = (id) => {
    if (!id) return;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const processGeneration = async () => {
    try {
      setProcessing(true);
      const selectedCustomers = targets.filter(t => 
        t && t.cust_no && selectedIds.includes(`${t.cust_no}-${t.dona_yy}-${t.seq_no}`)
      );

      const response = await fetch('/api/admin/donations/generate-release', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          customers: selectedCustomers,
          reg_id: JSON.parse(localStorage.getItem('adminInfo') || '{}').id || 'admin'
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data.results);
        fetchTargets(); // 목록 새로고침
        showStatus('success', '처리 완료', `${selectedIds.length}건의 기부 생성이 완료되었습니다.`);
      } else {
        showStatus('error', '처리 실패', data.message || '처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('기부금 생성 처리 오류:', error);
      showStatus('error', '오류 발생', '처리 중 예기치 못한 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = () => {
    if (selectedIds.length === 0) {
      showStatus('error', '선택 필요', '처리할 대상을 선택해주세요.');
      return;
    }

    showStatus(
      'confirm', 
      '기부 생성 확인', 
      `${selectedIds.length}건의 기부 생성을 진행하시겠습니까?\n이 작업은 재고를 매칭하고 출고 기록을 생성합니다.`,
      processGeneration,
      '지금 생성하기'
    );
  };

  const formatAmt = (amt) => {
    const num = Number(String(amt || 0).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  // 년도 필터 (2025~현재)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= 2025; y--) years.push(y.toString());

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 헤더 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <Sparkles size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">기부금 생성 관리</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">기부 신청 건을 실제 상품 재고와 매칭하여 기부 처리를 완료합니다.</p>
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
            onClick={handleGenerate}
            disabled={processing || selectedIds.length === 0}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-2xl active:scale-95 ${
              selectedIds.length > 0 
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {processing ? <RefreshCw size={20} className="animate-spin" /> : <Package size={20} />}
            {selectedIds.length > 0 ? `${selectedIds.length}건 기부 생성하기` : '처리할 대상 선택'}
          </button>
        </div>
      </div>

      {/* 필터 및 상태 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-2 min-w-[140px]">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">기부 년도</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <select
                value={filters.dona_yy}
                onChange={(e) => setFilters({ ...filters, dona_yy: e.target.value })}
                className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer text-slate-700"
              >
                {years.map(y => <option key={y} value={y}>{y}년도</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[240px]">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">추천인 필터</label>
            <div className="relative group">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <select
                value={filters.referral_code}
                onChange={(e) => setFilters({ ...filters, referral_code: e.target.value })}
                className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer text-slate-700"
              >
                <option value="">모든 추천인</option>
                {referrals.map(r => <option key={r.referral_code} value={r.referral_code}>{r.name} ({r.referral_code})</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[180px]">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">선수금 필터</label>
            <div className="relative group">
              <ListFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <select
                value={filters.pre_deposit_yn}
                onChange={(e) => setFilters({ ...filters, pre_deposit_yn: e.target.value })}
                className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer text-slate-700"
              >
                <option value="all">전체</option>
                <option value="Y">입금</option>
                <option value="N">미입금</option>
              </select>
            </div>
          </div>

          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-8 px-8 py-4 bg-indigo-50/50 border border-indigo-100 rounded-3xl">
              <div className="text-center">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">대기 중인 건</p>
                <p className="text-2xl font-black text-indigo-600">{targets.length}<span className="text-xs ml-1">건</span></p>
              </div>
              <div className="w-px h-8 bg-indigo-200" />
              <div className="text-center">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">선택된 건</p>
                <p className="text-2xl font-black text-slate-900">{selectedIds.length}<span className="text-xs ml-1">건</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/30 flex flex-col justify-center relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-bold opacity-80 mb-1">총 기부 신청 합계</p>
            <h3 className="text-3xl font-black tracking-tight group-hover:scale-105 transition-transform duration-500 origin-left">
              {formatAmt(targets.reduce((acc, cur) => acc + (cur?.dona_amt || 0), 0))}원
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black bg-white/20 w-fit px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">
              <AlertCircle size={12} />
              Stock Matching Ready
            </div>
          </div>
          <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12 group-hover:rotate-45 transition-all duration-1000" />
        </div>
      </div>

      {/* 결과 보기 모달 */}
      {results && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setResults(null)} />
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
            <div className="px-10 py-10 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-inner">
                  <CheckCircle2 className="text-emerald-400" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">기부 생성 처리 결과</h2>
                  <p className="text-slate-400 text-sm font-bold mt-2 opacity-80 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    선택한 대상에 대한 실시간 재고 매칭 결과입니다.
                  </p>
                </div>
              </div>
              <button onClick={() => setResults(null)} className="relative z-10 p-4 hover:bg-white/10 rounded-2xl transition-all active:scale-95 group">
                <X size={28} className="text-slate-400 group-hover:text-white transition-colors" />
              </button>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            </div>
            
            <div className="p-10 max-h-[50vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.isArray(results) && results.map((res, i) => (
                  <div key={i} className={`group p-8 rounded-[2.5rem] border transition-all duration-500 hover:scale-[1.02] ${
                    res?.status === 'SUCCESS' 
                      ? 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/5' 
                      : 'bg-rose-50/30 border-rose-100 hover:border-rose-200 shadow-sm'
                  }`}>
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${res?.status === 'SUCCESS' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                          <p className="text-xl font-black text-slate-900 tracking-tight">{res?.name || '알 수 없음'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            res?.status === 'SUCCESS' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-rose-100 text-rose-600 border-rose-200'
                          }`}>
                            {res?.status === 'SUCCESS' ? 'Success' : 'Failed'}
                          </span>
                          {res?.status === 'SUCCESS' && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest">
                              Matching Complete
                            </span>
                          )}
                        </div>
                        <p className={`text-sm font-bold leading-relaxed ${res?.status === 'SUCCESS' ? 'text-slate-500' : 'text-rose-500'}`}>
                          {res?.status === 'SUCCESS' ? `기부 생성 완료: ${formatAmt(res?.filledAmt)}원` : res?.reason}
                        </p>
                      </div>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 ${
                        res?.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-500 shadow-inner' : 'bg-rose-100 text-rose-500'
                      }`}>
                        {res?.status === 'SUCCESS' ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-10 bg-white border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3 text-slate-400 text-sm font-black uppercase tracking-widest">
                <ListFilter size={18} />
                Total {results.length} processed
              </div>
              <button 
                onClick={() => setResults(null)}
                className="px-12 py-5 bg-slate-900 text-white font-black rounded-[1.5rem] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center gap-3"
              >
                결과 확인 완료
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

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
                        ? 'bg-indigo-600 shadow-lg shadow-indigo-200' 
                        : 'bg-white border-2 border-slate-200'
                    }`}
                  >
                    {targets.length > 0 && selectedIds.length === targets.length && <Check size={14} className="text-white" strokeWidth={4} />}
                  </button>
                </th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">회원 정보</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">추천인</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">전년이월</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">신청금액</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">선수금</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">상태</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="animate-spin text-indigo-500" size={40} />
                      <p className="text-slate-400 font-bold">대상 목록을 불러오는 중입니다...</p>
                    </div>
                  </td>
                </tr>
              ) : targets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <History size={32} />
                      </div>
                      <p className="text-slate-400 font-bold">기부 생성이 필요한 대기 건이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                targets.map((t) => {
                  if (!t) return null;
                  const id = `${t.cust_no}-${t.dona_yy}-${t.seq_no}`;
                  const isSelected = selectedIds.includes(id);
                  return (
                    <tr 
                      key={id} 
                      className={`group transition-all cursor-pointer ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
                      onClick={() => handleSelectOne(id)}
                    >
                      <td className="px-8 py-6 text-center">
                        <div className={`mx-auto w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 shadow-lg shadow-indigo-200' 
                            : 'bg-white border-2 border-slate-200 group-hover:border-indigo-300'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black text-sm">
                            {(t.cust_name || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="text-[15px] font-black text-slate-900 leading-none">{t.cust_name || '이름 없음'}</p>
                            <p className="text-xs text-slate-400 font-bold mt-1.5 tracking-tight">{t.cust_hpno || '연락처 없음'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-black">
                          <UserCheck size={12} />
                          {t.referral_name || t.referral_code || '직접가입'}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right font-mono">
                        <p className="text-lg font-black text-blue-600 tracking-tighter">
                          {formatAmt(t.last_amt || 0)}<span className="text-xs ml-0.5">원</span>
                        </p>
                      </td>
                      <td className="px-6 py-6 text-right font-mono">
                        <p className="text-sm font-black text-slate-900">
                          {formatAmt(t.dona_amt)}원
                        </p>
                      </td>
                      <td className="px-6 py-6 text-right font-mono">
                        <p className="text-sm font-black text-emerald-600">
                          {formatAmt(t.pre_deposit_sum || 0)}원
                        </p>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-black">
                          <Clock size={12} />
                          승인 대기
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailItem(t);
                          }}
                          className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
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
        
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {targets.length} pending applications for {filters.dona_yy}
          </p>
          <div className="flex gap-2">
            <button disabled className="p-2 text-slate-300 cursor-not-allowed">
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <button disabled className="p-2 text-slate-300 cursor-not-allowed">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 상세 보기 모달 */}
      {detailItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setDetailItem(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner font-black text-2xl">
                  {detailItem.cust_name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{detailItem.cust_name} 상세 정보</h2>
                  <p className="text-sm text-slate-400 font-bold mt-1 tracking-tight">{detailItem.cust_hpno}</p>
                </div>
              </div>
              <button onClick={() => setDetailItem(null)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all active:scale-95 text-slate-300 hover:text-slate-900">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">기부 년도</p>
                  <div className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 border border-slate-100 shadow-inner">
                    {detailItem.dona_yy}년
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">추천인</p>
                  <div className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 border border-slate-100 shadow-inner">
                    {detailItem.referral_name || detailItem.referral_code || '없음'}
                  </div>
                </div>
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">전년이월</p>
                  <p className="text-xl font-black text-blue-600 tracking-tight">
                    {Number(detailItem.last_amt || 0).toLocaleString()}원
                  </p>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">신청금액</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">
                    {Number(detailItem.dona_amt).toLocaleString()}원
                  </p>
                </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-indigo-50 to-white rounded-[2rem] border border-indigo-100 shadow-lg shadow-indigo-100/50 space-y-5">
                <div className="flex items-center gap-3 text-indigo-600 font-black">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Package size={18} />
                  </div>
                  <span className="text-lg">매칭 및 출고 프로세스</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  이 신청 건은 현재 <span className="text-indigo-600 font-bold underline underline-offset-4">기부 신청</span> 상태입니다. 
                  기부 생성을 진행하면 시스템이 자동으로 최적의 상품 재고를 매칭하고, 기부 문서 발행을 위한 출고 처리를 완료합니다.
                </p>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setDetailItem(null)}
                className="px-12 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프리미엄 통합 상태 모달 */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !statusModal.onConfirm && setStatusModal({ ...statusModal, show: false })} />
          <div className="relative bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300 border border-slate-50">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce ${
              statusModal.type === 'success' 
                ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-emerald-200' 
                : statusModal.type === 'confirm'
                ? 'bg-gradient-to-tr from-indigo-400 to-violet-500 shadow-indigo-200'
                : statusModal.type === 'warning'
                ? 'bg-gradient-to-tr from-amber-400 to-orange-500 shadow-amber-200'
                : 'bg-gradient-to-tr from-rose-400 to-pink-500 shadow-rose-200'
            }`}>
              {statusModal.type === 'success' ? (
                <Check size={48} className="text-white" />
              ) : statusModal.type === 'confirm' ? (
                <PenTool size={48} className="text-white" />
              ) : statusModal.type === 'warning' ? (
                <AlertCircle size={48} className="text-white" />
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
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
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

export default AdminDonationCreate;
