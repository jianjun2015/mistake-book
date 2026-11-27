import { useState, useEffect } from 'react'
import { Card, Input, Button, Space, message, Tag, Typography, Divider } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, SaveOutlined, ApiOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Text, Title } = Typography

interface ProviderConfig {
  id: string
  provider: string
  display_name: string
  api_key_masked: string
  base_url: string
  default_model: string
  is_active: boolean
}

export default function ApiConfig() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([])
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const r = await api.get('/config')
      setConfigs(r.data)
    } catch { message.error('加载配置失败') }
  }

  useEffect(() => { load() }, [])

  const handleTest = async (provider: string) => {
    setTesting(t => ({ ...t, [provider]: true }))
    try {
      // Save key first if entered
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
    for (const [provider, key] of Object.entries(keys)) {
      if (key) {
        await api.post('/config', { provider, api_key: key })
      }
    }
    setSaving(false)
    setKeys({})
    message.success('配置已保存')
    load()
  }

  const providerEmoji: Record<string, string> = {
    runway: '🎬', kling: '🟢', seedance: '🔵',
  }

  return (
    <Card
      title={<><ApiOutlined /> API 配置</>}
      style={{ borderRadius: 12 }}
      extra={<Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存配置</Button>}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {configs.map(c => (
          <Card key={c.provider} size="small" style={{ borderRadius: 8, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 160 }}>
                <Title level={5} style={{ margin: 0 }}>
                  {providerEmoji[c.provider] || '⚙️'} {c.display_name}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>{c.provider}</Text>
              </div>

              <div style={{ flex: 1, minWidth: 300 }}>
                <Input.Password
                  placeholder={c.api_key_masked ? `已配置 (${c.api_key_masked})` : '输入 API Key...'}
                  value={keys[c.provider] || ''}
                  onChange={e => setKeys(k => ({ ...k, [c.provider]: e.target.value }))}
                  visibilityToggle
                />
              </div>

              <Button
                icon={<ApiOutlined />}
                loading={testing[c.provider]}
                onClick={() => handleTest(c.provider)}
              >
                测试连接
              </Button>

              {results[c.provider] && (
                results[c.provider].ok
                  ? <Tag icon={<CheckCircleOutlined />} color="success">连接成功</Tag>
                  : <Tag icon={<CloseCircleOutlined />} color="error">{results[c.provider].msg}</Tag>
              )}

              {c.api_key_masked && !keys[c.provider] && (
                <Tag color="green">已配置</Tag>
              )}
            </div>
          </Card>
        ))}

        <Divider />
        <Text type="secondary">
          💡 API Key 获取方式：
          Runway → runwayml.com | 可灵 → klingai.com | Seedance → 火山引擎
        </Text>
      </Space>
    </Card>
  )
}
