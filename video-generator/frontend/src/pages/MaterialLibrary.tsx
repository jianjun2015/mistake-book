import { useState, useRef } from 'react'
import {
  Card, Tabs, Upload, Button, Space, Typography, message, Tag, Modal,
  Empty, Popconfirm, Input, Select,
} from 'antd'
import {
  UploadOutlined, FileTextOutlined, PictureOutlined,
  VideoCameraOutlined, DownloadOutlined, EyeOutlined,
  DeleteOutlined, FolderOutlined, InboxOutlined,
} from '@ant-design/icons'

const { Text, Title } = Typography

interface Asset {
  id: string
  name: string
  category: 'text' | 'document' | 'image' | 'video'
  url: string
  size: number
  uploaded_at: string
  description: string
}

// 分类配置
const CATEGORIES = [
  { key: 'text', label: '📝 简单文本', icon: <FileTextOutlined />, color: '#1677ff', accept: '.txt,.md,.csv,.json' },
  { key: 'document', label: '📄 文档', icon: <FolderOutlined />, color: '#52c41a', accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx' },
  { key: 'image', label: '🖼️ 图片', icon: <PictureOutlined />, color: '#eb2f96', accept: '.jpg,.jpeg,.png,.gif,.webp,.svg' },
  { key: 'video', label: '🎬 视频', icon: <VideoCameraOutlined />, color: '#fa8c16', accept: '.mp4,.mov,.avi,.webm,.mkv' },
]

// 从 localStorage 加载
const loadAssets = (): Asset[] => {
  try { return JSON.parse(localStorage.getItem('material_assets') || '[]') }
  catch { return [] }
}

const saveAssets = (assets: Asset[]) => {
  localStorage.setItem('material_assets', JSON.stringify(assets))
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function MaterialLibrary() {
  const [assets, setAssets] = useState<Asset[]>(loadAssets())
  const [activeCategory, setActiveCategory] = useState('image')
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewType, setPreviewType] = useState('')
  const [searchText, setSearchText] = useState('')

  const currentCat = CATEGORIES.find(c => c.key === activeCategory)

  // 上传处理
  const handleUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const newAsset: Asset = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: file.name,
        category: activeCategory as Asset['category'],
        url: reader.result as string,
        size: file.size,
        uploaded_at: new Date().toISOString(),
        description: '',
      }
      const updated = [...assets, newAsset]
      setAssets(updated)
      saveAssets(updated)
      message.success(`✅ ${file.name} 上传成功！`)
    }

    // 文本类读取为文本
    if (activeCategory === 'text') {
      reader.readAsText(file)
    } else {
      reader.readAsDataURL(file)
    }
    return false  // 阻止 antd 默认上传
  }

  // 删除
  const handleDelete = (id: string) => {
    const updated = assets.filter(a => a.id !== id)
    setAssets(updated)
    saveAssets(updated)
    message.success('已删除')
  }

  // 预览
  const handlePreview = (asset: Asset) => {
    setPreviewUrl(asset.url)
    setPreviewType(asset.category)
  }

  // 下载
  const handleDownload = (asset: Asset) => {
    const a = document.createElement('a')
    a.href = asset.url
    a.download = asset.name
    a.click()
    message.success(`下载 ${asset.name}`)
  }

  // 当前分类的素材（过滤搜索）
  const filteredAssets = assets.filter(a =>
    a.category === activeCategory &&
    (searchText === '' || a.name.toLowerCase().includes(searchText.toLowerCase()))
  )

  // 各分类计数
  const countByCategory = (key: string) => assets.filter(a => a.category === key).length

  return (
    <Card
      title={
        <Space>
          <InboxOutlined style={{ fontSize: 20, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>素材库</Title>
          <Text type="secondary">管理提示词/文档/图片/视频素材</Text>
        </Space>
      }
      style={{ borderRadius: 12 }}
      extra={
        <Space>
          <Input.Search
            placeholder="搜索素材名..."
            allowClear
            style={{ width: 220 }}
            onChange={e => setSearchText(e.target.value)}
          />
        </Space>
      }
    >
      {/* 分类 Tab */}
      <Tabs
        activeKey={activeCategory}
        onChange={setActiveCategory}
        type="card"
        items={CATEGORIES.map(cat => ({
          key: cat.key,
          label: (
            <Space>
              {cat.icon}
              <span>{cat.label}</span>
              <Tag color={cat.color} style={{ marginLeft: 4 }}>
                {countByCategory(cat.key)}
              </Tag>
            </Space>
          ),
        }))}
      />

      {/* 上传区 */}
      <Upload.Dragger
        accept={currentCat?.accept}
        beforeUpload={handleUpload}
        showUploadList={false}
        style={{ marginBottom: 20 }}
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined style={{ fontSize: 32, color: currentCat?.color }} />
        </p>
        <p className="ant-upload-text">
          点击或拖拽文件上传到 <Text strong style={{ color: currentCat?.color }}>{currentCat?.label}</Text>
        </p>
        <p className="ant-upload-hint">
          支持格式：{currentCat?.accept.replace(/\./g, '').toUpperCase()}
        </p>
      </Upload.Dragger>

      {/* 素材列表 */}
      {filteredAssets.length === 0 ? (
        <Empty
          description={
            <Space direction="vertical">
              <Text type="secondary">暂无{currentCat?.label}素材</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>拖拽文件到上方区域上传</Text>
            </Space>
          }
          style={{ padding: 40 }}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {filteredAssets.map(asset => (
            <Card
              key={asset.id}
              hoverable
              size="small"
              style={{ borderRadius: 10 }}
              cover={
                <div
                  style={{
                    height: 140, background: '#fafafa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden',
                  }}
                  onClick={() => handlePreview(asset)}
                >
                  {asset.category === 'image' ? (
                    <img src={asset.url} alt={asset.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : asset.category === 'video' ? (
                    <video src={asset.url} muted preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : asset.category === 'text' ? (
                    <pre style={{
                      padding: 8, fontSize: 10, maxHeight: 120, overflow: 'hidden',
                      width: '100%', margin: 0, whiteSpace: 'pre-wrap', color: '#666',
                    }}>
                      {(asset.url.split(',')[1] ? atob(asset.url.split(',')[1]) : asset.url).substring(0, 200)}
                    </pre>
                  ) : (
                    <Space direction="vertical" style={{ textAlign: 'center' }}>
                      <FolderOutlined style={{ fontSize: 36, color: '#52c41a' }} />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {asset.name.split('.').pop()?.toUpperCase()}
                      </Text>
                    </Space>
                  )}
                </div>
              }
              actions={[
                <EyeOutlined key="view" onClick={() => handlePreview(asset)} title="预览" />,
                <DownloadOutlined key="download" onClick={() => handleDownload(asset)} title="下载" />,
                <Popconfirm title="删除素材？" onConfirm={() => handleDelete(asset.id)}>
                  <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} title="删除" />
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                title={<Text ellipsis style={{ fontSize: 12 }}>{asset.name}</Text>}
                description={
                  <Space size={4}>
                    <Tag color={currentCat?.color} style={{ fontSize: 10 }}>{formatSize(asset.size)}</Tag>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      {new Date(asset.uploaded_at).toLocaleDateString('zh-CN')}
                    </Text>
                  </Space>
                }
              />
            </Card>
          ))}
        </div>
      )}

      {/* 预览弹窗 */}
      <Modal
        open={!!previewUrl}
        onCancel={() => { setPreviewUrl(''); setPreviewType('') }}
        footer={null}
        width={800}
        title="👁️ 素材预览"
      >
        {previewType === 'image' && (
          <img src={previewUrl} alt="preview"
            style={{ width: '100%', borderRadius: 8 }} />
        )}
        {previewType === 'video' && (
          <video src={previewUrl} controls autoPlay
            style={{ width: '100%', borderRadius: 8, background: '#000' }} />
        )}
        {previewType === 'text' && (
          <pre style={{
            padding: 16, background: '#f5f5f5', borderRadius: 8,
            maxHeight: 500, overflow: 'auto', fontSize: 13,
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {previewUrl.split(',')[1] ? atob(previewUrl.split(',')[1]) : previewUrl}
          </pre>
        )}
        {previewType === 'document' && (
          <Empty description="文档预览暂不支持，请下载后查看" />
        )}
      </Modal>
    </Card>
  )
}
