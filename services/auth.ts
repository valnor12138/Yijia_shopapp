// 用户类型定义
export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // 密码字段，仅用于本地存储
}

// 认证服务类
class AuthService {
  // 获取用户列表
  private getUsers(): User[] {
    const usersStr = localStorage.getItem('users');
    if (usersStr) {
      try {
        return JSON.parse(usersStr);
      } catch (error) {
        console.error('解析用户列表失败:', error);
        return [];
      }
    }
    return [];
  }

  // 保存用户列表
  private saveUsers(users: User[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }

  // 获取当前用户
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // 移除密码字段，避免在前端显示
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      } catch (error) {
        console.error('解析用户信息失败:', error);
        this.logout();
        return null;
      }
    }
    return null;
  }

  // 检查用户是否已登录
  isAuthenticated(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true' && this.getCurrentUser() !== null;
  }

  // 登录
  login(email: string, password: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');
      // 移除密码字段，避免在前端显示
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  // 注册
  register(user: User): User | null {
    const users = this.getUsers();
    
    // 检查邮箱是否已存在
    if (users.some(u => u.email === user.email)) {
      return null;
    }
    
    // 生成唯一ID
    const newUser = {
      ...user,
      id: Date.now().toString()
    };
    
    // 保存新用户
    const updatedUsers = [...users, newUser];
    this.saveUsers(updatedUsers);
    
    // 自动登录
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('isLoggedIn', 'true');
    
    // 移除密码字段，避免在前端显示
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  // 注销
  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  }

  // 清除所有认证信息
  clearAuth(): void {
    localStorage.clear();
  }
}

// 导出单例实例
export const authService = new AuthService();

// 导出认证上下文类型
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => User | null;
  register: (user: User) => User | null;
  logout: () => void;
  clearAuth: () => void;
}