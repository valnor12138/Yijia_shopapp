import React, { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

interface PrivateRouteProps {
  children?: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // 如果用户未登录，重定向到登录页面，并保存当前位置以便登录后返回
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果有子组件，渲染子组件，否则渲染Outlet（用于嵌套路由）
  return children ? children : <Outlet />;
};

export default PrivateRoute;