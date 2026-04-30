import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Check, 
  X, 
  Eye, 
  Filter,
  ArrowUpDown,
  MoreVertical
} from 'lucide-react';

/**
 * 기부 신청 관리 페이지
 */
const DonationManagement = () => {
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/donations');
      const data = await response.json();
      setDonations(data);
    } catch (error) {
      console.error('Donations fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (item, newStatus) => {
    if (!window.confirm(`상태를 변경하시겠습니까?`)) return;

    try {
      const response = await fetch('/api/admin/donations/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cust_no: item.cust_no,
          dona_yy: item.dona_yy,
          seq_no: item.seq_no,
          step_code: newStatus
        })
      });

      if (response.ok) {
        alert('성공적으로 변경되었습니다.');
        fetchDonations(); // 목록 새로고침
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const getStatusStyle = (code) => {
    switch (code) {
      case '01': return 'bg-amber-100 text-amber-600 border-amber-200'; // 승인대기
      case '02': return 'bg-blue-100 text-blue-600 border-blue-200'; // 입금확인중
      case '03': return 'bg-emerald-100 text-emerald-600 border-emerald-200'; // 완료
      case '09': return 'bg-rose-100 text-rose-600 border-rose-200'; // 반려
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusName = (code) => {
    switch (code) {
      case '01': return '승인대기';
      case '02': return '입금확인';
      case '03': return '기부완료';
      case '09': return '반려됨';
      default: return '알수없음';
    }
  };

  const filteredDonations = donations.filter(item => {
    const matchesSearch = item.user_name?.includes(searchTerm) || item.cust_no?.includes(searchTerm);
    const matchesFilter = statusFilter === 'all' || item.step_code === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">기부 신청 관리</h1>
          <p className="text-slate-500">기부 신청 건을 검토하고 상태를 업데이트합니다.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchDonations}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> 새로고침
          </button>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="회원명 또는 회원번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            전체
          </button>
          <button 
            onClick={() => setStatusFilter('01')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${statusFilter === '01' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            승인대기
          </button>
          <button 
            onClick={() => setStatusFilter('03')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${statusFilter === '03' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            기부완료
          </button>
        </div>
      </div>

      {/* 목록 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">신청번호/일자</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">회원 정보</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">기부 금액</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">현재 상태</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">불러오는 중...</td></tr>
              ) : filteredDonations.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">조회된 신청 건이 없습니다.</td></tr>
              ) : (
                filteredDonations.map((item) => (
                  <tr key={`${item.cust_no}-${item.seq_no}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{item.dona_yy}-{item.seq_no}</div>
                      <div className="text-xs text-slate-500">{new Date(item.reg_date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{item.user_name}</div>
                      <div className="text-xs text-slate-500">{item.user_hpno}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-slate-900">₩{(item.dona_amt || 0).toLocaleString()}</div>
                      <div className="text-xs text-slate-400">실제: ₩{(item.real_amt || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(item.step_code)}`}>
                        {getStatusName(item.step_code)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        {item.step_code === '01' && (
                          <button 
                            onClick={() => handleStatusUpdate(item, '03')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="즉시 승인"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DonationManagement;
