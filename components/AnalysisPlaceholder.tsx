import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart3, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * 运营分析页面
 * 显示默认的运营数据和可视化图表
 */
const AnalysisPlaceholder: React.FC = () => {
  const navigate = useNavigate();

  // 默认运营数据
  const operationalData = [
    { name: '1月', 销售额: 120000, 订单数: 850, 客单价: 141 },
    { name: '2月', 销售额: 150000, 订单数: 980, 客单价: 153 },
    { name: '3月', 销售额: 180000, 订单数: 1200, 客单价: 150 },
    { name: '4月', 销售额: 165000, 订单数: 1100, 客单价: 150 },
    { name: '5月', 销售额: 200000, 订单数: 1350, 客单价: 148 },
    { name: '6月', 销售额: 220000, 订单数: 1500, 客单价: 147 }
  ];

  // 关键指标数据
  const keyMetrics = [
    { title: '总销售额', value: '1,035,000', trend: '+12.5%', icon: <TrendingUp className="text-green-500" />, isPositive: true },
    { title: '总订单数', value: '6,980', trend: '+8.3%', icon: <TrendingUp className="text-green-500" />, isPositive: true },
    { title: '平均客单价', value: '148', trend: '-2.0%', icon: <TrendingDown className="text-red-500" />, isPositive: false },
    { title: '订单完成率', value: '98.2%', trend: '+1.1%', icon: <TrendingUp className="text-green-500" />, isPositive: true }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-4 px-4 sticky top-0 z-40 shadow-sm flex items-center">
        <button 
          onClick={() => navigate('/')}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-8">运营分析</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {keyMetrics.map((metric, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">{metric.title}</span>
                {metric.icon}
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-gray-800">{metric.value}</span>
                <span className={`text-xs font-semibold ${metric.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {metric.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
            <BarChart3 size={16} className="mr-2 text-blue-500" />
            销售趋势分析
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operationalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="销售额" fill="#3B82F6" name="销售额" />
                <Bar dataKey="订单数" fill="#10B981" name="订单数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Section */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
            <AlertCircle size={16} className="mr-2 text-amber-500" />
            运营预警
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-sm text-gray-700">6月份客单价较上月下降2.0%，需关注</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-gray-700">总销售额同比增长12.5%，表现良好</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-sm text-gray-700">订单完成率持续提升，服务质量良好</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalysisPlaceholder;