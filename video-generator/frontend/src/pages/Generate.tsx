import { useState, useEffect, useRef } from 'react'
import {
  Card, Input, Select, Button, Slider, Space, Typography, message, Spin, Tag, Progress,
} from 'antd'
import { ThunderboltOutlined, DownloadOutlined, RedoOutlined, PlayCircleOutlined } from '@ant-design/icons'
import api from '../services/api'

const { TextArea } = Input
const { Title, Text } = Typography

interface Provider {
  provider: string
  display_name: string
  default_model: string
  api_key_masked: string
}

interface Task {
  id: string
  status: string
  video_url: string
  error_message: string
  duration: number
}

export default function Generate() {
  const [prompt, setPrompt] = useState('')
  const [provider, setProvider] = useState('kling')
  const [model, setModel] = useState('')
  const [resolution, setResolution] = useState('720p')
  const [duration, setDuration] = useState(5)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [task, setTask] = useState<Task | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    api.get('/config').then(r => {
      setProviders(r.data)
      const active = r.data.find((p: Provider) => p.api_key_masked)
      if (active) {
        setProvider(active.provider)
        setModel(active.default_model)
      }
    }).catch(() => {})
  }, [])

  // Poll task status
  const pollTask = (taskId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get(`/tasks/${taskId}`)
        setTask(r.data)
        if (r.data.status === 'completed') {
          setVideoUrl(r.data.video_url)
          setLoading(false)
          clearInterval(pollRef.current)
          message.success('视频生成完成！')
        } else if (r.data.status === 'failed') {
          setLoading(false)
          clearInterval(pollRef.current)
          message.error(`生成失败: ${r.data.error_message}`)
        }
      } catch {
        setLoading(false)
        clearInterval(pollRef.current)
      }
    }, 3000)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return message.warning('请输入视频描述')
    setLoading(true)
    setVideoUrl('')
    setTask(null)
    try {
      const r = await api.post('/generate', {
        prompt, provider, model,
        params: { resolution, duration },
      })
      setTask(r.data)
      if (r.data.status === 'failed') {
        message.error(r.data.error_message)
        setLoading(false)
      } else {
        message.info('任务已提交，生成中...')
        pollTask(r.data.id)
      }
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '请求失败')
      setLoading(false)
    }
  }

  const currentProvider = providers.find(p => p.provider === provider)

  return (
    <div style={{ display: 'flex', gap: 24, flexDirection: 'column' }}>
      {/* 生成表单 */}
      <Card title="🎬 生成视频" style={{ borderRadius: 12 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>📝 视频描述</Text>
            <TextArea
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="描述你想生成的视频，例如：一只橘猫在阳光明媚的草地上奔跑，慢动作，电影质感..."
              maxLength={2000}
              showCount
              style={{ marginTop: 8 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <Text strong>🤖 模型</Text>
              <Select
                value={provider}
                onChange={v => { setProvider(v); const p = providers.find(x => x.provider === v); if (p) setModel(p.default_model) }}
                style={{ width: '100%', marginTop: 8 }}
                options={providers.map(p => ({
                  value: p.provider,
                  label: `${p.display_name} ${p.api_key_masked ? '🟢' : '🔴'}`,
                }))}
              />
            </div>
            <div>
              <Text strong>📐 分辨率</Text>
              <Select
                value={resolution}
                onChange={setResolution}
                style={{ width: '100%', marginTop: 8 }}
                options={[
                  { value: '480p', label: '480p (快速)' },
                  { value: '720p', label: '720p (推荐)' },
                  { value: '1080p', label: '1080p (高清)' },
                ]}
              />
            </div>
            <div>
              <Text strong>⏱ 时长: {duration}s</Text>
              <Slider
                min={2} max={10} value={duration}
                onChange={setDuration}
                marks={{ 2: '2s', 5: '5s', 10: '10s' }}
                style={{ marginTop: 12 }}
              />
            </div>
          </div>

          <Button
            type="primary" size="large" block
            icon={<ThunderboltOutlined />}
            loading={loading}
            onClick={handleGenerate}
            style={{ height: 50, fontSize: 18, borderRadius: 8 }}
          >
            {loading ? '生成中...' : '🚀 生成视频'}
          </Button>
        </Space>
      </Card>

      {/* 生成进度 */}
      {loading && task && (
        <Card style={{ borderRadius: 12 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Spin />
            <Text>视频生成中，通常需要 1-5 分钟...</Text>
            <Progress percent={task.status === 'processing' ? 50 : 10} status="active" />
          </Space>
        </Card>
      )}

      {/* 视频预览 */}
      {videoUrl && (
        <Card
          title="🎥 视频预览"
          style={{ borderRadius: 12 }}
          extra={
            <Space>
              <Button icon={<DownloadOutlined />} href={videoUrl} target="_blank">下载</Button>
              <Button icon={<RedoOutlined />} onClick={handleGenerate}>重新生成</Button>
            </Space>
          }
        >
          <video
            src={videoUrl}
            controls
            autoPlay
            style={{ width: '100%', maxHeight: 500, borderRadius: 8, background: '#000' }}
          />
          {task && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Tag color="blue">{task.duration?.toFixed(1)}s</Tag>
              <Tag color="green">完成</Tag>
            </div>
          )}
        </Card>
      )}

      {/* 失败提示 */}
      {task?.status === 'failed' && (
        <Card style={{ borderRadius: 12, borderColor: '#ff4d4f' }}>
          <Text type="danger">❌ 生成失败: {task.error_message}</Text>
        </Card>
      )}
    </div>
  )
}
