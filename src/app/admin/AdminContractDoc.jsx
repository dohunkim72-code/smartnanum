import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import dayjs from 'dayjs';

/**
 * 물품공급계약서 생성 관리 페이지
 */
const AdminContractDoc = () => {
  const [years, setYears] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [list, setList] = useState([]);
  const [checked, setChecked] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  // 검색 조건
  const [cond, setCond] = useState({
    dona_yy: dayjs().format('YYYY'),
    status: 'ALL',
    referral_code: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchInitData();
    // 초기 로딩 시 검색 실행
    handleSearch();
  }, []);

  // 초기 데이터 (년도, 추천인 목록) 조회
  const fetchInitData = async () => {
    try {
      const [yearRes, refRes] = await Promise.all([
        fetch('https://hanwoolfd.synology.me/api/admin/donation/years', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('https://hanwoolfd.synology.me/api/admin/referrals', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const yearsData = await yearRes.json();
      const referralsData = await refRes.json();
      
      setYears(yearsData || [dayjs().format('YYYY')]);
      setReferrals(referralsData || []);
    } catch (err) {
      console.error('초기 데이터 로딩 오류:', err);
    }
  };

  // 대상 리스트 검색
  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contract-doc/list', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cond)
      });
      const data = await res.json();
      setList(data || []);
      setChecked({});
      setSelectAll(false);
    } catch (err) {
      console.error('검색 오류:', err);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 체크박스 관리
  const toggleCheck = (cust_no) => {
    setChecked(prev => ({
      ...prev,
      [cust_no]: !prev[cust_no]
    }));
  };

  const toggleSelectAll = () => {
    const nextValue = !selectAll;
    setSelectAll(nextValue);
    const nextChecked = {};
    if (nextValue) {
      list.forEach(item => {
        nextChecked[item.cust_no] = true;
      });
    }
    setChecked(nextChecked);
  };

  // 계약서 생성 실행
  const handleGenerate = async () => {
    const selectedCustomers = Object.keys(checked).filter(k => checked[k]);
    if (selectedCustomers.length === 0) {
      alert('생성할 대상을 선택해 주세요.');
      return;
    }

    if (!window.confirm(`${selectedCustomers.length}건의 공급계약서를 생성하시겠습니까?`)) {
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/admin/contract-doc/generate', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customers: selectedCustomers.map(cust_no => ({ cust_no })),
          dona_yy: cond.dona_yy
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
      } else {
        alert('문서 생성 실패: ' + (data.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('생성 오류:', err);
      alert('문서 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const selectedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* 헤더 섹션 */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20 text-white">
              <ClipboardList size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">물품공급계약서 생성</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">회원별 기부 물품에 대한 공급 계약서를 자동 생성하고 관리합니다.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={selectedCount === 0 || generating}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/10 active:scale-95 ${
              selectedCount > 0 && !generating
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {generating ? (
              <RefreshCcw size={20} className="animate-spin" />
            ) : (
              <Download size={20} />
            )}
            {generating ? '생성 중...' : `${selectedCount}건 계약서 생성`}
          </button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              <Calendar size={14} /> 기부년도
            </label>
            <select
              value={cond.dona_yy}
              onChange={(e) => setCond({...cond, dona_yy: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              <Filter size={14} /> 신청상태
            </label>
            <select
              value={cond.status}
              onChange={(e) => setCond({...cond, status: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="ALL">전체 상태</option>
              <option value="NEW">신규 (올해 처음)</option>
              <option value="APPLY">신청 (연속 기부)</option>
              <option value="NOT_APPLY">미신청 (전년도만)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              <Users size={14} /> 추천인
            </label>
            <select
              value={cond.referral_code}
              onChange={(e) => setCond({...cond, referral_code: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="">전체 추천인</option>
              {referrals.map(r => (
                <option key={r.referral_code} value={r.referral_code}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
            >
              <Search size={20} />
              검색하기
            </button>
          </div>
        </div>
      </div>

      {/* 리스트 섹션 */}
      <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-6 text-center w-20">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">고객명</th>
                <th className="px-6 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">추천인</th>
                <th className="px-6 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">기부금액</th>
                <th className="px-6 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">실기부금액</th>
                <th className="px-6 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">신청구분</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">기타</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-32 text-center">
                    <RefreshCcw className="animate-spin mx-auto text-blue-500 mb-4" size={40} />
                    <p className="text-slate-400 font-bold">데이터를 불러오는 중입니다...</p>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-32 text-center">
                    <AlertCircle className="mx-auto text-slate-200 mb-4" size={60} />
                    <p className="text-slate-400 font-bold text-lg">조회된 내역이 없습니다.</p>
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr 
                    key={row.cust_no} 
                    className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => toggleCheck(row.cust_no)}
                  >
                    <td className="px-8 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={!!checked[row.cust_no]}
                        onChange={() => toggleCheck(row.cust_no)}
                        className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          {row.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{row.name}</p>
                          <p className="text-[10px] text-slate-400 font-black tracking-tighter mt-0.5">{row.cust_no}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        {row.referral_name}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {Number(row.display_dona_amt).toLocaleString()}원
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="font-black text-blue-600">
                        {Number(row.real_amt).toLocaleString()}원
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-4 py-2 rounded-xl text-xs font-black shadow-sm ${
                        row.remark === '신규' ? 'bg-emerald-50 text-emerald-600' :
                        row.remark === '신청' ? 'bg-blue-50 text-blue-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {row.remark}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button className="p-2 text-slate-300 group-hover:text-blue-400 transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 푸터 영역 */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-slate-500 font-medium">
            총 <span className="text-slate-900 font-black">{list.length}</span>명의 회원 중 
            <span className="text-blue-600 font-black ml-1">{selectedCount}</span>명이 선택되었습니다.
          </p>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Auto-Calculation Enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContractDoc;
