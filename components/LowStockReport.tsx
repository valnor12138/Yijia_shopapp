import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart as BarChartIcon,
  Table as TableIcon,
  Database as DatabaseIcon,
  LineChart,
  BarChart,
  AreaChart,
  PieChart as PieChartIcon,
  Menu as MenuIcon,
  X as XIcon,
  Play,
  RefreshCw,
  PlusCircle,
  ArrowDownCircle,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  AreaChart as ReAreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

/**
 * 字段映射配置
 * 将数据库字段名映射为中文显示名
 * 基于商品库存预警[T5]的字段名称
 */
const FIELD_MAPPING: Record<string, string> = {
  // 基本信息字段
  '商品编码': '商品编码',
  '商品名称': '商品名称',
  '商品条码': '商品条码',
  '规格': '规格',
  '单位': '单位',
  '商品状态': '商品状态',
  '促销状态': '促销状态',
  '销售频率': '销售频率',
  
  // 价格信息字段
  '进价': '进价',
  '售价': '售价',
  '毛利': '毛利',
  '毛利率': '毛利率',
  
  // 库存信息字段
  '库存': '库存',
  '库存金额': '库存金额',
  '最后销售日期': '最后销售日期',
  '日均销售': '日均销售',
  '在途': '在途',
  
  // 分类和供应商字段
  '品类编码': '品类编码',
  '品类名称': '品类名称',
  '主供应商编码': '主供应商编码',
  '供应商名称': '供应商名称',
  '供应商类型': '供应商类型',
  
  // 原始SQL字段映射
  'c_gcode': '商品编码',
  'c_name': '商品名称',
  'c_barcode': '商品条码',
  'c_model': '规格',
  'c_basic_unit': '单位',
  'c_status': '商品状态',
  'c_pro_status': '促销状态',
  'c_sale_frequency': '销售频率',
  'c_pt_cost': '进价',
  'c_price': '售价',
  'c_maoli': '毛利',
  'c_maoliv': '毛利率',
  'c_number': '库存',
  'c_at_cost': '库存金额',
  'c_lastsale_dt': '最后销售日期',
  'c_sn_perday': '日均销售',
  'c_onway': '在途',
  'c_ccode': '品类编码',
  'c_provider': '主供应商编码',
  'c_category': '供应商类型'
};

/**
 * 获取字段的中文显示名
 */
const getFieldDisplayName = (fieldName: string): string => {
  return FIELD_MAPPING[fieldName] || fieldName;
};

/**
 * 负库存报表页面
 * 实现真实数据库连接和数据可视化
 */
const LowStockReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [sql, setSql] = useState(`-- [io]畅销商品缺货[T5] 
declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@商品名称 varchar(max),@显示无变动商品 varchar(max), 
@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max) ,@预警天数 int,@销售频率 varchar(50),@供应商类型 varchar(100) 
select @商品编码='' , @机构='11026',@部门='',@分类='22',@商品名称='',@预警天数=7,@销售频率='全部' , @供应商编码='' , @供应商类型='' 

select top 20 gs.c_gcode as 商品编码,gs.c_number as 库存,gs.c_store_id as 机构 
from tb_gdsstore gs 
where gs.c_store_id = @机构 
and gs.c_number < 10`);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'sql'>('chart');
  const [error, setError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [dataType, setDataType] = useState<'stock' | 'profit'>('stock');

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
      const initialColumns: Record<string, boolean> = {};
      Object.keys(data[0]).forEach(column => {
        initialColumns[column] = true;
      });
      setVisibleColumns(initialColumns);
    }
  }, [data]);

  /**
   * 当组件挂载时，自动执行一次查询
   */
  useEffect(() => {
    runAnalysis();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-10">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-4 px-4 sticky top-0 z-40 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowDownCircle size={20} className="text-orange-500" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-800 tracking-tight flex items-center">
              <AlertTriangle size={20} className="mr-2 text-red-500" />
              负库存报表
            </h1>
            <p className="text-xs text-gray-400">商品库存预警 [T5]</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center space-x-1 bg-red-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            <span>{loading ? '查询中...' : '执行查询'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4">
        {/* View Mode Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700 flex items-center">
              <DatabaseIcon size={16} className="mr-2 text-red-500" />
              数据视图
            </h2>
            <div className="flex space-x-1">
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'chart'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChartIcon size={14} />
                <span>图表</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TableIcon size={14} />
                <span>表格</span>
              </button>
              <button
                onClick={() => setViewMode('sql')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'sql'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <DatabaseIcon size={14} />
                <span>SQL</span>
              </button>
            </div>
          </div>

          {viewMode === 'chart' && (
            <div className="space-y-4">
              {/* Chart Controls */}
              <div className="flex flex-wrap gap-4">
                {/* Data Type Selection */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-600">数据类型:</span>
                  <div className="flex border border-gray-200 rounded-md overflow-hidden">
                    <button
                      onClick={() => setDataType('stock')}
                      className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${dataType === 'stock' ? 'text-red-600 bg-white border-b-2 border-red-600' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      库存数据
                    </button>
                    <button
                      onClick={() => setDataType('profit')}
                      className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${dataType === 'profit' ? 'text-red-600 bg-white border-b-2 border-red-600' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      毛利数据
                    </button>
                  </div>
                </div>

                {/* Chart Type Selection */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-600">图表类型:</span>
                  <div className="flex border border-gray-200 rounded-md overflow-hidden">
                    <button
                      onClick={() => setChartType('bar')}
                      className={`py-1.5 px-3 text-xs font-medium transition-colors ${chartType === 'bar' ? 'text-red-600 bg-white border-b-2 border-red-600' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      柱状图
                    </button>
                    <button
                      onClick={() => setChartType('line')}
                      className={`py-1.5 px-3 text-xs font-medium transition-colors ${chartType === 'line' ? 'text-red-600 bg-white border-b-2 border-red-600' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      折线图
                    </button>
                    <button
                      onClick={() => setChartType('area')}
                      className={`py-1.5 px-3 text-xs font-medium transition-colors ${chartType === 'area' ? 'text-red-600 bg-white border-b-2 border-red-600' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      面积图
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Container */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                  {chartType === 'bar' && <BarChartIcon size={16} className="mr-2 text-red-500" />}
                  {chartType === 'line' && <LineChart size={16} className="mr-2 text-red-500" />}
                  {chartType === 'area' && <AreaChart size={16} className="mr-2 text-red-500" />}
                  负库存商品分析
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {(() => {
                      const commonProps = {
                        data: data.slice(0, 20),
                        margin: { top: 10, right: 30, left: 20, bottom: 10 },
                      };

                      const filteredValueFields = data.length > 0 ? Object.keys(data[0]).filter(key => {
                        switch (dataType) {
                          case 'stock':
                            return ['库存', '库存金额', '日均销售', '在途'].includes(key);
                          case 'profit':
                            return ['毛利', '毛利率', '进价', '售价'].includes(key);
                          default:
                            return ['库存', '库存金额', '毛利', '毛利率'].includes(key);
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

                      const needDualYAxis = dataType === 'stock' && filteredValueFields.length > 1;

                      switch (chartType) {
                        case 'area':
                          return (
                            <ReAreaChart {...commonProps}>
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
                                label={needDualYAxis ? { value: '库存/销售', angle: -90, position: 'insideLeft', fontSize: '11px' } : undefined}
                              />
                              {needDualYAxis && (
                                <YAxis 
                                  yAxisId="right" 
                                  orientation="right" 
                                  style={{ fontSize: '12px' }} 
                                  tick={{ fill: '#666' }} 
                                  label={{ value: '金额', angle: 90, position: 'insideRight', fontSize: '11px' }}
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
                                
                                const yAxisId = key === '库存金额' ? 'right' : 'left';
                                
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
                            </ReAreaChart>
                          );
                        case 'line':
                          return (
                            <ReLineChart {...commonProps}>
                              <XAxis dataKey="商品编码" style={{ fontSize: '12px' }} tick={{ fill: '#666' }} />
                              <YAxis 
                                yAxisId="left" 
                                style={{ fontSize: '12px' }} 
                                tick={{ fill: '#666' }} 
                                label={needDualYAxis ? { value: '库存/销售', angle: -90, position: 'insideLeft', fontSize: '11px' } : undefined}
                              />
                              {needDualYAxis && (
                                <YAxis 
                                  yAxisId="right" 
                                  orientation="right" 
                                  style={{ fontSize: '12px' }} 
                                  tick={{ fill: '#666' }} 
                                  label={{ value: '金额', angle: 90, position: 'insideRight', fontSize: '11px' }}
                                />
                              )}
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} contentStyle={{ fontSize: '12px' }} />
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
                                  dataKey: key,
                                  name: getFieldDisplayName(key),
                                };
                                
                                const yAxisId = key === '库存金额' ? 'right' : 'left';
                                
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
                            </ReLineChart>
                          );
                        case 'bar':
                          return (
                            <ReBarChart {...commonProps}>
                              <XAxis dataKey="商品编码" style={{ fontSize: '12px' }} tick={{ fill: '#666' }} />
                              <YAxis 
                                yAxisId="left" 
                                style={{ fontSize: '12px' }} 
                                tick={{ fill: '#666' }} 
                                label={needDualYAxis ? { value: '库存/销售', angle: -90, position: 'insideLeft', fontSize: '11px' } : undefined}
                              />
                              {needDualYAxis && (
                                <YAxis 
                                  yAxisId="right" 
                                  orientation="right" 
                                  style={{ fontSize: '12px' }} 
                                  tick={{ fill: '#666' }} 
                                  label={{ value: '金额', angle: 90, position: 'insideRight', fontSize: '11px' }}
                                />
                              )}
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} contentStyle={{ fontSize: '12px' }} />
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
                                  dataKey: key,
                                  name: getFieldDisplayName(key),
                                };
                                
                                const yAxisId = key === '库存金额' ? 'right' : 'left';
                                
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
                            </ReBarChart>
                          );
                        default:
                          return null;
                      }
                    })()}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 负库存构成比例图表 */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                  <PieChartIcon size={16} className="mr-2 text-red-500" />
                  负库存商品构成比例
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.filter(item => item && typeof item === 'object').slice(0, 12)}
                        dataKey={(entry) => {
                          if (!entry || typeof entry !== 'object') return 0;
                          
                          const stockKey = Object.keys(entry).find(key => 
                            key.toLowerCase() === '库存' || key.toLowerCase() === 'c_number'
                          );
                          
                          if (stockKey && typeof entry[stockKey] === 'number') {
                            return Math.abs(entry[stockKey]);
                          }
                          
                          return 0;
                        }}
                        nameKey={(entry) => {
                          if (!entry || typeof entry !== 'object') return '未命名';
                          
                          const nameKey = Object.keys(entry).find(key => 
                            ['商品名称', '商品编码'].some(nameField => 
                              key.toLowerCase().includes(nameField)
                            )
                          );
                          
                          if (nameKey && entry[nameKey]) {
                            return entry[nameKey];
                          }
                          
                          return '未命名';
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
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-gray-600 font-medium text-xs">显示列：</span>
                  {data.length > 0 && Object.keys(data[0]).map((key) => (
                    <label key={key} className="flex items-center space-x-1 text-gray-600 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => toggleColumnVisibility(key)}
                        className="w-3 h-3 text-red-600 rounded focus:ring-red-500"
                      />
                      <span>{getFieldDisplayName(key)}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <MenuIcon size={16} />
                  <span className="text-xs">列设置</span>
                </button>
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
                            <td key={valIdx} className="px-4 py-3 text-xs">
                              {typeof value === 'number' && value < 0 ? (
                                <span className="text-red-600 font-medium">{value}</span>
                              ) : (
                                value
                              )}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 无数据提示 */}
              {data.length === 0 && (
                <div className="py-12 px-4 text-center">
                  <AlertTriangle size={48} className="mx-auto text-red-300 mb-3" />
                  <p className="text-gray-500 text-sm">暂无负库存商品数据</p>
                  <button
                    onClick={runAnalysis}
                    className="mt-4 bg-red-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    重新查询
                  </button>
                </div>
              )}
            </div>
          )}

          {viewMode === 'sql' && (
            <div className="flex flex-col space-y-4">
              <div className="bg-gray-900 rounded-xl p-4 shadow-inner overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs font-mono">SQL SERVER QUERY</span>
                  <DatabaseIcon size={14} className="text-red-400" />
                </div>
                <textarea
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  className="bg-transparent text-red-400 font-mono text-sm w-full h-64 outline-none border-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                <span>{loading ? '执行中...' : '执行查询并刷新报表'}</span>
              </button>
              <p className="text-[11px] text-gray-400 text-center italic">
                * 提示：此 SQL 将通过后台连接池发送至 SQL Server 实例执行
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle size={20} className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">查询失败</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {data.length > 0 && !error && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <PlusCircle size={20} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-green-800">查询成功</h3>
                <p className="text-sm text-green-700 mt-1">共返回 {data.length} 条负库存商品记录</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LowStockReport;