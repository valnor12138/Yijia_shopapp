
import React from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Bell, 
  HelpCircle, 
  Trash2, 
  LogOut, 
  ChevronRight,
  Database
} from 'lucide-react';

const Profile: React.FC = () => {
  const menuItems = [
    { label: '账号安全', icon: <ShieldCheck size={18} className="text-blue-500" /> },
    { label: '消息通知', icon: <Bell size={18} className="text-orange-500" /> },
    { label: '数据库配置', icon: <Database size={18} className="text-indigo-500" />, note: 'SQL Server' },
    { label: '帮助中心', icon: <HelpCircle size={18} className="text-green-500" /> },
    { label: '清除缓存', icon: <Trash2 size={18} className="text-gray-400" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <header className="bg-white border-b border-gray-50 py-5 flex items-center justify-center sticky top-0 z-40">
        <h1 className="text-lg font-bold text-gray-800">我的</h1>
        <button className="absolute right-4 p-1">
          <Settings size={20} className="text-gray-400" />
        </button>
      </header>

      <div className="p-4 space-y-6">
        {/* User Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
            <span className="text-2xl font-black text-blue-600">张</span>
          </div>
          <div className="flex-1">
            <div className="text-lg font-black text-gray-800">张经理</div>
            <div className="text-xs text-gray-400 mt-1">工号：880124  ·  华北区域经理</div>
          </div>
          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold">主账号</span>
        </div>

        {/* Menu List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden divide-y divide-gray-50">
          {menuItems.map((item, i) => (
            <button key={i} className="w-full flex items-center p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="w-8 flex items-center justify-start">
                {item.icon}
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700 text-left">{item.label}</span>
              <div className="flex items-center space-x-2">
                {item.note && <span className="text-[10px] text-gray-400 font-mono">{item.note}</span>}
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button className="w-full bg-white text-rose-500 py-4 rounded-3xl font-bold shadow-sm border border-gray-50 flex items-center justify-center space-x-2 active:bg-rose-50 transition-colors">
          <LogOut size={18} />
          <span>退出当前账号</span>
        </button>

        {/* Footer info */}
        <div className="text-center space-y-1">
          <div className="text-[10px] text-gray-300 font-medium tracking-widest">RETAIL INTELLIGENCE v1.0.2</div>
          <div className="text-[9px] text-gray-200">Connected to SQL Server Express</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
