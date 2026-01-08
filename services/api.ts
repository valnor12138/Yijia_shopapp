
import { AnalysisData } from '../types';

/**
 * 后台连接 SQL Server 的预留接口说明：
 * 在实际生产环境中，前端不建议直接连接 SQL Server（出于安全和性能考虑）。
 * 你应当创建一个中间层 API（如 Node.js + mssql, Python + pyodbc, 或 C# WebAPI）。
 * 
 * 下方的 executeAnalysisQuery 模拟了向该 API 发送请求的过程。
 */

const API_BASE_URL = 'http://your-backend-api-endpoint/api'; // 替换为你的后端地址

export const fetchSalesRateAnalysis = async (sqlQuery: string): Promise<AnalysisData[]> => {
  console.log('正在执行 SQL 查询:', sqlQuery);
  
  // 模拟 API 调用延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 模拟返回数据
  // 在真实场景中，你会使用 fetch(API_BASE_URL + '/execute-sql', { method: 'POST', body: JSON.stringify({ sql: sqlQuery }) })
  return [
    { category: '生鲜食品', salesRate: 85, stockVolume: 1200, salesVolume: 1020 },
    { category: '休闲零食', salesRate: 62, stockVolume: 3500, salesVolume: 2170 },
    { category: '日用百货', salesRate: 45, stockVolume: 5000, salesVolume: 2250 },
    { category: '酒水饮料', salesRate: 78, stockVolume: 2800, salesVolume: 2184 },
    { category: '冷冻冷藏', salesRate: 55, stockVolume: 1500, salesVolume: 825 },
    { category: '母婴用品', salesRate: 38, stockVolume: 900, salesVolume: 342 },
  ];
};

export const DEFAULT_ANALYSIS_SQL = `
SELECT 
    CategoryName as category,
    CAST(SUM(SalesQty) * 100.0 / NULLIF(SUM(StockQty), 0) AS DECIMAL(10,2)) as salesRate,
    SUM(StockQty) as stockVolume,
    SUM(SalesQty) as salesVolume
FROM FactSales
JOIN DimProduct ON FactSales.ProductKey = DimProduct.ProductKey
GROUP BY CategoryName
ORDER BY salesRate DESC;
`.trim();
