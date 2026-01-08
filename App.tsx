
import React, { useState, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import SalesAnalysis from './components/SalesAnalysis';
import OperationAnalysis from './components/OperationAnalysis';
import SiteManagement from './components/SiteManagement';
import Profile from './components/Profile';
import Modal from './components/Modal';
import { 
  Home as HomeIcon, 
  BarChart2, 
  ClipboardList, 
  User 
} from 'lucide-react';

// Create a context to manage global development modal
interface AppContextType {
  showDevModal: (title?: string) => void;
}
export const AppContext = createContext<AppContextType | undefined>(undefined);

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: '首页', icon: <HomeIcon size={20} />, path: '/' },
    { id: 'analysis', label: '运营分析', icon: <BarChart2 size={20} />, path: '/analysis' },
    { id: 'manage', label: '现场管理', icon: <ClipboardList size={20} />, path: '/manage' },
    { id: 'profile', label: '我的', icon: <User size={20} />, path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-around items-center py-2 px-4 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
              isActive ? 'text-blue-600 font-bold scale-110' : 'text-gray-400'
            }`}
          >
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  const showDevModal = (title?: string) => {
    setModalTitle(title || '功能开发中');
    setModalOpen(true);
  };

  return (
    <AppContext.Provider value={{ showDevModal }}>
      <Router>
        <div className="min-h-screen max-w-md mx-auto bg-gray-50 flex flex-col relative pb-20 overflow-x-hidden shadow-2xl border-x border-gray-100">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sales-rate-analysis" element={<SalesAnalysis />} />
            <Route path="/analysis" element={<OperationAnalysis />} />
            <Route path="/manage" element={<SiteManagement />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
          <BottomNav />
          <Modal 
            isOpen={modalOpen} 
            onClose={() => setModalOpen(false)} 
            title={modalTitle} 
          />
        </div>
      </Router>
    </AppContext.Provider>
  );
};

export default App;
