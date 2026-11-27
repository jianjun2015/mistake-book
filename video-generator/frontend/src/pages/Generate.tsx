import { useState, useEffect, useRef } from 'react'
import {
  Card, Input, Select, Button, Slider, Space, Typography, message, Tag, Switch,
  Divider, Row, Col,
} from 'antd'
import {
  ThunderboltOutlined, DownloadOutlined, RedoOutlined,
  KeyOutlined, PlusOutlined, CheckCircleFilled, CloseCircleFilled,
  BulbOutlined, BgColorsOutlined, VideoCameraOutlined, RocketOutlined,
  SmileOutlined, EnvironmentOutlined, CameraOutlined, FireOutlined,
} from '@ant-design/icons'
import api from '../services/api'
import StoryboardGenerator from '../components/StoryboardGenerator'

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

// ====== 提示词素材库 ======
const CHARACTER_TAGS = [
  '一只橘猫', '一位年轻女孩', '一位白发老人', '一个小男孩',
  '一只金毛犬', '一个机器人', '一位宇航员', '一只熊猫',
  '一位舞者', '一只蝴蝶', '一条龙', '一位画家',
]

const SCENE_TAGS = [
  '阳光明媚的草地', '繁华都市街道', '宁静的海滩', '神秘森林',
  '雪山之巅', '太空星空', '古代宫殿', '未来城市',
  '樱花树下', '雨夜霓虹', '沙漠绿洲', '海底世界',
]

const STYLE_TAGS = [
  '电影质感', '动漫风格', '水彩画风', '写实摄影',
  '赛博朋克', '复古胶片', '梦幻唯美', '黑白艺术',
  '3D动画', '油画风格', '极简主义', '蒸汽朋克',
]

const CAMERA_TAGS = [
  '慢动作', '航拍视角', '特写镜头', '广角全景',
  '跟随拍摄', '环绕镜头', '推拉镜头', '低角度仰拍',
  '延时摄影', '稳定器运镜', '手持拍摄', '俯拍视角',
]

const MOOD_TAGS = [
  '温馨治愈', '震撼壮观', '神秘悬疑', '欢乐活泼',
  '悲伤深沉', '紧张刺激', '浪漫唯美', '平静安宁',
  '史诗壮丽', '幽默搞笑', '惊悚恐怖', '怀旧感伤',
]

const QUALITY_TAGS = [
  '超高清4K', '色彩鲜艳', '光影细腻', '景深效果',
  '细节丰富', '构图精美', '色调柔和', '高对比度',
]

// 快速模板
const PROMPT_TEMPLATES = [
  { label: '🎬 电影场景', template: '电影质感的{角色}在{场景}，{镜头}，{氛围}的氛围，{画质}' },
  { label: '🌍 风景大片', template: '{场景}，{镜头}，{风格}，{画质}，{氛围}' },
  { label: '👤 人物特写', template: '{角色}，{镜头}，{风格}，{氛围}，{画质}' },
  { label: '🐾 动物萌宠', template: '{角色}在{场景}，{镜头}，{氛围}，{画质}' },
  { label: '🏙️ 城市街景', template: '{场景}，{镜头}，{风格}，{氛围}，{画质}' },
]

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

  // API Key
  const [keyInput, setKeyInput] = useState('')
  const [keySaving, setKeySaving] = useState(false)
  const [mockMode, setMockMode] = useState(true)

  // 提示词构建器
  const [showBuilder, setShowBuilder] = useState(true)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

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

  // Sync selected tags to prompt
  useEffect(() => {
    if (selectedTags.length > 0) {
      setPrompt(selectedTags.join('，'))
    }
  }, [selectedTags])

  const currentProvider = providers.find(p => p.provider === provider)

  // 标签切换：添加/移除到提示词
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag))
      setPrompt(prev => {
        const parts = prev.split('，').map(s => s.trim()).filter(s => s && s !== tag)
        return parts.join('，')
      })
    } else {
      setSelectedTags(prev => [...prev, tag])
      setPrompt(prev => {
        const sep = prev.trim() ? '，' : ''
        return prev + sep + tag
      })
    }
  }

  // 一键模板
  const applyTemplate = (template: string) => {
    setPrompt(template)
    message.success('模板已应用！请替换 { } 中的内容，或点击下方标签填充')
  }

  // 智能润色
  const polishPrompt = () => {
    if (!prompt.trim()) return message.warning('请先输入提示词')
    let parts = prompt.split(/[，,;；]/).map(s => s.trim()).filter(Boolean)
    parts = [...new Set(parts)]  // 去重

    // 自动补全品质词
    const hasQuality = QUALITY_TAGS.some(t => prompt.includes(t))
    if (!hasQuality) parts.push('超高清画质')
    const hasStyle = STYLE_TAGS.some(t => prompt.includes(t))
    if (!hasStyle) parts.push('电影质感')

    setPrompt(parts.join('，'))
    message.success('✨ 提示词已润色优化！')
  }

  // 保存 API Key
  const handleSaveKey = async () => {
    const key = keyInput.trim()
    if (!key) return message.warning('请输入 API Key')
    if (!provider) return message.error('请先选择模型')
    setKeySaving(true)
    try {
      const resp = await api.post('/config', { provider, api_key: key })
      if (resp.data?.saved) {
        message.success('API Key 配置成功！')
        setKeyInput('')
        loadProviders()
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      message.error(`保存失败: ${typeof detail === 'string' ? detail : e?.message || '网络错误'}`)
    }
    setKeySaving(false)
  }

  // Poll task
  const pollTask = (taskId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get(`/tasks/${taskId}`)
        setTask(r.data)
        if (r.data.status === 'completed') {
          setVideoUrl(r.data.video_url)
          setLoading(false)
          clearInterval(pollRef.current)
          message.success('🎉 视频生成完成！')
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

  // 生成
  const handleGenerate = async () => {
    if (!prompt.trim()) return message.warning('请输入视频描述')
    if (!mockMode && currentProvider && !currentProvider.api_key_masked) {
      return message.warning('请先在下方填写 API Key')
    }
    const finalModel = useCustomModel && customModel.trim() ? customModel.trim() : model
    setLoading(true)
    setVideoUrl('')
    setTask(null)
    try {
      const r = await api.post('/generate', {
        prompt,
        provider: mockMode ? 'mock' : provider,
        model: finalModel,
        params: { resolution, duration },
      })
      setTask(r.data)
      if (r.data.status === 'failed') {
        message.error(r.data.error_message)
        setLoading(false)
      } else if (r.data.status === 'completed') {
        // Mock mode: instant completion
        setVideoUrl(r.data.video_url)
        setLoading(false)
        message.success('🎉 视频生成完成！')
      } else {
        message.info('任务已提交，生成中...')
        pollTask(r.data.id)
      }
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '请求失败')
      setLoading(false)
    }
  }

  // 标签组组件
  const TagGroup = ({ title, icon, tags }: { title: string; icon: React.ReactNode; tags: string[] }) => (
    <div style={{ marginBottom: 6 }}>
      <Space style={{ marginBottom: 4 }}>
        {icon}
        <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
      </Space>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {tags.map(tag => (
          <Tag.CheckableTag
            key={tag}
            checked={selectedTags.includes(tag)}
            onChange={() => toggleTag(tag)}
            style={{
              borderRadius: 12, padding: '1px 10px', fontSize: 12,
              border: selectedTags.includes(tag) ? 'none' : '1px solid #d9d9d9',
            }}
          >
            {tag}
          </Tag.CheckableTag>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 24, flexDirection: 'column' }}>
      <Card
        title={<Space><VideoCameraOutlined /> 生成视频</Space>}
        style={{ borderRadius: 12 }}
        extra={
          <Button type="link" size="small" icon={<BulbOutlined />} onClick={() => setShowBuilder(!showBuilder)}>
            {showBuilder ? '收起提示助手' : '展开提示助手'}
          </Button>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* ====== 提示词构建器 ====== */}
          {showBuilder && (
            <Card size="small" style={{ borderRadius: 8, background: '#f8f9ff', border: '1px solid #e6f4ff' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {/* 快速模板 */}
                <Space style={{ marginBottom: 4 }}>
                  <RocketOutlined style={{ color: '#722ed1' }} />
                  <Text strong style={{ fontSize: 13 }}>快速模板</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>点击应用后替换或用标签填充</Text>
                </Space>
                <Space wrap>
                  {PROMPT_TEMPLATES.map(t => (
                    <Tag key={t.label} color="purple" style={{ cursor: 'pointer', borderRadius: 12, padding: '3px 12px' }}
                      onClick={() => applyTemplate(t.template)}>
                      {t.label}
                    </Tag>
                  ))}
                </Space>

                <Divider style={{ margin: '6px 0' }} />

                {/* 标签选择器 */}
                <TagGroup title="👤 角色" icon={<SmileOutlined style={{ color: '#1677ff' }} />} tags={CHARACTER_TAGS} />
                <TagGroup title="🏞️ 场景" icon={<EnvironmentOutlined style={{ color: '#52c41a' }} />} tags={SCENE_TAGS} />
                <TagGroup title="🎨 风格" icon={<BgColorsOutlined style={{ color: '#eb2f96' }} />} tags={STYLE_TAGS} />
                <TagGroup title="📷 镜头" icon={<CameraOutlined style={{ color: '#fa8c16' }} />} tags={CAMERA_TAGS} />
                <TagGroup title="💫 氛围" icon={<FireOutlined style={{ color: '#f5222d' }} />} tags={MOOD_TAGS} />
                <TagGroup title="✨ 画质" icon={<ThunderboltOutlined style={{ color: '#722ed1' }} />} tags={QUALITY_TAGS} />

                {/* 操作栏 */}
                {selectedTags.length > 0 && (
                  <>
                    <Divider style={{ margin: '6px 0' }} />
                    <Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>已选 {selectedTags.length} 个标签</Text>
                      <Button size="small" icon={<RocketOutlined />} onClick={polishPrompt} type="primary" ghost>
                        ✨ 润色提示词
                      </Button>
                      <Button size="small" onClick={() => { setSelectedTags([]); setPrompt('') }}>
                        清空全部
                      </Button>
                    </Space>
                  </>
                )}
              </Space>
            </Card>
          )}

          {/* ====== 分镜脚本生成 ====== */}
          <StoryboardGenerator onApplyToPrompt={(p) => setPrompt(p)} />

          {/* ====== 提示词输入 ====== */}
          <div>
            <Space style={{ marginBottom: 8 }}>
              <Text strong>📝 视频描述</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>点击上方标签快速构建，或直接输入</Text>
            </Space>
            <TextArea
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="描述你想生成的视频，例如：一只橘猫在阳光明媚的草地上奔跑，慢动作，电影质感..."
              maxLength={2000}
              showCount
            />
          </div>

          {/* ====== 模型选择 ====== */}
          <div>
            <Text strong>🤖 生成模型</Text>
            <Select
              value={provider}
              onChange={v => {
                setProvider(v)
                setKeyInput('')
                const p = providers.find(x => x.provider === v)
                if (p) { setModel(p.default_model); setUseCustomModel(false) }
              }}
              style={{ width: '100%', marginTop: 8 }}
              options={providers.map(p => ({
                value: p.provider,
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{p.display_name}</span>
                    {p.api_key_masked
                      ? <CheckCircleFilled style={{ color: '#52c41a' }} />
                      : <CloseCircleFilled style={{ color: '#ff4d4f' }} />}
                  </span>
                ),
              }))}
            />
          </div>

          {/* ====== API Key ====== */}
          <div style={{
            borderRadius: 8, padding: '16px 20px',
            background: currentProvider?.api_key_masked ? '#f6ffed' : '#fffbe6',
            border: `1px solid ${currentProvider?.api_key_masked ? '#b7eb8f' : '#ffe58f'}`,
          }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Space>
                <KeyOutlined style={{ color: currentProvider?.api_key_masked ? '#52c41a' : '#faad14', fontSize: 16 }} />
                <Text strong style={{ fontSize: 15 }}>{currentProvider?.display_name || provider} API Key</Text>
                {currentProvider?.api_key_masked ? (
                  <Tag color="green" icon={<CheckCircleFilled />}>已配置 {currentProvider.api_key_masked}</Tag>
                ) : (
                  <Tag color="red" icon={<CloseCircleFilled />}>未配置</Tag>
                )}
              </Space>
              <Space.Compact style={{ width: '100%' }}>
                <Input.Password
                  placeholder={currentProvider?.api_key_masked ? '输入新的 API Key 以更新...' : `粘贴 ${currentProvider?.display_name || provider} 的 API Key...`}
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  onPressEnter={handleSaveKey}
                />
                <Button type="primary" loading={keySaving} onClick={handleSaveKey} icon={<KeyOutlined />}>
                  {currentProvider?.api_key_masked ? '更新' : '保存'}
                </Button>
              </Space.Compact>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 获取方式：
                {provider === 'runway' && ' runwayml.com → Developer Portal'}
                {provider === 'kling' && ' klingai.com → 开发者控制台'}
                {provider === 'seedance' && ' 火山引擎 → 方舟平台 → API Key'}
                {!['runway', 'kling', 'seedance'].includes(provider) && ' 查看厂商官网'}
              </Text>
            </Space>
          </div>

          {/* ====== 参数配置 ====== */}
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>📐 分辨率</Text>
              <Select value={resolution} onChange={setResolution} style={{ width: '100%', marginTop: 8 }}
                options={[
                  { value: '480p', label: '480p (快速)' },
                  { value: '720p', label: '720p (推荐)' },
                  { value: '1080p', label: '1080p (高清)' },
                ]} />
            </Col>
            <Col span={8}>
              <Text strong>⏱ 时长: {duration}s</Text>
              <Slider min={2} max={10} value={duration} onChange={setDuration}
                marks={{ 2: '2s', 5: '5s', 10: '10s' }} style={{ marginTop: 12 }} />
            </Col>
            <Col span={8}>
              <Text strong>⚙️ 模型版本</Text>
              <Select value={useCustomModel ? 'custom' : 'default'}
                onChange={v => setUseCustomModel(v === 'custom')}
                style={{ width: '100%', marginTop: 8 }}
                options={[
                  { value: 'default', label: `默认 (${model || currentProvider?.default_model || 'auto'})` },
                  { value: 'custom', label: '+ 自定义模型' },
                ]} />
            </Col>
          </Row>

          {useCustomModel && (
            <Input placeholder="输入自定义模型名..." value={customModel}
              onChange={e => setCustomModel(e.target.value)}
              prefix={<PlusOutlined style={{ color: '#1677ff' }} />} />
          )}

          {/* Mock 模式开关 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 8,
            background: mockMode ? '#fff7e6' : '#f6ffed',
            border: `1px solid ${mockMode ? '#ffd591' : '#b7eb8f'}`,
          }}>
            <Space>
              <Text strong>🧪 测试模式 (Mock)</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {mockMode ? '无需真实 API Key，使用模拟视频测试所有功能' : '使用真实 API 调用生成视频'}
              </Text>
            </Space>
            <Switch checked={mockMode} onChange={setMockMode}
              checkedChildren="ON" unCheckedChildren="OFF" />
          </div>

          <Button type="primary" size="large" block icon={<ThunderboltOutlined />}
            loading={loading} onClick={handleGenerate}
            style={{ height: 52, fontSize: 18, borderRadius: 10, background: mockMode ? '#fa8c16' : undefined }}>
            {loading ? '⏳ 生成中...' : mockMode ? '🧪 测试生成 (Mock)' : '🚀 生成视频'}
          </Button>
        </Space>
      </Card>

      {/* 生成进度 */}
      {loading && task && (
        <Card style={{ borderRadius: 12, background: '#f6ffed' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>🔄 视频生成中，通常需要 1-5 分钟...</Text>
            <Text type="secondary">任务 ID: {task.id} | 模型: {task.model}</Text>
          </Space>
        </Card>
      )}

      {/* 视频预览 */}
      {videoUrl && (
        <Card title="🎥 视频预览" style={{ borderRadius: 12 }}
          extra={
            <Space>
              <Button icon={<DownloadOutlined />} href={videoUrl} target="_blank">下载</Button>
              <Button icon={<RedoOutlined />} onClick={handleGenerate}>重新生成</Button>
            </Space>
          }>
          <video src={videoUrl} controls autoPlay
            style={{ width: '100%', maxHeight: 500, borderRadius: 8, background: '#000' }} />
          {task && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Tag color="blue">{task.duration?.toFixed(1)}s</Tag>
              <Tag color="green">✅ 完成</Tag>
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
