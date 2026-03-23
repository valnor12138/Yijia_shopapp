import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Database, BarChart3, PieChart as PieChartIcon, Table as TableIcon, Play, Code2, AlertTriangle, Package, XCircle, Clock } from 'lucide-react';
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
  Legend
} from 'recharts';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

const FIELD_MAPPING: Record<string, string> = {
  '品名': '品名',
  '条码': '条码',
  '规格': '规格',
  '单位': '单位',
  '新品日': '新品日',
  'w异动日': '异动日',
  'w商品品态': '商品品态',
  '库存状态': '库存状态',
  '主供应商名称': '主供应商名称',
  '库存数量': '库存数量',
  '日均销量': '日均销量',
  'w库存天数': '库存天数',
  '最后收货日期': '最后收货日期',
  '最后销售日期': '最后销售日期',
  '分类名称': '分类名称',
  '主供应商': '主供应商'
};

const getFieldDisplayName = (fieldName: string): string => {
  return FIELD_MAPPING[fieldName] || fieldName;
};

const AbnormalStatusReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [sql, setSql] = useState(`--[io]品态异常T12
declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@商品名称 varchar(max),@显示无变动商品 varchar(max),
@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max) , @对比开始时间 datetime , @对比结束时间 datetime ,@品类层级 int, @预警天数 int,@销售频率 varchar(50)
select @商品编码='' , @机构='11021',@开始时间='2025-04-28' , @结束时间='2025-04-28',@显示无变动商品='否',@部门='11',@分类='1',@商品名称='',@预警天数=3,@销售频率='畅销' ;
select @品类层级=1 ;
select g.c_name as 品名,g.c_barcode as 条码,g.c_model as 规格,g.c_basic_unit as 单位,gs.c_introduce_date as 新品日,
null as w异动日,gs.c_store_status as w商品品态,gs.c_store_status as 库存状态,
p.c_name as 主供应商名称,gs.c_number as 库存数量,gs.c_sn_perday as 日均销量,gs.c_dnlmt_day as w库存天数,
gs.c_lastin_dt as 最后收货日期,gs.c_lastsale_dt as 最后销售日期,
gc.c_name as 分类名称, gs.c_provider as 主供应商
from tb_gdsstore gs
left join tb_gds g on g.c_gcode=gs.c_gcode
left join tb_gdsclass gc on gc.c_ccode=g.c_ccode
left join tb_partner p  on p.c_no=gs.c_provider
where  (isnull(@机构,'')='' or gs.c_store_id in (select c_str from  dbo.uf_io_split_string( @机构, ',','store',1 , default ) ))
and gs.c_status not like '作废' and  gs.c_store_status<>'正常商品'`);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'sql'>('chart');
  const [error, setError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.DEV ? 'http://localhost:3001/api/execute-sql' : '/.netlify/functions/execute-sql';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);
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
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null;
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
      return sortConfig.direction === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
  };

  const handleRowClick = (row: any) => {
    setSelectedRowData(row);
    setIsDetailModalOpen(true);
  };

  const getChartData = () => {
    if (!data || data.length === 0) return [];
    const statusData: Record<string, number> = {};
    data.forEach(item => {
      const status = item['库存状态'] || item['w商品品态'] || '未知';
      if (!statusData[status]) statusData[status] = 0;
      statusData[status]++;
    });
    return Object.entries(statusData).map(([name, value]) => ({ name, value }));
  };

  useEffect(() => {
    if (data.length > 0 && Object.keys(visibleColumns).length === 0) {
      const keys = Object.keys(data[0]);
      const initial: Record<string, boolean> = {};
      keys.forEach(key => { initial[key] = true; });
      setVisibleColumns(initial);
    }
  }, [data, visibleColumns]);

  useEffect(() => { runAnalysis(); }, []);

  const totalCount = data.length;
  const totalStock = data.reduce((sum, item) => sum + (Number(item['库存数量']) || 0), 0);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-100 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors mr-2">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-base font-semibold text-gray-800">品态异常</h1>
        </div>
        <button onClick={runAnalysis} disabled={loading} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play size={14} className="mr-1" />}刷新
        </button>
      </header>

      {error && <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs"><strong>错误：</strong>{error}</div>}

      <div className="flex border-b border-gray-200 bg-white shrink-0">
        <button onClick={() => setViewMode('chart')} className={`flex-1 py-2.5 px-4 text-xs font-medium transition-colors ${viewMode === 'chart' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><BarChart3 size={14} className="inline mr-1.5" />图表</button>
        <button onClick={() => setViewMode('table')} className={`flex-1 py-2.5 px-4 text-xs font-medium transition-colors ${viewMode === 'table' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><TableIcon size={14} className="inline mr-1.5" />表格</button>
        <button onClick={() => setViewMode('sql')} className={`flex-1 py-2.5 px-4 text-xs font-medium transition-colors ${viewMode === 'sql' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><Code2 size={14} className="inline mr-1.5" />SQL</button>
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
                      <h3 className="text-sm font-bold text-gray-800">⚠️ 品态异常分布</h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">按库存状态统计异常商品</p>
                    </div>
                  </div>

                  <div className="h-64 sm:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" style={{ fontSize: '10px' }} tick={{ fill: '#666' }} angle={-45} textAnchor="end" height={60} />
                        <YAxis style={{ fontSize: '11px' }} tick={{ fill: '#666' }} />
                        <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} contentStyle={{ fontSize: '11px', borderRadius: '6px' }} formatter={(value) => [Number(value), '商品数']} />
                        <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} name="异常商品数" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center mb-1"><AlertTriangle size={14} className="text-red-500 mr-1" /><p className="text-[10px] text-gray-500">异常商品</p></div>
                    <p className="text-lg sm:text-xl font-bold text-red-600">{totalCount}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center mb-1"><Package size={14} className="text-blue-500 mr-1" /><p className="text-[10px] text-gray-500">总库存</p></div>
                    <p className="text-lg sm:text-xl font-bold text-blue-600">{totalStock.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center mb-1"><XCircle size={14} className="text-orange-500 mr-1" /><p className="text-[10px] text-gray-500">异常状态数</p></div>
                    <p className="text-lg sm:text-xl font-bold text-orange-600">{getChartData().length}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center mb-1"><Clock size={14} className="text-purple-500 mr-1" /><p className="text-[10px] text-gray-500">涉及供应商</p></div>
                    <p className="text-lg sm:text-xl font-bold text-purple-600">{new Set(data.map(d => d['主供应商'])).size}</p>
                  </div>
                </div>

                <div className="bg-white p-2 sm:p-4 flex-1 min-h-[200px] sm:min-h-[250px] flex flex-col">
                  <h3 className="text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center shrink-0"><PieChartIcon size={16} className="mr-2 text-green-500" />异常构成</h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={getChartData()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {getChartData().map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <Tooltip formatter={(value) => [Number(value), '商品数']} />
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
                    <button onClick={() => { const allKeys = Object.keys(data[0] || {}); const newVisible: Record<string, boolean> = {}; allKeys.forEach(key => { newVisible[key] = true; }); setVisibleColumns(newVisible); }} className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium whitespace-nowrap">全选</button>
                    <button onClick={() => { const allKeys = Object.keys(data[0] || {}); const newVisible: Record<string, boolean> = {}; allKeys.forEach(key => { newVisible[key] = false; }); setVisibleColumns(newVisible); }} className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium whitespace-nowrap">全不选</button>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center border-l border-gray-300 pl-2">
                      {data.length > 0 && Object.keys(data[0]).map((key) => (
                        <label key={key} className="flex items-center space-x-1 text-gray-600 cursor-pointer whitespace-nowrap">
                          <input type="checkbox" checked={visibleColumns[key]} onChange={() => toggleColumnVisibility(key)} className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500" />
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
                    <button onClick={() => setSortConfig(null)} className="ml-auto text-blue-500 hover:text-blue-700 underline">取消</button>
                  </div>
                )}

                <div className="flex-1 overflow-auto min-h-0">
                  <table className="w-full text-left text-[10px] sm:text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        {data.length > 0 && Object.keys(data[0]).filter(column => visibleColumns[column]).map((key) => (
                          <th key={key} className="px-2 sm:px-4 py-2 sm:py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors select-none sticky top-0 z-10" onClick={() => handleSort(key)}>
                            <div className="flex items-center space-x-0.5 sm:space-x-1">
                              <span className="truncate">{getFieldDisplayName(key)}</span>
                              {sortConfig?.key === key && (<span className="text-blue-600 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {getSortedData().map((row, idx) => (
                        <tr key={idx} className="hover:bg-red-50 cursor-pointer transition-colors" onClick={() => handleRowClick(row)}>
                          {Object.entries(row).filter(([column]) => visibleColumns[column]).map(([key, value], valIdx) => (
                            <td key={valIdx} className="px-2 sm:px-4 py-2 sm:py-3">{typeof value === 'number' ? value.toLocaleString() : value}</td>
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
                  <textarea value={sql} onChange={(e) => setSql(e.target.value)} className="bg-transparent text-blue-400 font-mono text-sm w-full h-64 outline-none border-none resize-none leading-relaxed" spellCheck={false} />
                </div>
                <button onClick={runAnalysis} className="bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform">
                  <Play size={18} fill="currentColor" /><span>执行查询并刷新报表</span>
                </button>
                <p className="text-[11px] text-gray-400 text-center italic">* 提示：此 SQL 将通过后台连接池发送至 SQL Server 实例执行</p>
              </div>
            )}
          </>
        )}
      </div>

      {isDetailModalOpen && selectedRowData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100"><h3 className="text-lg font-semibold text-gray-800">商品详情</h3></div>
            <div className="p-4 space-y-3">
              {Object.entries(selectedRowData).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500 text-sm">{getFieldDisplayName(key)}</span>
                  <span className="text-gray-800 font-medium">{typeof value === 'number' ? value.toLocaleString() : String(value)}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setIsDetailModalOpen(false)} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbnormalStatusReport;