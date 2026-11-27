import { Card, Typography, Space, Tag, Timeline, Empty } from 'antd'
import {
  RocketOutlined, ThunderboltOutlined, AppstoreOutlined,
  ShareAltOutlined, DownloadOutlined, TeamOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

const ROADMAP = [
  {
    color: 'green',
    icon: <TeamOutlined />,
    title: '多用户支持',
    desc: '注册登录、个人空间、团队协作',
    status: '计划中',
  },
  {
    color: 'blue',
    icon: <AppstoreOutlined />,
    title: '图片生成视频',
    desc: '上传图片 + 文字描述 → 生成视频',
    status: '计划中',
  },
  {
    color: 'purple',
    icon: <ThunderboltOutlined />,
    title: '批量生成',
    desc: '批量导入提示词，队列生成，批量下载',
    status: '计划中',
  },
  {
    color: 'orange',
    icon: <ShareAltOutlined />,
    title: '分享与导出',
    desc: '视频分享链接、GIF 导出、短视频剪辑',
    status: '计划中',
  },
  {
    color: 'cyan',
    icon: <DownloadOutlined />,
    title: '本地视频库',
    desc: '视频本地保存、分类管理、标签筛选',
    status: '计划中',
  },
]

export default function ComingSoon() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 标题 */}
      <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f5f0ff 0%, #e8f4ff 100%)', border: 'none' }}>
        <Space direction="vertical" size={8} style={{ width: '100%', textAlign: 'center' }}>
          <RocketOutlined style={{ fontSize: 48, color: '#722ed1' }} />
          <Title level={2} style={{ margin: 0 }}>
            🚀 未完待续
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            更多强大功能正在路上...
          </Text>
        </Space>
      </Card>

      {/* 路线图 */}
      <Card title="📋 功能路线图" style={{ borderRadius: 12 }}>
        <Timeline
          items={ROADMAP.map(item => ({
            color: item.color,
            dot: item.icon,
            children: (
              <div>
                <Space>
                  <Text strong style={{ fontSize: 15 }}>{item.title}</Text>
                  <Tag color={item.color}>{item.status}</Tag>
                </Space>
                <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
                  {item.desc}
                </Paragraph>
              </div>
            ),
          }))}
        />
      </Card>

      {/* 当前支持能力 */}
      <Card title="✅ 当前已支持" style={{ borderRadius: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { icon: '🎬', title: '4个生成模型', desc: 'Runway / 可灵 / Seedance / Mock' },
            { icon: '📝', title: '提示词构建器', desc: '72个标签 + 5个模板 + 一键润色' },
            { icon: '🎭', title: '分镜脚本', desc: '5个模板 + 自定义编排 + 多镜头导出' },
            { icon: '🔑', title: 'API Key 管理', desc: '内联配置 + 连接测试 + 状态指示' },
            { icon: '📋', title: '任务管理', desc: '历史记录 + 预览 + 下载 + 收藏' },
            { icon: '🧪', title: 'Mock 测试', desc: '无需 API Key 完整测试全流程' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: 16, borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f',
            }}>
              <Space>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <div>
                  <Text strong>{item.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                </div>
              </Space>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
