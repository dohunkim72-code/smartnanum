import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Filter,
  ArrowUpRight,
  Wallet,
  Calendar,
  User,
  CreditCard,
  AlertCircle,
  X
} from 'lucide-react';

/**
 * 입금 처리 관리 화면 (AdminDeposit)
 * 기부 신청 내역 중 입금 대기 상태인 항목을 조회하고 입금 완료 처리를 수행합니다.
 */
const AdminDeposit = () => {
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
  const isSuperAdmin = adminInfo.grade === '01';

  const [deposits, setDeposits] = useState([]);
  const [years, setYears] = useState([]); // 년도 목록
  const [referrals, setReferrals] = useState([]); // 추천인 목록
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString()); // 선택된 년도 (기본값: 올해)
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferral, setSelectedReferral] = useState(isSuperAdmin ? '' : (adminInfo.referral_code || ''));
  const [statusFilter, setStatusFilter] = useState('04'); // 04: 입금 대기 (사용자 정의 기준)
  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', message: '' });

  // 입금 등록 모달 상태
  const [depositModal, setDepositModal] = useState({
    show: false,
    item: null,
    depositType: '01', // '01': 선수금, '02': 물품대금
    depositAmt: ''
  });

  // 년도 목록 조회
  const fetchYears = async () => {
    try {
      const response = await fetch('/api/admin/donation/years', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Years fetch failed');
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setYears(data);
        // 만약 데이터가 여러 개라면 'all'을 선택할 수 있도록 할 수 있지만, 
        // 사용자 편의를 위해 항상 올해를 기본값으로 유지하고 목록에는 가져온 데이터를 넣습니다.
      } else {
        setYears([new Date().getFullYear().toString()]);
      }
    } catch (error) {
      console.error('Fetch years error:', error);
      setYears([new Date().getFullYear().toString()]);
    }
  };

  // 입금 대기 목록 조회
  const fetchDeposits = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/donations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Deposits fetch failed');
      const data = await response.json();
      setDeposits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch deposits error:', error);
      setDeposits([]);
      showStatus('error', '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 추천인 목록 조회
  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/admin/referrals', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Referrals fetch failed');
      const data = await response.json();
      setReferrals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch referrals error:', error);
    }
  };

  useEffect(() => {
    fetchYears();
    fetchDeposits();
    fetchReferrals();
  }, []);

  // 상태 메시지 표시
  const showStatus = (type, message) => {
    setStatusModal({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
    }
  };

  // 입금 확인 모달 열기
  const handleConfirmDeposit = (item) => {
    setDepositModal({
      show: true,
      item: item,
      depositType: '01', // 기본값: 선수금
      depositAmt: String(item.unpaid_amt > 0 ? item.unpaid_amt : '')
    });
  };

  // 입금 확인 등록 제출
  const handleConfirmDepositSubmit = async () => {
    const { item, depositType, depositAmt } = depositModal;
    if (!item) return;

    const parsedAmt = Number(depositAmt);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      showStatus('error', '올바른 입금 금액을 입력해 주세요.');
      return;
    }

    try {
      const response = await fetch('/api/admin/donations/deposit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cust_no: item.cust_no,
          dona_yy: item.dona_yy,
          deposit_type: depositType,
          deposit_amt: parsedAmt,
          upd_id: adminInfo.id || 'admin'
        })
      });

      if (response.ok) {
        showStatus('success', `${item.cust_name}님의 입금 등록이 완료되었습니다.`);
        setDepositModal({ show: false, item: null, depositType: '01', depositAmt: '' });
        fetchDeposits();
      } else {
        const data = await response.json();
        showStatus('error', data.message || '입금 등록 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Deposit submit error:', error);
      showStatus('error', '서버 통신 오류가 발생했습니다.');
    }
  };

  // 필터링된 목록
  const filteredDeposits = deposits.filter(item => {
    const matchesSearch = (item.cust_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (item.hpno || '').includes(searchTerm);
    const matchesReferral = !selectedReferral || (item.referral_code === selectedReferral);
    const matchesStatus = statusFilter === 'all' || 
                        (statusFilter === '04' && item.deposit_yn !== 'Y') ||
                        (statusFilter === '02' && item.deposit_yn === 'Y');
    const matchesYear = selectedYear === 'all' || String(item.dona_yy) === selectedYear;
    return matchesSearch && matchesReferral && matchesStatus && matchesYear;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 상단 헤더 영역 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard size={20} />
            </div>
            <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">Deposit Management</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">입금 처리 관리</h1>
          <p className="text-slate-500 mt-1 font-medium">기부금 입금 확인 및 정산 상태를 관리합니다.</p>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={fetchDeposits}
            className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* 배경 장식 */}
        <div className="absolute top-[-20%] right-[-5%] w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-0" />
      </div>

      {/* 대시보드 요약 카드 (미니) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">입금 대기 ({selectedYear === 'all' ? '전체' : `${selectedYear}년`})</p>
            <h3 className="text-2xl font-black text-slate-900">
              {deposits.filter(d => d.deposit_yn !== 'Y' && (selectedYear === 'all' || String(d.dona_yy) === selectedYear)).length} <span className="text-sm font-medium text-slate-400">건</span>
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">입금 완료 ({selectedYear === 'all' ? '전체' : `${selectedYear}년`})</p>
            <h3 className="text-2xl font-black text-slate-900">
              {deposits.filter(d => d.deposit_yn === 'Y' && (selectedYear === 'all' || String(d.dona_yy) === selectedYear)).length} <span className="text-sm font-medium text-slate-400">건</span>
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-5 text-blue-600 bg-blue-50/30 border-blue-100">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-tighter">총 미입금 금액 ({selectedYear === 'all' ? '전체' : `${selectedYear}년`})</p>
            <h3 className="text-2xl font-black text-slate-900">
              ₩{deposits
                .filter(d => d.deposit_yn !== 'Y' && (selectedYear === 'all' || String(d.dona_yy) === selectedYear))
                .reduce((acc, curr) => acc + (curr.unpaid_amt || 0), 0)
                .toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* 년도 선택 추가 */}
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="relative w-full">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
            >
              <option value="all">전체 연도</option>
              {years.map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>
        </div>

        {/* 추천인 필터 추가 */}
        <div className="flex-1 md:max-w-[200px] relative w-full">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={selectedReferral}
            onChange={(e) => setSelectedReferral(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">모든 추천인</option>
            {referrals.map(r => (
              <option key={r.referral_code} value={r.referral_code}>{r.name} ({r.referral_code})</option>
            ))}
          </select>
        </div>

        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="기부자 이름 또는 연락처로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button 
              onClick={() => setStatusFilter('04')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === '04' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              입금 대기
            </button>
            <button 
              onClick={() => setStatusFilter('02')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === '02' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              입금 완료
            </button>
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              전체
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider">신청일 / 기부자</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider">추천인</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">기부 신청액</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">물품 대금</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">선수금 입금액</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">물품대금 입금액</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right text-rose-500">미입금액</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-center">상태</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-center">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="px-8 py-20 text-center">
                    <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">데이터를 불러오는 중입니다...</p>
                  </td>
                </tr>
              ) : filteredDeposits.length > 0 ? (
                filteredDeposits.map((item) => (
                  <tr key={`${item.cust_no}-${item.dona_yy}`} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                          {item.cust_name ? item.cust_name[0] : 'U'}
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-slate-900">{item.cust_name}</p>
                          <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                            <Calendar size={12} />
                            <span className="text-xs font-bold">{new Date(item.reg_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-[14px] font-bold text-slate-600">{item.referral_name || '-'}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <p className="text-sm font-black text-slate-900">₩{(item.dona_amt || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <p className="text-sm font-bold text-slate-600">₩{(item.goods_amt || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <p className="text-sm font-bold text-emerald-600">₩{(item.pre_deposit_sum || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <p className="text-sm font-bold text-blue-600">₩{(item.goods_deposit_sum || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <p className="text-sm font-black text-rose-500">₩{(item.unpaid_amt || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tight ${
                        item.deposit_yn === 'Y' 
                          ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-600 border border-amber-200'
                      }`}>
                        {item.deposit_yn === 'Y' ? '입금 완료' : '입금 대기'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      {item.deposit_yn !== 'Y' ? (
                        <button 
                          onClick={() => handleConfirmDeposit(item)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-black hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 active:scale-95 flex items-center gap-2 mx-auto"
                        >
                          <CheckCircle2 size={14} />
                          입금 확인
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleConfirmDeposit(item)}
                          className="px-4 py-2 bg-slate-600 text-white rounded-xl text-[11px] font-black hover:bg-slate-700 transition-all hover:shadow-lg hover:shadow-slate-200 active:scale-95 flex items-center gap-2 mx-auto"
                        >
                          <CreditCard size={14} />
                          추가 입금
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <AlertCircle size={48} className="mb-4 text-slate-300" />
                      <p className="text-lg font-bold text-slate-400">조회된 입금 내역이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 입금 등록 모달 */}
      {depositModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setDepositModal({ ...depositModal, show: false })} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight">{depositModal.item?.cust_name}님 입금 처리</h2>
              <button onClick={() => setDepositModal({ ...depositModal, show: false })} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">입금 구분</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDepositModal(prev => ({ ...prev, depositType: '01' }))}
                    className={`py-3.5 rounded-2xl font-black transition-all ${
                      depositModal.depositType === '01'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    선수금 (01)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositModal(prev => ({ ...prev, depositType: '02' }))}
                    className={`py-3.5 rounded-2xl font-black transition-all ${
                      depositModal.depositType === '02'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    물품대금 (02)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">입금 금액 (원)</label>
                <input
                  type="number"
                  placeholder="금액을 입력하세요"
                  value={depositModal.depositAmt}
                  onChange={(e) => setDepositModal(prev => ({ ...prev, depositAmt: e.target.value }))}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all outline-none font-bold text-slate-800"
                />
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl space-y-2.5 text-xs text-slate-500 font-bold leading-relaxed border border-slate-100">
                <div className="flex justify-between">
                  <span>총 물품대금:</span>
                  <span className="text-slate-800 font-black">₩{(depositModal.item?.goods_amt || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>선수금 입금액:</span>
                  <span className="text-emerald-600 font-black">₩{(depositModal.item?.pre_deposit_sum || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>물품대금 입금액:</span>
                  <span className="text-blue-600 font-black">₩{(depositModal.item?.goods_deposit_sum || 0).toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-200 my-1" />
                <div className="flex justify-between text-sm">
                  <span className="text-rose-500">현재 미입금액:</span>
                  <span className="text-rose-500 font-black">₩{(depositModal.item?.unpaid_amt || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setDepositModal({ ...depositModal, show: false })}
                className="flex-1 py-4 bg-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-300 transition-all active:scale-95"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDepositSubmit}
                className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                입금 확인 등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상태 모달 */}
      {statusModal.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border ${
            statusModal.type === 'success' ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-rose-600 border-rose-100'
          }`}>
            {statusModal.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            <span className="font-bold text-lg">{statusModal.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeposit;
