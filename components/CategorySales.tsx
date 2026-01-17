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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

/**
 * 品类销售页面
 * 实现真实数据库连接和数据可视化
 */
const CategorySales: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [sql, setSql] = useState(`--[io]销售客单按时段[T1]
declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@分类长度 varchar(20),@商品名称 varchar(max),@显示无变动商品 varchar(max),
@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max),@开始小时 int, @结束小时 int
select @商品编码='' , @机构='11021',@开始时间='2024-02-25' , @结束时间='2024-02-26',@显示无变动商品='否'
,@部门='',@分类='',@商品名称='',@分类长度='' , @开始小时=0 , @结束小时=23
exec up_rpt_io_sale_bytime @开始时间 , @结束时间 , @机构 , @部门 , @开始小时 , @结束小时,@分类, @分类长度,1`);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'sql'>('chart');
  const [error, setError] = useState<string | null>(null);

  /**
   * 运行SQL查询
   * 连接真实数据库并执行查询
   */
  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      // 开发环境使用本地服务器，生产环境使用 Netlify Functions
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3001/api/execute-sql'
        : '/.netlify/functions/execute-sql';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setData(result.data || []);
      if (viewMode === 'sql') setViewMode('chart');
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败，请检查SQL语句或网络连接。');
      console.error('查询失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

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
        <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-8">品类销售</h1>
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
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Database size={16} className="text-red-500" />
              <span className="text-sm font-bold text-red-700">数据库连接错误</span>
            </div>
            <p className="text-sm text-red-600">{error}</p>
            <div className="mt-3">
              <button
                onClick={runAnalysis}
                className="bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
              >
                重试连接
              </button>
            </div>
          </div>
        )}

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
                    销售客单按时段分布
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey={data.length > 0 ? Object.keys(data[0])[0] : '时段'} 
                          type="category" 
                          width={80} 
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip cursor={{ fill: '#f3f4f6' }} />
                        {data.length > 0 && Object.keys(data[0]).slice(1).map((key, index) => (
                          <Bar key={key} dataKey={key} radius={[0, 4, 4, 0]} barSize={20} fill={COLORS[index % COLORS.length]} name={key} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    <PieChartIcon size={16} className="mr-2 text-green-500" />
                    销售构成比例
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data}
                          dataKey={data.length > 0 ? Object.keys(data[0])[1] || '销售额' : '销售额'}
                          nameKey={data.length > 0 ? Object.keys(data[0])[0] || '时段' : '时段'}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        {data.length > 0 && Object.keys(data[0]).map((key) => (
                          <th key={key} className="px-4 py-3 font-semibold text-xs">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {Object.values(row).map((value, valIdx) => (
                            <td key={valIdx} className="px-4 py-3 text-xs font-mono">{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

export default CategorySales;