import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import type { ApiResponse } from '../types';
import { message } from 'antd';

const TOKEN_KEY = 'mistake_book_token';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

// 扩展 AxiosRequestConfig 类型
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

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

// 响应拦截器 - 处理 401 未授权和重试逻辑
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse<unknown>;
    if (data.code !== 200) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return response.data;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    
    if (!config) {
      return Promise.reject(error);
    }

    // 初始化重试计数
    if (config._retryCount === undefined) {
      config._retryCount = 0;
    }

    // 判断是否需要重试
    const shouldRetry = 
      config._retryCount < MAX_RETRIES && (
        !error.response || // 网络错误
        (error.response.status >= 500) || // 服务器错误
        error.response.status === 408 // 请求超时
      );

    if (shouldRetry) {
      config._retryCount += 1;
      console.log(`请求重试 ${config._retryCount}/${MAX_RETRIES}: ${config.url}`);
      
      // 延迟后重试
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config._retryCount!));
      
      // 重新发起请求
      return request(config);
    }

    // 不需要重试或重试次数用尽
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储并跳转登录
      localStorage.removeItem(TOKEN_KEY);
      message.error('登录已过期，请重新登录');
      window.location.href = '/login';
    } else if (error.response && error.response.status >= 500) {
      message.error('服务器繁忙，请稍后重试');
    } else {
      message.error((error.response?.data as any)?.message || error.message || '网络异常');
    }
    
    return Promise.reject(error);
  }
);

export default request;
