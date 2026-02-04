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
 * 基于新品销售分析[T10]的字段名称
 */
const FIELD_MAPPING: Record<string, string> = {
  // 门店和机构相关字段
  'c_store_id': '门店ID',
  'c_store_name': '门店名称',
  'c_ccode': '品类编码',
  'c_ccode_name': '品类名称',
  
  // 新品销售分析字段
  '商品编码': '商品编码',
  '商品名称': '商品名称',
  '条码': '条码',
  '规格': '规格',
  '单位': '单位',
  '上市日期': '上市日期',
  '首次订单日期': '首次订单日期',
  '首次销售日期': '首次销售日期',
  '试销期': '试销期',
  '商品状态': '商品状态',
  '销售状态': '销售状态',
  '销售频率': '销售频率',
  '供应商编码': '供应商编码',
  '销售量': '销售量',
  '销售额': '销售额',
  '毛利': '毛利',
  '毛利率': '毛利率',
  '库存': '库存',
  '成本金额': '成本金额',
  '安全库存': '安全库存',
  '在途库存': '在途库存',
  '库存周转天数': '库存周转天数',
  '品类名称': '品类名称',
  
  // 原始SQL字段映射
  'c_gcode': '商品编码',
  'c_name': '商品名称',
  'c_barcode': '条码',
  'c_model': '规格',
  'c_basic_unit': '单位',
  'c_introduce_date': '上市日期',
  'c_first_order_dt': '首次订单日期',
  'c_firstsale_dt': '首次销售日期',
  'c_test_day': '试销期',
  'c_status': '商品状态',
  'c_pro_status': '生产状态',
  'c_sale_frequency': '销售频率',
  'c_provider': '供应商编码',
  'c_number_sale': '销售量',
  'c_sale': '销售额',
  'c_maoli': '毛利',
  'c_maoliv': '毛利率',
  'c_number': '库存',
  'c_at_cost': '成本金额',
  'c_sn_perday': '安全库存',
  'c_onway': '在途库存',
  'c_dnlmt_day': '库存周转天数',
  
  // 其他可能的字段
  '分类': '分类',
  '部门': '部门',
  '机构': '机构',
  '供应商名称': '供应商名称',
  '库存数量': '库存数量',
  '销售成本': '销售成本',
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
 * 新品销售分析页面
 * 实现真实数据库连接和数据可视化
 */
const NewProductSales: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [sql, setSql] = useState(`--[io]新品报表T10 
declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@商品名称 varchar(max),@显示无变动商品 varchar(max), 
@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max) , @对比开始时间 datetime , @对比结束时间 datetime , @预警天数 int,@销售频率 varchar(50) 
select @商品编码='' , @机构='11021',@开始时间='2025-04-28' , @结束时间='2025-04-28',@显示无变动商品='否',@部门='11',@分类='',@商品名称='',@预警天数=3,@销售频率='畅销' 
--品名 	 条码 	 规格 	 单位 	 新品日 	 首次进货日期 	 首次销售日期 	 新品天数 	 商品品态 	 促销 	 畅销 	 供应商名称 	 
--销售数量 	 销售金额 	 销售毛利 	 销售毛利率 	 库存数量 	 库存成本 	 日均销售 	 在途数量 	 库存天数 	 分类名称
select top 10 g.c_gcode as 商品编码,g.c_name as 商品名, g.c_barcode as 条码,g.c_model as 规格,g.c_basic_unit as 单位,gs.c_introduce_date as 新品日,
gs.c_first_order_dt as 首次进货日期,gs.c_firstsale_dt as 首次销售日期,gs.c_test_day as 新品天数,
gs.c_status as 商品品态,gs.c_pro_status as 促销,gs.c_sale_frequency as 畅销,gs.c_provider as 供应商名称,
0 as 销售数量, 0 as 销售金额,0 as 销售毛利,0 as 销售毛利率,
gs.c_number as 库存数量,gs.c_at_cost as 库存成本,gs.c_sn_perday as 日均销售,gs.c_onway as 在途数量,gs.c_dnlmt_day as 库存天数,gc.c_name as 分类名称
from tb_gdsstore gs 
left join tb_gds g on g.c_gcode=gs.c_gcode 
left join tb_gdsclass gc on g.c_ccode=gc.c_ccode 
where gs.c_store_id = @机构
and gs.c_status not in ('暂停进货','正常流转','作废')
and isnull(gs.c_test_day,0)<>0
and gs.c_type like '%自营%'`);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'sql'>('chart');
  const [error, setError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('area');
  const [dataType, setDataType] = useState<'sales' | 'profit'>('sales');

  /**
   * 运行SQL查询
   * 连接真实数据库并执行查询
   */
  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
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
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 overflow-y-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-4 px-4 sticky top-0 z-40 shadow-sm flex items-center">
        <button 
          onClick={() => navigate('/')}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-8">新品销售分析</h1>
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
                {/* 新品销售分析图表区域 */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  {/* 图表标题和操作按钮 */}
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">新品销售分析</h3>
                      <p className="text-xs text-gray-500 mt-0.5">2025-04-28 | 门店: 11021 | 部门: 11</p>
                    </div>
                    <div className="flex space-x-2">
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
                      onClick={() => setDataType('profit')}
                      className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${dataType === 'profit' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      毛利数据
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
                      {(() => {
                        const commonProps = {
                          data: data.slice(0, 20),
                          margin: { top: 10, right: 30, left: 20, bottom: 10 },
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

                        const renderSeries = () => {
                          return filteredValueFields.map((key, index) => {
                            const commonSeriesProps = {
                              dataKey: key,
                              name: getFieldDisplayName(key),
                              strokeWidth: 2,
                            };

                            switch (chartType) {
                              case 'area':
                                return (
                                  <Area
                                    key={key}
                                    {...commonSeriesProps}
                                    type="monotone"
                                    fillOpacity={0.6}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                );
                              case 'line':
                                return (
                                  <Line
                                    key={key}
                                    {...commonSeriesProps}
                                    type="monotone"
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                  />
                                );
                              case 'bar':
                                return (
                                  <Bar
                                    key={key}
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
                                <XAxis dataKey="商品编码" style={{ fontSize: '12px' }} tick={{ fill: '#666' }} />
                                <YAxis 
                                  yAxisId="left" 
                                  style={{ fontSize: '12px' }} 
                                  tick={{ fill: '#666' }} 
                                  label={needDualYAxis ? { value: '销售量/库存', angle: -90, position: 'insideLeft', fontSize: '11px' } : undefined}
                                />
                                {needDualYAxis && (
                                  <YAxis 
                                    yAxisId="right" 
                                    orientation="right" 
                                    style={{ fontSize: '12px' }} 
                                    tick={{ fill: '#666' }} 
                                    label={{ value: '销售额', angle: 90, position: 'insideRight', fontSize: '11px' }}
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
                                    dataKey: key,
                                    name: getFieldDisplayName(key),
                                  };
                                  
                                  const yAxisId = key === '销售金额' ? 'right' : 'left';
                                  
                                  return (
                                    <Area
                                      key={key}
                                      {...commonSeriesProps}
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
                                <XAxis dataKey="商品编码" style={{ fontSize: '12px' }} tick={{ fill: '#666' }} />
                                <YAxis 
                                  yAxisId="left" 
                                  style={{ fontSize: '12px' }} 
                                  tick={{ fill: '#666' }} 
                                  label={needDualYAxis ? { value: '销售量/库存', angle: -90, position: 'insideLeft', fontSize: '11px' } : undefined}
                                />
                                {needDualYAxis && (
                                  <YAxis 
                                    yAxisId="right" 
                                    orientation="right" 
                                    style={{ fontSize: '12px' }} 
                                    tick={{ fill: '#666' }} 
                                    label={{ value: '销售额', angle: 90, position: 'insideRight', fontSize: '11px' }}
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
                                    dataKey: key,
                                    name: getFieldDisplayName(key),
                                  };
                                  
                                  const yAxisId = key === '销售金额' ? 'right' : 'left';
                                  
                                  return (
                                    <Line
                                      key={key}
                                      {...commonSeriesProps}
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
                                <XAxis dataKey="商品编码" style={{ fontSize: '12px' }} tick={{ fill: '#666' }} />
                                <YAxis 
                                  yAxisId="left" 
                                  style={{ fontSize: '12px' }} 
                                  tick={{ fill: '#666' }} 
                                  label={needDualYAxis ? { value: '销售量/库存', angle: -90, position: 'insideLeft', fontSize: '11px' } : undefined}
                                />
                                {needDualYAxis && (
                                  <YAxis 
                                    yAxisId="right" 
                                    orientation="right" 
                                    style={{ fontSize: '12px' }} 
                                    tick={{ fill: '#666' }} 
                                    label={{ value: '销售额', angle: 90, position: 'insideRight', fontSize: '11px' }}
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
                                    dataKey: key,
                                    name: getFieldDisplayName(key),
                                  };
                                  
                                  const yAxisId = key === '销售金额' ? 'right' : 'left';
                                  
                                  return (
                                    <Bar
                                      key={key}
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
                      })()}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 销售构成比例图表 */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    <PieChartIcon size={16} className="mr-2 text-green-500" />
                    新品销售构成比例
                  </h3>
                  <div className="h-80 w-full">
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
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* 显示列选择区域 */}
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

export default NewProductSales;