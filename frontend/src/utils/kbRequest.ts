/**
 * 知识库API请求实例
 */
import axios from 'axios';

const kbRequest = axios.create({
  baseURL: '/kb-api',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
kbRequest.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
kbRequest.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('KB API Error:', error);
    return Promise.reject(error);
  }
);

export default kbRequest;
