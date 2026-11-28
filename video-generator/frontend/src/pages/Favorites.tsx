import { useState, useEffect } from 'react'
import { Card, Empty, Button, Space, Typography, message, Modal, Tag, Popconfirm } from 'antd'
import {
  StarFilled, PlayCircleOutlined, DownloadOutlined,
  DeleteOutlined, ReloadOutlined,
} from '@ant-design/icons'
import api, { videoSrc } from '../services/api'

const { Text, Title } = Typography

interface Video {
  id: string
  prompt: string
  provider: string
  model: string
  video_url: string
  created_at: string
  duration: number
}

export default function Favorites() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  // localStorage 存储收藏
  const loadFavorites = () => {
    try {
      const favs = JSON.parse(localStorage.getItem('video_favorites') || '[]')
      setVideos(favs)
    } catch { setVideos([]) }
  }

  useEffect(() => { loadFavorites() }, [])

  const removeFavorite = (id: string) => {
    const favs = videos.filter(v => v.id !== id)
    setVideos(favs)
    localStorage.setItem('video_favorites', JSON.stringify(favs))
    message.success('已取消收藏')
  }

  return (
    <Card
      title={
        <Space>
          <StarFilled style={{ color: '#faad14', fontSize: 20 }} />
          <Title level={4} style={{ margin: 0 }}>收藏视频</Title>
          <Text type="secondary">({videos.length})</Text>
        </Space>
      }
      style={{ borderRadius: 12 }}
      extra={<Button icon={<ReloadOutlined />} onClick={loadFavorites}>刷新</Button>}
    >
      {videos.length === 0 ? (
        <Empty
          description={
            <Space direction="vertical">
              <Text type="secondary">还没有收藏的视频</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                在"已有视频"或生成完成后点击 ⭐ 收藏
              </Text>
            </Space>
          }
          style={{ padding: 60 }}
        >
          <Button type="primary" icon={<StarFilled />}>
            去生成视频
          </Button>
        </Empty>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20,
        }}>
          {videos.map(v => (
            <Card
              key={v.id}
              hoverable
              size="small"
              style={{ borderRadius: 10, overflow: 'hidden' }}
              cover={
                <div
                  style={{
                    height: 200, background: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => setPreviewUrl(videoSrc(v.video_url))}
                >
                  <video
                    src={videoSrc(v.video_url)}
                    muted
                    preload="metadata"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              }
              actions={[
                <PlayCircleOutlined key="play" onClick={() => setPreviewUrl(videoSrc(v.video_url))} />,
                <DownloadOutlined key="download" onClick={() => window.open(videoSrc(v.video_url))} />,
                <Popconfirm title="取消收藏？" onConfirm={() => removeFavorite(v.id)}>
                  <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} />
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                title={
                  <Text ellipsis style={{ fontSize: 13 }}>
                    {v.prompt}
                  </Text>
                }
                description={
                  <Space>
                    <Tag color="blue">{v.provider}</Tag>
                    {v.duration ? <Tag>{v.duration}s</Tag> : null}
                  </Space>
                }
              />
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!previewUrl}
        onCancel={() => setPreviewUrl('')}
        footer={null}
        width={800}
        title="🎥 视频预览"
      >
        <video
          src={previewUrl}
          controls
          autoPlay
          style={{ width: '100%', borderRadius: 8, background: '#000' }}
        />
      </Modal>
    </Card>
  )
}
