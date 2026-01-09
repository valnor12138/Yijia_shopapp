import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Settings, HelpCircle, LogOut, Bell, Shield, FileText, CreditCard } from 'lucide-react';

/**
 * 我的界面
 * 显示用户信息和相关功能入口
 */
const ProfilePlaceholder: React.FC = () => {
  const navigate = useNavigate();

  // 用户信息
  const userInfo = {
    name: '张店长',
    store: '北京朝阳店',
    role: '店长',
    avatar: 'https://ui-avatars.com/api/?name=张店长&background=random'
  };

  // 功能菜单
  const menuItems = [
    { id: 'settings', title: '设置', icon: <Settings className="text-gray-500" />, path: '#' },
    { id: 'notifications', title: '消息通知', icon: <Bell className="text-gray-500" />, path: '#' },
    { id: 'security', title: '安全中心', icon: <Shield className="text-gray-500" />, path: '#' },
    { id: 'reports', title: '我的报表', icon: <FileText className="text-gray-500" />, path: '#' },
    { id: 'billing', title: '账单管理', icon: <CreditCard className="text-gray-500" />, path: '#' },
    { id: 'help', title: '帮助中心', icon: <HelpCircle className="text-gray-500" />, path: '#' }
  ];

  // 统计信息
  const statistics = [
    { name: '本月登录次数', value: '25' },
    { name: '生成报表数', value: '120' },
    { name: '处理任务数', value: '85' }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-4 px-4 sticky top-0 z-40 shadow-sm flex items-center">
        <button 
          onClick={() => navigate('/')}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-8">我的</h1>
      </header>

      {/* User Profile */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mx-4 mt-4">
        <div className="flex items-center space-x-4">
          <img 
            src={userInfo.avatar} 
            alt={userInfo.name} 
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-800">{userInfo.name}</h2>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{userInfo.role}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{userInfo.store}</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mx-4 mt-4">
        {statistics.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{stat.name}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mx-4 mt-4 overflow-hidden">
        {menuItems.map((item) => (
          <button key={item.id} className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              {item.icon}
              <span className="text-sm text-gray-700">{item.title}</span>
            </div>
            <ChevronLeft size={16} className="text-gray-400 rotate-180" />
          </button>
        ))}
        <button className="w-full flex items-center justify-between p-4 text-red-500 hover:bg-gray-50 transition-colors">
          <div className="flex items-center space-x-3">
            <LogOut size={18} />
            <span className="text-sm">退出登录</span>
          </div>
          <ChevronLeft size={16} className="rotate-180" />
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto text-center p-4 text-xs text-gray-500">
        <p>版本号：v1.1.0</p>
        <p className="mt-1">© 2024 易家超市管理系统</p>
      </div>
    </div>
  );
};

export default ProfilePlaceholder;