import { useState, useEffect } from 'react'
import {
  Card, Input, Button, Space, message, Tag, Typography, Divider, AutoComplete,
  Select, Alert, List, Badge, Tooltip,
} from 'antd'
import {
  CheckCircleOutlined, CloseCircleOutlined, SaveOutlined, ApiOutlined,
  SyncOutlined, RobotOutlined, VideoCameraOutlined,
} from '@ant-design/icons'
import api from '../services/api'

const { Text, Title } = Typography

interface ModelStatus {
  state: string
  message: string
}

interface ModelItem {
  id: string
  label?: string
  status?: ModelStatus
  selected?: boolean
  preview?: boolean
  channel?: string
  channel_label?: string
}

interface ProviderConfig {
  id: string
  provider: string
  display_name: string
  api_key_masked: string
  base_url: string
  default_model: string
  is_active: boolean
}

const STATE_STYLE: Record<string, { icon: string; color: string; text: string }> = {
  available: { icon: '✅', color: 'success', text: '可用' },
  not_activated: { icon: '⛔', color: 'warning', text: '未开通' },
  not_found: { icon: '🚫', color: 'error', text: '不存在' },
  unsupported: { icon: '🚫', color: 'error', text: '不在套餐' },
  quota: { icon: '⚠️', color: 'warning', text: '配额耗尽' },
  no_key: { icon: '🔑', color: 'default', text: '缺 Key' },
  error: { icon: '❌', color: 'error', text: '错误' },
  unverified: { icon: '❔', color: 'default', text: '未探测' },
}

function StatusTag({ status }: { status?: ModelStatus }) {
  if (!status) return null
  const s = STATE_STYLE[status.state] || STATE_STYLE.unverified
  return (
    <Tooltip title={status.message}>
      <Tag color={s.color}>{s.icon} {s.text}</Tag>
    </Tooltip>
  )
}

export default function ApiConfig() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([])
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({})
  const [models, setModels] = useState<Record<string, string>>({})
  const [catalogs, setCatalogs] = useState<Record<string, ModelItem[]>>({})
  const [probing, setProbing] = useState<Record<string, boolean>>({})
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [saving, setSaving] = useState(false)

  // AI 语言模型
  const [textModels, setTextModels] = useState<ModelItem[]>([])
  const [textCurrent, setTextCurrent] = useState('')
  const [textChannel, setTextChannel] = useState('ark')
  const [textProbing, setTextProbing] = useState(false)
  const [textNote, setTextNote] = useState('')

  const load = async () => {
    try {
      const r = await api.get('/config')
      setConfigs(r.data)
      const init: Record<string, string> = {}
      r.data.forEach((c: ProviderConfig) => { init[c.provider] = c.default_model })
      setModels(init)
      await Promise.all(r.data.map((c: ProviderConfig) => loadCatalog(c.provider, false)))
    } catch { message.error('加载配置失败') }
  }

  const loadTextModels = async (probe = false) => {
    try {
      const r = await api.get('/config/ai/text-models', { params: probe ? { probe: true } : {} })
      setTextModels(r.data.models || [])
      setTextCurrent(r.data.current || '')
      setTextNote(r.data.note || '')
      const cur = (r.data.models || []).find((m: ModelItem) => m.selected)
      if (cur?.channel) setTextChannel(cur.channel)
    } catch { message.error('加载语言模型清单失败') }
  }

  useEffect(() => { load(); loadTextModels(false) }, [])

  /** 拉取厂商模型目录（真实账户清单）；probe=true 时附带开通状态 */
  const loadCatalog = async (provider: string, probe: boolean) => {
    if (probing[provider] && probe) return
    if (probe) setProbing(p => ({ ...p, [provider]: true }))
    try {
      const r = await api.get(`/config/${provider}/models`, { params: probe ? { probe: true } : {} })
      const list: ModelItem[] = r.data.models || []
      setCatalogs(c => ({ ...c, [provider]: list }))
      // 当前默认模型不在清单里时补进下拉，避免下拉空白
      setModels(m => {
        if (m[provider]) return m
        return { ...m, [provider]: r.data.default_model || (list[0]?.id ?? '') }
      })
    } catch (e: any) {
      message.error(e?.response?.data?.detail || `${provider} 模型清单获取失败`)
    } finally {
      if (probe) setProbing(p => ({ ...p, [provider]: false }))
    }
  }

  const handleTest = async (provider: string) => {
    setTesting(t => ({ ...t, [provider]: true }))
    try {
      if (keys[provider]) {
        await api.post('/config', { provider, api_key: keys[provider] })
      }
      const r = await api.post(`/config/${provider}/test`)
      setResults(r2 => ({ ...r2, [provider]: { ok: r.data.success, msg: r.data.message } }))
    } catch (e: any) {
      setResults(r2 => ({ ...r2, [provider]: { ok: false, msg: e?.response?.data?.detail || '连接失败' } }))
    }
    setTesting(t => ({ ...t, [provider]: false }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const c of configs) {
        const payload: Record<string, string> = { provider: c.provider }
        if (keys[c.provider]) payload.api_key = keys[c.provider]
        if (baseUrls[c.provider]) payload.base_url = baseUrls[c.provider]
        if (models[c.provider]) payload.default_model = models[c.provider]
        await api.post('/config', payload)
      }
      setKeys({})
      message.success('配置已保存')
      load()
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '保存失败')
    }
    setSaving(false)
  }

  const handleSaveTextModel = async () => {
    if (!textCurrent) { message.warning('请先选择语言模型'); return }
    try {
      const r = await api.post('/config/ai/text-model', { model: textCurrent, channel: textChannel })
      message.success(`默认语言模型已设为 ${r.data.model}（立即生效）`)
      loadTextModels(false)
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '保存失败')
    }
  }

  const providerEmoji: Record<string, string> = { runway: '🎬', kling: '🟢', seedance: '🔵', mock: '🧪' }

  const textOptions = textModels.map(m => ({
    value: m.id,
    label: `${m.channel === 'ark' ? '方舟' : 'MiMo'} · ${m.id}${m.preview ? ' (preview)' : ''}`,
  }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* ---------------- 视频厂商 ---------------- */}
      <Card
        title={<><VideoCameraOutlined /> 视频厂商配置</>}
        style={{ borderRadius: 12 }}
        extra={<Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存配置</Button>}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {configs.map(c => {
            const list = catalogs[c.provider] || []
            const cur = list.find(m => m.id === models[c.provider])
            return (
              <Card key={c.provider} size="small" style={{ borderRadius: 8, background: '#fafafa' }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 150 }}>
                      <Title level={5} style={{ margin: 0 }}>
                        {providerEmoji[c.provider] || '⚙️'} {c.display_name}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>{c.provider}</Text>
                    </div>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <Input.Password
                        placeholder={c.api_key_masked ? `已配置 (${c.api_key_masked})` : '输入 API Key...'}
                        value={keys[c.provider] || ''}
                        onChange={e => setKeys(k => ({ ...k, [c.provider]: e.target.value }))}
                        visibilityToggle
                      />
                    </div>
                    <Button icon={<ApiOutlined />} loading={testing[c.provider]} onClick={() => handleTest(c.provider)}>
                      测试连接
                    </Button>
                    {results[c.provider] && (
                      results[c.provider].ok
                        ? <Tag icon={<CheckCircleOutlined />} color="success">连接成功</Tag>
                        : <Tag icon={<CloseCircleOutlined />} color="error">{results[c.provider].msg}</Tag>
                    )}
                    {c.api_key_masked && !keys[c.provider] && <Tag color="green">已配置</Tag>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Text strong style={{ minWidth: 84 }}>模型</Text>
                    <AutoComplete
                      value={models[c.provider] || ''}
                      onChange={v => setModels(m => ({ ...m, [c.provider]: v }))}
                      options={list.map(m => ({
                        value: m.id,
                        label: `${STATE_STYLE[m.status?.state || 'unverified']?.icon || '❔'} ${m.id}${m.preview ? ' (preview)' : ''}`,
                      }))}
                      placeholder="选择或手动输入模型名"
                      style={{ minWidth: 300 }}
                      filterOption={(input, option) =>
                        String(option?.value || '').toLowerCase().includes(input.toLowerCase())}
                    />
                    <Button
                      size="small"
                      icon={<SyncOutlined />}
                      loading={probing[c.provider]}
                      onClick={() => loadCatalog(c.provider, true)}
                    >
                      探测开通状态
                    </Button>
                    <StatusTag status={cur?.status} />
                    <Text type="secondary" style={{ fontSize: 12 }}>共 {list.length} 个真实模型</Text>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text strong style={{ minWidth: 84 }}>Base URL</Text>
                    <Input
                      value={baseUrls[c.provider] ?? c.base_url}
                      onChange={e => setBaseUrls(b => ({ ...b, [c.provider]: e.target.value }))}
                      placeholder="Base URL"
                      style={{ flex: 1 }}
                    />
                  </div>

                  {c.provider === 'seedance' && (
                    <Alert
                      type="info"
                      showIcon
                      message="Seedance 视频模型需在方舟控制台逐个开通，未开通的模型会返回 ModelNotOpen。"
                      style={{ fontSize: 13 }}
                    />
                  )}
                </Space>
              </Card>
            )
          })}
        </Space>
      </Card>

      {/* ---------------- AI 语言模型 ---------------- */}
      <Card
        title={<><RobotOutlined /> AI 语言模型（方舟 Coding 套餐）</>}
        style={{ borderRadius: 12 }}
        extra={
          <Space>
            <Button icon={<SyncOutlined />} loading={textProbing}
              onClick={async () => { setTextProbing(true); await loadTextModels(true); setTextProbing(false) }}>
              探测可用性
            </Button>
            <Button type="primary" onClick={handleSaveTextModel}>设为默认</Button>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {textNote && <Alert type="info" showIcon message={textNote} style={{ fontSize: 13 }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Text strong>默认模型</Text>
            <Select
              value={textCurrent || undefined}
              onChange={(v) => {
                setTextCurrent(v)
                const m = textModels.find(x => x.id === v)
                if (m?.channel) setTextChannel(m.channel)
              }}
              options={textOptions}
              showSearch
              optionFilterProp="label"
              placeholder="选择语言模型"
              style={{ minWidth: 320 }}
            />
            <Tag color={textChannel === 'ark' ? 'blue' : 'purple'}>
              {textChannel === 'ark' ? '火山方舟 Coding 套餐' : '小米 MiMo'}
            </Tag>
          </div>

          <Divider style={{ margin: '4px 0' }} />

          <List
            size="small"
            bordered
            dataSource={textModels}
            header={<Text type="secondary">共 {textModels.length} 个语言模型（仅用于 AI 润色/分镜，不能生成视频）</Text>}
            renderItem={(m: ModelItem) => (
              <List.Item
                actions={[
                  <StatusTag key="st" status={m.status} />,
                  m.selected
                    ? <Tag key="cur" color="blue">当前默认</Tag>
                    : <Button key="use" size="small" type="link"
                        onClick={() => { setTextCurrent(m.id); if (m.channel) setTextChannel(m.channel) }}>
                        设为默认
                      </Button>,
                ]}
              >
                <Space>
                  <Badge status={m.channel === 'ark' ? 'processing' : 'success'} />
                  <Text code style={{ fontSize: 13 }}>{m.id}</Text>
                  {m.preview && <Tag color="orange">preview</Tag>}
                </Space>
              </List.Item>
            )}
          />
        </Space>
      </Card>

      <Divider />
      <Text type="secondary">
        💡 API Key 获取：Runway → runwayml.com ｜ 可灵 → klingai.com ｜ Seedance → 火山引擎方舟控制台
      </Text>
    </Space>
  )
}
