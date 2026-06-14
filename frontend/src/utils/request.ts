import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ApiResponse } from '../types';
import { message } from 'antd';

const TOKEN_KEY = 'mistake_book_token';

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截器 - 自动添加 Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理 401 未授权
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse<unknown>;
    if (data.code !== 200) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储并跳转登录
      localStorage.removeItem(TOKEN_KEY);
      message.error('登录已过期，请重新登录');
      window.location.href = '/login';
    } else {
      message.error(error.response?.data?.message || error.message || '网络异常');
    }
    return Promise.reject(error);
  }
);

export default request;
