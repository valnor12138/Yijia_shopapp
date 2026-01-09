
import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, Wallet, ShoppingBag } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';

const dummyData = [
  { name: '01-01', value: 400 },
  { name: '01-02', value: 300 },
  { name: '01-03', value: 600 },
  { name: '01-04', value: 800 },
  { name: '01-05', value: 500 },
  { name: '01-06', value: 900 },
  { name: '01-07', value: 1100 },
];

const OperationAnalysis: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-6">
      <header className="bg-white border-b border-gray-50 py-5 flex items-center justify-center sticky top-0 z-40">
        <h1 className="text-lg font-bold text-gray-800">运营分析</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg text-white">
            <div className="flex justify-between items-start mb-2">
              <Wallet size={18} className="opacity-80" />
              <TrendingUp size={14} className="text-blue-100" />
            </div>
            <div className="text-xs opacity-80 mb-1">今日销售额</div>
            <div className="text-xl font-bold">¥ 45,280</div>
            <div className="text-[10px] mt-2 text-blue-100">+12.5% 较昨日</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-2xl shadow-lg text-white">
            <div className="flex justify-between items-start mb-2">
              <ShoppingBag size={18} className="opacity-80" />
              <TrendingDown size={14} className="text-indigo-100" />
            </div>
            <div className="text-xs opacity-80 mb-1">今日订单数</div>
            <div className="text-xl font-bold">1,284</div>
            <div className="text-[10px] mt-2 text-indigo-100">-2.3% 较昨日</div>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-800">近7日销售走势</h3>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">零售额 (万)</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dummyData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">门店实时排行</h3>
            <BarChart3 size={16} className="text-gray-400" />
          </div>
          <div className="p-2">
            {[
              { name: '北京朝阳旗舰店', sales: '¥12.5万', rate: '85%' },
              { name: '上海静安中心店', sales: '¥9.8万', rate: '92%' },
              { name: '深圳南山科技店', sales: '¥8.2万', rate: '78%' },
              { name: '杭州西湖概念店', sales: '¥7.4万', rate: '81%' },
            ].map((store, i) => (
              <div key={i} className="flex items-center p-3 hover:bg-gray-50 transition-colors">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 mr-3">
                  {i + 1}
                </div>
                <div className="flex-1 text-sm font-medium text-gray-700">{store.name}</div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-800">{store.sales}</div>
                  <div className="text-[9px] text-green-500 font-medium">达成率 {store.rate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationAnalysis;
