import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  CheckCircle,
  AlertCircle,
  Tag,
  Truck,
  Layers
} from 'lucide-react';

/**
 * 상품마스터 관리 화면
 * 상품의 기본 정보(코드, 명칭, 카테고리, 단가 등)를 관리합니다.
 */
const AdminProduct = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isNew, setIsNew] = useState(true);
  const [loading, setLoading] = useState(true);

  const [statusModal, setStatusModal] = useState({ 
    show: false, 
    type: 'success', 
    message: '', 
    onConfirm: null,
    actionLabel: '확인' 
  });

  // 상품 목록 가져오기
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/products', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('상품 목록 조회 오류:', error);
      setProducts([]);
      setStatusModal({
        show: true,
        type: 'error',
        message: '데이터를 불러오는 중 오류가 발생했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 검색 필터링
  const filteredProducts = (Array.isArray(products) ? products : []).filter(p => {
    const name = p.product_name || '';
    const code = p.product_code || '';
    const brand = p.brand || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           brand.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 모달 열기 (등록/수정)
  const openModal = (product = null) => {
    if (product) {
      setCurrentProduct({ ...product });
      setIsNew(false);
    } else {
      setCurrentProduct({
        product_code: '',
        product_name: '',
        product_category: '',
        product_spec: '',
        unit: 'EA',
        cost_price: 0,
        sale_price: 0,
        manufacturer: '',
        brand: '',
        use_yn: 'Y'
      });
      setIsNew(true);
    }
    setIsModalOpen(true);
  };

  // 저장 처리
  const handleSave = async (e) => {
    e.preventDefault();
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const adminId = adminInfo.referral_code || 'admin';
    
    try {
      const method = isNew ? 'POST' : 'PUT';
      const response = await fetch('/api/admin/products', {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...currentProduct,
          reg_id: adminId,
          upd_id: adminId
        })
      });

      if (response.ok) {
        setStatusModal({
          show: true,
          type: 'success',
          message: isNew ? '새로운 상품이 성공적으로 등록되었습니다.' : '상품 정보가 정밀하게 수정되었습니다.'
        });
        setIsModalOpen(false);
        fetchProducts();
        setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
      } else {
        const errorData = await response.json();
        setStatusModal({
          show: true,
          type: 'error',
          message: errorData.message || '저장 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      setStatusModal({
        show: true,
        type: 'error',
        message: '서버 통신 오류가 발생했습니다.'
      });
    }
  };

  // 삭제 처리
  const handleDelete = (code) => {
    setStatusModal({
      show: true,
      type: 'error',
      message: '정말 이 상품을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
      actionLabel: '삭제하기',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/products/${code}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });

          if (response.ok) {
            setStatusModal({
              show: true,
              type: 'success',
              message: '상품이 성공적으로 삭제되었습니다.'
            });
            fetchProducts();
            setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
          } else {
            const errorData = await response.json();
            setStatusModal({
              show: true,
              type: 'error',
              message: errorData.message || '삭제 중 오류가 발생했습니다.'
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

  // 금액 포맷터 (숫자 -> 콤마 문자열)
  const formatPrice = (value) => {
    if (value === null || value === undefined) return '0';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 금액 언포맷터 (콤마 문자열 -> 숫자)
  const unformatPrice = (value) => {
    if (typeof value !== 'string') return value;
    return Number(value.replace(/[^0-9]/g, ''));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 섹션 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="text-blue-600" />
              상품마스터 관리
            </h1>
            <p className="text-slate-500 mt-1">취급 상품의 기본 정보와 단가를 정밀하게 관리합니다.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-200 font-bold active:scale-95"
          >
            <Plus size={20} />
            새 상품 등록
          </button>
        </div>

        {/* 검색 및 요약 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <Search className="text-slate-400" size={22} />
            <input
              type="text"
              placeholder="상품명, 상품코드 또는 브랜드로 검색..."
              className="flex-1 outline-none text-slate-700 placeholder-slate-400 bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl text-white">
                <Layers size={20} />
              </div>
              <span className="font-bold">총 상품 수</span>
            </div>
            <span className="text-2xl font-black">{Array.isArray(products) ? products.length : 0}</span>
          </div>
        </div>

        {/* 상품 리스트 테이블 */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">상품 정보</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">카테고리 / 브랜드</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">규격 / 단위</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">매입 / 매출 단가</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">상태</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-medium">데이터 분석 중...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-medium">등록된 상품이 존재하지 않습니다.</td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.product_code} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{product?.product_name || '이름 없음'}</div>
                        <div className="text-xs text-slate-400 font-mono mt-1">{product?.product_code || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 flex items-center gap-1.5 font-medium">
                          <Tag size={14} className="text-blue-400" />
                          {product.product_category || '-'}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{product.brand || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 font-medium">{product.product_spec || '-'}</div>
                        <div className="text-xs text-blue-500 font-black mt-1 uppercase tracking-tighter">{product.unit || 'EA'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-xs font-bold text-slate-400">COST: {formatPrice(product.cost_price)}원</div>
                        <div className="text-sm font-black text-blue-600 mt-0.5">SALE: {formatPrice(product.sale_price)}원</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest ${
                          product.use_yn === 'Y' 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-rose-100 text-rose-600'
                        }`}>
                          {product.use_yn === 'Y' ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(product)}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
                            title="수정"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.product_code)}
                            className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
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

      {/* 상품 등록/수정 프리미엄 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl transition-all duration-500">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.3)] border border-white/40 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* 모달 헤더 - 그라데이션 포인트 */}
            <div className="px-10 py-10 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-inner">
                  {isNew ? <Plus size={32} strokeWidth={2.5} /> : <Edit2 size={32} strokeWidth={2.5} />}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {isNew ? '신규 상품 등록' : '상품 정보 수정'}
                  </h2>
                  <div className="text-slate-400 text-sm font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    System Inventory Management
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-10 pb-10">
              <form onSubmit={handleSave} className="space-y-8">
                {/* 섹션 1: 기본 식별 정보 */}
                <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Product Code</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm text-blue-500">
                          <Tag size={16} />
                        </div>
                        <input
                          disabled
                          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-100 text-blue-600 font-black outline-none shadow-sm cursor-not-allowed"
                          value={isNew ? '자동 생성 (SYSTEM)' : (currentProduct?.product_code || '')}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Category</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm text-slate-400 group-focus-within:text-blue-500">
                          <Package size={16} />
                        </div>
                        <input
                          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-bold"
                          value={currentProduct?.product_category || ''}
                          onChange={(e) => setCurrentProduct({...currentProduct, product_category: e.target.value})}
                          placeholder="분류 입력"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Product Name</label>
                    <input
                      required
                      className="w-full px-6 py-5 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-black text-lg text-slate-800 placeholder:text-slate-300 shadow-sm"
                      value={currentProduct?.product_name || ''}
                      onChange={(e) => setCurrentProduct({...currentProduct, product_name: e.target.value})}
                      placeholder="상품명을 정확하게 입력하세요"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Brand</label>
                      <input
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-bold shadow-sm"
                        value={currentProduct?.brand || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, brand: e.target.value})}
                        placeholder="브랜드명"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Unit (EA/KG/..)</label>
                      <input
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-black text-blue-600 text-center uppercase shadow-sm"
                        value={currentProduct?.unit || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, unit: e.target.value})}
                        placeholder="EA"
                      />
                    </div>
                  </div>
                </div>

                {/* 섹션 2: 가격 및 상세 사양 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Specification</label>
                      <input
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-bold shadow-sm"
                        value={currentProduct?.product_spec || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, product_spec: e.target.value})}
                        placeholder="상품 규격/사양"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Cost Price (원가)</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all text-right font-bold text-slate-700 shadow-sm"
                          value={formatPrice(currentProduct?.cost_price)}
                          onChange={(e) => setCurrentProduct({...currentProduct, cost_price: unformatPrice(e.target.value)})}
                        />
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">₩</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-xl shadow-blue-600/20 flex flex-col justify-center">
                    <label className="text-[11px] font-black text-blue-200 uppercase tracking-widest ml-2 mb-4">Retail Sale Price (판매가)</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-6 py-6 rounded-2xl bg-white/10 border border-white/20 focus:bg-white/20 outline-none transition-all text-right font-black text-2xl text-white placeholder:text-white/30"
                        value={formatPrice(currentProduct?.sale_price)}
                        onChange={(e) => setCurrentProduct({...currentProduct, sale_price: unformatPrice(e.target.value)})}
                        placeholder="0"
                      />
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 font-black text-xl">₩</span>
                    </div>
                    <p className="text-[10px] text-blue-200/60 font-bold mt-4 text-center">정확한 판매 단가를 입력해 주세요.</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-5 rounded-[1.75rem] bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all font-black active:scale-95"
                  >
                    닫기
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-5 rounded-[1.75rem] bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all shadow-xl shadow-blue-600/30 font-black flex items-center justify-center gap-3 active:scale-95 hover:brightness-110"
                  >
                    <Save size={24} strokeWidth={2.5} />
                    {isNew ? '상품 데이터 등록하기' : '수정사항 저장하기'}
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

export default AdminProduct;
