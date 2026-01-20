import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Database, BarChart3, PieChart as PieChartIcon, Table as TableIcon, Play, Code2, Eye, EyeOff, Settings } from 'lucide-react';
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

/**
 * 字段映射配置
 * 将数据库字段名映射为中文显示名
 * 基于图片中显示的字段名称
 */
const FIELD_MAPPING: Record<string, string> = {
  // 门店和机构相关字段
  'c_store_id': '门店ID',
  'c_store_name': '门店名称',
  'c_ccode': '机构代码',
  'c_ccode_name': '机构名称',
  
  // 销售客单按时段字段（图片中显示的）
  '时段': '时段',
  '客单数': '客单数',
  '客单量': '客单量',
  '销售数量': '销售数量',
  '销售金额': '销售金额',
  '开始日期': '开始日期',
  '结束日期': '结束日期',
  '初始库存': '初始库存',
  
  // 原始SQL字段映射
  'hours': '时段',
  'kl': '客单数',
  'kd': '客单量',
  'sale': '销售数量',
  'salesum': '销售金额',
  'bdate': '开始日期',
  'edate': '结束日期',
  'init': '初始库存',
  
  // 其他可能的字段
  '商品编码': '商品编码',
  '商品名称': '商品名称',
  '分类': '分类',
  '部门': '部门',
  '机构': '机构',
  '供应商编码': '供应商编码',
  '供应商名称': '供应商名称',
  '库存数量': '库存数量',
  '销售成本': '销售成本',
  '毛利': '毛利',
  '毛利率': '毛利率',
  '动销率': '动销率',
  '库存周转': '库存周转',
  '销售日期': '销售日期',
  '销售时间': '销售时间'
};

/**
 * 获取字段的中文显示名
 */
const getFieldDisplayName = (fieldName: string): string => {
  return FIELD_MAPPING[fieldName] || fieldName;
};

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
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('area');
  const [dataType, setDataType] = useState<'sales' | 'orders'>('sales');

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

  /**
   * 切换列的可见性
   */
  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  /**
   * 当数据加载完成后，初始化列可见性设置
   */
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
                {/* 销售客单按时段分析图表区域 */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  {/* 图表标题和操作按钮 */}
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">销售客单按时段分析</h3>
                      <p className="text-xs text-gray-500 mt-0.5">2024-02-25 至 2024-02-26 | 机构: 11021</p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
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
                      <button 
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                        title="下载图表"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 数据类型标签页 */}
                  <div className="flex border border-gray-200 rounded-md mb-4 overflow-hidden">
                    <button 
                      onClick={() => setDataType('sales')}
                      className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${dataType === 'sales' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      销售数据
                    </button>
                    <button 
                      onClick={() => setDataType('orders')}
                      className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${dataType === 'orders' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      订单数据
                    </button>
                  </div>

                  {/* 图表类型选择 */}
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

                  {/* 图表容器 */}
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {/* 通用图表配置 */}
                      {(() => {
                        // 获取时段字段和数值字段
                        const timeField = data.length > 0 ? 
                          (Object.keys(data[0]).find(key => ['hours', '时段'].includes(key.toLowerCase())) || Object.keys(data[0])[0]) 
                          : '时段';
                        const valueFields = data.length > 0 ? Object.keys(data[0]).filter(key => key !== timeField) : [];
                        
                        // 根据图表类型选择合适的图表组件
                        const renderChart = () => {
                          // 通用图表配置
                          const commonProps = {
                            data: data,
                            margin: { top: 10, right: 30, left: 20, bottom: 10 },
                          };

                          // 根据选择的数据类型过滤显示不同字段
                          const filteredValueFields = valueFields.filter(key => {
                            const fieldName = key.toLowerCase();
                            
                            // 根据数据类型显示不同的字段
                            switch (dataType) {
                              case 'sales':
                                // 销售数据：销售数量、销售金额、初始库存
                                return ['salesum', 'sale', 'init'].includes(fieldName);
                              case 'orders':
                                // 订单数据：客单数、客单量
                                return ['kl', 'kd'].includes(fieldName);
                              default:
                                return ['salesum', 'sale', 'kl', 'kd', 'init'].includes(fieldName);
                            }
                          });

                          // 渲染数据系列
                          const renderSeries = () => {
                            return filteredValueFields.map((key, index) => {
                              const commonSeriesProps = {
                                key: key,
                                dataKey: key,
                                stroke: COLORS[index % COLORS.length],
                                name: getFieldDisplayName(key),
                                strokeWidth: 2,
                              };

                              switch (chartType) {
                                case 'area':
                                  return (
                                    <Area
                                      {...commonSeriesProps}
                                      type="monotone"
                                      fillOpacity={0.6}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  );
                                case 'line':
                                  return (
                                    <Line
                                      {...commonSeriesProps}
                                      type="monotone"
                                      dot={{ r: 3 }}
                                      activeDot={{ r: 5 }}
                                    />
                                  );
                                case 'bar':
                                  return (
                                    <Bar
                                      {...commonSeriesProps}
                                      fill={COLORS[index % COLORS.length]}
                                      radius={[4, 4, 0, 0]}
                                      barSize={20}
                                    />
                                  );
                                default:
                                  return null;
                              }
                            });
                          };

                          // 判断是否需要双Y轴（销售数据类型且有多个量级不同的字段）
                          const needDualYAxis = dataType === 'sales' && filteredValueFields.length > 1;
                          
                          // 渲染不同类型的图表
                          switch (chartType) {
                            case 'area':
                              return (
                                <AreaChart {...commonProps}>
                                  {/* 渐变定义 */}
                                  <defs>
                                    {filteredValueFields.map((key, index) => (
                                      <linearGradient key={`colorKey-${index}`} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1}/>
                                      </linearGradient>
                                    ))}
                                  </defs>
                                  <XAxis dataKey={timeField} style={{ fontSize: '12px' }} tick={{ fill: '#666' }} />
                                  <YAxis 
                                    yAxisId="left" 
                                    style={{ fontSize: '12px' }} 
                                    tick={{ fill: '#666' }} 
                                    label={needDualYAxis ? { value: '销售数量/初始库存', angle: -90, position: 'insideLeft', fontSize: '11px' } : undefined}
                                  />
                                  {needDualYAxis && (
                                    <YAxis 
                                      yAxisId="right" 
                                      orientation="right" 
                                      style={{ fontSize: '12px' }} 
                                      tick={{ fill: '#666' }} 
                                      label={{ value: '销售金额', angle: 90, position: 'insideRight', fontSize: '11px' }}
                                    />
                                  )}
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} contentStyle={{ fontSize: '12px' }} />
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
                                    const commonSeriesProps = {
                                      key: key,
                                      dataKey: key,
                                      stroke: COLORS[index % COLORS.length],
                                      name: getFieldDisplayName(key),
                                      strokeWidth: 2,
                                    };
                                    
                                    // 销售金额使用右侧Y轴，其他使用左侧Y轴
                                    const yAxisId = key.toLowerCase() === 'salesum' ? 'right' : 'left';
                                    
                                    return (
                                      <Area
                                        {...commonSeriesProps}
                                        yAxisId={yAxisId}
                                        type="monotone"
                                        fillOpacity={0.6}
                                        fill={COLORS[index % COLORS.length]}
                                      />
                                    );
                                  })}
                                </AreaChart>
                              );
                            case 'line':
                              return (
                                <LineChart {...commonProps}>
                                  <XAxis dataKey={timeField} style={{ fontSize: '12px' }} tick={{ fill: '#666' }} />
                                  <YAxis 
                                    yAxisId="left" 
                                    style={{ fontSize: '12px' }} 
                                    tick={{ fill: '#666' }} 
                                    label={needDualYAxis ? { value: '销售数量/初始库存', angle: -90, position: 'insideLeft', fontSize: '11px' } : undefined}
                                  />
                                  {needDualYAxis && (
                                    <YAxis 
                                      yAxisId="right" 
                                      orientation="right" 
                                      style={{ fontSize: '12px' }} 
                                      tick={{ fill: '#666' }} 
                                      label={{ value: '销售金额', angle: 90, position: 'insideRight', fontSize: '11px' }}
                                    />
                                  )}
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: '12px' }} />
                                  <Legend 
                                    verticalAlign="top" 
                                    height={24} 
                                    formatter={(value) => getFieldDisplayName(value)}
                                    wrapperStyle={{ paddingBottom: '5px', flexWrap: 'wrap', justifyContent: 'center' }}
                                    iconType="line"
                                    layout="horizontal"
                                    iconSize={8}
                                    itemStyle={{ fontSize: '11px', marginRight: '8px' }}
                                  />
                                  {filteredValueFields.map((key, index) => {
                                    const commonSeriesProps = {
                                      key: key,
                                      dataKey: key,
                                      stroke: COLORS[index % COLORS.length],
                                      name: getFieldDisplayName(key),
                                      strokeWidth: 2,
                                    };
                                    
                                    // 销售金额使用右侧Y轴，其他使用左侧Y轴
                                    const yAxisId = key.toLowerCase() === 'salesum' ? 'right' : 'left';
                                    
                                    return (
                                      <Line
                                        {...commonSeriesProps}
                                        yAxisId={yAxisId}
                                        type="monotone"
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                      />
                                    );
                                  })}
                                </LineChart>
                              );
                            case 'bar':
                              return (
                                <BarChart {...commonProps}>
                                  <XAxis dataKey={timeField} style={{ fontSize: '12px' }} tick={{ fill: '#666' }} />
                                  <YAxis 
                                    yAxisId="left" 
                                    style={{ fontSize: '12px' }} 
                                    tick={{ fill: '#666' }} 
                                    label={needDualYAxis ? { value: '销售数量/初始库存', angle: -90, position: 'insideLeft', fontSize: '11px' } : undefined}
                                  />
                                  {needDualYAxis && (
                                    <YAxis 
                                      yAxisId="right" 
                                      orientation="right" 
                                      style={{ fontSize: '12px' }} 
                                      tick={{ fill: '#666' }} 
                                      label={{ value: '销售金额', angle: 90, position: 'insideRight', fontSize: '11px' }}
                                    />
                                  )}
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ fontSize: '12px' }} />
                                  <Legend 
                                    verticalAlign="top" 
                                    height={24} 
                                    formatter={(value) => getFieldDisplayName(value)}
                                    wrapperStyle={{ paddingBottom: '5px', flexWrap: 'wrap', justifyContent: 'center' }}
                                    iconType="rect"
                                    layout="horizontal"
                                    iconSize={8}
                                    itemStyle={{ fontSize: '11px', marginRight: '8px' }}
                                  />
                                  {filteredValueFields.map((key, index) => {
                                    const commonSeriesProps = {
                                      key: key,
                                      dataKey: key,
                                      name: getFieldDisplayName(key),
                                    };
                                    
                                    // 销售金额使用右侧Y轴，其他使用左侧Y轴
                                    const yAxisId = key.toLowerCase() === 'salesum' ? 'right' : 'left';
                                    
                                    return (
                                      <Bar
                                        {...commonSeriesProps}
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
                        };

                        return renderChart();
                      })()}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 销售构成比例图表 */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    <PieChartIcon size={16} className="mr-2 text-green-500" />
                    销售构成比例
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.filter(item => item && typeof item === 'object').slice(0, 12)} // 过滤有效的数据项并只显示前12个
                          dataKey={(entry) => {
                            if (!entry || typeof entry !== 'object') return 0;
                            
                            // 尝试获取销售金额字段
                            const salesAmountKey = Object.keys(entry).find(key => 
                              key.toLowerCase() === 'salesum' || key.toLowerCase() === '销售金额'
                            );
                            
                            if (salesAmountKey && typeof entry[salesAmountKey] === 'number') {
                              return entry[salesAmountKey];
                            }
                            
                            // 尝试获取其他数值字段
                            const numericKey = Object.keys(entry).find(key => 
                              typeof entry[key] === 'number' && 
                              !['hours', '时段'].some(timeKey => 
                                key.toLowerCase().includes(timeKey)
                              )
                            );
                            
                            return numericKey ? entry[numericKey] : 0;
                          }}
                          nameKey={(entry) => {
                            if (!entry || typeof entry !== 'object') return '未命名';
                            
                            // 尝试获取时段字段
                            const timeKey = Object.keys(entry).find(key => 
                              ['hours', '时段'].some(timeField => 
                                key.toLowerCase().includes(timeField)
                              )
                            );
                            
                            if (timeKey && entry[timeKey]) {
                              return entry[timeKey];
                            }
                            
                            // 尝试获取其他非数值字段作为名称
                            const nameKey = Object.keys(entry).find(key => 
                              typeof entry[key] !== 'number' && 
                              key.toLowerCase() !== 'salesum' && 
                              key.toLowerCase() !== '销售金额'
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
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* 显示列选择区域（严格按照图片复刻） */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2 items-center text-xs">
                  <span className="text-gray-600 font-medium">显示列：</span>
                  {data.length > 0 && Object.keys(data[0]).map((key) => (
                    <label key={key} className="flex items-center space-x-1 text-gray-600 cursor-pointer">
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

                {/* 表格内容 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        {data.length > 0 && Object.keys(data[0]).filter(column => visibleColumns[column]).map((key) => (
                          <th 
                            key={key} 
                            className="px-4 py-3 font-semibold text-xs cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleColumnVisibility(key)}
                            title="点击隐藏此列"
                          >
                            {getFieldDisplayName(key)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {Object.entries(row)
                            .filter(([column]) => visibleColumns[column])
                            .map(([_, value], valIdx) => (
                              <td key={valIdx} className="px-4 py-3 text-xs">{value}</td>
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