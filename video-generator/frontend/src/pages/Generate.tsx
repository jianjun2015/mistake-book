import { useState, useEffect, useRef } from 'react'
import {
  Card, Input, Select, Button, Slider, Space, Typography, message, Tag,
} from 'antd'
import {
  ThunderboltOutlined, DownloadOutlined, RedoOutlined,
  KeyOutlined, PlusOutlined, CheckCircleFilled, CloseCircleFilled,
} from '@ant-design/icons'
import api from '../services/api'

const { TextArea } = Input
const { Text } = Typography

interface Provider {
  provider: string
  display_name: string
  default_model: string
  api_key_masked: string
  is_active: boolean
}

interface Task {
  id: string
  status: string
  model: string
  video_url: string
  error_message: string
  duration: number
}

export default function Generate() {
  const [prompt, setPrompt] = useState('')
  const [provider, setProvider] = useState('kling')
  const [model, setModel] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [useCustomModel, setUseCustomModel] = useState(false)
  const [resolution, setResolution] = useState('720p')
  const [duration, setDuration] = useState(5)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [task, setTask] = useState<Task | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  // API Key 内联输入
  const [keyInput, setKeyInput] = useState('')
  const [keySaving, setKeySaving] = useState(false)

  const loadProviders = () => {
    api.get('/config').then(r => {
      setProviders(r.data)
      const active = r.data.find((p: Provider) => p.api_key_masked)
      if (active) {
        setProvider(active.provider)
        setModel(active.default_model)
      }
    }).catch(() => {})
  }

  useEffect(() => { loadProviders() }, [])

  const currentProvider = providers.find(p => p.provider === provider)

  // 保存 API Key（内联）
  const handleSaveKey = async () => {
    const key = keyInput.trim()
    if (!key) return message.warning('请输入 API Key')
    if (!provider) return message.error('请先选择模型')
    
    setKeySaving(true)
    try {
      const resp = await api.post('/config', {
        provider: provider,
        api_key: key,
      })
      if (resp.data?.saved) {
        message.success('API Key 配置成功！')
        setKeyInput('')
        loadProviders()
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      const errMsg = typeof detail === 'string' ? detail : e?.message || '网络错误'
      message.error(`保存失败: ${errMsg}`)
    }
    setKeySaving(false)
  }

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

  // 生成视频
  const handleGenerate = async () => {
    if (!prompt.trim()) return message.warning('请输入视频描述')

    // 检查 API Key
    if (currentProvider && !currentProvider.api_key_masked) {
      return message.warning('请先在下方填写 API Key')
    }

    const finalModel = useCustomModel && customModel.trim() ? customModel.trim() : model

    setLoading(true)
    setVideoUrl('')
    setTask(null)
    try {
      const r = await api.post('/generate', {
        prompt, provider, model: finalModel,
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

  return (
    <div style={{ display: 'flex', gap: 24, flexDirection: 'column' }}>
      {/* 生成表单 */}
      <Card title="🎬 生成视频" style={{ borderRadius: 12 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 视频描述 */}
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

          {/* 模型选择 */}
          <div>
            <Text strong>🤖 生成模型</Text>
            <Select
              value={provider}
              onChange={v => {
                setProvider(v)
                setKeyInput('')
                const p = providers.find(x => x.provider === v)
                if (p) {
                  setModel(p.default_model)
                  setUseCustomModel(false)
                }
              }}
              style={{ width: '100%', marginTop: 8 }}
              options={providers.map(p => ({
                value: p.provider,
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{p.display_name}</span>
                    {p.api_key_masked
                      ? <CheckCircleFilled style={{ color: '#52c41a' }} />
                      : <CloseCircleFilled style={{ color: '#ff4d4f' }} />
                    }
                  </span>
                ),
              }))}
            />
          </div>

          {/* API Key 配置区域 — 始终可见 */}
          <div
            style={{
              borderRadius: 8,
              padding: '16px 20px',
              background: currentProvider?.api_key_masked ? '#f6ffed' : '#fffbe6',
              border: `1px solid ${currentProvider?.api_key_masked ? '#b7eb8f' : '#ffe58f'}`,
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Space>
                <KeyOutlined style={{ color: currentProvider?.api_key_masked ? '#52c41a' : '#faad14', fontSize: 16 }} />
                <Text strong style={{ fontSize: 15 }}>
                  {currentProvider?.display_name || provider} API Key
                </Text>
                {currentProvider?.api_key_masked ? (
                  <Tag color="green" icon={<CheckCircleFilled />}>
                    已配置 {currentProvider.api_key_masked}
                  </Tag>
                ) : (
                  <Tag color="red" icon={<CloseCircleFilled />}>未配置</Tag>
                )}
              </Space>

              {/* 输入框 — 始终显示（已配置时显示修改入口） */}
              <Space.Compact style={{ width: '100%' }}>
                <Input.Password
                  placeholder={
                    currentProvider?.api_key_masked
                      ? '输入新的 API Key 以更新...'
                      : `粘贴 ${currentProvider?.display_name || provider} 的 API Key...`
                  }
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  onPressEnter={handleSaveKey}
                />
                <Button
                  type="primary"
                  loading={keySaving}
                  onClick={handleSaveKey}
                  icon={<KeyOutlined />}
                >
                  {currentProvider?.api_key_masked ? '更新' : '保存'}
                </Button>
              </Space.Compact>

              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 获取方式：
                {provider === 'runway' && ' runwayml.com → Settings → API Keys'}
                {provider === 'kling' && ' klingai.com → 开发者 → API Key'}
                {provider === 'seedance' && ' 火山引擎 → 方舟平台 → API Key'}
                {!['runway', 'kling', 'seedance'].includes(provider) && ' 查看厂商官网'}
                {' ｜ '}API Key 仅存储在本地数据库
              </Text>
            </Space>
          </div>

          {/* 参数配置 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
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
            <div>
              <Text strong>⚙️ 模型版本</Text>
              <Select
                value={useCustomModel ? 'custom' : 'default'}
                onChange={v => setUseCustomModel(v === 'custom')}
                style={{ width: '100%', marginTop: 8 }}
                options={[
                  { value: 'default', label: `默认 (${model || currentProvider?.default_model || 'auto'})` },
                  { value: 'custom', label: '+ 自定义模型' },
                ]}
              />
            </div>
          </div>

          {/* 自定义模型输入 */}
          {useCustomModel && (
            <div>
              <Input
                placeholder="输入自定义模型名..."
                value={customModel}
                onChange={e => setCustomModel(e.target.value)}
                prefix={<PlusOutlined style={{ color: '#1677ff' }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 留空则使用默认模型
              </Text>
            </div>
          )}

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
            <Text>🔄 视频生成中，通常需要 1-5 分钟...</Text>
            <Text type="secondary">任务 ID: {task.id} | 模型: {task.model}</Text>
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
