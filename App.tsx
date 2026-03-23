
import React from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import SalesAnalysis from './components/SalesAnalysis';
import AnalysisPlaceholder from './components/AnalysisPlaceholder';
import ManagePlaceholder from './components/ManagePlaceholder';
import ProfilePlaceholder from './components/ProfilePlaceholder';
import CategorySales from './components/CategorySales';
import NewProductSales from './components/NewProductSales';
import LowStockReport from './components/LowStockReport';
import SalesPeriodReport from './components/SalesPeriodReport';
import CustomerFlowReport from './components/CustomerFlowReport';
import PeriodCompareReport from './components/PeriodCompareReport';
import StockoutReport from './components/StockoutReport';
import ProductSalesReport from './components/ProductSalesReport';
import SupplierDeliveryReport from './components/SupplierDeliveryReport';
import NegativeProfitReport from './components/NegativeProfitReport';
import HighStockReport from './components/HighStockReport';
import AbnormalStatusReport from './components/AbnormalStatusReport';
import SlowSalesReport from './components/SlowSalesReport';
import SalesPerformanceReport from './components/SalesPerformanceReport';
import CozeChat from './components/CozeChat';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import { AuthProvider } from './services/AuthContext';
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
    <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-7xl bg-white border-t border-gray-200 flex justify-around items-center h-16 px-4 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
          >
            <span className="mb-1">{item.icon}</span>
            <span className="text-xs leading-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const AppContent: React.FC = () => {
  console.log('App component rendered');
  return (
    <div className="min-h-screen mx-auto bg-gray-50 flex flex-col relative pb-20 overflow-x-hidden max-w-7xl">
      <Routes>
        {/* 公共路由 - 不需要登录 */}
        <Route element={<PublicRoute restricted={true} />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        
        {/* 私有路由 - 需要登录 */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/sales-rate-analysis" element={<SalesAnalysis />} />
          <Route path="/analysis" element={<AnalysisPlaceholder />} />
          <Route path="/manage" element={<ManagePlaceholder />} />
          <Route path="/profile" element={<ProfilePlaceholder />} />
          <Route path="/category-sales" element={<CategorySales />} />
          <Route path="/new-product-sales" element={<NewProductSales />} />
          <Route path="/low-stock" element={<LowStockReport />} />
          <Route path="/sales-period" element={<SalesPeriodReport />} />
          <Route path="/customer-flow" element={<CustomerFlowReport />} />
          <Route path="/period-compare" element={<PeriodCompareReport />} />
          <Route path="/stockout" element={<StockoutReport />} />
          <Route path="/product-sales" element={<ProductSalesReport />} />
          <Route path="/supplier-delivery" element={<SupplierDeliveryReport />} />
          <Route path="/negative-profit" element={<NegativeProfitReport />} />
          <Route path="/high-stock" element={<HighStockReport />} />
          <Route path="/abnormal-status" element={<AbnormalStatusReport />} />
          <Route path="/slow-sales" element={<SlowSalesReport />} />
          <Route path="/supplier-sales" element={<SalesPerformanceReport />} />
        </Route>
      </Routes>
      <BottomNav />
      <CozeChat />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
