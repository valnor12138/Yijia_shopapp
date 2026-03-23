
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  ChevronRight,
  PlusCircle,
  Tag,
  BarChart,
  AlertTriangle,
  XCircle,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Coins,
  Home as HomeIcon,
  Clock,
  Users,
  GitCompare,
  PackageSearch,
  Truck,
  TrendingUp,
  BrainCircuit,
  ShieldAlert,
  Network,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import Dialog from './Dialog';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const reportGroups = [
    {
      title: '销售运营分析',
      items: [
        { id: 'sales_period', label: '销售客单时段', icon: <Clock className="text-blue-500" />, color: 'bg-blue-50', implemented: true },
        { id: 'customer_flow', label: '总客流日报', icon: <Users className="text-cyan-500" />, color: 'bg-cyan-50', implemented: true },
        { id: 'category', label: '品类销售分析', icon: <Tag className="text-green-500" />, color: 'bg-green-50', implemented: true },
        { id: 'period_compare', label: '销售时段对比', icon: <GitCompare className="text-purple-500" />, color: 'bg-purple-50', implemented: true },
        { id: 'stockout', label: '畅销商品缺货', icon: <AlertTriangle className="text-red-400" />, color: 'bg-red-50', implemented: true },
        { id: 'product_sales', label: '商品销售分析', icon: <PackageSearch className="text-indigo-500" />, color: 'bg-indigo-50', implemented: true },
        { id: 'supplier_delivery', label: '供应商到货率', icon: <Truck className="text-teal-500" />, color: 'bg-teal-50', implemented: true },
        { id: 'negative_profit', label: '负毛利商品', icon: <Coins className="text-red-500" />, color: 'bg-red-50', implemented: true },
        { id: 'high_stock', label: '高库存分析', icon: <ArrowUpCircle className="text-yellow-500" />, color: 'bg-yellow-50', implemented: true },
        { id: 'new', label: '新品报表', icon: <PlusCircle className="text-blue-400" />, color: 'bg-blue-50', implemented: true },
        { id: 'supplier_sales', label: '供应商动销率', icon: <TrendingUp className="text-orange-500" />, color: 'bg-orange-50', implemented: true },
        { id: 'abnormal', label: '品态异常表单', icon: <XCircle className="text-rose-400" />, color: 'bg-rose-50', implemented: true },
        { id: 'slow_selling', label: '滞销商品分析', icon: <TrendingDown className="text-orange-600" />, color: 'bg-orange-50', implemented: true },
      ]
    },
    {
      title: '智能分析',
      items: [
        { id: 'ai_forecast', label: 'AI销售预测', icon: <BrainCircuit className="text-indigo-500" />, color: 'bg-indigo-50' },
        { id: 'ai_anomaly', label: '异常识别', icon: <ShieldAlert className="text-rose-500" />, color: 'bg-rose-50' },
        { id: 'ai_associate', label: '关联分析', icon: <Network className="text-amber-500" />, color: 'bg-amber-50' },
        { id: 'ai_assistant', label: '智能客服', icon: <MessageSquare className="text-emerald-500" />, color: 'bg-emerald-50' },
        { id: 'ai_magic', label: '智慧经营', icon: <Sparkles className="text-violet-500" />, color: 'bg-violet-50' },
      ]
    }
  ];

  console.log('Home component rendered');
  console.log('reportGroups:', reportGroups);

  const handleItemClick = (item: any) => {
    if (item.implemented) {
      if (item.id === 'category') {
        navigate('/category-sales');
      } else if (item.id === 'new') {
        navigate('/new-product-sales');
      } else if (item.id === 'low_stock') {
        navigate('/low-stock');
      } else if (item.id === 'sales_period') {
        navigate('/sales-period');
      } else if (item.id === 'customer_flow') {
        navigate('/customer-flow');
      } else if (item.id === 'period_compare') {
        navigate('/period-compare');
      } else if (item.id === 'stockout') {
        navigate('/stockout');
      } else if (item.id === 'product_sales') {
        navigate('/product-sales');
      } else if (item.id === 'supplier_delivery') {
        navigate('/supplier-delivery');
      } else if (item.id === 'negative_profit') {
        navigate('/negative-profit');
      } else if (item.id === 'high_stock') {
        navigate('/high-stock');
      } else if (item.id === 'abnormal') {
        navigate('/abnormal-status');
      } else if (item.id === 'slow_selling') {
        navigate('/slow-sales');
      } else if (item.id === 'supplier_sales') {
        navigate('/supplier-sales');
      } else {
        navigate('/sales-rate-analysis');
      }
    } else {
      setDialogMessage(`「${item.label}」功能正在开发中，敬请期待！`);
      setDialogOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-10">
      {/* Centered Header */}
      <header className="bg-white border-b border-gray-100 py-4 px-4 sticky top-0 z-40 shadow-sm flex items-center justify-center">
        <div className="absolute left-4 text-gray-700">
           <HomeIcon size={20} />
        </div>
        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">报表主页</h1>
      </header>

      {/* Notification Bar */}
      <div className="bg-blue-50/50 px-4 py-3 flex items-center justify-between border-b border-blue-100/50">
        <div className="flex items-center space-x-2 overflow-hidden">
          <Megaphone size={16} className="text-orange-400 shrink-0" />
          <p className="text-sm text-gray-600 truncate">最新通知：AI 智能销售预测模块即将上线！</p>
        </div>
        <ChevronRight size={16} className="text-gray-400 shrink-0" />
      </div>

      {/* Main Content Card */}
      <main className="p-4 space-y-4">
        {reportGroups.map((group, gIdx) => (
          <div key={gIdx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center mb-6">
              <span className={`w-2 h-2 rounded-full mr-2 ${gIdx === 0 ? 'bg-orange-400' : 'bg-indigo-400'}`}></span>
              <h2 className="text-lg font-bold text-gray-800">{group.title}</h2>
            </div>
            
            <div className="grid grid-cols-5 gap-y-8">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="flex flex-col items-center transition-transform active:scale-95 group"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-sm transition-shadow group-hover:shadow-md ${item.color}`}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: 24 })}
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium whitespace-nowrap">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {/* Placeholder for bottom margin */}
        <div className="h-10"></div>
      </main>
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="功能开发中"
        message={dialogMessage}
        confirmText="知道了"
      />
    </div>
  );
};

export default Home;
