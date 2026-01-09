import axios from 'axios';

// 测试API连接
async function testApi() {
  try {
    const sqlQuery = `--[io]销售客单按时段[T1]
declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@分类长度 varchar(20),@商品名称 varchar(max),@显示无变动商品 varchar(max),
@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max),@开始小时 int, @结束小时 int
select @商品编码='' , @机构='11021',@开始时间='2024-02-25' , @结束时间='2024-02-26',@显示无变动商品='否'
,@部门='',@分类='',@商品名称='',@分类长度='' , @开始小时=0 , @结束小时=23
exec up_rpt_io_sale_bytime @开始时间 , @结束时间 , @机构 , @部门 , @开始小时 , @结束小时,@分类, @分类长度,1`;

    console.log('正在测试API连接...');
    const response = await axios.post('http://localhost:3001/api/execute-sql', {
      sql: sqlQuery
    }, {
      timeout: 60000 // 60秒超时
    });

    console.log('✓ API调用成功！');
    console.log('响应状态:', response.status);
    console.log('响应数据:', response.data);
    console.log(`返回记录数: ${response.data.data.length}`);
  } catch (error) {
    console.error('✗ API调用失败:', error);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('没有收到响应:', error.request);
    }
  }
}

testApi();