import React from 'react';
import { 
  Users, 
  Heart, 
  Wallet, 
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

/**
 * 관리자 대시보드 메인 화면
 */
const AdminDashboard = () => {
  const [data, setData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const statsData = await response.json();
        setData(statsData);
      } catch (error) {
        console.error('Stats fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // 통계 카드 데이터 구성
  const stats = [
    { 
      label: '총 회원 수', 
      value: isLoading ? '...' : (data?.userCount || 0).toLocaleString(), 
      icon: <Users className="text-blue-500" />, 
      trend: '+12.5%', 
      color: 'bg-blue-50' 
    },
    { 
      label: '당해년도 기부 요청', 
      value: isLoading ? '...' : `₩${(data?.totalRequestedAmt || 0).toLocaleString()}`, 
      icon: <Wallet className="text-amber-500" />, 
      trend: '올해 합계', 
      color: 'bg-amber-50' 
    },
    { 
      label: '당해년도 기부 완료', 
      value: isLoading ? '...' : `₩${(data?.totalCompletedAmt || 0).toLocaleString()}`, 
      icon: <CheckCircle className="text-emerald-500" />, 
      trend: '승인 완료', 
      color: 'bg-emerald-50' 
    },
    { 
      label: '승인 대기 건수', 
      value: isLoading ? '...' : (data?.pendingCount || 0).toLocaleString(), 
      icon: <Clock className="text-indigo-500" />, 
      trend: '처리 필요', 
      color: 'bg-indigo-50' 
    },
  ];

  // 실제 데이터 또는 기본값 설정
  const chartData = data?.chartData || [
    { name: '데이터 없음', amt: 0 }
  ];
  
  const recentRequests = data?.recentRequests || [];

  return (
    <div className="space-y-8">
      {/* 제목 영역 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">종합 현황 대시보드</h1>
        <p className="text-slate-500">오늘의 스마트나눔 운영 현황을 한눈에 확인하세요.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full text-slate-500 bg-slate-100">
                {stat.trend}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 기부 트렌드 차트 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">월별 기부 추이 (요청 금액 기준)</h3>
            <select className="text-sm border-slate-200 rounded-lg p-1 px-2 focus:ring-blue-500 focus:border-blue-500">
              <option>최근 7개월</option>
              <option>최근 1년</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [`₩${value.toLocaleString()}`, '요청 금액']}
                />
                <Area type="monotone" dataKey="amt" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 최근 신청 내역 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">최근 기부 신청</h3>
            <button className="text-sm text-blue-600 font-medium hover:underline">전체보기</button>
          </div>
          <div className="space-y-6 flex-1">
            {recentRequests.length > 0 ? (
              recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                      {req.user[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{req.user}</p>
                      <p className="text-xs text-slate-500">{req.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {typeof req.amount === 'number' ? `₩${req.amount.toLocaleString()}` : req.amount}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      req.status === '완료' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Clock className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">최근 신청 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
