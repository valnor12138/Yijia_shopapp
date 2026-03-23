import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Database, BarChart3, PieChart as PieChartIcon, Table as TableIcon, Play, Code2, TrendingUp, Package, Percent, ArrowRight, Layers } from 'lucide-react';
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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

type SubReportType = 'supplier' | 'supplierDetail' | 'category' | 'noSales';

const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  supplier: {
    '机构': '机构', '机构名称': '机构名称', '供应商号': '供应商号', '供应商名称': '供应商名称',
    '单品数': '单品数', '动销数': '动销数', '不动销数': '不动销数', '动销率': '动销率'
  },
  supplierDetail: {
    '机构': '机构', '商品编码': '商品编码', '商品名称': '商品名称', '商品条码': '商品条码',
    '部门': '部门', '规格': '规格', '商品分类': '商品分类', '单位': '单位',
    '进价': '进价', '售价': '售价', '毛利率': '毛利率', '主供应商': '主供应商',
    '主供应商名': '主供应商名', '最后一次进货日期': '最后一次进货日期', '最后销售日期': '最后销售日期',
    '库存数量': '库存数量', '销售状态': '销售状态', '商品状态': '商品状态'
  },
  category: {
    '分类号码': '分类号码', '分类名称': '分类名称', '单品数': '单品数', '动销数': '动销数',
    '不动销数': '不动销数', '动销率': '动销率'
  },
  noSales: {
    '机构': '机构', '商品编码': '商品编码', '商品名称': '商品名称', '商品条码': '商品条码',
    '部门': '部门', '规格': '规格', '商品分类': '商品分类', '单位': '单位',
    '进价': '进价', '售价': '售价', '毛利率': '毛利率', '主供应商': '主供应商',
    '主供应商名': '主供应商名', '最后一次进货日期': '最后一次进货日期', '最后销售日期': '最后销售日期',
    '库存数量': '库存数量', '销售状态': '销售状态', '商品状态': '商品状态'
  }
};

const SUB_REPORT_LABELS: Record<SubReportType, string> = {
  supplier: '供应商动销率',
  supplierDetail: '供应商不动销明细',
  category: '品类动销率',
  noSales: '不动销商品明细'
};

const getFieldDisplayName = (reportType: SubReportType, fieldName: string): string => {
  return FIELD_MAPPINGS[reportType]?.[fieldName] || fieldName;
};

const getSqlForReport = (reportType: SubReportType, context?: { providerCode?: string; providerName?: string; categoryCode?: string; categoryName?: string }): string => {
  if (reportType === 'supplier') {
    return `--[io]供应商动销率T11
declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@商品名称 varchar(max),@显示无变动商品 varchar(max),
@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max) , @对比开始时间 datetime , @对比结束时间 datetime , @预警天数 int,@销售频率 varchar(50)
select @商品编码='' , @机构='11007',@开始时间='2025-05-01' , @结束时间='2025-05-19',@显示无变动商品='否',@部门='11',@分类='',@商品名称='',@预警天数=3,@销售频率='畅销',
@供应商编码='12002' ;

select gdsp.c_store_id as 机构,s.c_sname as 机构名称,gdsp.c_provider as 供应商号,p.c_name as 供应商名称,
count(distinct gdsp.c_gcode) as 单品数 ,count(case when dg.c_sale is null then null else 1 end ) as 动销数,
count(case when dg.c_sale is not null then null else 1 end ) as 不动销数,
cast(count(case when dg.c_sale is null then null else 1 end ) as float) / cast(count(distinct gdsp.c_gcode) as float) as 动销率
from tb_gdsprovider gdsp
left join (
	 select dg.c_store_id,dg.c_gcode,sum(dg.c_at_sale) as c_at_sale,sum(dg.c_sale) as c_sale from tbs_d_gds dg
	 where convert(char(10),dg.c_dt,20)>=@开始时间 and convert(char(10),dg.c_dt,20)<=@结束时间
	 group by dg.c_store_id,dg.c_gcode
) dg on dg.c_gcode=gdsp.c_gcode and dg.c_store_id=gdsp.c_store_id
inner join tb_store s on s.c_id=gdsp.c_store_id and s.c_status='正常营业'
left join tb_partner p on gdsp.c_provider=p.c_no
left join tb_gds g on g.c_gcode=gdsp.c_gcode and (isnull(@分类,'')='' or g.c_ccode like @分类+'%')
left join tb_gdsclass gc on gc.c_ccode=g.c_ccode
left join tb_gdsstore gs on gs.c_store_id=gdsp.c_store_id and gs.c_gcode=gdsp.c_gcode
where gdsp.c_status_gp='正常进货'  and gs.c_status not in ('暂停销售')
and (isnull(@机构,'')='' or gdsp.c_store_id in (select c_str from  dbo.uf_io_split_string( @机构, ',','store',1 ,default ) ))
and (isnull(@供应商编码,'')='' or gdsp.c_provider=@供应商编码)
and (isnull(@分类,'')='' or g.c_ccode like @分类+'%')
group by gdsp.c_store_id,s.c_sname,gdsp.c_provider,p.c_name`;
  }

  if (reportType === 'supplierDetail') {
    const providerFilter = context?.providerCode ? `and gdsp.c_provider='${context.providerCode}'` : '';
    return `--[io]供应商不动销明细T11.1
declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@商品名称 varchar(max),@显示无变动商品 varchar(max),
@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max) , @对比开始时间 datetime , @对比结束时间 datetime , @预警天数 int,@销售频率 varchar(50)
select @商品编码='' , @机构='11007',@开始时间='2025-05-01' , @结束时间='2025-05-19',@显示无变动商品='否',@部门='11',@分类='',@商品名称='',@预警天数=3,@销售频率='畅销',
@供应商编码='12002' ;

select gdsp.c_store_id as 机构,s.c_sname as 机构名称,gdsp.c_provider as 供应商号,p.c_name as 供应商名称,
g.c_gcode as 商品编码,g.c_name as 商品名称,g.c_barcode as 商品条码,g.c_model as 规格,
g.c_basic_unit as 单位,gs.c_pt_cost as 进价,gs.c_price as 售价,
case when gs.c_price=0 then null else (gs.c_price-gs.c_pt_cost)/gs.c_price end as 毛利率,
gs.c_lastin_dt as 最后一次进货日期,gs.c_lastsale_dt as 最后销售日期,
gs.c_number as 库存数量,gs.c_sale_status as 销售状态,gs.c_status as 商品状态
from tb_gdsprovider gdsp
left join (
	 select dg.c_store_id,dg.c_gcode,sum(dg.c_at_sale) as c_at_sale,sum(dg.c_sale) as c_sale from tbs_d_gds dg
	 where convert(char(10),dg.c_dt,20)>=@开始时间 and convert(char(10),dg.c_dt,20)<=@结束时间
	 group by dg.c_store_id,dg.c_gcode
) dg on dg.c_gcode=gdsp.c_gcode and dg.c_store_id=gdsp.c_store_id
inner join tb_store s on s.c_id=gdsp.c_store_id and s.c_status='正常营业'
left join tb_partner p on gdsp.c_provider=p.c_no
left join tb_gds g on g.c_gcode=gdsp.c_gcode
left join tb_gdsstore gs on gs.c_store_id=gdsp.c_store_id and gs.c_gcode=gdsp.c_gcode
where gdsp.c_status_gp='正常进货'  and gs.c_status not in ('暂停销售')
and dg.c_sale is null
and (isnull(@机构,'')='' or gdsp.c_store_id in (select c_str from  dbo.uf_io_split_string( @机构, ',','store',1 ,default ) ))
${providerFilter}
group by gdsp.c_store_id,s.c_sname,gdsp.c_provider,p.c_name,g.c_gcode,g.c_name,g.c_barcode,g.c_model,
g.c_basic_unit,gs.c_pt_cost,gs.c_price,gs.c_lastin_dt,gs.c_lastsale_dt,gs.c_number,gs.c_sale_status,gs.c_status`;
  }

  if (reportType === 'category') {
    return `--[io]品类动销率T11.2
declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@商品名称 varchar(max),@显示无变动商品 varchar(max),
@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max) , @对比开始时间 datetime , @对比结束时间 datetime ,@品类层级 int, @预警天数 int,@销售频率 varchar(50)
select @商品编码='' , @机构='11023',@开始时间='2025-04-28' , @结束时间='2025-04-28',@显示无变动商品='否',@部门='11',@分类='',@商品名称='',@预警天数=3,@销售频率='畅销' ;

IF OBJECT_ID('tempdb..#机构列表') IS NOT NULL DROP TABLE #机构列表;
SELECT LTRIM(RTRIM(c_str)) AS store_id
INTO #机构列表
FROM dbo.uf_io_split_string(@机构, ',','store',1,default)
WHERE LTRIM(RTRIM(c_str))<>'';

select
  gc.c_ccode as 分类号码,
  gc.c_name as 分类名称,
  count(distinct gs.c_gcode) as 单品数,
  count(distinct case when isnull(dg.c_sale,0)<>0 then gs.c_gcode else null end) as 动销数,
  round(cast(count(distinct case when isnull(dg.c_sale,0)<>0 then gs.c_gcode else null end) as dec(12,2))/count(distinct gs.c_gcode),4) as 动销率,
  count(distinct gs.c_gcode)-count(distinct case when isnull(dg.c_sale,0)<>0 then gs.c_gcode else null end) as 不动销数
from tb_gdsclass gc
left join tb_gds g on g.c_ccode = gc.c_ccode
left join tb_gdsstore gs on gs.c_gcode = g.c_gcode and gs.c_store_id in (select store_id from #机构列表)
left join (
  select c_store_id,c_gcode,sum(c_sale) as c_sale
  from tbs_d_gds
  where convert(char(10),c_dt,20) between @开始时间 and @结束时间
  group by c_store_id,c_gcode
) dg on dg.c_store_id=gs.c_store_id and dg.c_gcode=gs.c_gcode
where 1=1
  and (isnull(@品类层级,'')='' or gc.c_level=@品类层级)
  and (isnull(@分类,'')='' or gc.c_ccode like @分类+'%')
  and gs.c_sale_status not in ('暂停销售')
  and not (gs.c_number=0 and gs.c_status in ('暂停进货'))
  and gc.c_ccode not like '44%'
group by gc.c_ccode,gc.c_name
order by gc.c_ccode;

DROP TABLE IF EXISTS #机构列表;`;
  }

  const categoryFilter = context?.categoryCode ? `and gc.c_ccode='${context.categoryCode}'` : '';
  return `--[io]不动销商品明细T11.3
declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@商品名称 varchar(max),
@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max) , @对比开始时间 datetime , @对比结束时间 datetime ,@品类层级 int, @预警天数 int,@销售频率 varchar(50)
select @商品编码='' , @机构='11026',@开始时间='2025-07-01' , @供应商编码='',@结束时间='2025-08-08',@部门='',@分类='',@商品名称='',@销售频率='畅销' ;
select @品类层级=null ;

IF OBJECT_ID('tempdb..#机构列表') IS NOT NULL DROP TABLE #机构列表;
SELECT LTRIM(RTRIM(c_str)) AS store_id
INTO #机构列表
FROM dbo.uf_io_split_string(@机构, ',','store',1,default)
WHERE LTRIM(RTRIM(c_str))<>'';

IF OBJECT_ID('tempdb..#部门列表') IS NOT NULL DROP TABLE #部门列表;
SELECT LTRIM(RTRIM(c_str)) AS adno
INTO #部门列表
FROM dbo.uf_split_string(@部门, ',')
WHERE LTRIM(RTRIM(c_str))<>'' AND ISNULL(@部门,'')<>'';

select
  gs.c_store_id as 机构,
  g.c_gcode as 商品编码,
  g.c_name as 商品名称,
  g.c_barcode as 商品条码,
  g.c_adno as 部门,
  g.c_model as 规格,
  g.c_ccode as 商品分类,
  g.c_basic_unit as 单位,
  gs.c_pt_cost as 进价,
  gs.c_price as 售价,
  case when gs.c_price=0 then null else (gs.c_price-gs.c_pt_cost)/gs.c_price end as 毛利率,
  gp.c_provider as 主供应商,
  p.c_name as 主供应商名,
  gs.c_lastin_dt as 最后一次进货日期,
  gs.c_lastsale_dt as 最后销售日期,
  gs.c_number as 库存数量,
  gs.c_sale_status as 销售状态,
  gs.c_status as 商品状态
from tb_gdsclass gc
left join tb_gds g on g.c_ccode = gc.c_ccode
left join tb_gdsstore gs on gs.c_gcode = g.c_gcode and gs.c_store_id in (select store_id from #机构列表)
left join (
  select c_store_id,c_gcode,sum(c_sale) as c_sale
  from tbs_d_gds
  where convert(char(10),c_dt,20) between @开始时间 and @结束时间
  group by c_store_id,c_gcode
) dg on dg.c_store_id=gs.c_store_id and dg.c_gcode=g.c_gcode
left join tb_gdsprovider gp on gp.c_store_id=gs.c_store_id and gp.c_gcode=g.c_gcode and gp.c_status='主供应商'
left join tb_partner p on p.c_no=gp.c_provider
where 1=1
  and isnull(dg.c_sale,0) = 0
  and (isnull(@部门,'')='' or g.c_adno in (select adno from #部门列表))
  ${categoryFilter}
  and len(gc.c_ccode)=9
  and gc.c_ccode not like '44%'
  and gs.c_sale_status not in ('暂停销售')
  and not (gs.c_number=0 and gs.c_status in ('暂停进货'))
  and (isnull(@供应商编码,'')='' or p.c_no = @供应商编码)
  and gs.c_type like '%自营%'
order by g.c_gcode,gc.c_ccode;

DROP TABLE IF EXISTS #机构列表;
DROP TABLE IF EXISTS #部门列表;`;
};

const SalesPerformanceReport: React.FC = () => {
  const navigate = useNavigate();
  const [activeSubReport, setActiveSubReport] = useState<SubReportType>('supplier');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [sql, setSql] = useState(getSqlForReport('supplier'));
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'sql'>('chart');
  const [error, setError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [context, setContext] = useState<{ providerCode?: string; providerName?: string; categoryCode?: string; categoryName?: string }>({});

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

  const handleSubReportChange = (reportType: SubReportType) => {
    setActiveSubReport(reportType);
    setSql(getSqlForReport(reportType, context));
    setData([]);
    setSortConfig(null);
  };

  const handleRowClick = (row: any) => {
    if (activeSubReport === 'supplier') {
      setContext({ providerCode: row['供应商号'], providerName: row['供应商名称'] });
      setSql(getSqlForReport('supplierDetail', { providerCode: row['供应商号'], providerName: row['供应商名称'] }));
      setActiveSubReport('supplierDetail');
    } else if (activeSubReport === 'category') {
      setContext({ categoryCode: row['分类号码'], categoryName: row['分类名称'] });
      setSql(getSqlForReport('noSales', { categoryCode: row['分类号码'], categoryName: row['分类名称'] }));
      setActiveSubReport('noSales');
    }
  };

  const getChartData = () => {
    if (!data || data.length === 0) return [];
    if (activeSubReport === 'supplier' || activeSubReport === 'category') {
      return data.slice(0, 10).map(item => ({
        name: (item[activeSubReport === 'supplier' ? '供应商名称' : '分类名称'] || '未知').toString().substring(0, 6),
        动销率: Number(item['动销率']) || 0,
        动销数: Number(item['动销数']) || 0,
        不动销数: Number(item['不动销数']) || 0
      }));
    }
    return data.slice(0, 10).map(item => ({
      name: (item['商品名称'] || '未知').toString().substring(0, 6),
      库存: Number(item['库存数量']) || 0,
      售价: Number(item['售价']) || 0
    }));
  };

  const getSummaryStats = () => {
    if (activeSubReport === 'supplier' || activeSubReport === 'category') {
      const totalProducts = data.reduce((sum, item) => sum + (Number(item['单品数']) || 0), 0);
      const totalActive = data.reduce((sum, item) => sum + (Number(item['动销数']) || 0), 0);
      const totalInactive = data.reduce((sum, item) => sum + (Number(item['不动销数']) || 0), 0);
      const avgRate = totalProducts > 0 ? (totalActive / totalProducts) * 100 : 0;
      return { totalProducts, totalActive, totalInactive, avgRate };
    }
    const totalCount = data.length;
    const totalStock = data.reduce((sum, item) => sum + (Number(item['库存数量']) || 0), 0);
    const totalValue = data.reduce((sum, item) => sum + (Number(item['售价']) || 0) * (Number(item['库存数量']) || 0), 0);
    return { totalCount, totalStock, totalValue };
  };

  useEffect(() => {
    if (data.length > 0 && Object.keys(visibleColumns).length === 0) {
      const keys = Object.keys(data[0]);
      const initial: Record<string, boolean> = {};
      keys.forEach(key => { initial[key] = true; });
      setVisibleColumns(initial);
    }
  }, [data, visibleColumns]);

  useEffect(() => { runAnalysis(); }, [sql]);

  const stats = getSummaryStats();
  const hasContext = context.providerCode || context.categoryName;
  const subReportTitles: Record<SubReportType, { title: string; subtitle?: string }> = {
    supplier: { title: '供应商动销率', subtitle: 'T11' },
    supplierDetail: { title: '供应商不动销明细', subtitle: 'T11.1', context: context.providerName ? `${context.providerName} (${context.providerCode})` : undefined },
    category: { title: '品类动销率', subtitle: 'T11.2' },
    noSales: { title: '不动销商品明细', subtitle: 'T11.3', context: context.categoryName || '全部品类' }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-100 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors mr-2">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-gray-800">销售动销分析</h1>
            <p className="text-[10px] text-gray-500">供应商动销率 / 品类动销率</p>
          </div>
        </div>
        <button onClick={runAnalysis} disabled={loading} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play size={14} className="mr-1" />}刷新
        </button>
      </header>

      <div className="flex border-b border-gray-200 bg-white shrink-0 overflow-x-auto">
        {(Object.keys(SUB_REPORT_LABELS) as SubReportType[]).map((key) => (
          <button
            key={key}
            onClick={() => handleSubReportChange(key)}
            className={`flex-1 py-2.5 px-3 text-xs font-medium transition-colors whitespace-nowrap ${activeSubReport === key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {SUB_REPORT_LABELS[key]}
          </button>
        ))}
      </div>

      {hasContext && (
        <div className="bg-blue-50 px-3 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center text-xs text-blue-700">
            <Layers size={14} className="mr-1" />
            <span>当前筛选：</span>
            {context.providerName && <span className="font-medium ml-1">{context.providerName}</span>}
            {context.categoryName && <span className="font-medium ml-1">{context.categoryName}</span>}
          </div>
          <button
            onClick={() => {
              if (context.providerCode) {
                setContext({});
                setSql(getSqlForReport('supplier'));
                setActiveSubReport('supplier');
              } else if (context.categoryCode) {
                setContext({});
                setSql(getSqlForReport('category'));
                setActiveSubReport('category');
              }
            }}
            className="text-xs text-blue-500 hover:text-blue-700 underline"
          >
            重置
          </button>
        </div>
      )}

      {error && <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs"><strong>错误：</strong>{error}</div>}

      <div className="flex border-b border-gray-200 bg-white shrink-0">
        <button onClick={() => setViewMode('chart')} className={`flex-1 py-2 px-4 text-xs font-medium transition-colors ${viewMode === 'chart' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><BarChart3 size={12} className="inline mr-1" />图表</button>
        <button onClick={() => setViewMode('table')} className={`flex-1 py-2 px-4 text-xs font-medium transition-colors ${viewMode === 'table' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><TableIcon size={12} className="inline mr-1" />表格</button>
        <button onClick={() => setViewMode('sql')} className={`flex-1 py-2 px-4 text-xs font-medium transition-colors ${viewMode === 'sql' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><Code2 size={12} className="inline mr-1" />SQL</button>
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
              <div className="space-y-3 p-3">
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <div className="mb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">📊 {subReportTitles[activeSubReport].title}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {(activeSubReport === 'supplier' || activeSubReport === 'supplierDetail') ? '点击表格行可查看明细' : '点击行可查看不动销商品'}
                      </p>
                    </div>
                    {subReportTitles[activeSubReport].subtitle && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{subReportTitles[activeSubReport].subtitle}</span>
                    )}
                  </div>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" style={{ fontSize: '9px' }} tick={{ fill: '#666' }} angle={-45} textAnchor="end" height={50} />
                        <YAxis style={{ fontSize: '10px' }} tick={{ fill: '#666' }} />
                        <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                        <Legend verticalAlign="top" height={20} wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey={activeSubReport === 'supplier' || activeSubReport === 'category' ? '动销率' : '库存'} fill={COLORS[0]} radius={[4, 4, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(activeSubReport === 'supplier' || activeSubReport === 'category') ? (
                    <>
                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-1"><Percent size={12} className="text-blue-500 mr-1" /><p className="text-[10px] text-gray-500">平均动销率</p></div>
                        <p className="text-lg font-bold text-blue-600">{(stats as { avgRate: number }).avgRate.toFixed(1)}%</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-1"><TrendingUp size={12} className="text-green-500 mr-1" /><p className="text-[10px] text-gray-500">总动销数</p></div>
                        <p className="text-lg font-bold text-green-600">{(stats as { totalActive: number }).totalActive.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-1"><Package size={12} className="text-orange-500 mr-1" /><p className="text-[10px] text-gray-500">总不动销</p></div>
                        <p className="text-lg font-bold text-orange-600">{(stats as { totalInactive: number }).totalInactive.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-1"><TrendingUp size={12} className="text-purple-500 mr-1" /><p className="text-[10px] text-gray-500">{activeSubReport === 'supplier' ? '供应商数' : '品类数'}</p></div>
                        <p className="text-lg font-bold text-purple-600">{data.length}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-1"><Package size={12} className="text-red-500 mr-1" /><p className="text-[10px] text-gray-500">不动销商品</p></div>
                        <p className="text-lg font-bold text-red-600">{(stats as { totalCount: number }).totalCount}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-1"><Package size={12} className="text-blue-500 mr-1" /><p className="text-[10px] text-gray-500">总库存</p></div>
                        <p className="text-lg font-bold text-blue-600">{(stats as { totalStock: number }).totalStock.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-1"><TrendingUp size={12} className="text-green-500 mr-1" /><p className="text-[10px] text-gray-500">总售价金额</p></div>
                        <p className="text-lg font-bold text-green-600">¥{((stats as { totalValue: number }).totalValue / 1000).toFixed(0)}k</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-1"><Package size={12} className="text-purple-500 mr-1" /><p className="text-[10px] text-gray-500">涉及门店</p></div>
                        <p className="text-lg font-bold text-purple-600">{new Set(data.map(d => d['机构'])).size}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {viewMode === 'table' && (
              <div className="bg-white h-full flex flex-col overflow-hidden">
                <div className="px-2 py-2 bg-gray-50 border-b border-gray-100 shrink-0 overflow-x-auto">
                  <div className="flex gap-2 items-center text-[10px] whitespace-nowrap">
                    <span className="text-gray-600 font-medium mr-1">显示列：</span>
                    <button onClick={() => { const allKeys = Object.keys(data[0] || {}); const newVisible: Record<string, boolean> = {}; allKeys.forEach(key => { newVisible[key] = true; }); setVisibleColumns(newVisible); }} className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium">全选</button>
                    <button onClick={() => { const allKeys = Object.keys(data[0] || {}); const newVisible: Record<string, boolean> = {}; allKeys.forEach(key => { newVisible[key] = false; }); setVisibleColumns(newVisible); }} className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium">全不选</button>
                    <div className="flex gap-2 items-center border-l border-gray-300 pl-2">
                      {data.length > 0 && Object.keys(data[0]).map((key) => (
                        <label key={key} className="flex items-center space-x-1 text-gray-600 cursor-pointer">
                          <input type="checkbox" checked={visibleColumns[key]} onChange={() => toggleColumnVisibility(key)} className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500" />
                          <span>{getFieldDisplayName(activeSubReport, key)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {sortConfig && (
                  <div className="px-2 py-1.5 bg-blue-50 border-b border-blue-100 flex items-center text-[10px] text-blue-700 shrink-0">
                    <span className="mr-2">🔽</span>
                    <span>排序：<strong>{getFieldDisplayName(activeSubReport, sortConfig.key)}</strong>（{sortConfig.direction === 'asc' ? '升序 ↑' : '降序 ↓'}）</span>
                    <button onClick={() => setSortConfig(null)} className="ml-auto text-blue-500 hover:text-blue-700 underline">取消</button>
                  </div>
                )}

                <div className="flex-1 overflow-auto min-h-0">
                  <table className="w-full text-left text-[10px] sm:text-xs">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        {data.length > 0 && Object.keys(data[0]).filter(column => visibleColumns[column]).map((key) => (
                          <th key={key} className="px-2 py-2 font-semibold cursor-pointer hover:bg-gray-100 transition-colors select-none sticky top-0 z-10 whitespace-nowrap" onClick={() => handleSort(key)}>
                            <div className="flex items-center space-x-1">
                              <span>{getFieldDisplayName(activeSubReport, key)}</span>
                              {sortConfig?.key === key && (<span className="text-blue-600 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </th>
                        ))}
                        {(activeSubReport === 'supplier' || activeSubReport === 'category') && (
                          <th className="px-2 py-2 font-semibold sticky top-0 z-10 bg-gray-50 text-gray-600 whitespace-nowrap">操作</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {getSortedData().map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-blue-50 cursor-pointer transition-colors ${activeSubReport === 'noSales' || activeSubReport === 'supplierDetail' ? '' : ''}`}
                          onClick={() => (activeSubReport === 'supplier' || activeSubReport === 'category') ? handleRowClick(row) : undefined}
                        >
                          {Object.entries(row).filter(([column]) => visibleColumns[column]).map(([key, value], valIdx) => (
                            <td key={valIdx} className="px-2 py-2 whitespace-nowrap">
                              {key === '动销率' || key === '毛利率' ? `${((Number(value) || 0) * 100).toFixed(1)}%` :
                               typeof value === 'number' ? value.toLocaleString() : value}
                            </td>
                          ))}
                          {(activeSubReport === 'supplier' || activeSubReport === 'category') && (
                            <td className="px-2 py-2 text-blue-600 hover:text-blue-800">
                              <div className="flex items-center space-x-1">
                                <ArrowRight size={12} />
                                <span className="text-[10px]">查看明细</span>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'sql' && (
              <div className="flex flex-col space-y-3 p-3">
                <div className="bg-gray-900 rounded-xl p-3 shadow-inner overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-[10px] font-mono">SQL SERVER QUERY</span>
                    <Database size={12} className="text-blue-400" />
                  </div>
                  <textarea value={sql} onChange={(e) => setSql(e.target.value)} className="bg-transparent text-blue-400 font-mono text-[10px] w-full h-48 outline-none border-none resize-none leading-relaxed" spellCheck={false} />
                </div>
                <button onClick={runAnalysis} className="bg-blue-600 text-white font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform text-xs">
                  <Play size={14} fill="currentColor" /><span>执行查询</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SalesPerformanceReport;