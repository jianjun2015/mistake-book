import { useState } from 'react'
import { Layout, Tabs, Typography, Space, Badge } from 'antd'
import {
  VideoCameraOutlined, FolderOpenOutlined,
  StarOutlined, RocketOutlined, InboxOutlined,
} from '@ant-design/icons'
import Generate from './pages/Generate'
import TaskList from './pages/TaskList'
import Favorites from './pages/Favorites'
import ComingSoon from './pages/ComingSoon'
import MaterialLibrary from './pages/MaterialLibrary'

const { Header, Content } = Layout

export default function App() {
  const [activeTab, setActiveTab] = useState('generate')

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 顶部品牌栏 */}
      <Header style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64, lineHeight: '64px',
      }}>
        <Space size={16}>
          <span style={{ fontSize: 28 }}>🎬</span>
          <Typography.Title level={3} style={{ color: '#fff', margin: 0, letterSpacing: 2 }}>
            文生视频平台
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6 }}>
            AI Video Generator
          </Typography.Text>
        </Space>
        <Space>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            Runway / 可灵 / Seedance / Mock
          </Typography.Text>
        </Space>
      </Header>

      {/* Tab 导航 */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          tabBarStyle={{ marginBottom: 0 }}
          items={[
            {
              key: 'generate',
              label: (
                <Space size={8}>
                  <VideoCameraOutlined style={{ fontSize: 18 }} />
                  <span style={{ fontSize: 16 }}>生成视频</span>
                </Space>
              ),
              children: null,
            },
            {
              key: 'videos',
              label: (
                <Space size={8}>
                  <FolderOpenOutlined style={{ fontSize: 18 }} />
                  <span style={{ fontSize: 16 }}>已有视频</span>
                </Space>
              ),
              children: null,
            },
            {
              key: 'favorites',
              label: (
                <Space size={8}>
                  <StarOutlined style={{ fontSize: 18, color: '#faad14' }} />
                  <span style={{ fontSize: 16 }}>收藏视频</span>
                </Space>
              ),
              children: null,
            },
            {
              key: 'materials',
              label: (
                <Space size={8}>
                  <InboxOutlined style={{ fontSize: 18, color: '#1677ff' }} />
                  <span style={{ fontSize: 16 }}>素材库</span>
                </Space>
              ),
              children: null,
            },
            {
              key: 'coming',
              label: (
                <Space size={8}>
                  <RocketOutlined style={{ fontSize: 18, color: '#722ed1' }} />
                  <span style={{ fontSize: 16 }}>未完待续</span>
                  <Badge count="NEW" style={{ fontSize: 10, backgroundColor: '#722ed1' }} />
                </Space>
              ),
              children: null,
            },
          ]}
        />
      </div>

      {/* 内容区域 */}
      <Content style={{ padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {activeTab === 'generate' && <Generate />}
        {activeTab === 'videos' && <TaskList />}
        {activeTab === 'favorites' && <Favorites />}
        {activeTab === 'materials' && <MaterialLibrary />}
        {activeTab === 'coming' && <ComingSoon />}
      </Content>
    </Layout>
  )
}
