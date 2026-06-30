import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Plus, 
  Trash2, 
  X, 
  Save,
  Calendar,
  Box,
  Building,
  DollarSign,
  Hash,
  Filter,
  CheckCircle,
  AlertCircle,
  Edit2
} from 'lucide-react';

/**
 * 상품입고 관리 화면
 * 기부처로부터 상품이 들어온 내역을 기록하고 재고에 반영합니다.
 */
const AdminReceipt = () => {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // 현재 년-월 (YYYY-MM)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 수정 관련 상태 추가 (한글 주석)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editKey, setEditKey] = useState(null); // { receipt_yymm, client_no, product_code, seq_no }
  
  const [formData, setFormData] = useState({
    receipt_date: new Date().toISOString().split('T')[0],
    client_no: '',
    product_code: '',
    quantity: 0,
    unit_price: 0
  });

  const [statusModal, setStatusModal] = useState({ 
    show: false, 
    type: 'success', 
    message: '', 
    onConfirm: null,
    actionLabel: '확인' 
  });

  // 폼 데이터 초기화 함수
  const resetForm = () => {
    setFormData({
      receipt_date: new Date().toISOString().split('T')[0],
      client_no: '',
      product_code: '',
      quantity: 0,
      unit_price: 0
    });
  };

  // 등록 모달 열기
  const openModal = () => {
    resetForm();
    setIsEditMode(false);
    setEditKey(null);
    setIsModalOpen(true);
  };

  // 수정 모달 열기 (기존 입고 데이터를 폼에 자동 셋팅)
  const openEditModal = (r) => {
    // receipt_date를 YYYY-MM-DD 형식으로 정규화 (DB에서 ISO 형태로 오는 경우 처리)
    let dateStr = r.receipt_date || '';
    if (dateStr && dateStr.length > 10) {
      dateStr = dateStr.substring(0, 10);
    }
    if (dateStr && dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    // Date 객체인 경우에도 안전하게 처리
    if (!dateStr && r.receipt_date instanceof Date) {
      dateStr = r.receipt_date.toISOString().split('T')[0];
    }
    
    setFormData({
      receipt_date: dateStr,
      client_no: r.client_no,
      product_code: r.product_code,
      quantity: r.quantity,
      unit_price: r.unit_price
    });
    setIsEditMode(true);
    setEditKey({
      receipt_yymm: r.receipt_yymm,
      client_no: r.client_no,
      product_code: r.product_code,
      seq_no: r.seq_no
    });
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditKey(null);
  };

  // 데이터 로드 (입고 내역, 상품 목록, 기부처 목록)
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [resR, resP, resC] = await Promise.all([
        fetch('/api/admin/receipts', { headers }),
        fetch('/api/admin/products', { headers }),
        fetch('/api/admin/clients', { headers })
      ]);
      
      const [dataR, dataP, dataC] = await Promise.all([
        resR.json(),
        resP.json(),
        resC.json()
      ]);
      
      setReceipts(Array.isArray(dataR) ? dataR : []);
      setProducts(Array.isArray(dataP) ? dataP.filter(p => p.use_yn === 'Y') : []);
      setClients(Array.isArray(dataC) ? dataC : []);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setReceipts([]);
      setProducts([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 검색 및 년월 필터링
  const filteredReceipts = (Array.isArray(receipts) ? receipts : []).filter(r => {
    const pName = r.product_name || '';
    const cName = r.client_name || '';
    const matchesSearch = 
      pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // r.receipt_date는 "YYYY-MM-DD" 형식이므로 "YYYY-MM"으로 시작하는지 체크
    const matchesMonth = !selectedMonth || (r.receipt_date && r.receipt_date.startsWith(selectedMonth));
    
    return matchesSearch && matchesMonth;
  });

  // 입고 등록 및 수정 처리 (한글 주석)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_no || !formData.product_code || formData.quantity <= 0) {
      setStatusModal({
        show: true,
        type: 'error',
        message: '기부처, 상품을 선택하고\n수량을 정확히 입력해주세요. 😊'
      });
      return;
    }

    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const adminId = adminInfo.referral_code || 'admin';

    try {
      let response;
      if (isEditMode && editKey) {
        // 수정 요청인 경우 PUT 메소드 사용
        response = await fetch(`/api/admin/receipts/${editKey.receipt_yymm}/${editKey.client_no}/${editKey.product_code}/${editKey.seq_no}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            ...formData,
            reg_id: adminId
          })
        });
      } else {
        // 신규 등록 요청인 경우 POST 메소드 사용
        response = await fetch('/api/admin/receipts', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            ...formData,
            reg_id: adminId
          })
        });
      }

      if (response.ok) {
        setStatusModal({
          show: true,
          type: 'success',
          message: isEditMode 
            ? '물품 입고 내역이 성공적으로 수정되었습니다!\n재고에 실시간으로 반영되었습니다.' 
            : '물품 입고 처리가 완벽하게 완료되었습니다!\n재고에 실시간으로 반영되었습니다.'
        });
        closeModal();
        fetchData();
        // 폼 초기화
        resetForm();
        // 성공 시 2초 후 자동 닫기
        setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
      } else {
        const error = await response.json();
        setStatusModal({
          show: true,
          type: 'error',
          message: error.message || '입고 처리 중 예상치 못한 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      setStatusModal({
        show: true,
        type: 'error',
        message: '서버와의 통신이 원활하지 않습니다.\n네트워크 상태를 확인해주세요.'
      });
    }
  };

  // 삭제 처리 (재고에서도 차감됨)
  const handleDelete = async (r) => {
    setStatusModal({
      show: true,
      type: 'error',
      message: '정말 이 입고 내역을 삭제하시겠습니까?\n해당 수량만큼 재고에서도 즉시 차감됩니다.',
      actionLabel: '삭제하기',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/receipts/${r.receipt_yymm}/${r.client_no}/${r.product_code}/${r.seq_no}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });

          if (response.ok) {
            setStatusModal({
              show: true,
              type: 'success',
              message: '내역이 안전하게 삭제되었습니다.'
            });
            fetchData();
            setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
          } else {
            const error = await response.json();
            setStatusModal({
              show: true,
              type: 'error',
              message: error.message || '삭제 중 오류가 발생했습니다.'
            });
          }
        } catch (error) {
          setStatusModal({
            show: true,
            type: 'error',
            message: '서버 통신 오류가 발생했습니다.'
          });
        }
      }
    });
  };

  // 금액/수량 포맷터 (숫자 -> 콤마 문자열)
  const formatValue = (value) => {
    if (value === null || value === undefined) return '0';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 금액/수량 언포맷터 (콤마 문자열 -> 숫자)
  const unformatValue = (value) => {
    const num = Number(value.replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 섹션 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Truck className="text-blue-600" />
              상품 입고 관리
            </h1>
            <p className="text-gray-500 mt-1">물품의 입고 내역을 기록하고 실시간 재고에 반영합니다.</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200 font-medium"
          >
            <Plus size={20} />
            새 입고 등록
          </button>
        </div>

        {/* 검색창 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
          <Search className="text-gray-400" size={22} />
          <input
            type="text"
            placeholder="상품명 또는 기부처명으로 검색..."
            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="h-6 w-[1px] bg-gray-200 mx-2 hidden lg:block"></div>
          
          {/* 년월 필터 */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
            <Calendar size={18} className="text-blue-500" />
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 cursor-pointer"
            />
            {selectedMonth && (
              <button 
                onClick={() => setSelectedMonth('')}
                className="text-gray-400 hover:text-gray-600 ml-1"
                title="필터 초기화"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="h-6 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>
          <div className="text-sm text-gray-500 hidden md:flex items-center gap-2">
            <Filter size={16} />
            총 {Array.isArray(filteredReceipts) ? filteredReceipts.length : 0}건
          </div>
        </div>

        {/* 입고 리스트 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">입고일자 / 번호</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">기부처(입고처)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">상품 정보</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">수량 / 단위</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">단가 / 총액</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400">데이터를 불러오는 중입니다...</td>
                  </tr>
                ) : (Array.isArray(filteredReceipts) && filteredReceipts.length === 0) ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400">입고 내역이 없습니다.</td>
                  </tr>
                ) : (
                  (Array.isArray(filteredReceipts) ? filteredReceipts : []).map((r, idx) => (
                    <tr key={`${r.receipt_yymm}-${r.client_no}-${r.product_code}-${r.seq_no}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Calendar size={14} className="text-blue-500" />
                          {r.receipt_date}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 font-mono">#{r.receipt_yymm}-{r.seq_no}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">{r.client_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{r.client_no}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-700">{r.product_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{r.product_spec} | {r.product_code}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-bold text-blue-600">{formatValue(r.quantity)}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{r.unit}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-xs text-gray-400">단가: {formatValue(r.unit_price)}원</div>
                        <div className="text-sm font-bold text-gray-800 mt-0.5">{formatValue(r.total_amount)}원</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(r)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={18} />
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

      {/* 입고 등록 프리미엄 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl transition-all duration-500">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.3)] border border-white/40 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* 모달 헤더 */}
            <div className="px-10 py-10 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-inner">
                  <Truck size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {isEditMode ? '입고 내역 수정' : '신규 입고 등록'}
                  </h2>
                  <div className="text-slate-400 text-sm font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    Stock Inbound Logistics
                  </div>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-10 pb-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 섹션 1: 입고 기본 정보 */}
                <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Receipt Date</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm text-blue-500">
                          <Calendar size={16} />
                        </div>
                        <input
                          type="date"
                          required
                          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-bold shadow-sm"
                          value={formData.receipt_date}
                          onChange={(e) => setFormData({...formData, receipt_date: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Donator (Client)</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm text-slate-400">
                          <Building size={16} />
                        </div>
                        <select
                          required
                          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-bold shadow-sm appearance-none cursor-pointer"
                          value={formData.client_no}
                          onChange={(e) => setFormData({...formData, client_no: e.target.value})}
                        >
                          <option value="">기부처 선택</option>
                          {Array.isArray(clients) && clients.map(c => (
                            <option key={c.client_no} value={c.client_no}>{c.client_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Selected Product</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm text-slate-400">
                        <Box size={16} />
                      </div>
                      <select
                        required
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-black text-slate-800 shadow-sm appearance-none cursor-pointer"
                        value={formData.product_code}
                        onChange={(e) => {
                          const selected = products.find(p => p.product_code === e.target.value);
                          setFormData({
                            ...formData, 
                            product_code: e.target.value,
                            unit_price: selected ? selected.cost_price : 0
                          });
                        }}
                      >
                        <option value="">입고할 상품을 선택하세요</option>
                        {Array.isArray(products) && products.map(p => (
                          <option key={p.product_code} value={p.product_code}>{p.product_name} ({p.product_spec})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 섹션 2: 수량 및 금액 계산 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Quantity</label>
                      <input
                        type="text"
                        required
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all text-right font-black text-slate-800 shadow-sm"
                        value={formatValue(formData.quantity)}
                        onChange={(e) => setFormData({...formData, quantity: unformatValue(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Unit Price</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all text-right font-bold text-slate-500 shadow-sm"
                          value={formatValue(formData.unit_price)}
                          onChange={(e) => setFormData({...formData, unit_price: unformatValue(e.target.value)})}
                        />
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">₩</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-xl shadow-blue-600/20 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-white/5 rotate-12 group-hover:scale-110 transition-transform">
                      <DollarSign size={100} />
                    </div>
                    <label className="text-[11px] font-black text-blue-200 uppercase tracking-widest ml-2 mb-4 relative z-10">Total Amount (합계)</label>
                    <div className="relative z-10 text-right">
                      <span className="text-4xl font-black text-white tracking-tight">
                        {formatValue(formData.quantity * formData.unit_price)}
                      </span>
                      <span className="text-xl font-bold text-blue-100 ml-2">원</span>
                    </div>
                    <p className="text-[10px] text-blue-100/60 font-bold mt-4 text-center relative z-10">자동 계산된 총 입고 금액입니다.</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-5 rounded-[1.75rem] bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all font-black active:scale-95"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-5 rounded-[1.75rem] bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all shadow-xl shadow-blue-600/30 font-black flex items-center justify-center gap-3 active:scale-95 hover:brightness-110"
                  >
                    <Save size={24} strokeWidth={2.5} />
                    {isEditMode ? '수정 내용 저장' : '입고 데이터 확정'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 프리미엄 통합 상태 알림 모달 */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-10 rounded-[40px] shadow-2xl max-w-sm w-full text-center transform animate-in zoom-in duration-300">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ${
              statusModal.type === 'success' ? 'bg-blue-500 shadow-blue-200' : 'bg-rose-500 shadow-rose-200'
            }`}>
              {statusModal.type === 'success' ? (
                <CheckCircle size={44} className="text-white animate-in slide-in-from-bottom-2 duration-500" />
              ) : (
                <AlertCircle size={44} className="text-white animate-in slide-in-from-bottom-2 duration-500" />
              )}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
              {statusModal.type === 'success' ? '알림' : '확인 필요'}
            </h3>
            <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-line">{statusModal.message}</p>
            <div className="mt-10 flex gap-4">
              {statusModal.onConfirm && (
                <button 
                  onClick={() => setStatusModal(prev => ({ ...prev, show: false }))}
                  className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-2xl font-black hover:bg-slate-300 transition-all active:scale-95"
                >
                  취소
                </button>
              )}
              <button 
                onClick={() => {
                  if (statusModal.onConfirm) {
                    statusModal.onConfirm();
                  } else {
                    setStatusModal(prev => ({ ...prev, show: false }));
                  }
                }}
                className={`flex-1 py-4 text-white rounded-2xl font-black transition-all shadow-xl active:scale-95 ${
                  statusModal.type === 'success' ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                }`}
              >
                {statusModal.actionLabel || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReceipt;
