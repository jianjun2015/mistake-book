import axios from 'axios'

const api = axios.create({
  baseURL: '/video-api',
  timeout: 30000,
})

api.interceptors.response.use(
  r => r,
  e => {
    console.error('API Error:', e?.response?.data || e.message)
    return Promise.reject(e)
  },
)

export default api

/**
 * 把后端返回的视频相对路径转换为浏览器可访问地址。
 * 后端返回 /api/videos/{id}（直连后端可用），前端经 nginx 走 /video-api 前缀。
 */
export function videoSrc(url: string): string {
  if (!url) return url
  if (url.startsWith('/api/')) return '/video-api' + url.slice(4)
  // 兼容历史数据里的 /video-api 前缀
  return url
}
