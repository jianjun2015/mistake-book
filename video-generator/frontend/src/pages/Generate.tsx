import { useState, useEffect, useRef } from 'react'
import {
  Card, Input, Select, Button, Slider, Space, Typography, message, Tag,
  Modal, Form, Alert, Tooltip,
} from 'antd'
import {
  ThunderboltOutlined, DownloadOutlined, RedoOutlined,
  KeyOutlined, PlusOutlined, CheckCircleFilled,
} from '@ant-design/icons'
import api from '../services/api'

const { TextArea } = Input
const { Text, Title } = Typography

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

  // API Key 配置弹窗
  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [keySaving, setKeySaving] = useState(false)
  const [pendingProvider, setPendingProvider] = useState('')

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

  // 切换模型时检查 API Key
  const handleProviderChange = (value: string) => {
    const p = providers.find(x => x.provider === value)
    setProvider(value)
    if (p) {
      setModel(p.default_model)
      setUseCustomModel(false)
      // 未配置 API Key → 弹窗
      if (!p.api_key_masked) {
        setPendingProvider(value)
        setKeyModalOpen(true)
      }
    }
  }

  // 保存 API Key
  const handleSaveKey = async () => {
    if (!keyInput.trim()) return message.warning('请输入 API Key')
    setKeySaving(true)
    try {
      await api.post('/config', {
        provider: pendingProvider,
        api_key: keyInput.trim(),
      })
      message.success('API Key 配置成功！')
      setKeyModalOpen(false)
      setKeyInput('')
      loadProviders()
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '保存失败')
    }
    setKeySaving(false)
  }

  // 生成视频
  const handleGenerate = async () => {
    if (!prompt.trim()) return message.warning('请输入视频描述')

    // 检查 API Key
    const current = providers.find(p => p.provider === provider)
    if (current && !current.api_key_masked) {
      setPendingProvider(provider)
      setKeyModalOpen(true)
      return message.warning('请先配置该模型的 API Key')
    }

    // 确定模型名
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

          {/* 模型选择 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <Text strong>🤖 模型</Text>
              <Select
                value={provider}
                onChange={handleProviderChange}
                style={{ width: '100%', marginTop: 8 }}
                options={providers.map(p => ({
                  value: p.provider,
                  label: (
                    <span>
                      {p.display_name}
                      {p.api_key_masked
                        ? <CheckCircleFilled style={{ color: '#52c41a', marginLeft: 8, fontSize: 12 }} />
                        : <KeyOutlined style={{ color: '#ff4d4f', marginLeft: 8, fontSize: 12 }} />
                      }
                    </span>
                  ),
                }))}
              />
              {/* API Key 状态提示 */}
              {currentProvider && !currentProvider.api_key_masked && (
                <Alert
                  type="warning"
                  showIcon
                  message="尚未配置 API Key"
                  description={
                    <Button size="small" type="link" icon={<KeyOutlined />} onClick={() => { setPendingProvider(provider); setKeyModalOpen(true) }}>
                      点击配置
                    </Button>
                  }
                  style={{ marginTop: 8 }}
                />
              )}
              {currentProvider?.api_key_masked && (
                <Text type="success" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  ✓ API Key: {currentProvider.api_key_masked}
                </Text>
              )}
            </div>

            <div>
              <Text strong>
                <Space>
                  📐 分辨率
                </Space>
              </Text>
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

          {/* 模型名配置 */}
          <Card size="small" style={{ background: '#fafafa', borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Text strong>⚙️ 模型版本</Text>
                <Select
                  value={useCustomModel ? 'custom' : 'default'}
                  onChange={v => setUseCustomModel(v === 'custom')}
                  style={{ width: 200 }}
                  options={[
                    { value: 'default', label: `默认 (${model || currentProvider?.default_model})` },
                    { value: 'custom', label: '+ 自定义模型' },
                  ]}
                />
              </Space>

              {useCustomModel && (
                <div>
                  <Input
                    placeholder="输入自定义模型名，如 kling-v1-6 / gen3a_turbo / seedance-1-0-pro ..."
                    value={customModel}
                    onChange={e => setCustomModel(e.target.value)}
                    prefix={<PlusOutlined style={{ color: '#1677ff' }} />}
                    style={{ width: '100%' }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    💡 不同厂商模型名不同，留空则使用默认模型
                  </Text>
                </div>
              )}
            </Space>
          </Card>

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
            <Text type="secondary">任务 ID: {task.id}</Text>
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

      {/* API Key 配置弹窗 */}
      <Modal
        title={
          <Space>
            <KeyOutlined />
            配置 {providers.find(p => p.provider === pendingProvider)?.display_name || pendingProvider} API Key
          </Space>
        }
        open={keyModalOpen}
        onCancel={() => { setKeyModalOpen(false); setKeyInput('') }}
        onOk={handleSaveKey}
        okText="保存"
        confirmLoading={keySaving}
        width={500}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 16 }}>
          <Alert
            type="info"
            showIcon
            message="配置 API Key 后即可开始生成视频"
            description="API Key 仅存储在本地数据库，用于调用厂商 API"
          />
          <div>
            <Text strong>API Key</Text>
            <Input.Password
              placeholder="粘贴你的 API Key..."
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onPressEnter={handleSaveKey}
              autoFocus
              style={{ marginTop: 8 }}
            />
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            获取方式：
            {pendingProvider === 'runway' && 'runwayml.com → Settings → API Keys'}
            {pendingProvider === 'kling' && 'klingai.com → 开发者 → API Key'}
            {pendingProvider === 'seedance' && '火山引擎 → 方舟平台 → API Key'}
          </Text>
        </Space>
      </Modal>
    </div>
  )
}
