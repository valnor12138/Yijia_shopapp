
import React from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import SalesAnalysis from './components/SalesAnalysis';
import AnalysisPlaceholder from './components/AnalysisPlaceholder';
import ManagePlaceholder from './components/ManagePlaceholder';
import ProfilePlaceholder from './components/ProfilePlaceholder';
import CategorySales from './components/CategorySales';
import CozeChat from './components/CozeChat';
import { 
  Home as HomeIcon, 
  BarChart2, 
  ClipboardList, 
  User 
} from 'lucide-react';

// 底部导航组件
function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: '首页', icon: <HomeIcon size={20} />, path: '/' },
    { id: 'analysis', label: '运营分析', icon: <BarChart2 size={20} />, path: '/analysis' },
    { id: 'manage', label: '现场管理', icon: <ClipboardList size={20} />, path: '/manage' },
    { id: 'profile', label: '我的', icon: <User size={20} />, path: '/profile' }
  ];

  const handleNav = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-4 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item.path)}
            className={`flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const App: React.FC = () => {
  console.log('App component rendered');
  return (
    <Router>
      <div className="min-h-screen max-w-md mx-auto bg-gray-50 flex flex-col relative pb-20 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sales-rate-analysis" element={<SalesAnalysis />} />
          <Route path="/analysis" element={<AnalysisPlaceholder />} />
          <Route path="/manage" element={<ManagePlaceholder />} />
          <Route path="/profile" element={<ProfilePlaceholder />} />
          <Route path="/category-sales" element={<CategorySales />} />
        </Routes>
        <BottomNav />
        <CozeChat />
      </div>
    </Router>
  );
}

export default App;
