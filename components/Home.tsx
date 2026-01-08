
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { 
  Megaphone, 
  ChevronRight,
  PackagePlus, // Changed icon for "New Product"
  Tag,
  BarChart,
  AlertTriangle,
  XCircle,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Coins,
  Handshake,
  Home as HomeIcon,
  BrainCircuit,
  ShieldAlert,
  Network,
  MessageSquare,
  Sparkles
} from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(AppContext);

  const reportGroups = [
    {
      title: '品态管理类报表',
      color: 'bg-orange-400',
      items: [
        { id: 'new', label: '新品报表', icon: <PackagePlus className="text-blue-500" />, color: 'bg-blue-50' },
        { id: 'category', label: '品类销售', icon: <Tag className="text-green-500" />, color: 'bg-green-50' },
        { id: 'rate', label: '动销率分析', icon: <BarChart className="text-cyan-500" />, color: 'bg-cyan-50', implemented: true },
        { id: 'stockout', label: '缺货报表', icon: <AlertTriangle className="text-red-400" />, color: 'bg-red-50' },
        { id: 'abnormal', label: '品态异常', icon: <XCircle className="text-purple-400" />, color: 'bg-purple-50' },
        { id: 'slow', label: '滞销商品', icon: <TrendingDown className="text-amber-500" />, color: 'bg-amber-50' },
        { id: 'high_stock', label: '高库存', icon: <ArrowUpCircle className="text-yellow-600" />, color: 'bg-yellow-50' },
        { id: 'low_stock', label: '负库存', icon: <ArrowDownCircle className="text-orange-600" />, color: 'bg-orange-50' },
        { id: 'profit', label: '负毛利', icon: <Coins className="text-rose-500" />, color: 'bg-rose-50' },
        { id: 'fulfillment', label: '货商履约', icon: <Handshake className="text-teal-500" />, color: 'bg-teal-50' },
      ]
    },
    {
      title: '销售数据分析',
      color: 'bg-indigo-500',
      items: [
        { id: 'ai_forecast', label: 'AI销售预测', icon: <BrainCircuit className="text-indigo-500" />, color: 'bg-indigo-50' },
        { id: 'ai_anomaly', label: '异常识别', icon: <ShieldAlert className="text-rose-500" />, color: 'bg-rose-50' },
        { id: 'ai_associate', label: '关联分析', icon: <Network className="text-amber-600" />, color: 'bg-amber-50' },
        { id: 'ai_assistant', label: '智能客服', icon: <MessageSquare className="text-emerald-500" />, color: 'bg-emerald-50' },
        { id: 'ai_magic', label: '智慧经营', icon: <Sparkles className="text-violet-500" />, color: 'bg-violet-50' },
      ]
    }
  ];

  const handleItemClick = (item: any) => {
    if (item.implemented) {
      navigate('/sales-rate-analysis');
    } else {
      context?.showDevModal(item.label);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-10">
      {/* Centered Header */}
      <header className="bg-white border-b border-gray-50 py-5 px-4 sticky top-0 z-40 shadow-sm flex items-center justify-center">
        <div className="absolute left-4 text-gray-300">
           <HomeIcon size={20} />
        </div>
        <h1 className="text-lg font-bold text-gray-800 tracking-wider">报表主页</h1>
      </header>

      {/* Notification */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-50/50 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
        <div className="flex items-center space-x-2 overflow-hidden">
          <Megaphone size={16} className="text-orange-400 shrink-0" />
          <p className="text-[13px] text-gray-500 truncate font-medium">最新通知：AI 智能销售预测模块即将上线！</p>
        </div>
        <ChevronRight size={14} className="text-gray-300 shrink-0" />
      </div>

      {/* Main Content */}
      <main className="p-4 space-y-5">
        {reportGroups.map((group, gIdx) => (
          <div key={gIdx} className="bg-white rounded-[2rem] shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-50 p-6">
            <div className="flex items-center mb-6 pl-1">
              <span className={`w-1.5 h-4 rounded-full mr-2.5 ${group.color}`}></span>
              <h2 className="text-[16px] font-bold text-gray-800">{group.title}</h2>
            </div>
            
            <div className="grid grid-cols-5 gap-y-8">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="flex flex-col items-center transition-all active:scale-90 group"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 shadow-sm group-hover:shadow-md transition-all ${item.color}`}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: 24 })}
                  </div>
                  <span className="text-[11px] text-gray-500 font-bold tracking-tight whitespace-nowrap">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {/* Footer info */}
        <div className="py-6 flex flex-col items-center opacity-20">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </main>
    </div>
  );
};

export default Home;
