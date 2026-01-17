// 加载环境变量
require('dotenv').config();

const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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
  console.error('   本地开发：在 server 目录创建 .env 文件');
  console.error('   生产环境：在部署平台设置环境变量');
  process.exit(1);
}

// 测试数据库连接
async function testConnection() {
  try {
    await sql.connect(config);
    console.log('✓ 数据库连接成功！');
    await sql.close();
  } catch (err) {
    console.error('✗ 数据库连接失败:', err);
  }
}

testConnection();

// SQL执行API
app.post('/api/execute-sql', async (req, res) => {
  const { sql: sqlQuery } = req.body;
  
  if (!sqlQuery) {
    return res.status(400).json({ error: 'SQL查询语句不能为空' });
  }

  try {
    await sql.connect(config);
    
    // 执行SQL查询
    const result = await sql.query(sqlQuery);
    
    // 关闭连接
    await sql.close();
    
    // 处理结果
    const data = result.recordset || [];
    
    res.json({
      success: true,
      data: data,
      message: `查询成功，返回 ${data.length} 条记录`
    });
  } catch (err) {
    console.error('SQL执行错误:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'SQL执行失败'
    });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器正在运行，端口：${PORT}`);
  console.log(`API地址：http://localhost:${PORT}/api/execute-sql`);
});