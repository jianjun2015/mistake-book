// utils/request.js
const app = getApp();

const BASE_URL = app.globalData.baseUrl;

// 封装 wx.request
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = app.getToken();
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    };

    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      success(res) {
        if (res.statusCode === 200) {
          const data = res.data;
          if (data.code === 200) {
            resolve(data);
          } else {
            wx.showToast({ title: data.message || '请求失败', icon: 'none' });
            reject(data);
          }
        } else if (res.statusCode === 401) {
          // Token 过期
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.redirectTo({ url: '/pages/login/login' });
          reject(res);
        } else {
          wx.showToast({ title: '网络异常', icon: 'none' });
          reject(res);
        }
      },
      fail(err) {
        wx.showToast({ title: '网络连接失败', icon: 'none' });
        reject(err);
      }
    });
  });
};

// GET 请求
const get = (url, data) => request({ url, method: 'GET', data });

// POST 请求
const post = (url, data) => request({ url, method: 'POST', data });

// PUT 请求
const put = (url, data) => request({ url, method: 'PUT', data });

// DELETE 请求
const del = (url, data) => request({ url, method: 'DELETE', data });

// 上传文件
const upload = (url, filePath) => {
  return new Promise((resolve, reject) => {
    const token = app.getToken();
    wx.uploadFile({
      url: `${BASE_URL}${url}`,
      filePath,
      name: 'file',
      formData: { imageType: 1 },
      header: {
        'Authorization': `Bearer ${token}`
      },
      success(res) {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data);
          if (data.code === 200) {
            resolve(data);
          } else {
            wx.showToast({ title: data.message || '上传失败', icon: 'none' });
            reject(data);
          }
        } else {
          wx.showToast({ title: '上传失败', icon: 'none' });
          reject(res);
        }
      },
      fail(err) {
        wx.showToast({ title: '上传失败', icon: 'none' });
        reject(err);
      }
    });
  });
};

module.exports = {
  request,
  get,
  post,
  put,
  del,
  upload,
  BASE_URL
};
