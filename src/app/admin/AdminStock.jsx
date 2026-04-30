import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Search, 
  RefreshCcw, 
  Box, 
  Building, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  PackageCheck,
  Calendar
} from 'lucide-react';

/**
 * 상품 재고 현황 화면
 * 현재 창고(기부처)별 상품의 실재고량을 파악합니다.
 */
const AdminStock = () => {
  const [stocks, setStocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 재고 목록 가져오기
  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stock-status');
      const data = await response.json();
      setStocks(data);
    } catch (error) {
      console.error('재고 현황 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // 검색 필터링
  const filteredStocks = stocks.filter(s => 
    s.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 통계 요약 계산
  const totalStockItems = stocks.reduce((acc, curr) => acc + curr.current_stock, 0);
  const lowStockItems = stocks.filter(s => s.current_stock < 10).length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 섹션 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="text-blue-600" />
              상품 재고 현황
            </h1>
            <p className="text-gray-500 mt-1">기부처별 실시간 재고 보유량을 모니터링합니다.</p>
          </div>
          <button
            onClick={fetchStocks}
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl transition-all border border-gray-200 font-medium shadow-sm"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>

        {/* 요약 대시보드 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
              <PackageCheck size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">총 재고 수량</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalStockItems.toLocaleString()} <span className="text-sm font-normal text-gray-400 ml-1">Items</span></h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="p-4 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-100">
              <AlertTriangle size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">재고 부족 품목 (10개 미만)</p>
              <h3 className="text-2xl font-bold text-gray-800">{lowStockItems} <span className="text-sm font-normal text-gray-400 ml-1">SKUs</span></h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="p-4 bg-green-500 rounded-2xl text-white shadow-lg shadow-green-100">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">활성 보관 기부처</p>
              <h3 className="text-2xl font-bold text-gray-800">{new Set(stocks.map(s => s.client_no)).size} <span className="text-sm font-normal text-gray-400 ml-1">Clients</span></h3>
            </div>
          </div>
        </div>

        {/* 검색바 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
          <Search className="text-gray-400" size={22} />
          <input
            type="text"
            placeholder="상품명 또는 기부처명으로 재고 검색..."
            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 재고 리스트 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">보관 장소 (기부처)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">상품 정보</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">카테고리</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">현재 재고</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">최종 입고 / 출고</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400">데이터 분석 중...</td>
                  </tr>
                ) : filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400">조회된 재고 내역이 없습니다.</td>
                  </tr>
                ) : (
                  filteredStocks.map((s) => (
                    <tr key={`${s.client_no}-${s.product_code}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded text-gray-500">
                            <Building size={14} />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{s.client_name}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 ml-7">{s.client_no}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-700">{s.product_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{s.product_spec} | {s.product_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                          {s.product_category || '미분류'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`text-lg font-black ${s.current_stock < 10 ? 'text-red-600' : 'text-gray-800'}`}>
                          {s.current_stock?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{s.unit || 'EA'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="w-12 text-blue-500 font-medium">최근입고</span>
                          <Calendar size={12} />
                          {s.last_receipt_date || '-'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                          <span className="w-12 text-amber-500 font-medium">최근출고</span>
                          <Calendar size={12} />
                          {s.last_release_date || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.current_stock < 10 ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-pulse">
                            <AlertTriangle size={12} />
                            재고부족
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            <PackageCheck size={12} />
                            정상
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStock;
