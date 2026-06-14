import request from '../utils/request';
import type { ApiResponse, LoginForm, RegisterForm, LoginResult, UserInfo } from '../types';

// 用户登录
export const login = (data: LoginForm) => {
  return request.post<any, ApiResponse<LoginResult>>('/auth/login', data);
};

// 用户注册
export const register = (data: RegisterForm) => {
  return request.post<any, ApiResponse<UserInfo>>('/auth/register', data);
};

// 获取当前用户信息
export const getCurrentUser = () => {
  return request.get<any, ApiResponse<UserInfo>>('/auth/me');
};
