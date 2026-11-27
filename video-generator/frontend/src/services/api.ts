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
