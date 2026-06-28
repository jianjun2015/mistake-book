import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, Tag } from 'antd';
import {
  UnorderedListOutlined,
  PlusOutlined,
  DashboardOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  BookOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../../context/AuthContext';

const { Sider, Content, Header } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '学习概览',
  },
  {
    key: '/mistakes',
    icon: <UnorderedListOutlined />,
    label: '错题列表',
  },
  {
    key: '/mistakes/add',
    icon: <PlusOutlined />,
    label: '添加错题',
  },
  {
    key: '/search',
    icon: <SearchOutlined />,
    label: '搜索错题',
  },
  {
    key: '/knowledge-summary',
    icon: <BookOutlined />,
    label: '知识总结',
  },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'info',
      icon: <UserOutlined />,
      label: (
        <div>
          <div style={{ fontWeight: 'bold' }}>{user?.username}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {user?.gradeName} · {user?.genderName}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="80"
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1890ff',
            fontWeight: 'bold',
            fontSize: 16,
          }}
        >
          📝 错题本
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: '1px solid #f0f0f0',
            height: 56,
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                style={{ backgroundColor: '#1890ff' }}
                icon={<UserOutlined />}
              />
              <span>{user?.username}</span>
              <Tag color="blue">{user?.gradeName}</Tag>
            </Space>
          </Dropdown>
        </Header>
        <Content>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
