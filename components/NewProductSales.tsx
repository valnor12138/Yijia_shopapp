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
  Pie,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const FIELD_MAPPING: Record<string, string> = {
  'c_store_id': '门店ID',
  'c_store_name': '门店名称',
  'c_ccode': '品类编码',
  'c_ccode_name': '品类名称',
  '商品编码': '商品编码',
  '商品名称': '商品名称',
  '条码': '条码',
  '规格': '规格',
  '单位': '单位',
  '新品日': '新品日',
  '首次进货日期': '首次进货日期',
  '首次销售日期': '首次销售日期',
  '新品天数': '新品天数',
  '商品品态': '商品品态',
  '促销': '促销',
  '畅销': '畅销',
  '供应商名称': '供应商名称',
  '销售数量': '销售数量',
  '销售金额': '销售金额',
  '销售毛利': '销售毛利',
  '销售毛利率': '销售毛利率',
  '库存数量': '库存数量',
  '库存成本': '库存成本',
  '日均销售': '日均销售',
  '在途数量': '在途数量',
  '库存天数': '库存天数',
  '分类名称': '分类名称',
  'c_gcode': '商品编码',
  'c_name': '商品名',
  'c_barcode': '条码',
  'c_model': '规格',
  'c_basic_unit': '单位',
  'c_introduce_date': '新品日',
  'c_first_order_dt': '首次进货日期',
  'c_firstsale_dt': '首次销售日期',
  'c_test_day': '新品天数',
  'c_status': '商品品态',
  'c_pro_status': '促销',
  'c_sale_frequency': '畅销',
  'c_provider': '供应商',
  'c_number_sale': '销售数量',
  'c_sale': '销售金额',
  'c_maoli': '销售毛利',
  'c_maoliv': '销售毛利率',
  'c_number': '库存数量',
  'c_at_cost': '库存成本',
  'c_sn_perday': '日均销售',
  'c_onway': '在途数量',
  'c_dnlmt_day': '库存天数',
  '分类': '分类',
  '部门': '部门',
  '机构': '机构',
  '库存': '库存',
  '成本金额': '成本金额',
  '安全库存': '安全库存',
  '在途库存': '在途库存',
  '库存周转天数': '库存周转天数'
};

const getFieldDisplayName = (fieldName: string): string => {
  return FIELD_MAPPING[fieldName] || fieldName;
};

const NewProductSales: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [sql, setSql] = useState(`--[io]新品报表T10

declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@商品名称 varchar(max),@显示无变动商品 varchar(max),

@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max) , @对比开始时间 datetime , @对比结束时间 datetime , @预警天数 int,@销售频率 varchar(50)

select @商品编码='' , @机构='11021',@开始时间='2025-04-28' , @结束时间='2025-04-28',@显示无变动商品='否',@部门='11',@分类='',@商品名称='',@预警天数=3,@销售频率='畅销'

select g.c_gcode as 商品编码,g.c_name as 商品名, g.c_barcode as 条码,g.c_model as 规格,g.c_basic_unit as 单位,gs.c_introduce_date as 新品日,

gs.c_first_order_dt as 首次进货日期,gs.c_firstsale_dt as 首次销售日期,gs.c_test_day as 新品天数,

gs.c_status as 商品品态,gs.c_pro_status as 促销,gs.c_sale_frequency as 畅销,gs.c_provider as 供应商名称,

dg.c_number_sale as 销售数量, dg.c_sale as 销售金额,dg.c_maoli as 销售毛利,dg.c_maoliv as 销售毛利率,

gs.c_number as 库存数量,gs.c_at_cost as 库存成本,gs.c_sn_perday as 日均销售,gs.c_onway as 在途数量,gs.c_dnlmt_day as 库存天数,gc.c_name as 分类名称

from tb_gdsstore gs

left join tb_gds g on g.c_gcode=gs.c_gcode

left join tb_gdsclass gc on g.c_ccode=gc.c_ccode

left join (

select c_store_id ,c_gcode,sum(c_number_sale) as c_number_sale,sum(c_sale) as c_sale,sum(c_sale-c_at_sale) as c_maoli,

case when sum(c_sale)=0 then null else sum(c_sale-c_at_sale)/sum(c_sale) end as c_maoliv

from tbs_d_gds where convert(char(10),c_dt,20)>=@开始时间 and convert(char(10),c_dt,20)<=@结束时间

and (isnull(@机构,'')='' or c_store_id in (select c_str from  dbo.uf_split_string(isnull(@机构,''),',') ))

group by c_store_id ,c_gcode

) dg on dg.c_store_id=gs.c_store_id and dg.c_gcode=gs.c_gcode

where 1=1

and (isnull(@机构,'')='' or gs.c_store_id in (select c_str from  dbo.uf_split_string(isnull(@机构,''),',') ))

and gs.c_status not in ('暂停进货','正常流转','作废')

and isnull(gs.c_test_day,0)<>0

and gs.c_type like '%自营%'

and datediff(day,gs.c_introduce_date,getdate()) <g.c_od_day`);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'sql'>('chart');
  const [error, setError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('area');
  const [dataType, setDataType] = useState<'sales' | 'profit'>('sales');
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

  useEffect(() => {
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      const initialVisibleColumns: Record<string, boolean> = {};
      columns.forEach(column => {
        initialVisibleColumns[column] = true;
      });
      setVisibleColumns(initialVisibleColumns);
    }
  }, [data]);

  useEffect(() => {
    runAnalysis();
  }, []);

  const formatNumber = (val: any): string => {
    if (val === null || val === undefined) return '-';
    const num = Number(val);
    return isNaN(num) ? String(val) : num.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  };

  const formatCurrency = (val: any): string => {
    if (val === null || val === undefined) return '-';
    const num = Number(val);
    return isNaN(num) ? String(val) : `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (val: any): string => {
    if (val === null || val === undefined) return '-';
    const num = Number(val);
    return isNaN(num) ? String(val) : `${(num * 100).toFixed(2)}%`;
  };

  const formatDate = (val: any): string => {
    if (!val) return '-';
    if (typeof val === 'string' && val.includes('T')) {
      return val.split('T')[0];
    }
    return String(val);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-100 py-3 px-4 flex items-center shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={22} className="text-gray-600" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-gray-800 flex-1 text-center pr-8">新品销售分析</h1>
      </header>

      <div className="bg-white px-3 sm:px-4 py-2 border-b border-gray-100 shrink-0">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('chart')}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            <BarChart3 size={14} className="w-4 h-4" />
            <span>图表</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            <TableIcon size={14} className="w-4 h-4" />
            <span>表格</span>
          </button>
          <button
            onClick={() => setViewMode('sql')}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'sql' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            <Code2 size={14} className="w-4 h-4" />
            <span>SQL</span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
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
              <div className="space-y-3 sm:space-y-4 h-full flex flex-col">
                <div className="bg-white p-3 sm:p-4 rounded-none sm:rounded-xl border-0 sm:border border-gray-100 shadow-none sm:shadow-sm flex-1 min-h-0">
                  <div className="mb-3 sm:mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">📊 销售数据分析</h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">展示销售额排名前10的新品销售情况</p>
                    </div>
                    <button
                      onClick={runAnalysis}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                      title="刷新数据"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 1 1-9 9 9.75 9.75 0 0 1 6.74-2.74L21 16" />
                        <path d="M3 21v-5h5" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex border border-gray-200 rounded-md mb-4 overflow-hidden">
                    <button
                      onClick={() => setDataType('sales')}
                      className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${dataType === 'sales' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      销售数据
                    </button>
                    <button
                      onClick={() => setDataType('profit')}
                      className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${dataType === 'profit' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      毛利数据
                    </button>
                  </div>

                  <div className="flex items-center mb-4">
                    <span className="text-xs font-medium text-gray-600 mr-2">图表类型:</span>
                    <div className="flex border border-gray-200 rounded-md overflow-hidden">
                      <button
                        onClick={() => setChartType('bar')}
                        className={`py-1.5 px-3 text-xs font-medium transition-colors ${chartType === 'bar' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
                      >
                        柱状图
                      </button>
                      <button
                        onClick={() => setChartType('line')}
                        className={`py-1.5 px-3 text-xs font-medium transition-colors ${chartType === 'line' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
                      >
                        折线图
                      </button>
                      <button
                        onClick={() => setChartType('area')}
                        className={`py-1.5 px-3 text-xs font-medium transition-colors ${chartType === 'area' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
                      >
                        面积图
                      </button>
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {(() => {
                        const chartData = [...data]
                          .sort((a, b) => (Number(b['销售金额']) || 0) - (Number(a['销售金额']) || 0))
                          .slice(0, 10)
                          .map((item, idx) => ({
                            ...item,
                            displayName: (item['商品名'] || item['商品名称'] || `商品${idx + 1}`).toString().substring(0, 8)
                          }));

                        const commonProps = {
                          data: chartData,
                          margin: { top: 10, right: 30, left: 20, bottom: 60 },
                        };

                        const filteredValueFields = data.length > 0 ? Object.keys(data[0]).filter(key => {
                          switch (dataType) {
                            case 'sales':
                              return ['销售数量', '销售金额', '库存数量'].includes(key);
                            case 'profit':
                              return ['销售毛利', '销售毛利率'].includes(key);
                            default:
                              return ['销售数量', '销售金额', '销售毛利', '销售毛利率'].includes(key);
                          }
                        }) : [];

                        const needDualYAxis = dataType === 'sales' && filteredValueFields.length > 1;

                        switch (chartType) {
                          case 'area':
                            return (
                              <AreaChart {...commonProps}>
                                <defs>
                                  {filteredValueFields.map((key, index) => (
                                    <linearGradient key={`colorKey-${index}`} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1}/>
                                    </linearGradient>
                                  ))}
                                </defs>
                                <XAxis 
                                  dataKey="displayName" 
                                  style={{ fontSize: '10px' }} 
                                  tick={{ fill: '#666' }} 
                                  angle={-45}
                                  textAnchor="end"
                                  height={60}
                                />
                                <YAxis
                                  yAxisId="left"
                                  style={{ fontSize: '10px' }}
                                  tick={{ fill: '#666' }}
                                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                                  label={needDualYAxis ? { value: '销售量/库存', angle: -90, position: 'insideLeft', fontSize: '10px' } : undefined}
                                />
                                {needDualYAxis && (
                                  <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    style={{ fontSize: '10px' }}
                                    tick={{ fill: '#666' }}
                                    tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                                    label={{ value: '销售额(元)', angle: 90, position: 'insideRight', fontSize: '10px' }}
                                  />
                                )}
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <Tooltip 
                                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
                                  contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                                  formatter={(value, name) => {
                                    const displayName = getFieldDisplayName(name);
                                    if (name === '销售金额' || name === '销售毛利') {
                                      return [`¥${Number(value).toLocaleString()}`, displayName];
                                    }
                                    return [Number(value).toLocaleString(), displayName];
                                  }}
                                  labelFormatter={(label) => `商品: ${label}`}
                                />
                                <Legend
                                  verticalAlign="top"
                                  height={24}
                                  formatter={(value) => getFieldDisplayName(value)}
                                  wrapperStyle={{ paddingBottom: '5px', flexWrap: 'wrap', justifyContent: 'center' }}
                                  iconType="circle"
                                  layout="horizontal"
                                  iconSize={8}
                                  itemStyle={{ fontSize: '11px', marginRight: '8px' }}
                                />
                                {filteredValueFields.map((key, index) => {
                                  const yAxisId = key === '销售金额' ? 'right' : 'left';

                                  return (
                                    <Area
                                      key={key}
                                      dataKey={key}
                                      name={getFieldDisplayName(key)}
                                      yAxisId={yAxisId}
                                      type="monotone"
                                      fill={`url(#color${index})`}
                                      fillOpacity={0.6}
                                      stroke={COLORS[index % COLORS.length]}
                                      strokeWidth={2}
                                    />
                                  );
                                })}
                              </AreaChart>
                            );
                          case 'line':
                            return (
                              <LineChart {...commonProps}>
                                <XAxis 
                                  dataKey="displayName" 
                                  style={{ fontSize: '10px' }} 
                                  tick={{ fill: '#666' }} 
                                  angle={-45}
                                  textAnchor="end"
                                  height={60}
                                />
                                <YAxis
                                  yAxisId="left"
                                  style={{ fontSize: '10px' }}
                                  tick={{ fill: '#666' }}
                                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                                  label={needDualYAxis ? { value: '销售量/库存', angle: -90, position: 'insideLeft', fontSize: '10px' } : undefined}
                                />
                                {needDualYAxis && (
                                  <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    style={{ fontSize: '10px' }}
                                    tick={{ fill: '#666' }}
                                    tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                                    label={{ value: '销售额(元)', angle: 90, position: 'insideRight', fontSize: '10px' }}
                                  />
                                )}
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <Tooltip 
                                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
                                  contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                                  formatter={(value, name) => {
                                    const displayName = getFieldDisplayName(name);
                                    if (name === '销售金额' || name === '销售毛利') {
                                      return [`¥${Number(value).toLocaleString()}`, displayName];
                                    }
                                    return [Number(value).toLocaleString(), displayName];
                                  }}
                                  labelFormatter={(label) => `商品: ${label}`}
                                />
                                <Legend
                                  verticalAlign="top"
                                  height={24}
                                  formatter={(value) => getFieldDisplayName(value)}
                                  wrapperStyle={{ paddingBottom: '5px', flexWrap: 'wrap', justifyContent: 'center' }}
                                  iconType="circle"
                                  layout="horizontal"
                                  iconSize={8}
                                  itemStyle={{ fontSize: '11px', marginRight: '8px' }}
                                />
                                {filteredValueFields.map((key, index) => {
                                  const yAxisId = key === '销售金额' ? 'right' : 'left';

                                  return (
                                    <Line
                                      key={key}
                                      dataKey={key}
                                      name={getFieldDisplayName(key)}
                                      yAxisId={yAxisId}
                                      type="monotone"
                                      dot={{ r: 3 }}
                                      activeDot={{ r: 5 }}
                                      stroke={COLORS[index % COLORS.length]}
                                      strokeWidth={2}
                                    />
                                  );
                                })}
                              </LineChart>
                            );
                          case 'bar':
                            return (
                              <BarChart {...commonProps}>
                                <XAxis 
                                  dataKey="displayName" 
                                  style={{ fontSize: '10px' }} 
                                  tick={{ fill: '#666' }} 
                                  angle={-45}
                                  textAnchor="end"
                                  height={60}
                                />
                                <YAxis
                                  yAxisId="left"
                                  style={{ fontSize: '10px' }}
                                  tick={{ fill: '#666' }}
                                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                                  label={needDualYAxis ? { value: '销售量/库存', angle: -90, position: 'insideLeft', fontSize: '10px' } : undefined}
                                />
                                {needDualYAxis && (
                                  <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    style={{ fontSize: '10px' }}
                                    tick={{ fill: '#666' }}
                                    tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                                    label={{ value: '销售额(元)', angle: 90, position: 'insideRight', fontSize: '10px' }}
                                  />
                                )}
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <Tooltip 
                                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
                                  contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                                  formatter={(value, name) => {
                                    const displayName = getFieldDisplayName(name);
                                    if (name === '销售金额' || name === '销售毛利') {
                                      return [`¥${Number(value).toLocaleString()}`, displayName];
                                    }
                                    return [Number(value).toLocaleString(), displayName];
                                  }}
                                  labelFormatter={(label) => `商品: ${label}`}
                                />
                                <Legend
                                  verticalAlign="top"
                                  height={24}
                                  formatter={(value) => getFieldDisplayName(value)}
                                  wrapperStyle={{ paddingBottom: '5px', flexWrap: 'wrap', justifyContent: 'center' }}
                                  iconType="circle"
                                  layout="horizontal"
                                  iconSize={8}
                                  itemStyle={{ fontSize: '11px', marginRight: '8px' }}
                                />
                                {filteredValueFields.map((key, index) => {
                                  const yAxisId = key === '销售金额' ? 'right' : 'left';

                                  return (
                                    <Bar
                                      key={key}
                                      dataKey={key}
                                      name={getFieldDisplayName(key)}
                                      yAxisId={yAxisId}
                                      fill={COLORS[index % COLORS.length]}
                                      radius={[4, 4, 0, 0]}
                                      barSize={20}
                                    />
                                  );
                                })}
                              </BarChart>
                            );
                          default:
                            return null;
                        }
                      })()}
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-2 sm:p-4 flex-1 min-h-[200px] sm:min-h-[300px] flex flex-col">
                  <h3 className="text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center shrink-0">
                    <PieChartIcon size={16} className="mr-2 text-green-500" />
                    新品销售构成比例
                  </h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.filter(item => item && typeof item === 'object').slice(0, 12)}
                          dataKey={(entry) => {
                            if (!entry || typeof entry !== 'object') return 0;

                            const salesAmountKey = Object.keys(entry).find(key =>
                              key.toLowerCase() === 'c_sale' || key.toLowerCase() === '销售额'
                            );

                            if (salesAmountKey && typeof entry[salesAmountKey] === 'number') {
                              return entry[salesAmountKey];
                            }

                            const numericKey = Object.keys(entry).find(key =>
                              typeof entry[key] === 'number' &&
                              !['c_gcode', '商品编码'].some(codeKey =>
                                key.toLowerCase().includes(codeKey)
                              )
                            );

                            return numericKey ? entry[numericKey] : 0;
                          }}
                          nameKey={(entry) => {
                            if (!entry || typeof entry !== 'object') return '未命名';

                            const codeKey = Object.keys(entry).find(key =>
                              ['c_gcode', '商品编码'].some(codeField =>
                                key.toLowerCase().includes(codeField)
                              )
                            );

                            if (codeKey && entry[codeKey]) {
                              return entry[codeKey];
                            }

                            const nameKey = Object.keys(entry).find(key =>
                              typeof entry[key] !== 'number' &&
                              key.toLowerCase() !== 'c_sale' &&
                              key.toLowerCase() !== '销售额'
                            );

                            return nameKey ? entry[nameKey] : '未命名';
                          }}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={2}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                          labelLine={{ stroke: '#666', strokeWidth: 0.5 }}
                          strokeWidth={1}
                          stroke="#fff"
                        >
                          {data.filter(item => item && typeof item === 'object').slice(0, 12).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: '12px', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                          formatter={(value, name) => [`${value}`, `${getFieldDisplayName(name)}`]}
                        />
                        <Legend
                          align="center"
                          verticalAlign="bottom"
                          layout="horizontal"
                          formatter={(value) => getFieldDisplayName(value)}
                          wrapperStyle={{ paddingTop: '10px', flexWrap: 'wrap' }}
                          iconType="rect"
                          iconSize={10}
                          itemStyle={{ fontSize: '12px', marginRight: '12px', marginBottom: '4px' }}
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
                        {data.length > 0 && Object.keys(data[0]).filter(column => visibleColumns[column]).map((key) => {
                          const isProductName = key === '商品名称' || key === '商品名';
                          const isFrozen = isProductName;

                          return (
                            <th
                              key={key}
                              className={`px-2 sm:px-4 py-2 sm:py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors select-none ${isFrozen ? 'sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.15)]' : 'sticky top-0 z-10'}`}
                              onClick={() => handleSort(key)}
                              title={isFrozen ? `${getFieldDisplayName(key)} - 固定列` : `点击按 ${getFieldDisplayName(key)} 排序`}
                            >
                              <div className="flex items-center space-x-0.5 sm:space-x-1">
                                <span className="truncate max-w-[60px] sm:max-w-none">{getFieldDisplayName(key)}</span>
                                {sortConfig?.key === key && (
                                  <span className="text-blue-600 font-bold">
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                                {isFrozen && <span className="text-gray-400 text-[8px] sm:text-[10px]">📌</span>}
                              </div>
                            </th>
                          );
                        })}
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
                            .map(([key, value], valIdx) => {
                              const isProductName = key === '商品名称' || key === '商品名';
                              const isFrozen = isProductName;

                              return (
                                <td
                                  key={valIdx}
                                  className={`px-2 sm:px-4 py-2 sm:py-3 ${isFrozen ? 'sticky left-0 bg-white hover:bg-blue-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.08)] font-medium' : ''}`}
                                >
                                  <span className={isFrozen ? 'font-medium' : ''}>
                                    {typeof value === 'number' ? value.toLocaleString() : value}
                                  </span>
                                </td>
                              );
                            })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t border-gray-100 text-[10px] sm:text-xs text-gray-500 flex justify-between shrink-0">
                  <span>共 {data.length} 条</span>
                  <span>💡 点击行查看详情</span>
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

      {isDetailModalOpen && selectedRowData && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">商品详情</h3>
                <p className="text-blue-100 text-xs mt-1">{selectedRowData['商品编码'] || selectedRowData['c_gcode']}</p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-gray-50 rounded-xl p-4 mb-4">
                  <h4 className="text-gray-700 font-semibold text-sm mb-3 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    基本信息
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">商品名称</span>
                      <span className="text-gray-800 text-sm">{selectedRowData['商品名称'] || selectedRowData['商品名'] || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">条码</span>
                      <span className="text-gray-800 text-sm">{selectedRowData['条码'] || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">规格</span>
                      <span className="text-gray-800 text-sm">{selectedRowData['规格'] || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">单位</span>
                      <span className="text-gray-800 text-sm">{selectedRowData['单位'] || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">分类</span>
                      <span className="text-gray-800 text-sm">{selectedRowData['分类名称'] || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">供应商</span>
                      <span className="text-gray-800 text-sm">{selectedRowData['供应商名称'] || selectedRowData['供应商'] || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 bg-green-50 rounded-xl p-4 mb-4">
                  <h4 className="text-gray-700 font-semibold text-sm mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    销售数据
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">销售数量</span>
                      <span className="text-blue-600 font-bold text-sm">{formatNumber(selectedRowData['销售数量'])}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">销售金额</span>
                      <span className="text-blue-600 font-bold text-sm">{formatCurrency(selectedRowData['销售金额'])}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">销售毛利</span>
                      <span className="text-gray-800 text-sm">{formatCurrency(selectedRowData['销售毛利'])}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">毛利率</span>
                      <span className="text-gray-800 text-sm">{formatPercent(selectedRowData['销售毛利率'])}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 bg-orange-50 rounded-xl p-4 mb-4">
                  <h4 className="text-gray-700 font-semibold text-sm mb-3 flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    库存数据
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">库存数量</span>
                      <span className="text-gray-800 text-sm">{formatNumber(selectedRowData['库存数量'])}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">库存成本</span>
                      <span className="text-gray-800 text-sm">{formatCurrency(selectedRowData['库存成本'])}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">日均销售</span>
                      <span className="text-gray-800 text-sm">{formatNumber(selectedRowData['日均销售'])}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">在途数量</span>
                      <span className="text-gray-800 text-sm">{formatNumber(selectedRowData['在途数量'])}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">库存天数</span>
                      <span className="text-gray-800 text-sm">{formatNumber(selectedRowData['库存天数'])}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 bg-purple-50 rounded-xl p-4">
                  <h4 className="text-gray-700 font-semibold text-sm mb-3 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    新品信息
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">新品日</span>
                      <span className="text-gray-800 text-sm">{formatDate(selectedRowData['新品日'])}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">新品天数</span>
                      <span className="text-gray-800 text-sm">{formatNumber(selectedRowData['新品天数'])}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">首次进货日期</span>
                      <span className="text-gray-800 text-sm">{formatDate(selectedRowData['首次进货日期'])}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">首次销售日期</span>
                      <span className="text-gray-800 text-sm">{formatDate(selectedRowData['首次销售日期'])}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">商品品态</span>
                      <span className="text-gray-800 text-sm">{selectedRowData['商品品态'] || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">促销</span>
                      <span className="text-gray-800 text-sm">{selectedRowData['促销'] || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">畅销</span>
                      <span className="text-gray-800 text-sm">{selectedRowData['畅销'] || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
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

export default NewProductSales;
