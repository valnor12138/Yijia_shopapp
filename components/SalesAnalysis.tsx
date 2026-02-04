
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Database, BarChart3, PieChart as PieChartIcon, Table as TableIcon, Play, Code2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { fetchSalesRateAnalysis, DEFAULT_ANALYSIS_SQL } from '../services/api';
import { AnalysisData } from '../types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const SalesAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisData[]>([]);
  const [sql, setSql] = useState(DEFAULT_ANALYSIS_SQL);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'sql'>('chart');

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const results = await fetchSalesRateAnalysis(sql);
      setData(results);
      if (viewMode === 'sql') setViewMode('chart');
    } catch (err) {
      alert('查询失败，请检查 SQL 语句或网络连接。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 overflow-y-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-4 px-4 sticky top-0 z-40 shadow-sm flex items-center">
        <button 
          onClick={() => navigate('/')}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-8">动销率分析</h1>
      </header>

      {/* Control Tabs */}
      <div className="bg-white px-4 py-2 border-b border-gray-100 flex items-center justify-between sticky top-[61px] z-30">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full">
          <button 
            onClick={() => setViewMode('chart')}
            className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            <BarChart3 size={14} />
            <span>图表</span>
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            <TableIcon size={14} />
            <span>表格</span>
          </button>
          <button 
            onClick={() => setViewMode('sql')}
            className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'sql' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            <Code2 size={14} />
            <span>SQL</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-500 text-sm">正在请求 SQL Server 数据...</p>
          </div>
        ) : (
          <>
            {viewMode === 'chart' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    <BarChart3 size={16} className="mr-2 text-blue-500" />
                    各品类动销率对比 (%)
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="category" type="category" width={80} style={{ fontSize: '12px' }} />
                        <Tooltip cursor={{ fill: '#f3f4f6' }} />
                        <Bar dataKey="salesRate" radius={[0, 4, 4, 0]} barSize={20}>
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    <PieChartIcon size={16} className="mr-2 text-green-500" />
                    库存量构成比例
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data}
                          dataKey="stockVolume"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        >
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'table' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">品类</th>
                      <th className="px-4 py-3 font-semibold text-right">动销率</th>
                      <th className="px-4 py-3 font-semibold text-right">库存量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{row.category}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${row.salesRate > 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {row.salesRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{row.stockVolume.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'sql' && (
              <div className="flex flex-col space-y-4">
                <div className="bg-gray-900 rounded-xl p-4 shadow-inner overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-xs font-mono">SQL SERVER QUERY</span>
                    <Database size={14} className="text-blue-400" />
                  </div>
                  <textarea
                    value={sql}
                    onChange={(e) => setSql(e.target.value)}
                    className="bg-transparent text-blue-400 font-mono text-sm w-full h-64 outline-none border-none resize-none leading-relaxed"
                    spellCheck={false}
                  />
                </div>
                <button
                  onClick={runAnalysis}
                  className="bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                >
                  <Play size={18} fill="currentColor" />
                  <span>执行查询并刷新报表</span>
                </button>
                <p className="text-[11px] text-gray-400 text-center italic">
                  * 提示：此 SQL 将通过后台连接池发送至 SQL Server 实例执行
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SalesAnalysis;
