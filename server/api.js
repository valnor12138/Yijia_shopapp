const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 数据库配置
const config = {
  user: 'rou_9999',
  password: 'kl87ngG@f',
  server: 'tag.qyyjtr.com',
  port: 6899,
  database: 'enjoy_shq_test',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 60000 // 增加查询超时时间到60秒
  }
};

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