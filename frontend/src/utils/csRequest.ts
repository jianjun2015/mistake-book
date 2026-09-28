/**
 * 智能客服API请求
 */
import axios from 'axios';

const csRequest = axios.create({
  baseURL: '/cs-api',
  timeout: 120000,
});

csRequest.interceptors.request.use((config) => {
  const token = localStorage.getItem('mistake_book_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

csRequest.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('客服API错误:', error);
    return Promise.reject(error);
  }
);

export default csRequest;
