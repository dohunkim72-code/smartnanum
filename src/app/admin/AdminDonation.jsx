import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Calendar,
  User,
  CreditCard,
  CheckCircle2,
  Clock,
  X,
  Check,
  AlertCircle,
  Save,
  ChevronDown,
  ChevronRight,
  Building,
  UserCheck,
  FileText,
  PenTool,
  RotateCcw
} from 'lucide-react';
import api from '../../lib/api';
const AdminDonation = () => {
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
  const isSuperAdmin = adminInfo.grade === '01';

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false); // 상세 조회(읽기 전용) 상태 변수 (한글 주석)
  const canvasRef = useRef(null);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    dona_yy: new Date().getFullYear().toString(),
    searchTerm: '',
    referral_code: isSuperAdmin ? '' : (adminInfo.referral_code || ''),
    step_code: 'all',
    deposit_yn: 'all'
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDona, setCurrentDona] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  
  const [formData, setFormData] = useState({
    cust_no: '',
    name: '',
    hpno: '',
    dona_yy: new Date().getFullYear().toString(),
    dona_amt: '',
    real_amt: 0,
    company_name: '',
    receipt_yn: 'N', // 초기값: 신청안함
    step_code: '01',
    jmin1: '',
    jmin2: '',
    zipcode: '',
    address: '',
    address_detail: '',
    agrees: Array(13).fill(false),
    signature: null
  });

  // 상태 모달 제어 (Premium Unified Version)
  const [statusModal, setStatusModal] = useState({ 
    show: false, 
    type: 'success', 
    title: '',
    message: '', 
    onConfirm: null,
    actionLabel: '확인' 
  });

  const showStatus = (type, title, message, onConfirm = null, actionLabel = '확인') => {
    setStatusModal({ show: true, type, title, message, onConfirm, actionLabel });
  };

  const [referrals, setReferrals] = useState([]);
  const [users, setUsers] = useState([]);

  // 카카오 주소 검색 연동
  const handlePostcode = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        setFormData(prev => ({
          ...prev,
          zipcode: data.zonecode,
          address: data.address
        }));
      }
    }).open();
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const data = await api.get(`/admin/donations?${query}`);
      setDonations(data);
    } catch (error) {
      console.error('기부 내역 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      const data = await api.get('/admin/referrals');
      setReferrals(data);
    } catch (error) { console.error(error); }
  };

  const fetchUserList = async () => {
    try {
      const data = await api.get('/admin/users');
      setUsers(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchDonations();
  }, [filters.dona_yy, filters.referral_code, filters.step_code, filters.deposit_yn]);

  useEffect(() => {
    fetchReferrals();
    fetchUserList();
  }, []);

  // 모달이 열리고 서명 정보가 있을 때 캔버스에 서명 로드 (한글 주석)
  useEffect(() => {
    if (isModalOpen && formData.signature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      const isBase64 = formData.signature.startsWith('data:image') || formData.signature.includes('base64');
      img.src = isBase64 ? formData.signature : `/signatures/${formData.signature}`;
    }
  }, [isModalOpen, formData.signature]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchDonations();
  };

  const openModal = async (dona = null, readOnly = false) => {
    setIsReadOnly(readOnly); // 읽기 전용 상태 설정 (한글 주석)
    if (dona) {
      try {
        setLoading(true);
        const data = await api.get(`/admin/donations/detail/${dona.cust_no}/${dona.dona_yy}`);
        
        const agreesArray = [];
        for (let i = 1; i <= 13; i++) {
          agreesArray.push(data[`agree${i}`] === 'Y');
        }

        setCurrentDona(data);
        setFormData({
          cust_no: data.cust_no,
          name: data.cust_name || '',
          hpno: data.cust_hpno || '',
          dona_yy: data.dona_yy,
          seq_no: data.seq_no,
          dona_amt: data.dona_amt,
          real_amt: data.real_amt || 0, // 결제 금액 추가 (한글 주석)
          last_amt: data.last_amt || 0,
          company_name: data.company_name || '',
          receipt_yn: data.receipt_yn || 'N',
          step_code: data.step_code,
          jmin1: data.jmin1 || '',
          jmin2: data.jmin2 || '',
          zipcode: data.zipcode || '',
          address: data.address || '',
          address_detail: data.address_detail || '',
          agrees: agreesArray,
          signature: data.signature || null
        });
        setSearchTerm(data.cust_name || '');
        setIsModalOpen(true);
      } catch (error) {
        console.error('상세 정보 로드 실패:', error);
        showStatus('error', '상세 정보 로드 실패', '상세 기부 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentDona(null);
      setFormData({
        cust_no: '',
        name: '',
        hpno: '',
        dona_yy: new Date().getFullYear().toString(),
        dona_amt: '',
        real_amt: 0, // 결제 금액 초기값 (한글 주석)
        last_amt: 0, // 전년이월 초기화
        company_name: '',
        receipt_yn: 'N', // 신청안함
        step_code: '01',
        jmin1: '',
        jmin2: '',
        zipcode: '',
        address: '',
        address_detail: '',
        agrees: Array(13).fill(false),
        signature: null
      });
      setSearchTerm('');
      setIsModalOpen(true);
    }
  };

  // 미신청 회원용 자동 정보 세팅 신규 신청 모달 오픈 함수 (한글 주석)
  const openModalForNewApply = async (dona) => {
    try {
      setLoading(true);
      setIsReadOnly(false); // 신규 신청 시 읽기 전용 상태 해제 (한글 주석)
      let recent = null;
      try {
        recent = await api.get(`/admin/donations/recent/${dona.cust_no}`);
      } catch (e) {
        console.error('최근 기부 정보 조회 실패:', e);
      }

      setCurrentDona(null); // 신규 신청이므로 null로 지정
      setFormData({
        cust_no: dona.cust_no,
        name: dona.cust_name || '',
        hpno: dona.cust_hpno || '',
        dona_yy: filters.dona_yy, // 현재 검색 필터에 설정된 연도로 설정
        dona_amt: '',
        real_amt: 0, // 결제 금액 초기값 (한글 주석)
        last_amt: 0,
        company_name: '',
        receipt_yn: 'N',
        step_code: '01',
        jmin1: recent?.jmin1 || '',
        jmin2: recent?.jmin2 || '',
        zipcode: recent?.zipcode || '',
        address: recent?.address || '',
        address_detail: recent?.address_detail || '',
        agrees: Array(13).fill(false),
        signature: null
      });
      setSearchTerm(dona.cust_name || '');
      setIsModalOpen(true);
    } catch (error) {
      console.error('신청 정보 로드 실패:', error);
      showStatus('error', '정보 로드 실패', '회원 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = (val) => {
    setSearchTerm(val);
    if (!val.trim()) {
      setUserSearchResults([]);
      setIsSearchingUser(false);
      return;
    }
    const filtered = users.filter(u => 
      (u.name || '').includes(val) || (u.hpno || '').includes(val)
    ).slice(0, 10);
    setUserSearchResults(filtered);
    setIsSearchingUser(true);
  };

  const selectUser = async (user) => {
    // 검색창 초기화 및 결과 숨기기
    setSearchTerm(user.name);
    setUserSearchResults([]);
    setIsSearchingUser(false);
    
    try {
      // 최근 정보 가져오기 시도
      const recent = await api.get(`/admin/donations/recent/${user.cust_no}`);
      setFormData(prev => ({
        ...prev,
        cust_no: user.cust_no,
        name: user.name,
        hpno: user.hpno,
        jmin1: recent?.jmin1 || user.jmin1 || '',
        jmin2: recent?.jmin2 || user.jmin2 || '',
        zipcode: recent?.zipcode || user.zipcode || '',
        address: recent?.address || user.address || '',
        address_detail: recent?.address_detail || user.address_detail || ''
      }));
    } catch (error) {
      setFormData(prev => ({
        ...prev,
        cust_no: user.cust_no,
        name: user.name,
        hpno: user.hpno,
        jmin1: user.jmin1 || '',
        jmin2: user.jmin2 || '',
        zipcode: user.zipcode || '',
        address: user.address || '',
        address_detail: user.address_detail || ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 검증: 기부 금액 (1,000,000원 이상)
    if (!formData.dona_amt || Number(formData.dona_amt) < 1000000) {
      showStatus('error', '금액 확인', '신청 금액은 1,000,000원 이상이어야 합니다.');
      return;
    }

    // 검증: 동의서 전체 체크 확인
    if (formData.agrees.some(v => v === false)) {
      showStatus('error', '동의 필요', '모든 개인정보 수집 및 활용에 동의하셔야 신청이 가능합니다.');
      return;
    }

    // 검증: 서명 확인
    if (!formData.signature) {
      showStatus('error', '서명 누락', '신청인 서명이 누락되었습니다.');
      return;
    }

    try {
      // boolean 배열을 'Y'/'N' 개별 필드로 변환
      const agreeFields = {};
      formData.agrees.forEach((v, i) => {
        agreeFields[`agree${i + 1}`] = v ? 'Y' : 'N';
      });
      
      const payload = {
        ...formData,
        dona_amt: Number(formData.dona_amt || 0),
        real_amt: Number(formData.real_amt || 0),
        ...agreeFields,
        reg_id: 'admin',
        signature: formData.signature
      };
      // 원본 배열 삭제
      delete payload.agrees;

      const endpoint = '/admin/donations';
      if (currentDona) {
        await api.put(endpoint, payload);
      } else {
        await api.post(endpoint, payload);
      }

      showStatus('success', '저장 완료', currentDona ? '내역이 성공적으로 수정되었습니다.' : '신규 기부 신청이 등록되었습니다.');
      setIsModalOpen(false);
      fetchDonations();
    } catch (error) {
      console.error(error);
      showStatus('error', '저장 실패', error.message || '처리 중 예기치 못한 오류가 발생했습니다.');
    }
  };

  const handleDelete = (dona) => {
    showStatus(
      'confirm', 
      '삭제 확인', 
      '이 기부 신청 내역을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
      async () => {
        try {
          await api.delete(`/admin/donations/${dona.cust_no}/${dona.dona_yy}/${dona.seq_no}`);
          showStatus('success', '삭제 완료', '내역이 정상적으로 삭제되었습니다.');
          fetchDonations();
        } catch (error) { 
          console.error(error);
          showStatus('error', '삭제 실패', error.message || '삭제 중 오류가 발생했습니다.');
        }
      },
      '삭제'
    );
  };

  const getStepBadge = (code) => {
    switch (code) {
      case '01': return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> 신청완료</span>;
      case '02': return <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 size={12} /> 승인완료</span>;
      case '99': return <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold flex items-center gap-1 w-fit">신청취소</span>;
      default: return <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-xs font-bold w-fit">{code}</span>;
    }
  };

  const formatAmt = (amt) => (amt || 0).toLocaleString();

  // 년도 필터 (2026~현재)
  const years = [];
  for (let y = new Date().getFullYear(); y >= 2026; y--) years.push(y.toString());

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="text-rose-500" fill="currentColor" />
            기부 신청 관리
          </h1>
          <p className="text-slate-500">연도별 기부 신청 현황을 관리하고 처리 상태를 변경합니다.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} /> 수기 신청 등록
        </button>
      </div>

      {/* 필터 바 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={filters.dona_yy}
              onChange={(e) => setFilters({ ...filters, dona_yy: e.target.value })}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}년 기부</option>)}
            </select>
          </div>

          <div className="md:col-span-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="고객명, 휴대폰... (Enter)"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              onKeyDown={handleSearch}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
            />
          </div>

          <div className={`relative ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={filters.referral_code}
              onChange={(e) => isSuperAdmin && setFilters({ ...filters, referral_code: e.target.value })}
              disabled={!isSuperAdmin}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer disabled:cursor-not-allowed"
            >
              {isSuperAdmin && <option value="">모든 추천인</option>}
              {referrals.filter(r => isSuperAdmin || r.referral_code === adminInfo.referral_code).map(r => (
                <option key={r.referral_code} value={r.referral_code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={filters.step_code}
              onChange={(e) => setFilters({ ...filters, step_code: e.target.value })}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer"
            >
              <option value="all">모든 진행상태</option>
              <option value="01">신청완료</option>
              <option value="02">승인완료</option>
              <option value="99">신청취소</option>
            </select>
          </div>

          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={filters.deposit_yn}
              onChange={(e) => setFilters({ ...filters, deposit_yn: e.target.value })}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer"
            >
              <option value="all">입금여부 전체</option>
              <option value="Y">입금확인됨</option>
              <option value="N">미입금</option>
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-center w-16 tracking-widest">순번</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">고객정보</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">추천인</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">전년이월</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">신청금액</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">상태</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400">조회 중...</td></tr>
              ) : donations.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400">데이터가 없습니다.</td></tr>
              ) : (
                donations.map((d, index) => (
                  <tr key={`${d.cust_no}-${d.seq_no}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{d.cust_name}</div>
                      <div className="text-xs text-slate-500">{d.cust_hpno}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-indigo-500 font-bold">
                        {d.referral_name ? `${d.referral_name} (${d.referral_code})` : (d.referral_code || '직접가입')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      <div className="text-sm font-black text-blue-600">{formatAmt(d.last_amt)}원</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      <div className="text-sm font-black text-slate-900">{formatAmt(d.dona_amt)}원</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStepBadge(d.step_code)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {d.step_code === '00' ? (
                          <button
                            onClick={() => openModalForNewApply(d)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-xs font-bold shadow-md active:scale-95 flex items-center gap-1"
                            title="신청"
                          >
                            <Plus size={14} /> 신청
                          </button>
                        ) : d.step_code === '01' ? (
                          <>
                            <button onClick={() => openModal(d)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="수정"><Edit2 size={18} /></button>
                            <button onClick={() => handleDelete(d)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="삭제"><Trash2 size={18} /></button>
                          </>
                        ) : ['02', '03', '04'].includes(d.step_code) ? (
                          <button
                            onClick={() => openModal(d, true)}
                            className="px-3 py-1.5 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all text-xs font-bold shadow-md active:scale-95 flex items-center gap-1"
                            title="조회"
                          >
                            <Search size={14} /> 조회
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300 font-medium italic">수정불가</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-8">
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
              <h2 className="text-2xl font-black text-slate-900">{isReadOnly ? '기부 상세 조회' : currentDona ? '기부 내역 수정' : '기부 신청 수기 등록'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-all"><X size={24} /></button>
            </div>
            
            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <form onSubmit={isReadOnly ? (e) => e.preventDefault() : handleSubmit} className="space-y-8">
                {/* 섹션 1: 회원 검색 및 기본 정보 */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> 회원 검색 및 마스터 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 relative space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 ml-2">회원 검색 (이름 또는 연락처)</label>
                      <div className="relative">
                        <input
                          type="text"
                          disabled={!!currentDona || isReadOnly}
                          value={searchTerm}
                          onChange={(e) => handleUserSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                          }}
                          placeholder="검색어를 입력하세요..."
                          className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 outline-none font-bold transition-all shadow-inner"
                        />
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      </div>
                      
                      {/* 검색 결과 드롭다운 */}
                      {userSearchResults.length > 0 && (
                        <div className="absolute z-[110] top-full left-0 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
                          {userSearchResults.map(u => (
                            <button
                              key={u.cust_no}
                              type="button"
                              onClick={() => selectUser(u)}
                              className="w-full px-6 py-4 text-left hover:bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
                            >
                              <div>
                                <span className="font-black text-slate-900">{u.name}</span>
                                <span className="ml-3 text-sm text-slate-400 font-bold">{u.hpno}</span>
                              </div>
                              <ChevronRight size={16} className="text-slate-300" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 ml-2">연락처</label>
                      <input
                        type="text"
                        value={formData.hpno}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-100 border border-transparent outline-none font-bold text-slate-500"
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 ml-2">기부년도</label>
                      <input
                        type="text"
                        value={`${formData.dona_yy}년`}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-100 border border-transparent outline-none font-bold text-slate-500"
                        readOnly
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 ml-2">주민번호 앞자리</label>
                      <input
                        type="text"
                        maxLength={6}
                        readOnly={isReadOnly}
                        value={formData.jmin1}
                        onChange={(e) => setFormData({ ...formData, jmin1: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 outline-none font-bold shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 ml-2">주민번호 뒷자리</label>
                      <input
                        type="password"
                        maxLength={7}
                        readOnly={isReadOnly}
                        value={formData.jmin2}
                        onChange={(e) => setFormData({ ...formData, jmin2: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 outline-none font-bold shadow-inner"
                      />
                    </div>
                    <div className="col-span-2 grid grid-cols-[1fr_auto] gap-4 items-end">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 ml-2">우편번호</label>
                        <input
                          type="text"
                          readOnly
                          value={formData.zipcode}
                          placeholder="00000"
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 outline-none font-bold shadow-inner"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handlePostcode}
                        disabled={isReadOnly}
                        className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-colors shadow-lg active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        주소 검색
                      </button>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 ml-2">기본 주소</label>
                      <input
                        type="text"
                        readOnly={isReadOnly}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 outline-none font-bold shadow-inner"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 ml-2">상세 주소</label>
                      <input
                        type="text"
                        readOnly={isReadOnly}
                        value={formData.address_detail}
                        onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 outline-none font-bold shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* 섹션 2: 신청 정보 */}
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard size={14} /> 기부 신청 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 ml-2">신청금액 (원)</label>
                      <input
                        type="text"
                        required
                        placeholder="0"
                        readOnly={isReadOnly}
                        value={formData.dona_amt ? Number(formData.dona_amt).toLocaleString() : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setFormData({ ...formData, dona_amt: val });
                        }}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 outline-none font-bold font-mono text-right shadow-inner"
                      />
                      <p className="text-[10px] text-rose-500 ml-2 font-bold italic">* 최소 신청 가능 금액은 1,000,000원입니다.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 ml-2">현금영수증 발행</label>
                      <select
                        disabled={isReadOnly}
                        value={formData.receipt_yn}
                        onChange={(e) => setFormData({ ...formData, receipt_yn: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 outline-none font-bold shadow-inner"
                      >
                        <option value="N">신청안함</option>
                        <option value="Y">신청함</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 ml-2">회사명</label>
                      <input
                        type="text"
                        readOnly={isReadOnly}
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="회사명을 입력하세요"
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 outline-none font-bold shadow-inner"
                      />
                    </div>
                    {currentDona && (
                      <div className="col-span-2 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-400 ml-2">전년 이월 (원)</label>
                          <input
                            type="text"
                            readOnly
                            value={formatAmt(formData.last_amt)}
                            className="w-full px-5 py-3.5 rounded-2xl bg-slate-100 border border-transparent outline-none font-bold font-mono text-right text-blue-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-400 ml-2">진행 상태</label>
                          <select
                            disabled={isReadOnly}
                            value={formData.step_code}
                            onChange={(e) => setFormData({ ...formData, step_code: e.target.value })}
                            className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 outline-none font-bold shadow-inner"
                          >
                            <option value="01">신청완료</option>
                            <option value="02">승인완료</option>
                            <option value="99">신청취소</option>
                          </select>
                        </div>
                        <div className="space-y-2 col-span-2">
                          <label className="text-[11px] font-bold text-slate-400 ml-2">결제 금액 (실입금액) (원)</label>
                          <input
                            type="text"
                            readOnly
                            value={formData.real_amt ? Number(formData.real_amt).toLocaleString() : '0'}
                            className="w-full px-5 py-3.5 rounded-2xl bg-slate-100 border border-transparent outline-none font-bold font-mono text-right text-emerald-600 shadow-inner"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 섹션 3: 약관 동의 */}
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} /> 이용 약관 동의
                    </h3>
                    <label className={`flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl transition-colors group ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-indigo-100'}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${formData.agrees.every(v => v) ? 'bg-indigo-600' : 'bg-white border-2 border-indigo-200'}`}>
                        {formData.agrees.every(v => v) && <Check size={10} className="text-white" strokeWidth={4} />}
                      </div>
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        className="hidden"
                        checked={formData.agrees.every(v => v)}
                        onChange={(e) => {
                          if (isReadOnly) return;
                          setFormData({ ...formData, agrees: Array(13).fill(e.target.checked) });
                        }}
                      />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">전체 동의하기</span>
                    </label>
                  </div>
                  {/* 약관 리스트 */}
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { title: "제1조 (목적)", content: "본 약관은 기부금 환급 및 기부 관리 서비스 이용과 관련하여 회사가 제공하는 제반 서비스의 이용 조건 및 절차, 이용자와 회사의 권리, 의무, 책임사항 등을 규정함을 목적으로 합니다." },
                      { title: "제2조 (개인정보 수집 및 이용 동의)", content: "회사는 기부금 영수증 발급 및 환급 대행을 위해 성명, 주민등록번호(세무 신고용), 연락처, 주소, 이메일 등을 수집합니다. 수집된 정보는 법령에 따른 보유기간 동안 안전하게 관리됩니다." },
                      { title: "제3조 (서비스 이용의 제한)", content: "회사는 이용자가 본 약관을 위반하거나 서비스의 정상적인 운영을 방해하는 경우 서비스 이용을 제한하거나 중지할 수 있습니다." },
                      { title: "제4조 (권리와 의무)", content: "이용자는 정확한 정보를 제공할 의무가 있으며, 회사는 이용자의 정보를 보호하고 원활한 서비스를 제공할 책임이 있습니다." },
                      { title: "제5조 (기부금 물품 대행)", content: "이용자는 회사가 대리인으로서 관계 기관에 기부 물품 업무를 수행하는 데 필요한 권한을 위임하는 것에 동의합니다." },
                      { title: "제6조 (면책 조항)", content: "회사는 천재지변 또는 이용자의 귀책사유로 인한 서비스 장애나 손해에 대하여 책임을 지지 않습니다." },
                      { title: "제7조 (관할 법원)", content: "본 서비스 이용과 관련하여 발생한 분쟁에 대해서는 회사의 본사 소재지를 관할하는 법원을 합의 관할 법원으로 합니다." },
                      { title: "제8조 (기부금 산정 및 한도)", content: "기부금 산정 시 근로소득금액의 최대 30% 한도 내에서 개인 공제 내역, 기부 내역, 이월금, 연봉 변동 등을 고려하여 신청해 주세요. 한도가 넘어가는 기부금에 대해서는 이월되더라도 물품 대금은 완납 해주셔야 합니다." },
                      { title: "제9조 (기부 취소 불가 안내)", content: "기부신청 후 기부가 완료된 경우에는 취소가 불가능합니다. (기부 완료 후 퇴사, 휴직 등의 사유로 변동이 발생하는 경우에는 담당자에게 필히 연락주시기 바랍니다.)" },
                      { title: "제10조 (계약금 납부 안내)", content: "기부신청 시 계약금(기부신청금 기준 환급 예상액의 5%)을 받고 있습니다. 계약금을 납부하신 경우에만 기부가 진행됩니다." },
                      { title: "제11조 (물품대금 납부 안내)", content: "계약금 제외 한 물품대금은 연말정산환급 후 납부 바랍니다." },
                      { title: "제12조 (신청 기한 안내)", content: "당해년도 기부신청은 연말정산 직후 완료 부탁드리며, 상반기 내 신청 완료 바랍니다. 신청이 늦어지시면 구입할 물품이 없어 기부가 어려울 수 있습니다." },
                      { title: "제13조 (개인정보 제3자 제공 동의)", content: "개인정보 제3자 제공에 동의 하십니까?" }
                    ].map((term, idx) => (
                      <label key={idx} className={`flex gap-4 p-5 rounded-3xl bg-slate-50 transition-all group ${isReadOnly ? 'cursor-not-allowed' : 'hover:bg-white border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 cursor-pointer'}`}>
                        <div className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${formData.agrees[idx] ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white border-2 border-slate-200'}`}>
                          {formData.agrees[idx] && <Check size={14} className="text-white" strokeWidth={4} />}
                        </div>
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          className="hidden"
                          checked={formData.agrees[idx]}
                          onChange={() => {
                            if (isReadOnly) return;
                            const newAgrees = [...formData.agrees];
                            newAgrees[idx] = !newAgrees[idx];
                            setFormData({ ...formData, agrees: newAgrees });
                          }}
                        />
                        <div className="space-y-1.5">
                          <div className={`text-sm font-black transition-colors ${formData.agrees[idx] ? 'text-indigo-600' : 'text-slate-900'}`}>{term.title}</div>
                          <div className="text-[12px] text-slate-500 leading-relaxed font-medium">{term.content}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 섹션 4: 서명 */}
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                    <PenTool size={14} /> 신청인 서명 (필수)
                  </h3>
                  <div className="relative group">
                    <div className="w-full h-48 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 group-focus-within:border-indigo-300 transition-all overflow-hidden relative shadow-inner">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={(e) => {
                          if (isReadOnly) return;
                          const canvas = canvasRef.current;
                          const ctx = canvas.getContext('2d');
                          ctx.beginPath();
                          ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                          canvas.isDrawing = true;
                        }}
                        onMouseMove={(e) => {
                          if (isReadOnly) return;
                          const canvas = canvasRef.current;
                          if (!canvas.isDrawing) return;
                          const ctx = canvas.getContext('2d');
                          ctx.lineWidth = 3;
                          ctx.lineCap = 'round';
                          ctx.strokeStyle = '#334155';
                          ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                          ctx.stroke();
                        }}
                        onMouseUp={() => {
                          if (isReadOnly) return;
                          const canvas = canvasRef.current;
                          canvas.isDrawing = false;
                          setFormData({ ...formData, signature: canvas.toDataURL() });
                        }}
                        onMouseLeave={() => {
                          const canvas = canvasRef.current;
                          if (canvas) canvas.isDrawing = false;
                        }}
                        width={600}
                        height={192}
                        className={`w-full h-full ${isReadOnly ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
                      />
                      {!formData.signature && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none gap-2">
                          <PenTool size={32} />
                          <p className="text-[10px] font-black uppercase tracking-widest">
                            {isReadOnly ? '등록된 서명이 없습니다' : '여기에 서명해 주세요'}
                          </p>
                        </div>
                      )}
                    </div>
                    {formData.signature && !isReadOnly && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const canvas = canvasRef.current;
                          const ctx = canvas.getContext('2d');
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          setFormData({ ...formData, signature: null });
                        }}
                        className="absolute top-4 right-4 p-3 bg-white rounded-2xl shadow-xl text-slate-400 hover:text-rose-500 transition-all active:scale-95 border border-slate-50"
                      >
                        <RotateCcw size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  {isReadOnly ? (
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-5 rounded-3xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-black flex items-center justify-center gap-2 active:scale-95">
                      확인
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 rounded-3xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all font-black">취소</button>
                      <button type="submit" className="flex-[2] py-5 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:brightness-110 transition-all font-black flex items-center justify-center gap-2 active:scale-95">
                        <Save size={20} /> {currentDona ? '수정 완료' : '기부 신청 완료'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 프리미엄 통합 상태 모달 */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !statusModal.onConfirm && setStatusModal({ ...statusModal, show: false })} />
          <div className="relative bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce ${
              statusModal.type === 'success' 
                ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-emerald-200' 
                : statusModal.type === 'confirm'
                ? 'bg-gradient-to-tr from-indigo-400 to-violet-500 shadow-indigo-200'
                : 'bg-gradient-to-tr from-rose-400 to-pink-500 shadow-rose-200'
            }`}>
              {statusModal.type === 'success' ? <Check size={48} className="text-white" /> : statusModal.type === 'confirm' ? <PenTool size={48} className="text-white" /> : <AlertCircle size={48} className="text-white" />}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{statusModal.title}</h3>
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

export default AdminDonation;
