import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ClipboardList, AlertCircle, CheckCircle, Clock, Users, ShoppingCart } from 'lucide-react';

/**
 * 现场管理页面
 * 显示默认的现场管理数据和状态
 */
const ManagePlaceholder: React.FC = () => {
  const navigate = useNavigate();

  // 默认现场状态数据
  const onSiteStatus = [
    { name: '今日销售额', value: '¥25,800', status: 'normal', icon: <ShoppingCart className="text-blue-500" /> },
    { name: '当前在线顾客', value: '42', status: 'normal', icon: <Users className="text-green-500" /> },
    { name: '待处理订单', value: '12', status: 'warning', icon: <Clock className="text-amber-500" /> },
    { name: '设备状态', value: '正常', status: 'normal', icon: <CheckCircle className="text-green-500" /> }
  ];

  // 待处理任务
  const pendingTasks = [
    { id: 1, title: '补货任务：生鲜区', status: 'pending', priority: 'high' },
    { id: 2, title: '设备维护：收银机', status: 'pending', priority: 'medium' },
    { id: 3, title: '清洁任务：熟食区', status: 'pending', priority: 'low' },
    { id: 4, title: '盘点任务：零食区', status: 'pending', priority: 'medium' }
  ];

  // 预警信息
  const alerts = [
    { id: 1, title: '生鲜区温度异常', level: 'warning', time: '10:30' },
    { id: 2, title: '库存不足：牛奶', level: 'warning', time: '09:15' },
    { id: 3, title: '收银机网络波动', level: 'info', time: '08:45' }
  ];

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
        <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-8">现场管理</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* On-site Status */}
        <div className="grid grid-cols-2 gap-4">
          {onSiteStatus.map((status, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">{status.name}</span>
                {status.icon}
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-gray-800">{status.value}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.status === 'normal' ? 'bg-green-100 text-green-700' : status.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {status.status === 'normal' ? '正常' : status.status === 'warning' ? '警告' : '异常'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
            <ClipboardList size={16} className="mr-2 text-blue-500" />
            待处理任务
          </h3>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                  <span className="text-sm text-gray-700">{task.title}</span>
                </div>
                <span className="text-xs text-gray-500">{task.status === 'pending' ? '待处理' : '处理中'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
            <AlertCircle size={16} className="mr-2 text-amber-500" />
            预警信息
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <AlertCircle size={16} className={`${alert.level === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                  <div>
                    <div className="text-sm text-gray-700">{alert.title}</div>
                    <div className="text-xs text-gray-500">{alert.time}</div>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${alert.level === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {alert.level === 'warning' ? '警告' : '信息'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagePlaceholder;