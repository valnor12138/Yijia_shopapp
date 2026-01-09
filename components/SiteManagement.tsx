
import React from 'react';
import { ClipboardCheck, Clock, CheckCircle2, AlertCircle, MapPin, ChevronRight } from 'lucide-react';

const SiteManagement: React.FC = () => {
  const tasks = [
    { title: '早班库存盘点', time: '08:30', status: 'done', priority: 'high' },
    { title: '生鲜区巡检', time: '10:00', status: 'pending', priority: 'high' },
    { title: '新品上架核准', time: '14:00', status: 'pending', priority: 'normal' },
    { title: '晚班交接汇报', time: '21:30', status: 'pending', priority: 'normal' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <header className="bg-white border-b border-gray-50 py-5 flex items-center justify-center sticky top-0 z-40">
        <h1 className="text-lg font-bold text-gray-800">现场管理</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Status Section */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <MapPin size={24} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">当前在店</div>
              <div className="text-xs text-gray-400">北京朝阳区旗舰店</div>
            </div>
          </div>
          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold">打卡成功</span>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <h3 className="text-[13px] font-bold text-gray-400 pl-2">今日任务清单</h3>
          {tasks.map((task, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between group active:scale-95 transition-all">
              <div className="flex items-center space-x-4">
                <div className={`w-1 h-8 rounded-full ${task.status === 'done' ? 'bg-gray-200' : task.priority === 'high' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                <div>
                  <div className={`text-sm font-bold ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {task.title}
                  </div>
                  <div className="flex items-center text-[10px] text-gray-400 mt-1">
                    <Clock size={10} className="mr-1" />
                    <span>计划时间: {task.time}</span>
                  </div>
                </div>
              </div>
              <div>
                {task.status === 'done' ? (
                  <CheckCircle2 size={20} className="text-green-500" />
                ) : (
                  <ChevronRight size={18} className="text-gray-300" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Report Summary */}
        <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between mt-6">
          <div>
            <div className="text-xl font-bold mb-1">现场巡检报告</div>
            <div className="text-xs opacity-80 italic">本周已提交 5 份报告</div>
          </div>
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-2xl transition-all">
            <ClipboardCheck size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteManagement;
