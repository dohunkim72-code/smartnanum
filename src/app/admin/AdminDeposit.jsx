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
  AlertCircle
} from 'lucide-react';

/**
 * 입금 처리 관리 화면 (AdminDeposit)
 * 기부 신청 내역 중 입금 대기 상태인 항목을 조회하고 입금 완료 처리를 수행합니다.
 */
const AdminDeposit = () => {
  const [deposits, setDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('01'); // 01: 입금 대기
  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', message: '' });

  // 입금 대기 목록 조회
  const fetchDeposits = async () => {
    setIsLoading(true);
    try {
      // 기부 신청 관리와 동일한 API를 사용하되, 필터링 로직을 강화하거나 전용 엔드포인트를 고려할 수 있습니다.
      const response = await fetch('/api/admin/donations');
      const data = await response.json();
      
      // 실제 서비스에서는 서버에서 필터링해서 가져오는 것이 좋지만, 
      // 여기서는 우선 전체를 가져와 프론트엔드에서 필터링합니다.
      setDeposits(data || []);
    } catch (error) {
      console.error('Fetch deposits error:', error);
      showStatus('error', '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // 상태 메시지 표시
  const showStatus = (type, message) => {
    setStatusModal({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
    }
  };

  // 입금 완료 처리 (상태 변경 및 확정금액 저장)
  const handleConfirmDeposit = async (item) => {
    try {
      // 실제 입금액을 신청금액과 동일하게 초기화 (필요시 수동 입력 가능하도록 확장)
      const realAmt = item.dona_amt;
      
      const response = await fetch(`/api/admin/donations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          real_amt: realAmt,
          step_code: '02', // 02: 입금 완료 상태로 변경
          upd_id: 'admin'
        })
      });

      if (response.ok) {
        showStatus('success', `${item.name}님의 입금 처리가 완료되었습니다.`);
        fetchDeposits();
      } else {
        showStatus('error', '입금 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Deposit confirm error:', error);
      showStatus('error', '서버 통신 오류가 발생했습니다.');
    }
  };

  // 필터링된 목록
  const filteredDeposits = deposits.filter(item => {
    const matchesSearch = (item.name || '').includes(searchTerm) || (item.hpno || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || item.step_code === statusFilter;
    return matchesSearch && matchesStatus;
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">입금 대기</p>
            <h3 className="text-2xl font-black text-slate-900">
              {deposits.filter(d => d.step_code === '01').length} <span className="text-sm font-medium text-slate-400">건</span>
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">오늘 완료</p>
            <h3 className="text-2xl font-black text-slate-900">
              {deposits.filter(d => d.step_code === '02').length} <span className="text-sm font-medium text-slate-400">건</span>
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-5 text-blue-600 bg-blue-50/30 border-blue-100">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-tighter">총 대기 금액</p>
            <h3 className="text-2xl font-black text-slate-900">
              ₩{deposits.filter(d => d.step_code === '01').reduce((acc, curr) => acc + (curr.dona_amt || 0), 0).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
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
              onClick={() => setStatusFilter('01')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === '01' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider">신청일 / 기부자</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider">기부 정보</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">금액 현황</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-center">상태</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-center">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">데이터를 불러오는 중입니다...</p>
                  </td>
                </tr>
              ) : filteredDeposits.length > 0 ? (
                filteredDeposits.map((item) => (
                  <tr key={`${item.cust_no}-${item.dona_yy}-${item.seq_no}`} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                          {item.name ? item.name[0] : 'U'}
                        </div>
                        <div>
                          <p className="text-[15px] font-black text-slate-900">{item.name}</p>
                          <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                            <Calendar size={12} />
                            <span className="text-xs font-bold">{new Date(item.reg_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-700">{item.company_name || '개인 기부'}</p>
                        <p className="text-xs text-slate-400 font-medium italic">{item.hpno}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">₩{(item.dona_amt || 0).toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">신청 금액</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black tracking-tight ${
                        item.step_code === '02' 
                          ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-600 border border-amber-200'
                      }`}>
                        {item.step_code === '02' ? '입금 완료' : '입금 대기'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {item.step_code === '01' ? (
                        <button 
                          onClick={() => handleConfirmDeposit(item)}
                          className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 active:scale-95 flex items-center gap-2 mx-auto"
                        >
                          <CheckCircle2 size={14} />
                          입금 확인
                        </button>
                      ) : (
                        <div className="flex items-center justify-center text-emerald-500 gap-1.5">
                          <CheckCircle2 size={16} />
                          <span className="text-xs font-bold">처리완료</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
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
