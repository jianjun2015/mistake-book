import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Card, Input, Select, Button, Slider, Space, Typography, message, Tag,
  Divider, Row, Col, Switch, Tooltip, Steps, Progress,
} from 'antd'
import {
  ThunderboltOutlined, DownloadOutlined, RedoOutlined,
  KeyOutlined, CheckCircleFilled, CloseCircleFilled,
  BulbOutlined, BgColorsOutlined, VideoCameraOutlined, RocketOutlined,
  SmileOutlined, EnvironmentOutlined, CameraOutlined, FireOutlined,
  CopyOutlined, StarOutlined, HistoryOutlined,
  CompressOutlined, ExpandOutlined,
} from '@ant-design/icons'
import api, { videoSrc } from '../services/api'
import StoryboardGenerator, { type Shot } from '../components/StoryboardGenerator'

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

// ====== 标签库 ======
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
const PROMPT_TEMPLATES = [
  { label: '🎬 电影场景', template: '电影质感的{角色}在{场景}，{镜头}，{氛围}的氛围，{画质}' },
  { label: '🌍 风景大片', template: '{场景}，{镜头}，{风格}，{画质}，{氛围}' },
  { label: '👤 人物特写', template: '{角色}，{镜头}，{风格}，{氛围}，{画质}' },
  { label: '🐾 动物萌宠', template: '{角色}在{场景}，{镜头}，{氛围}，{画质}' },
  { label: '🏙️ 城市街景', template: '{场景}，{镜头}，{风格}，{氛围}，{画质}' },
]

// 质量评分
const scorePrompt = (text: string): { score: number; tips: string[] } => {
  let score = 0
  const tips: string[] = []
  const len = text.length
  if (len > 20) score += 20; else tips.push('描述太短，建议 20 字以上')
  if (len > 50) score += 15
  if (len > 100) score += 10
  if (STYLE_TAGS.some(t => text.includes(t))) score += 15; else tips.push('建议添加风格词（如"电影质感"）')
  if (CAMERA_TAGS.some(t => text.includes(t))) score += 15; else tips.push('建议添加镜头词（如"慢动作"）')
  if (QUALITY_TAGS.some(t => text.includes(t))) score += 10; else tips.push('建议添加画质词（如"超高清"）')
  if (MOOD_TAGS.some(t => text.includes(t))) score += 10
  return { score: Math.min(score, 100), tips }
}

export default function Generate() {
  const [prompt, setPrompt] = useState('')
  const [provider, setProvider] = useState('mock')
  const [model, setModel] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [useCustomModel, setUseCustomModel] = useState(false)
  const [modelCatalog, setModelCatalog] = useState<any[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogWarn, setCatalogWarn] = useState('')
  const [llmModels, setLlmModels] = useState<any[]>([])
  const [llmModel, setLlmModel] = useState('')
  const [resolution, setResolution] = useState('720p')
  const [duration, setDuration] = useState(5)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [task, setTask] = useState<Task | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  // API Key 折叠
  const [keyInput, setKeyInput] = useState('')
  const [keySaving, setKeySaving] = useState(false)
  const [keyExpanded, setKeyExpanded] = useState(false)

  // 构建器
  const [builderTab, setBuilderTab] = useState<'tags' | 'storyboard'>('tags')
  const [showBuilder, setShowBuilder] = useState(true)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // 历史
  const [promptHistory, setPromptHistory] = useState<string[]>([])

  // Mock
  const [mockMode, setMockMode] = useState(false)
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [genProgress, setGenProgress] = useState(0)
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])
  const [scriptInput, setScriptInput] = useState('')
  const [generatingStoryboard, setGeneratingStoryboard] = useState(false)
  const [storyboardShots, setStoryboardShots] = useState<Shot[]>([
    { id: 1, camera: '全景', description: '', duration: 3, transition: '淡入' },
    { id: 2, camera: '中景', description: '', duration: 4, transition: '切换' },
    { id: 3, camera: '特写', description: '', duration: 3, transition: '淡出' },
  ])
  const previewRef = useRef<HTMLDivElement>(null)

  // 悬浮按钮
  const [showFloatingBtn, setShowFloatingBtn] = useState(false)

  const loadProviders = () => {
    api.get('/config').then(r => {
      setProviders(r.data)
      // 优先选有 API Key 的真实厂商
      const realActive = r.data.find((p: Provider) => p.provider !== 'mock' && p.api_key_masked)
      const fallback = realActive || r.data.find((p: Provider) => p.provider === 'mock')
      if (fallback) {
        setProvider(fallback.provider)
        setModel(fallback.default_model)
        // 拉取该厂商真实模型目录与开通状态
        loadModelCatalog(fallback.provider)
      }
    }).catch(() => {})
  }

  useEffect(() => {
    loadProviders()
    // 语言模型清单（分镜/润色用）
    api.get('/ai/models').then(r => {
      const list = r.data?.models || []
      setLlmModels(list)
      const def = list.find((m: any) => m.default) || list[0]
      if (def) setLlmModel(def.id)
    }).catch(() => {})
    try {
      setPromptHistory(JSON.parse(localStorage.getItem('prompt_history') || '[]'))
      const draft = localStorage.getItem('prompt_draft')
      if (draft && !prompt) setPrompt(draft)
      const negDraft = localStorage.getItem('negative_draft')
      if (negDraft && !negativePrompt) setNegativePrompt(negDraft)
    } catch {}
  }, [])

  // 草稿自动保存
  useEffect(() => {
    const t = setTimeout(() => {
      if (prompt) localStorage.setItem('prompt_draft', prompt)
      if (negativePrompt) localStorage.setItem('negative_draft', negativePrompt)
    }, 1000)
    return () => clearTimeout(t)
  }, [prompt, negativePrompt])

  useEffect(() => {
    if (selectedTags.length > 0) setPrompt(selectedTags.join('，'))
  }, [selectedTags])

  // 滚动检测
  useEffect(() => {
    const onScroll = () => setShowFloatingBtn(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const currentProvider = providers.find(p => p.provider === provider)

  // 拉取该厂商账户下真实可选的模型目录及开通状态
  const loadModelCatalog = async (prov: string) => {
    if (prov === 'mock') { setModelCatalog([{ id: 'mock-v1', label: 'Mock 测试模型', status: { state: 'available' } }]); setCatalogWarn(''); return }
    setCatalogLoading(true)
    setCatalogWarn('')
    try {
      const r = await api.get(`/config/${prov}/models`, { params: { probe: true } })
      const list = r.data?.models || []
      setModelCatalog(list)
      const usable = list.filter((m: any) => m.status?.state === 'available')
      if (usable.length > 0) {
        setModel(usable[0].id); setUseCustomModel(false)
      } else {
        // 没有已开通模型：保留默认但给出醒目提示，避免用户对着报错摸不着头脑
        setModel(r.data?.default_model || (list[0]?.id ?? ''))
        const blocked = list.find((m: any) => ['not_activated', 'not_found'].includes(m.status?.state))
        setCatalogWarn(blocked
          ? `账户尚未开通任何可用视频模型（${blocked.status.message || blocked.status.state}），请到方舟控制台开通后重试`
          : '未探测到可用模型，请检查 API Key 或模型开通状态')
      }
    } catch (e: any) {
      setModelCatalog([])
      setCatalogWarn('模型目录加载失败：' + (e?.response?.data?.detail || e.message || '未知错误'))
    } finally {
      setCatalogLoading(false)
    }
  }
  const promptQuality = scorePrompt(prompt)

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag))
    } else {
      setSelectedTags(prev => [...prev, tag])
    }
  }

  const applyTemplate = (template: string) => {
    setPrompt(template)
    message.success('模板已应用！请替换 { } 中的内容')
  }

  const [polishing, setPolishing] = useState(false)

  const polishPrompt = async () => {
    if (!prompt.trim()) return message.warning('请先输入提示词')
    setPolishing(true)
    try {
      const r = await api.post('/ai/polish', { prompt, llm_model: llmModel })
      if (r.data?.polished) {
        setPrompt(r.data.polished)
        message.success('✨ AI 润色完成！提示词已增强')
      }
    } catch (e: any) {
      // 降级：本地增强
      let parts = prompt.split(/[，,;；]/).map(s => s.trim()).filter(Boolean)
      parts = [...new Set(parts)]
      if (!QUALITY_TAGS.some(t => prompt.includes(t))) parts.push('超高清画质')
      if (!STYLE_TAGS.some(t => prompt.includes(t))) parts.push('电影质感')
      if (!CAMERA_TAGS.some(t => prompt.includes(t))) parts.push('慢动作')
      setPrompt(parts.join('，'))
      message.warning('AI 服务不可用，已本地增强')
    }
    setPolishing(false)
  }

  const copyPrompt = () => {
    if (!prompt.trim()) return message.warning('提示词为空')
    navigator.clipboard.writeText(prompt)
    message.success('提示词已复制！')
  }

  // 剧本→分镜脚本（关联标签体系）
  const generateStoryboardFromScript = async () => {
    if (!scriptInput.trim()) return message.warning('请先输入剧本/故事')
    setGeneratingStoryboard(true)
    try {
      // 将当前已选标签传给 AI，让分镜描述中融入标签元素
      const tagContext = selectedTags.length > 0
        ? `\n\n已选标签（请融入分镜描述中）：${selectedTags.join('，')}`
        : ''

      const r = await api.post('/ai/storyboard', {
        script: scriptInput + tagContext,
        scene_count: 5,
        tags: selectedTags,
        llm_model: llmModel,
      })

      if (r.data?.shots?.length > 0) {
        // 1) 填充分镜表格（真正落库到分镜脚本 tab）
        const rows: Shot[] = r.data.shots
          .map((s: any, i: number) => ({
            id: i + 1,
            camera: s.camera || '全景',
            description: (s.description || '').trim(),
            duration: Number(s.duration) || 3,
            transition: s.transition || '切换',
            mood: s.mood || '',
            dialogue: s.dialogue || '',
          }))
          .filter((x: Shot) => x.description)
        if (rows.length > 0) {
          setStoryboardShots(rows)
          setBuilderTab('storyboard')
          setShowBuilder(true)
        }

        // 2) 同时把分镜转成提示词
        const prompts = r.data.shots.map((s: any, i: number) =>
          `【镜头${s.shot_id || i+1}·${s.camera || '全景'}】${s.description}${s.mood ? '，' + s.mood : ''}`
        )
        setPrompt(prompts.join('\n'))

        // 自动关联标签：扫描分镜描述中的标签词并选中
        const allText = r.data.shots.map((s: any) => s.description + ' ' + (s.mood || '') + ' ' + (s.camera || '')).join(' ')
        const allTags = [...CHARACTER_TAGS, ...SCENE_TAGS, ...STYLE_TAGS, ...CAMERA_TAGS, ...MOOD_TAGS, ...QUALITY_TAGS]
        const matchedTags = allTags.filter(tag => allText.includes(tag))
        if (matchedTags.length > 0) {
          setSelectedTags(prev => [...new Set([...prev, ...matchedTags])])
        }

        const src = r.data.source === 'ai' ? 'AI' : '本地规则'
        message.success(`🎬 已填充 ${r.data.total_shots} 个分镜（${src}）！关联 ${matchedTags.length} 个标签`)
        if (r.data.notice) message.warning(r.data.notice)
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      message.error(detail ? `分镜生成失败：${detail}` : 'AI 服务不可用，请稍后重试')
    }
    setGeneratingStoryboard(false)
  }

  const savePromptToHistory = () => {
    if (!prompt.trim()) return message.warning('提示词为空')
    const updated = [prompt, ...promptHistory.filter(p => p !== prompt)].slice(0, 20)
    setPromptHistory(updated)
    localStorage.setItem('prompt_history', JSON.stringify(updated))
    message.success('已保存到历史！')
  }

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
        setKeyExpanded(false)
        loadProviders()
      }
    } catch (e: any) {
      message.error(`保存失败: ${e?.response?.data?.detail || e?.message || '网络错误'}`)
    }
    setKeySaving(false)
  }

  const pollTask = (taskId: string) => {
    setGenProgress(10)
    const progressInterval = setInterval(() => {
      setGenProgress(prev => Math.min(prev + Math.random() * 15, 90))
    }, 2000)
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get(`/tasks/${taskId}`)
        setTask(r.data)
        if (r.data.status === 'completed') {
          setVideoUrl(videoSrc(r.data.video_url))
          setLoading(false)
          setGenProgress(100)
          clearInterval(pollRef.current)
          clearInterval(progressInterval)
          message.success('🎉 视频生成完成！')
          setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
        } else if (r.data.status === 'failed') {
          setLoading(false)
          setGenProgress(0)
          clearInterval(pollRef.current)
          clearInterval(progressInterval)
          message.error(`生成失败: ${r.data.error_message}`)
        }
      } catch {
        setLoading(false)
        setGenProgress(0)
        clearInterval(pollRef.current)
        clearInterval(progressInterval)
      }
    }, 3000)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return message.warning('请输入视频描述')
    if (!mockMode && currentProvider && !currentProvider.api_key_masked) {
      setKeyExpanded(true)
      return message.warning('请先配置 API Key')
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
        params: { resolution, duration, aspect_ratio: aspectRatio, negative_prompt: negativePrompt || undefined },
      })
      setTask(r.data)
      if (r.data.status === 'failed') {
        message.error(r.data.error_message)
        setLoading(false)
      } else if (r.data.status === 'completed') {
        setVideoUrl(videoSrc(r.data.video_url))
        setLoading(false)
        setGenProgress(100)
        message.success('🎉 视频生成完成！')
        setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
      } else {
        message.info('任务已提交，生成中...')
        pollTask(r.data.id)
      }
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '请求失败')
      setLoading(false)
    }
  }

  // Ctrl+Enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleGenerate()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }, [])

  const TagGroup = ({ title, icon, tags }: { title: string; icon: React.ReactNode; tags: string[] }) => {
    const isCollapsed = collapsedGroups.includes(title)
    return (
      <div style={{ marginBottom: 6 }}>
        <div
          data-testid={`tag-group-${title}`}
          onMouseDown={(e) => { e.preventDefault(); toggleGroup(title) }}
          style={{ marginBottom: 4, cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {icon}
          <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
          <Text type="secondary" style={{ fontSize: 10 }}>{isCollapsed ? '▶' : '▼'} ({tags.length})</Text>
        </div>
        {!isCollapsed && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {tags.map(tag => (
              <Tag.CheckableTag key={tag} checked={selectedTags.includes(tag)} onChange={() => toggleTag(tag)}
                style={{ borderRadius: 12, padding: '1px 10px', fontSize: 12, border: selectedTags.includes(tag) ? 'none' : '1px solid #d9d9d9' }}>
                {tag}
              </Tag.CheckableTag>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
      {/* 步骤指示器 */}
      <Card size="small" style={{ borderRadius: 10 }}>
        <Steps size="small"
          current={prompt ? (loading ? 2 : videoUrl ? 3 : 1) : 0}
          items={[
            { title: '构建提示词', icon: <BulbOutlined /> },
            { title: '配置参数', icon: <VideoCameraOutlined /> },
            { title: '生成中', icon: <ThunderboltOutlined /> },
            { title: '完成', icon: <CheckCircleFilled /> },
          ]} />
      </Card>

      {/* ====== 左右分栏 ====== */}
      <Row gutter={16}>
        {/* 左: 提示词构建 (55%) */}
        <Col xs={24} lg={13}>
          <Card
            title={<Space><BulbOutlined style={{ color: '#722ed1' }} /><Text strong>提示词构建</Text></Space>}
            style={{ borderRadius: 12 }}
            extra={
              <Space>
                <Button size="small" type="text" icon={<CopyOutlined />} onClick={copyPrompt}>复制</Button>
                <Button size="small" type="text" icon={<StarOutlined />} onClick={savePromptToHistory}>收藏</Button>
                <Button size="small" type="text"
                  icon={showBuilder ? <CompressOutlined /> : <ExpandOutlined />}
                  onClick={() => setShowBuilder(!showBuilder)}>
                  {showBuilder ? '收起' : '展开'}
                </Button>
              </Space>
            }>
            {/* 剧本→分镜 */}
            <div style={{
              marginBottom: 12, padding: 12, borderRadius: 8,
              background: '#fff7e6', border: '1px solid #ffd591',
            }}>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Space>
                  <Text strong style={{ fontSize: 13 }}>📖 剧本/故事 → 分镜脚本</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>粘贴剧情，一键拆分并填充到视频描述</Text>
                </Space>
                <Input.TextArea
                  rows={3}
                  value={scriptInput}
                  onChange={e => setScriptInput(e.target.value)}
                  placeholder="粘贴你的剧本或故事...&#10;例如：一只小猫在森林里迷路了，它遇到了一只善良的鹿，鹿带它找到了回家的路..."
                  maxLength={5000}
                  showCount
                  style={{ fontSize: 12 }}
                />
                <Button
                  size="small"
                  type="primary"
                  icon={<RocketOutlined />}
                  loading={generatingStoryboard}
                  onClick={generateStoryboardFromScript}
                  style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
                >
                  🎬 一键生成分镜并填充
                </Button>
                {llmModels.length > 0 && (
                  <Select
                    size="small"
                    value={llmModel || undefined}
                    onChange={setLlmModel}
                    style={{ minWidth: 200 }}
                    showSearch
                    optionFilterProp="label"
                    placeholder="选择 AI 语言模型"
                    options={llmModels.map((m: any) => ({
                      value: m.id,
                      label: `${m.channel === 'ark' ? '方舟' : 'MiMo'} · ${m.id}${m.preview ? ' (preview)' : ''}`,
                    }))}
                  />
                )}
              </Space>
            </div>

            {/* 构建器 Tab */}
            {showBuilder && (
              <div style={{ marginBottom: 12 }}>
                <Space style={{ marginBottom: 8 }}>
                  <Button size="small" type={builderTab === 'tags' ? 'primary' : 'default'}
                    onClick={() => setBuilderTab('tags')} icon={<BgColorsOutlined />}>标签构建</Button>
                  <Button size="small" type={builderTab === 'storyboard' ? 'primary' : 'default'}
                    onClick={() => setBuilderTab('storyboard')} icon={<VideoCameraOutlined />}>分镜脚本</Button>
                </Space>

                {builderTab === 'tags' ? (
                  <div style={{ borderRadius: 8, padding: 12, background: '#f8f9ff', border: '1px solid #e6f4ff', maxHeight: 360, overflow: 'auto' }}>
                    <Space wrap style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>模板:</Text>
                      {PROMPT_TEMPLATES.map(t => (
                        <Tag key={t.label} color="purple" style={{ cursor: 'pointer', borderRadius: 12, fontSize: 11, padding: '1px 8px' }}
                          onClick={() => applyTemplate(t.template)}>{t.label}</Tag>
                      ))}
                    </Space>
                    <Divider style={{ margin: '6px 0' }} />
                    <TagGroup title="👤 角色" icon={<SmileOutlined style={{ color: '#1677ff', fontSize: 12 }} />} tags={CHARACTER_TAGS} />
                    <TagGroup title="🏞️ 场景" icon={<EnvironmentOutlined style={{ color: '#52c41a', fontSize: 12 }} />} tags={SCENE_TAGS} />
                    <TagGroup title="🎨 风格" icon={<BgColorsOutlined style={{ color: '#eb2f96', fontSize: 12 }} />} tags={STYLE_TAGS} />
                    <TagGroup title="📷 镜头" icon={<CameraOutlined style={{ color: '#fa8c16', fontSize: 12 }} />} tags={CAMERA_TAGS} />
                    <TagGroup title="💫 氛围" icon={<FireOutlined style={{ color: '#f5222d', fontSize: 12 }} />} tags={MOOD_TAGS} />
                    <TagGroup title="✨ 画质" icon={<ThunderboltOutlined style={{ color: '#722ed1', fontSize: 12 }} />} tags={QUALITY_TAGS} />
                    {selectedTags.length > 0 && (
                      <>
                        <Divider style={{ margin: '6px 0' }} />
                        <Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>已选 {selectedTags.length} 个</Text>
                          <Button size="small" type="primary" ghost icon={<RocketOutlined />} onClick={polishPrompt} loading={polishing}>
                            {polishing ? 'AI 润色中...' : '✨ AI 润色'}
                          </Button>
                          <Button size="small" onClick={() => { setSelectedTags([]); setPrompt('') }}>清空</Button>
                        </Space>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ borderRadius: 8, padding: 12, background: '#f8f9ff', border: '1px solid #e6f4ff', maxHeight: 360, overflow: 'auto' }}>
                    <StoryboardGenerator
                      onApplyToPrompt={(p) => setPrompt(p)}
                      shots={storyboardShots}
                      onShotsChange={setStoryboardShots}
                      sceneDesc={scriptInput}
                      onSceneDescChange={setScriptInput}
                      selectedTags={selectedTags}
                      llmModel={llmModel}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 提示词输入 */}
            <div style={{ marginBottom: 8 }}>
              <Space style={{ marginBottom: 6 }}>
                <Text strong>📝 视频描述</Text>
                <Tooltip title="Ctrl+Enter 快速生成"><Tag color="blue" style={{ fontSize: 10 }}>Ctrl+Enter 生成</Tag></Tooltip>
              </Space>
              <TextArea rows={5} value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="描述你想生成的视频...（点击上方标签快速构建，或直接输入）"
                maxLength={2000} showCount />
            </div>

            {/* 质量评分 */}
            {prompt.trim() && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 8,
                background: promptQuality.score >= 70 ? '#f6ffed' : promptQuality.score >= 40 ? '#fffbe6' : '#fff2f0',
              }}>
                <Space>
                  <Text strong style={{ fontSize: 12 }}>提示词质量:</Text>
                  <Progress percent={promptQuality.score} size="small" style={{ width: 120 }}
                    strokeColor={promptQuality.score >= 70 ? '#52c41a' : promptQuality.score >= 40 ? '#faad14' : '#ff4d4f'} />
                  <Text style={{ fontSize: 12, color: promptQuality.score >= 70 ? '#52c41a' : '#faad14' }}>
                    {promptQuality.score >= 70 ? '优秀' : promptQuality.score >= 40 ? '良好' : '待改进'}
                  </Text>
                </Space>
                {promptQuality.tips.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    {promptQuality.tips.map((tip, i) => (
                      <Text key={i} type="secondary" style={{ fontSize: 11, display: 'block' }}>💡 {tip}</Text>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 提示词历史 */}
            {promptHistory.length > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}><HistoryOutlined /> 最近使用:</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {promptHistory.slice(0, 5).map((p, i) => (
                    <Tag key={i} style={{ cursor: 'pointer', fontSize: 11, maxWidth: 200 }} onClick={() => setPrompt(p)}>
                      <Text ellipsis style={{ fontSize: 11, maxWidth: 180 }}>{p}</Text>
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* 右: 配置+生成 (45%) */}
        <Col xs={24} lg={11}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Card size="small" title={<Space><VideoCameraOutlined /> 生成配置</Space>} style={{ borderRadius: 12 }}>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {/* 模型 */}
                <div>
                  <Text strong style={{ fontSize: 13 }}>🤖 生成模型</Text>
                  <Select value={provider}
                    onChange={v => {
                      setProvider(v); setKeyInput('')
                      setModelCatalog([]); setCatalogWarn('')
                      const p = providers.find(x => x.provider === v)
                      if (p) { setUseCustomModel(false); loadModelCatalog(v) }
                    }}
                    style={{ width: '100%', marginTop: 6 }}
                    options={providers.map(p => ({
                      value: p.provider,
                      label: (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{p.display_name}</span>
                          {p.api_key_masked ? <CheckCircleFilled style={{ color: '#52c41a' }} /> : <CloseCircleFilled style={{ color: '#ff4d4f' }} />}
                        </span>
                      ),
                    }))} />
                </div>

                {/* API Key 折叠 */}
                <div style={{
                  borderRadius: 8, padding: keyExpanded || !currentProvider?.api_key_masked ? 12 : '8px 12px',
                  background: currentProvider?.api_key_masked ? '#f6ffed' : '#fffbe6',
                  border: `1px solid ${currentProvider?.api_key_masked ? '#b7eb8f' : '#ffe58f'}`,
                }}>
                  <Space>
                    <KeyOutlined style={{ color: currentProvider?.api_key_masked ? '#52c41a' : '#faad14' }} />
                    <Text strong style={{ fontSize: 13 }}>API Key</Text>
                    {currentProvider?.api_key_masked
                      ? <Tag color="green" icon={<CheckCircleFilled />} style={{ margin: 0 }}>{currentProvider.api_key_masked}</Tag>
                      : <Tag color="red" icon={<CloseCircleFilled />} style={{ margin: 0 }}>未配置</Tag>}
                    {currentProvider?.api_key_masked && !keyExpanded && (
                      <Button size="small" type="link" onClick={() => setKeyExpanded(true)}>修改</Button>
                    )}
                  </Space>
                  {(keyExpanded || !currentProvider?.api_key_masked) && (
                    <Space.Compact style={{ width: '100%', marginTop: 8 }}>
                      <Input.Password placeholder="粘贴 API Key..." value={keyInput}
                        onChange={e => setKeyInput(e.target.value)} onPressEnter={handleSaveKey} size="small" />
                      <Button type="primary" size="small" loading={keySaving} onClick={handleSaveKey} icon={<KeyOutlined />}>保存</Button>
                    </Space.Compact>
                  )}
                </div>

                {/* 参数 */}
                <Row gutter={12}>
                  <Col span={8}>
                    <Text strong style={{ fontSize: 13 }}>📐 分辨率</Text>
                    <Select value={resolution} onChange={setResolution} size="small" style={{ width: '100%', marginTop: 6 }}
                      options={[
                        { value: '480p', label: '480p (快速)' },
                        { value: '720p', label: '720p (推荐)' },
                        { value: '1080p', label: '1080p (高清)' },
                      ]} />
                  </Col>
                  <Col span={8}>
                    <Text strong style={{ fontSize: 13 }}>📺 宽高比</Text>
                    <Select value={aspectRatio} onChange={setAspectRatio} size="small" style={{ width: '100%', marginTop: 6 }}
                      options={[
                        { value: '16:9', label: '16:9 横屏' },
                        { value: '9:16', label: '9:16 竖屏' },
                        { value: '1:1', label: '1:1 方形' },
                        { value: '4:3', label: '4:3 标准' },
                      ]} />
                  </Col>
                  <Col span={8}>
                    <Text strong style={{ fontSize: 13 }}>⏱ 时长: {duration}s</Text>
                    <Slider min={2} max={10} value={duration} onChange={setDuration}
                      marks={{ 2: '2s', 10: '10s' }} style={{ marginTop: 12 }} />
                  </Col>
                </Row>

                <div>
                  <Text strong style={{ fontSize: 13 }}>⚙️ 模型版本</Text>
                  <Space style={{ marginTop: 6, width: '100%' }} direction="vertical" size={4}>
                    <Select
                      value={useCustomModel ? 'custom' : model}
                      onChange={(v: string) => {
                        if (v === 'custom') { setUseCustomModel(true); return }
                        setUseCustomModel(false); setModel(v)
                      }}
                      size="small" style={{ width: '100%' }}
                      loading={catalogLoading}
                      placeholder={catalogLoading ? '正在探测账户可用模型...' : '选择模型'}
                      options={[
                        ...modelCatalog.map((m: any) => {
                          const st = m.status?.state || 'unverified'
                          const disabled = st === 'not_activated' || st === 'not_found'
                          const badge = st === 'available' ? '✅ 可用'
                            : st === 'not_activated' ? '⛔ 未开通'
                            : st === 'not_found' ? '🚫 不存在'
                            : '❔ 未探测'
                          return {
                            value: m.id,
                            disabled,
                            label: (
                              <span style={{ display: 'flex', justifyContent: 'space-between', opacity: disabled ? 0.55 : 1 }}>
                                <span>{m.label || m.id}</span>
                                <span style={{ fontSize: 11, color: disabled ? '#ff4d4f' : '#52c41a' }}>{badge}</span>
                              </span>
                            ),
                          }
                        }),
                        { value: 'custom', label: '✏️ 自定义模型名' },
                      ]} />
                    {useCustomModel && (
                      <Input placeholder="输入自定义模型 ID" value={customModel} size="small"
                        onChange={e => setCustomModel(e.target.value)} />
                    )}
                    {catalogWarn && (
                      <div style={{ fontSize: 11, color: '#fa8c16', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '4px 8px' }}>
                        ⚠️ {catalogWarn}
                      </div>
                    )}
                    {modelCatalog.some((m: any) => m.status?.state === 'available') && !catalogWarn && (
                      <Text type="secondary" style={{ fontSize: 11 }}>已按账户真实开通状态过滤，灰显项无法生成</Text>
                    )}
                  </Space>
                </div>

                {/* 负面提示词 */}
                <div>
                  <Text strong style={{ fontSize: 13 }}>🚫 负面提示词</Text>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>不希望出现的内容</Text>
                  <Input.TextArea
                    rows={2}
                    value={negativePrompt}
                    onChange={e => setNegativePrompt(e.target.value)}
                    placeholder="例如：模糊、变形、文字水印、低质量..."
                    maxLength={500}
                    showCount
                    style={{ marginTop: 6, fontSize: 12 }}
                  />
                </div>

                {/* Mock 开关 */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8,
                  background: mockMode ? '#fff7e6' : '#f6ffed',
                  border: `1px solid ${mockMode ? '#ffd591' : '#b7eb8f'}`,
                }}>
                  <Space>
                    <Text strong style={{ fontSize: 12 }}>🧪 测试模式</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{mockMode ? 'Mock 视频' : '真实 API'}</Text>
                  </Space>
                  <Switch size="small" checked={mockMode} onChange={setMockMode} />
                </div>
              </Space>
            </Card>

            {/* 生成进度 */}
            {loading && (
              <div style={{ padding: '12px 16px', borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Space direction="vertical" style={{ width: '100%' }} size={4}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 13 }}>⏳ 生成中...</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{Math.round(genProgress)}%</Text>
                  </Space>
                  <Progress percent={genProgress} status="active" strokeColor="#52c41a" />
                  <Text type="secondary" style={{ fontSize: 11 }}>通常需要 1-5 分钟，请耐心等待</Text>
                </Space>
              </div>
            )}

            {/* 生成按钮 */}
            <Button type="primary" size="large" block icon={<ThunderboltOutlined />}
              loading={loading} onClick={handleGenerate}
              style={{ height: 52, fontSize: 18, borderRadius: 10, background: mockMode ? '#fa8c16' : undefined }}>
              {loading ? '⏳ 生成中...' : mockMode ? '🧪 测试生成' : '🚀 生成视频'}
            </Button>

            {/* 视频预览 */}
            {videoUrl && (
              <Card title="🎥 视频预览" size="small" style={{ borderRadius: 12 }} ref={previewRef}
                extra={
                  <Space>
                    <Button size="small" icon={<DownloadOutlined />} href={videoUrl} target="_blank">下载</Button>
                    <Button size="small" icon={<RedoOutlined />} onClick={handleGenerate}>重试</Button>
                  </Space>
                }>
                <video src={videoUrl} controls autoPlay style={{ width: '100%', borderRadius: 8, background: '#000' }} />
              </Card>
            )}

            {task?.status === 'failed' && (
              <Card size="small" style={{ borderRadius: 12, borderColor: '#ff4d4f' }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text type="danger">❌ {task.error_message}</Text>
                  {(task.error_message || '').includes('console.volcengine.com') && (
                    <Space>
                      <Button size="small" type="primary"
                        href="https://console.volcengine.com/ark/region:ark+cn-beijing/openManagement"
                        target="_blank">去方舟控制台开通</Button>
                      <Text type="secondary" style={{ fontSize: 12 }}>开通后回到此页点「探测开通状态」即可</Text>
                    </Space>
                  )}
                  {(task.error_message || '').includes('API Key') && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      提示：也可切到「测试模式」（Mock）验证完整流程，Mock 无需任何 Key。
                    </Text>
                  )}
                </Space>
              </Card>
            )}
          </Space>
        </Col>
      </Row>

      {/* 悬浮生成按钮 */}
      {showFloatingBtn && !videoUrl && (
        <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleGenerate} loading={loading}
          style={{
            position: 'fixed', bottom: 32, right: 32,
            height: 52, borderRadius: 26, paddingLeft: 24, paddingRight: 24,
            fontSize: 16, boxShadow: '0 4px 16px rgba(24,144,255,0.4)', zIndex: 100,
          }}>
          {loading ? '生成中...' : '🚀 生成'}
        </Button>
      )}
    </div>
  )
}
