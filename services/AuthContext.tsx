import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authService, AuthContextType } from './auth';

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件接口
interface AuthProviderProps {
  children: ReactNode;
}

// 认证提供者组件
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时检查用户状态
  useEffect(() => {
    const checkAuthStatus = () => {
      const currentUser = authService.getCurrentUser();
      const authenticated = authService.isAuthenticated();
      setUser(currentUser);
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // 登录方法
  const login = (email: string, password: string): User | null => {
    const user = authService.login(email, password);
    if (user) {
      setUser(user);
      setIsAuthenticated(true);
    }
    return user;
  };

  // 注册方法
  const register = (userData: User): User | null => {
    const user = authService.register(userData);
    if (user) {
      setUser(user);
      setIsAuthenticated(true);
    }
    return user;
  };

  // 注销方法
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // 清除认证信息
  const clearAuth = () => {
    authService.clearAuth();
    setUser(null);
    setIsAuthenticated(false);
  };

  // 上下文值
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    clearAuth
  };

  // 如果正在加载，返回null或加载指示器
  if (isLoading) {
    return null; // 或者返回一个加载组件
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，用于在组件中访问认证上下文
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;