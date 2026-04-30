import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * 메시징 센터 (문자 발송 이력) 페이지
 */
const SmsLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/sms-logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Logs fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full"><CheckCircle size={12}/> 성공</span>;
      case 'FAIL':
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-rose-100 text-rose-600 rounded-full"><XCircle size={12}/> 실패</span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-amber-100 text-amber-600 rounded-full"><AlertCircle size={12}/> 대기</span>;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.receiver_phone?.includes(searchTerm) || 
    log.cust_name?.includes(searchTerm) ||
    log.msg_content?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">메시징 센터</h1>
          <p className="text-slate-500">문자 발송 이력을 모니터링하고 관리합니다.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> 새로고침
        </button>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="수신번호, 이름 또는 내용으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">
          <Filter size={18} /> 상세 필터
        </button>
      </div>

      {/* 로그 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">발송 일시</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">수신자</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">분류</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">메시지 내용</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">데이터를 불러오는 중입니다...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">조회된 이력이 없습니다.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(log.reg_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{log.cust_name || '비회원'}</div>
                      <div className="text-xs text-slate-500">{log.receiver_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                        {log.send_category || '일반'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-sm text-slate-600">
                      {log.msg_content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(log.send_stat)}
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

export default SmsLogs;
