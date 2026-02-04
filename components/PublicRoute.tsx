import React, { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

interface PublicRouteProps {
  children?: ReactNode;
  restricted?: boolean; // 是否限制已登录用户访问
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children, restricted = false }) => {
  const { isAuthenticated } = useAuth();

  // 如果页面被限制（如登录/注册页）且用户已登录，重定向到首页
  if (restricted && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 如果有子组件，渲染子组件，否则渲染Outlet（用于嵌套路由）
  return children ? children : <Outlet />;
};

export default PublicRoute;