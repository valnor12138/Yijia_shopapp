#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SQL Server 连接测试脚本
用于测试远程SQL Server数据库连接是否成功
"""

import pyodbc
import socket
import sys

def test_network_connection(server, port):
    """
    测试网络连接是否正常
    """
    print(f"\n正在测试网络连接到 {server}:{port}...")
    try:
        # 创建TCP套接字
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)  # 设置5秒超时
        # 解析主机名
        host_ip = socket.gethostbyname(server.split(',')[0])
        print(f"解析主机名 {server.split(',')[0]} 到 IP: {host_ip}")
        # 尝试连接
        result = sock.connect_ex((host_ip, int(port)))
        if result == 0:
            print(f"✓ 网络连接到 {server}:{port} 成功！")
            sock.close()
            return True
        else:
            print(f"✗ 网络连接到 {server}:{port} 失败，错误代码: {result}")
            sock.close()
            return False
    except socket.gaierror as e:
        print(f"✗ 无法解析主机名: {e}")
        return False
    except ValueError as e:
        print(f"✗ 无效的端口号: {e}")
        return False
    except Exception as e:
        print(f"✗ 网络连接测试失败: {e}")
        return False

def test_sql_server_connection():
    """
    测试SQL Server数据库连接
    """
    # 数据库连接信息
    server = 'tag.qyyjtr.com,6899'
    database = 'enjoy_shq_test'
    username = 'rou_9999'
    password = 'kl87ngG@f'
    
    # 提取服务器和端口
    server_host = server.split(',')[0]
    server_port = server.split(',')[1] if ',' in server else '1433'
    
    # 先测试网络连接
    network_ok = test_network_connection(server_host, server_port)
    
    if not network_ok:
        print("\n网络连接失败，请检查以下内容：")
        print("1. 确认服务器地址和端口号正确")
        print("2. 确认网络可以访问目标服务器")
        print("3. 确认服务器防火墙允许该端口的连接")
        return False
    
    try:
        # 构建连接字符串 - 尝试不同的连接选项
        conn_str_options = [
            # 基本连接字符串
            f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}",
            # 增加连接超时
            f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Connection Timeout=30",
            # 使用加密选项
            f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=no;TrustServerCertificate=yes",
            # 使用TCP协议显式指定
            f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER=tcp:{server};DATABASE={database};UID={username};PWD={password}"
        ]
        
        for i, conn_str in enumerate(conn_str_options, 1):
            print(f"\n尝试连接选项 {i}...")
            print(f"连接字符串: {conn_str}")
            
            # 尝试连接
            conn = pyodbc.connect(conn_str)
            print("✓ 连接成功！")
            
            # 创建游标并执行用户提供的SQL查询
            cursor = conn.cursor()
            print("\n正在执行用户提供的SQL查询...")
            
            # 用户提供的SQL语句
            sql_query = '''
--[io]销售客单按时段[T1]
declare @商品编码 varchar(max),@机构 varchar(1000),@部门 varchar(1000),@分类 varchar(1000),@分类长度 varchar(20),@商品名称 varchar(max),@显示无变动商品 varchar(max),
@开始时间 datetime,@结束时间 datetime, @供应商编码 varchar(max),@开始小时 int, @结束小时 int
select @商品编码='' , @机构='11021',@开始时间='2024-02-25' , @结束时间='2024-02-26',@显示无变动商品='否'
,@部门='',@分类='',@商品名称='',@分类长度='' , @开始小时=0 , @结束小时=23
exec up_rpt_io_sale_bytime @开始时间 , @结束时间 , @机构 , @部门 , @开始小时 , @结束小时,@分类, @分类长度,1
            '''
            
            # 执行SQL查询
            cursor.execute(sql_query)
            
            # 处理多个结果集
            result_set_count = 0
            has_results = False
            
            while True:
                result_set_count += 1
                
                # 获取列名
                if cursor.description is not None:
                    columns = [column[0] for column in cursor.description]
                    print(f"\n结果集 {result_set_count} 列: {', '.join(columns)}")
                    print("-" * 100)
                    
                    # 获取并打印结果集
                    rows = cursor.fetchall()
                    print(f"结果集 {result_set_count} 行数: {len(rows)}")
                    
                    if len(rows) > 0:
                        has_results = True
                        # 打印前10行结果（如果结果集很大）
                        for i, row in enumerate(rows[:10], 1):
                            print(f"行 {i}: {row}")
                        
                        # 如果结果超过10行，提示用户
                        if len(rows) > 10:
                            print(f"... 共 {len(rows)} 行结果，仅显示前10行")
                    else:
                        print(f"结果集 {result_set_count} 为空")
                else:
                    print(f"\n结果集 {result_set_count} 无列信息（可能是存储过程执行状态）")
                    
                # 检查是否还有更多结果集
                if not cursor.nextset():
                    break
            
            if not has_results:
                print("\n所有结果集都为空")
                
            # 获取受影响的行数（如果适用）
            if cursor.rowcount > -1:
                print(f"\n受影响的行数: {cursor.rowcount}")
            
            # 关闭连接
            cursor.close()
            conn.close()
            print("\n连接已关闭。")
            return True
    
    except pyodbc.Error as e:
        print(f"\n✗ 连接失败！错误信息: {e}")
        print("\n可能的原因和解决方案：")
        print("1. SQL Server版本不兼容：确认服务器支持ODBC Driver 17")
        print("2. 服务器资源限制：服务器可能达到最大连接数或内存不足")
        print("3. 防火墙设置：确认服务器防火墙允许该端口的连接")
        print("4. 登录凭据错误：确认用户名和密码正确")
        print("5. 数据库不存在：确认数据库名称正确")
        print("6. SQL Server配置：确认SQL Server允许远程连接")
        print("7. 网络问题：确认网络稳定，没有丢包或高延迟")
        return False
    except Exception as e:
        print(f"\n✗ 发生未知错误: {e}")
        return False

if __name__ == "__main__":
    print("SQL Server连接测试工具")
    print("=" * 50)
    test_sql_server_connection()