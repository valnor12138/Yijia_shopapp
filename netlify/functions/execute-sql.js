const sql = require('mssql');

// 数据库配置 - 从环境变量读取
const config = {
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || '',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 60000 // 增加查询超时时间到60秒
  }
};

// 验证必需的环境变量
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 数据库配置缺失！请设置以下环境变量：');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('   请在 Netlify 控制台的 Environment variables 中设置');
}

exports.handler = async (event, context) => {
  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理预检请求（OPTIONS）
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Method not allowed. Only POST requests are supported.' 
      })
    };
  }

  // 检查环境变量
  if (missingVars.length > 0) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `数据库配置缺失：${missingVars.join(', ')}。请在 Netlify 控制台设置环境变量。`
      })
    };
  }

  try {
    // 解析请求体
    const { sql: sqlQuery } = JSON.parse(event.body);
    
    if (!sqlQuery) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'SQL查询语句不能为空' 
        })
      };
    }

    // 连接数据库并执行查询
    await sql.connect(config);
    
    // 执行SQL查询
    const result = await sql.query(sqlQuery);
    
    // 关闭连接
    await sql.close();
    
    // 处理结果
    const data = result.recordset || [];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        message: `查询成功，返回 ${data.length} 条记录`
      })
    };
  } catch (err) {
    console.error('SQL执行错误:', err);
    
    // 确保连接已关闭
    try {
      await sql.close();
    } catch (closeErr) {
      // 忽略关闭错误
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: err.message || 'SQL执行失败'
      })
    };
  }
};
