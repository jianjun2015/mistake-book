import { useState } from 'react'
import { Layout, Menu, theme, Typography } from 'antd'
import { VideoCameraOutlined, SettingOutlined, HistoryOutlined } from '@ant-design/icons'
import Generate from './pages/Generate'
import TaskList from './pages/TaskList'
import ApiConfig from './pages/ApiConfig'

const { Header, Content } = Layout

export default function App() {
  const [page, setPage] = useState('generate')
  const { token } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex', alignItems: 'center', gap: 24,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
          🎬 文生视频平台
        </Typography.Title>
        <Menu
          mode="horizontal"
          selectedKeys={[page]}
          onClick={e => setPage(e.key)}
          style={{ flex: 1, background: 'transparent', color: '#fff' }}
          items={[
            { key: 'generate', icon: <VideoCameraOutlined />, label: '生成视频' },
            { key: 'tasks', icon: <HistoryOutlined />, label: '历史记录' },
            { key: 'config', icon: <SettingOutlined />, label: 'API 配置' },
          ]}
        />
      </Header>
      <Content style={{ padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {page === 'generate' && <Generate />}
        {page === 'tasks' && <TaskList />}
        {page === 'config' && <ApiConfig />}
      </Content>
    </Layout>
  )
}
