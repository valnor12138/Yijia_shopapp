import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Database, BarChart3, PieChart as PieChartIcon, Table as TableIcon, Play, Code2, TrendingUp, Users, CreditCard, DollarSign } from 'lucide-react';
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
  Pie,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const FIELD_MAPPING: Record<string, string> = {
  '日期': '日期',
  '星期': '星期',
  '机构': '机构',
  '机构名称': '机构名称',
  '客流': '客流',
  '客单': '客单',
  '销售额': '销售额',
  '毛利率': '毛利率',
  'c_datetime': '日期',
  'c_store_id': '机构',
  'c_name': '机构名称',
  'c_id': '客流ID',
  'c_amount': '金额',
  'c_pt_cost': '成本',
  'c_qtty': '数量'
};

const getFieldDisplayName = (fieldName: string): string => {
  return FIELD_MAPPING[fieldName] || fieldName;
};

const CustomerFlowReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [sql, setSql] = useState(`--[io]总客流日报[T2]
declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@商品名称 varchar(max),@显示无变动商品 varchar(max),
@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max)
select @商品编码='001097,001100' , @机构='11021',@开始时间='2025-04-26' , @结束时间='2025-04-27',@显示无变动商品='否',@部门='11',@分类='',@商品名称=''
select convert(char(10),a.c_datetime,20) as 日期,
case when DATEPART(WEEKDAY, a.c_datetime)=1 then '日'
     when DATEPART(WEEKDAY, a.c_datetime)=2 then '一'
     when DATEPART(WEEKDAY, a.c_datetime)=3 then '二'
     when DATEPART(WEEKDAY, a.c_datetime)=4 then '三'
     when DATEPART(WEEKDAY, a.c_datetime)=5 then '四'
     when DATEPART(WEEKDAY, a.c_datetime)=6 then '五'
     when DATEPART(WEEKDAY, a.c_datetime)=7 then '六'
end as 星期,
a.c_store_id as 机构,b.c_name as 机构名称,count(distinct a.c_id) as 客流,sum(a.c_amount)/count(distinct a.c_id) as 客单,
sum(a.c_amount) as 销售额,
case when sum(a.c_amount)=0 then null else (sum(a.c_amount)-sum(a.c_pt_cost*c_qtty))/sum(a.c_amount) end as 毛利率
from tb_o_sg a
left join tb_store b on a.c_store_id=b.c_id
where convert(char(10),a.c_datetime,20)>=@开始时间 and convert(char(10),a.c_datetime,20)<=@结束时间
and (isnull(@机构,'')='' or a.c_store_id in (select c_str from  dbo.uf_split_string(isnull(@机构,''),',')))
and a.c_id not like '-%'
and (a.c_adno<>'14')
group by convert(char(10),a.c_datetime,20) , DATEPART(WEEKDAY, a.c_datetime),a.c_store_id , b.c_name
order by convert(char(10),a.c_datetime,20) , a.c_store_id`);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'sql'>('chart');
  const [error, setError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [dataType, setDataType] = useState<'flow' | 'sales' | 'avg'>('flow');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3001/api/execute-sql'
        : '/.netlify/functions/execute-sql';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null;
        }
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortedData = () => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortConfig.direction === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  };

  const handleRowClick = (row: any, idx: number) => {
    setSelectedRowData(row);
    setIsDetailModalOpen(true);
  };

  const getChartData = () => {
    if (!data || data.length === 0) return [];

    const groupedData: Record<string, any> = {};
    data.forEach(item => {
      const dateKey = item['日期'] || Object.keys(item).find(k => k === '日期');
      if (dateKey && !groupedData[item[dateKey]]) {
        groupedData[item[dateKey]] = {
          日期: item[dateKey],
          星期: item['星期'] || '',
          客流: 0,
          销售额: 0,
          客单: 0,
          计数: 0
        };
      }
      if (dateKey) {
        const flowKey = Object.keys(item).find(k => k === '客流');
        const saleKey = Object.keys(item).find(k => k === '销售额');
        const avgKey = Object.keys(item).find(k => k === '客单');

        groupedData[item[dateKey]].客流 += Number(item[flowKey]) || 0;
        groupedData[item[dateKey]].销售额 += Number(item[saleKey]) || 0;
        groupedData[item[dateKey]].客单 = Number(item[avgKey]) || 0;
        groupedData[item[dateKey]].计数 += 1;
      }
    });

    return Object.values(groupedData).map((item: any) => ({
      ...item,
      客单: item.计数 > 0 ? (item.销售额 / item.客流 / item.计数) : 0
    }));
  };

  useEffect(() => {
    if (data.length > 0 && Object.keys(visibleColumns).length === 0) {
      const keys = Object.keys(data[0]);
      const initial: Record<string, boolean> = {};
      keys.forEach(key => { initial[key] = true; });
      setVisibleColumns(initial);
    }
  }, [data, visibleColumns]);

  useEffect(() => {
    runAnalysis();
  }, []);

  const totalFlow = data.reduce((sum, item) => {
    const flowKey = Object.keys(item).find(k => k === '客流');
    return sum + (flowKey ? Number(item[flowKey]) || 0 : 0);
  }, 0);

  const totalSales = data.reduce((sum, item) => {
    const saleKey = Object.keys(item).find(k => k === '销售额');
    return sum + (saleKey ? Number(item[saleKey]) || 0 : 0);
  }, 0);

  const avgFlow = data.length > 0 ? totalFlow / data.length : 0;

  const getDataKey = () => {
    switch (dataType) {
      case 'flow': return '客流';
      case 'sales': return '销售额';
      case 'avg': return '客单';
      default: return '客流';
    }
  };

  const getDataColor = () => {
    switch (dataType) {
      case 'flow': return COLORS[0];
      case 'sales': return COLORS[1];
      case 'avg': return COLORS[2];
      default: return COLORS[0];
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-100 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors mr-2"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-base font-semibold text-gray-800">总客流日报</h1>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play size={14} className="mr-1" />
          )}
          刷新
        </button>
      </header>

      {error && (
        <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
          <strong>错误：</strong>{error}
        </div>
      )}

      <div className="flex border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={() => setViewMode('chart')}
          className={`flex-1 py-2.5 px-4 text-xs font-medium transition-colors ${viewMode === 'chart' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <BarChart3 size={14} className="inline mr-1.5" />
          图表
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`flex-1 py-2.5 px-4 text-xs font-medium transition-colors ${viewMode === 'table' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <TableIcon size={14} className="inline mr-1.5" />
          表格
        </button>
        <button
          onClick={() => setViewMode('sql')}
          className={`flex-1 py-2.5 px-4 text-xs font-medium transition-colors ${viewMode === 'sql' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Code2 size={14} className="inline mr-1.5" />
          SQL
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-500 text-sm">正在请求 SQL Server 数据...</p>
          </div>
        ) : (
          <>
            {viewMode === 'chart' && (
              <div className="space-y-3 sm:space-y-4 h-full flex flex-col p-3">
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm flex-1 min-h-0">
                  <div className="mb-3 sm:mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">📊 客流与销售趋势</h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">按日期展示客流与销售变化</p>
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <span className="text-xs font-medium text-gray-600 mr-2">数据类型:</span>
                    <div className="flex border border-gray-200 rounded-md overflow-hidden">
                      <button
                        onClick={() => setDataType('flow')}
                        className={`py-1.5 px-3 text-xs font-medium transition-colors ${dataType === 'flow' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
                      >
                        客流
                      </button>
                      <button
                        onClick={() => setDataType('sales')}
                        className={`py-1.5 px-3 text-xs font-medium transition-colors ${dataType === 'sales' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
                      >
                        销售额
                      </button>
                      <button
                        onClick={() => setDataType('avg')}
                        className={`py-1.5 px-3 text-xs font-medium transition-colors ${dataType === 'avg' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
                      >
                        客单价
                      </button>
                    </div>
                  </div>

                  <div className="h-64 sm:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={getDataColor()} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={getDataColor()} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="日期"
                          style={{ fontSize: '11px' }}
                          tick={{ fill: '#666' }}
                        />
                        <YAxis
                          style={{ fontSize: '11px' }}
                          tick={{ fill: '#666' }}
                          tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                          contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                          formatter={(value, name) => {
                            if (name === '销售额') {
                              return [`¥${Number(value).toLocaleString()}`, '销售额'];
                            }
                            if (name === '客单') {
                              return [`¥${Number(value).toFixed(2)}`, '客单价'];
                            }
                            return [Number(value).toLocaleString(), name];
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={24}
                          formatter={(value) => getFieldDisplayName(value)}
                          wrapperStyle={{ fontSize: '11px' }}
                        />
                        <Area
                          type="monotone"
                          dataKey={getDataKey()}
                          stroke={getDataColor()}
                          fill="url(#colorGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center mb-1">
                      <Users size={14} className="text-blue-500 mr-1" />
                      <p className="text-[10px] text-gray-500">总客流</p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-blue-600">{totalFlow.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center mb-1">
                      <DollarSign size={14} className="text-green-500 mr-1" />
                      <p className="text-[10px] text-gray-500">总销售额</p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-green-600">¥{totalSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center mb-1">
                      <TrendingUp size={14} className="text-purple-500 mr-1" />
                      <p className="text-[10px] text-gray-500">日均客流</p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-purple-600">{avgFlow.toFixed(0)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center mb-1">
                      <CreditCard size={14} className="text-orange-500 mr-1" />
                      <p className="text-[10px] text-gray-500">平均客单价</p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-orange-600">¥{(totalSales / totalFlow * 100 / 100).toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-white p-2 sm:p-4 flex-1 min-h-[200px] sm:min-h-[250px] flex flex-col">
                  <h3 className="text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center shrink-0">
                    <PieChartIcon size={16} className="mr-2 text-green-500" />
                    客流占比
                  </h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getChartData().filter(item => item && typeof item === 'object')}
                          dataKey="客流"
                          nameKey="日期"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {getChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [Number(value).toLocaleString(), '客流']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'table' && (
              <div className="bg-white h-full flex flex-col overflow-hidden">
                <div className="px-2 sm:px-4 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center text-[10px] sm:text-xs">
                    <span className="text-gray-600 font-medium mr-1">显示列：</span>
                    <button
                      onClick={() => {
                        const allKeys = Object.keys(data[0] || {});
                        const newVisible: Record<string, boolean> = {};
                        allKeys.forEach(key => { newVisible[key] = true; });
                        setVisibleColumns(newVisible);
                      }}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium whitespace-nowrap"
                    >
                      全选
                    </button>
                    <button
                      onClick={() => {
                        const allKeys = Object.keys(data[0] || {});
                        const newVisible: Record<string, boolean> = {};
                        allKeys.forEach(key => { newVisible[key] = false; });
                        setVisibleColumns(newVisible);
                      }}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium whitespace-nowrap"
                    >
                      全不选
                    </button>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center border-l border-gray-300 pl-2">
                      {data.length > 0 && Object.keys(data[0]).map((key) => (
                        <label key={key} className="flex items-center space-x-1 text-gray-600 cursor-pointer whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={visibleColumns[key]}
                            onChange={() => toggleColumnVisibility(key)}
                            className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span>{getFieldDisplayName(key)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {sortConfig && (
                  <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-50 border-b border-blue-100 flex items-center text-[10px] sm:text-xs text-blue-700 shrink-0">
                    <span className="mr-1 sm:mr-2">🔽</span>
                    <span>当前排序：<strong>{getFieldDisplayName(sortConfig.key)}</strong>（{sortConfig.direction === 'asc' ? '升序 ↑' : '降序 ↓'}）</span>
                    <button
                      onClick={() => setSortConfig(null)}
                      className="ml-auto text-blue-500 hover:text-blue-700 underline"
                    >
                      取消
                    </button>
                  </div>
                )}

                <div className="flex-1 overflow-auto min-h-0">
                  <table className="w-full text-left text-[10px] sm:text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        {data.length > 0 && Object.keys(data[0]).filter(column => visibleColumns[column]).map((key) => (
                          <th
                            key={key}
                            className="px-2 sm:px-4 py-2 sm:py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors select-none sticky top-0 z-10"
                            onClick={() => handleSort(key)}
                          >
                            <div className="flex items-center space-x-0.5 sm:space-x-1">
                              <span className="truncate">{getFieldDisplayName(key)}</span>
                              {sortConfig?.key === key && (
                                <span className="text-blue-600 font-bold">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {getSortedData().map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => handleRowClick(row, idx)}
                        >
                          {Object.entries(row)
                            .filter(([column]) => visibleColumns[column])
                            .map(([key, value], valIdx) => (
                              <td
                                key={valIdx}
                                className="px-2 sm:px-4 py-2 sm:py-3"
                              >
                                {typeof value === 'number' ? value.toLocaleString() : value}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'sql' && (
              <div className="flex flex-col space-y-4 p-3">
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
      </div>

      {isDetailModalOpen && selectedRowData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">日期详情</h3>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(selectedRowData).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500 text-sm">{getFieldDisplayName(key)}</span>
                  <span className="text-gray-800 font-medium">
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerFlowReport;