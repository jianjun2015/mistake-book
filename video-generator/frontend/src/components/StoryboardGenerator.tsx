import { useState } from 'react'
import {
  Card, Button, Space, Typography, Input, message, Tag, Divider,
  Row, Col, Collapse, Select, Alert,
} from 'antd'
import {
  VideoCameraOutlined, PlusOutlined, DeleteOutlined,
  ThunderboltOutlined, CopyOutlined, FileTextOutlined,
  CameraOutlined, EditOutlined, RocketOutlined,
} from '@ant-design/icons'
import api from '../services/api'

const { Text } = Typography

export interface Shot {
  id: number
  camera: string
  description: string
  duration: number
  transition: string
  mood?: string
  dialogue?: string
}

// 分镜脚本模板（description 已带可用描述，应用模板即可直接出片）
const SHOT_TEMPLATES = [
  {
    label: '🎬 电影开场',
    shots: [
      { camera: '远景/航拍', description: '建立环境，展示整体场景，晨昏光线，电影质感', duration: 3, transition: '淡入' },
      { camera: '中景', description: '主角登场，展示动作，自然光，浅景深', duration: 4, transition: '切换' },
      { camera: '特写', description: '细节描写，表情与物品特写，柔和光线', duration: 3, transition: '切换' },
    ],
  },
  {
    label: '📖 叙事故事',
    shots: [
      { camera: '全景', description: '故事背景介绍，环境全貌，暖色光影', duration: 3, transition: '淡入' },
      { camera: '中景', description: '主角开始行动，镜头缓慢跟随', duration: 4, transition: '切换' },
      { camera: '近景', description: '关键动作或事件发生，情绪推进', duration: 4, transition: '切换' },
      { camera: '特写', description: '高潮细节与表情变化，逆光轮廓', duration: 3, transition: '切换' },
      { camera: '远景', description: '结局交代，场景收尾，缓慢拉远', duration: 3, transition: '淡出' },
    ],
  },
  {
    label: '🌍 风景展示',
    shots: [
      { camera: '航拍全景', description: '俯瞰全貌，山川与天际线，晨昏光', duration: 4, transition: '淡入' },
      { camera: '推镜头', description: '缓慢推进到主体，景深渐浅', duration: 4, transition: '切换' },
      { camera: '环绕镜头', description: '360 度环绕展示空间关系', duration: 5, transition: '切换' },
      { camera: '拉镜头', description: '缓慢拉远收尾，留白构图', duration: 3, transition: '淡出' },
    ],
  },
  {
    label: '👤 人物展示',
    shots: [
      { camera: '中景', description: '人物全身展示，自然站姿，环境光', duration: 3, transition: '淡入' },
      { camera: '近景', description: '上半身与动作细节，浅景深', duration: 3, transition: '切换' },
      { camera: '特写', description: '面部表情与眼神，柔和面光', duration: 3, transition: '切换' },
      { camera: '慢动作', description: '关键动作慢放，高帧质感', duration: 4, transition: '切换' },
      { camera: '全景', description: '环境中的完整形象，收束全片', duration: 3, transition: '淡出' },
    ],
  },
  {
    label: '🐾 萌宠日常',
    shots: [
      { camera: '中景', description: '宠物整体活动，生活化场景', duration: 3, transition: '淡入' },
      { camera: '低角度仰拍', description: '宠物视角低角度拍摄，趣味构图', duration: 3, transition: '切换' },
      { camera: '特写', description: '可爱表情与小动作特写', duration: 3, transition: '切换' },
      { camera: '跟拍', description: '跟随宠物移动，稳定运镜', duration: 4, transition: '切换' },
      { camera: '慢动作', description: '跳跃或奔跑慢放，捕捉动作细节', duration: 3, transition: '淡出' },
    ],
  },
]

// 镜头类型库
const CAMERA_TYPES = [
  '远景', '全景', '中景', '近景', '特写', '大特写',
  '航拍/鸟瞰', '低角度仰拍', '高角度俯拍', '荷兰角',
  '推镜头', '拉镜头', '摇镜头', '移镜头', '跟拍',
  '环绕镜头', '手持拍摄', '稳定器运镜', '慢动作', '延时',
]

const TRANSITIONS = ['淡入', '淡出', '切换', '叠化', '闪白', '缩放']

const DEFAULT_SHOTS: Shot[] = [
  { id: 1, camera: '全景', description: '', duration: 3, transition: '淡入' },
  { id: 2, camera: '中景', description: '', duration: 4, transition: '切换' },
  { id: 3, camera: '特写', description: '', duration: 3, transition: '淡出' },
]

interface Props {
  onApplyToPrompt?: (prompt: string) => void
  /** 受控分镜行（由父组件维护，便于「一键生成」直接填充） */
  shots?: Shot[]
  onShotsChange?: (shots: Shot[]) => void
  /** 场景描述，复用父组件的剧本输入 */
  sceneDesc?: string
  onSceneDescChange?: (v: string) => void
  selectedTags?: string[]
  onTagsMatched?: (tags: string[]) => void
}

export default function StoryboardGenerator({
  onApplyToPrompt,
  shots: shotsProp,
  onShotsChange,
  sceneDesc: sceneDescProp,
  onSceneDescChange,
  selectedTags = [],
  onTagsMatched,
}: Props) {
  const [storyboardName, setStoryboardName] = useState('')
  const [innerShots, setInnerShots] = useState<Shot[]>(DEFAULT_SHOTS)
  const [innerSceneDesc, setInnerSceneDesc] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const shots = shotsProp ?? innerShots
  const sceneDesc = sceneDescProp ?? innerSceneDesc
  const setShots = (next: Shot[]) => {
    if (onShotsChange) onShotsChange(next)
    else setInnerShots(next)
  }
  const setSceneDesc = (v: string) => {
    if (onSceneDescChange) onSceneDescChange(v)
    else setInnerSceneDesc(v)
  }

  // 应用模板
  const applyTemplate = (template: typeof SHOT_TEMPLATES[0]) => {
    setShots(template.shots.map((s, i) => ({ ...s, id: i + 1 })))
    message.success(`已应用「${template.label}」分镜模板`)
  }

  // 添加镜头
  const addShot = () => {
    const newId = Math.max(...shots.map(s => s.id), 0) + 1
    setShots([...shots, { id: newId, camera: '中景', description: '', duration: 3, transition: '切换' }])
  }

  // 删除镜头
  const removeShot = (id: number) => {
    if (shots.length <= 1) return message.warning('至少保留一个镜头')
    setShots(shots.filter(s => s.id !== id))
  }

  // 更新镜头
  const updateShot = (id: number, field: keyof Shot, value: any) => {
    setShots(shots.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  // 按场景描述一键生成分镜并填充表格
  const fillByScript = async () => {
    if (!sceneDesc.trim()) return message.warning('请先输入场景描述/剧本')
    setAiLoading(true)
    setNotice('')
    try {
      const r = await api.post('/ai/storyboard', {
        script: sceneDesc,
        scene_count: Math.max(shots.length, 3),
        tags: selectedTags,
      })
      const data = r.data || {}
      const rows: Shot[] = (data.shots || []).map((s: any, i: number) => ({
        id: i + 1,
        camera: s.camera || '中景',
        description: (s.description || '').trim(),
        duration: Number(s.duration) || 3,
        transition: s.transition || '切换',
        mood: s.mood || '',
        dialogue: s.dialogue || '',
      })).filter((s: Shot) => s.description)

      if (rows.length === 0) {
        message.error('分镜生成失败：返回内容为空，请补充场景描述后重试')
      } else {
        setShots(rows)
        if (data.notice) setNotice(data.notice)
        message.success(
          `🎬 已填充 ${rows.length} 个分镜（${data.source === 'ai' ? 'AI 生成' : '本地规则'}）`,
        )
        if (onTagsMatched && Array.isArray(data.matched_tags)) onTagsMatched(data.matched_tags)
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      message.error(detail ? `分镜生成失败：${detail}` : '分镜生成失败，请稍后重试')
    } finally {
      setAiLoading(false)
    }
  }

  // 计算总时长
  const totalDuration = shots.reduce((sum, s) => sum + (s.duration || 0), 0)
  const emptyCount = shots.filter(s => !s.description.trim()).length

  // 生成完整分镜脚本文本
  const generateScript = (): string => {
    if (!sceneDesc.trim()) return ''

    let script = `📋 分镜脚本${storyboardName ? `：${storyboardName}` : ''}\n`
    script += `📝 场景：${sceneDesc}\n`
    script += `⏱ 总时长：${totalDuration}秒 | 镜头数：${shots.length}\n`
    script += `${'═'.repeat(40)}\n\n`

    shots.forEach((shot, i) => {
      script += `【镜头 ${i + 1}】${shot.camera} | ${shot.duration}s | ${shot.transition}\n`
      script += `${shot.description || '(待补充)'}\n`
      if (shot.dialogue) script += `台词：${shot.dialogue}\n`
      script += '\n'
    })

    return script
  }

  // 生成多条提示词（每镜头一条，空描述继承场景描述而不是留空）
  const generatePrompts = (): string[] => {
    if (!sceneDesc.trim()) return []
    return shots.map((shot, i) => {
      const base = shot.description.trim() || sceneDesc
      return `镜头${i + 1}(${shot.camera})：${base}，${shot.duration}秒，${shot.transition}`
    })
  }

  // 复制脚本
  const copyScript = () => {
    if (!sceneDesc.trim()) return message.warning('请先输入场景描述')
    navigator.clipboard.writeText(generateScript())
    message.success('分镜脚本已复制到剪贴板！')
  }

  // 应用到提示词
  const applyToPrompt = () => {
    if (!sceneDesc.trim()) return message.warning('请先输入场景描述')
    const prompts = generatePrompts()
    if (prompts.length > 0 && onApplyToPrompt) {
      onApplyToPrompt(prompts.join('\n---\n'))
      message.success('分镜提示词已应用到视频描述！')
    }
  }

  // 可灵多镜头格式
  const exportMultiShot = () => {
    if (!sceneDesc.trim()) return message.warning('请先输入场景描述')
    const multiPrompt = shots
      .map((shot, i) => `镜头 ${i + 1}, ${shot.duration}, ${shot.description.trim() || sceneDesc}`)
      .join('; ')
    if (onApplyToPrompt) {
      onApplyToPrompt(multiPrompt)
      message.success('多镜头格式提示词已应用！')
    }
  }

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined style={{ color: '#722ed1' }} />
          <Text strong>📝 分镜脚本生成</Text>
          <Tag color="purple">Storyboard</Tag>
        </Space>
      }
      size="small"
      style={{ borderRadius: 8, background: '#faf5ff', border: '1px solid #d3adf7' }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 场景描述 */}
        <Row gutter={12}>
          <Col span={8}>
            <Text strong>脚本名称</Text>
            <Input
              placeholder="如：猫咪冒险短片"
              value={storyboardName}
              onChange={e => setStoryboardName(e.target.value)}
              size="small"
              style={{ marginTop: 4 }}
            />
          </Col>
          <Col span={16}>
            <Text strong>场景总体描述 / 剧本</Text>
            <Input
              placeholder="描述整个视频的核心场景和主题，或直接粘贴剧本..."
              value={sceneDesc}
              onChange={e => setSceneDesc(e.target.value)}
              size="small"
              style={{ marginTop: 4 }}
            />
          </Col>
        </Row>

        {/* 一键填充 */}
        <Space wrap>
          <Button
            size="small"
            type="primary"
            icon={<RocketOutlined />}
            loading={aiLoading}
            onClick={fillByScript}
            style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
          >
            🎬 按描述生成分镜并填充
          </Button>
          {emptyCount > 0 && (
            <Text type="warning" style={{ fontSize: 12 }}>
              {emptyCount} 个镜头描述为空，将沿用场景描述
            </Text>
          )}
        </Space>

        {notice && (
          <Alert type="warning" showIcon message={notice} style={{ fontSize: 12 }} banner />
        )}

        {/* 快速模板 */}
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>📋 快速分镜模板：</Text>
          <Space wrap style={{ marginTop: 4 }}>
            {SHOT_TEMPLATES.map(t => (
              <Tag key={t.label} color="geekblue" style={{ cursor: 'pointer', borderRadius: 12, padding: '2px 12px' }}
                onClick={() => applyTemplate(t)}>
                {t.label} ({t.shots.length}镜)
              </Tag>
            ))}
          </Space>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* 镜头列表 */}
        <div>
          <Row style={{ marginBottom: 6, fontWeight: 600, fontSize: 12, color: '#666' }}>
            <Col span={2}>#</Col>
            <Col span={5}>📷 镜头类型</Col>
            <Col span={9}>📝 画面描述</Col>
            <Col span={3}>⏱ 时长(s)</Col>
            <Col span={3}>🔄 转场</Col>
            <Col span={2}>操作</Col>
          </Row>

          {shots.map((shot, idx) => (
            <Row key={shot.id} gutter={6} style={{ marginBottom: 6, alignItems: 'center' }}>
              <Col span={2}>
                <Tag color="blue" style={{ margin: 0, textAlign: 'center', width: 28 }}>{idx + 1}</Tag>
              </Col>
              <Col span={5}>
                <Select
                  size="small"
                  value={shot.camera}
                  onChange={(v: string) => updateShot(shot.id, 'camera', v)}
                  style={{ width: '100%' }}
                  options={CAMERA_TYPES.map(c => ({ value: c, label: c }))}
                  showSearch
                />
              </Col>
              <Col span={9}>
                <Input
                  size="small"
                  value={shot.description}
                  onChange={e => updateShot(shot.id, 'description', e.target.value)}
                  placeholder={`镜头${idx + 1}画面描述...`}
                  status={shot.description.trim() ? undefined : 'warning'}
                />
              </Col>
              <Col span={3}>
                <Input
                  size="small"
                  type="number"
                  min={1} max={15}
                  value={shot.duration}
                  onChange={e => updateShot(shot.id, 'duration', parseInt(e.target.value) || 3)}
                />
              </Col>
              <Col span={3}>
                <Select
                  size="small"
                  value={shot.transition}
                  onChange={(v: string) => updateShot(shot.id, 'transition', v)}
                  style={{ width: '100%' }}
                  options={TRANSITIONS.map(t => ({ value: t, label: t }))}
                />
              </Col>
              <Col span={2}>
                <Button size="small" danger type="text" icon={<DeleteOutlined />}
                  onClick={() => removeShot(shot.id)} />
              </Col>
            </Row>
          ))}
        </div>

        {/* 操作按钮 */}
        <Row gutter={8}>
          <Col>
            <Button size="small" icon={<PlusOutlined />} onClick={addShot} type="dashed" block>
              添加镜头
            </Button>
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12, lineHeight: '24px' }}>
              共 {shots.length} 个镜头 ｜ 总时长 <Text strong>{totalDuration}s</Text>
            </Text>
          </Col>
        </Row>

        <Divider style={{ margin: '4px 0' }} />

        {/* 输出操作 */}
        <Space wrap>
          <Button size="small" type="primary" icon={<CopyOutlined />} onClick={copyScript}>
            复制脚本
          </Button>
          <Button size="small" icon={<CameraOutlined />} onClick={applyToPrompt}>
            生成分镜提示词
          </Button>
          <Button size="small" icon={<ThunderboltOutlined />} onClick={exportMultiShot} style={{ background: '#722ed1', color: '#fff' }}>
            多镜头格式（可灵）
          </Button>
        </Space>

        {/* 预览 */}
        <Collapse
          size="small"
          items={[{
            key: 'preview',
            label: <Text type="secondary"><EditOutlined /> 脚本预览</Text>,
            children: (
              <pre style={{ fontSize: 12, background: '#fff', padding: 12, borderRadius: 6, maxHeight: 200, overflow: 'auto', margin: 0 }}>
                {generateScript() || '输入场景描述后显示预览...'}
              </pre>
            ),
          }]}
        />
      </Space>
    </Card>
  )
}
