import { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Popconfirm, message, Card, Modal } from 'antd'
import { PlayCircleOutlined, DownloadOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '../services/api'

interface Task {
  id: string
  prompt: string
  provider: string
  model: string
  status: string
  video_url: string
  error_message: string
  duration: number
  created_at: string
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/tasks?size=50')
      setTasks(r.data.tasks)
    } catch { message.error('加载失败') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    await api.delete(`/tasks/${id}`)
    message.success('已删除')
    load()
  }

  const statusTag = (s: string) => {
    const map: Record<string, [string, string]> = {
      pending: ['processing', '排队中'],
      processing: ['processing', '生成中'],
      completed: ['success', '已完成'],
      failed: ['error', '失败'],
    }
    const [color, label] = map[s] || ['default', s]
    return <Tag color={color}>{label}</Tag>
  }

  const columns = [
    {
      title: '描述', dataIndex: 'prompt', ellipsis: true,
      render: (v: string) => v.length > 50 ? v.slice(0, 50) + '...' : v,
    },
    { title: '模型', dataIndex: 'provider', width: 120, render: (v: string) => {
      const map: Record<string, string> = { runway: 'Runway', kling: '可灵', seedance: 'Seedance' }
      return map[v] || v
    }},
    { title: '状态', dataIndex: 'status', width: 100, render: statusTag },
    { title: '耗时', dataIndex: 'duration', width: 80, render: (v: number) => v ? `${v.toFixed(0)}s` : '-' },
    { title: '时间', dataIndex: 'created_at', width: 160, render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    {
      title: '操作', width: 200,
      render: (_: any, row: Task) => (
        <Space>
          {row.video_url && (
            <>
              <Button size="small" icon={<PlayCircleOutlined />} onClick={() => setPreviewUrl(row.video_url)}>预览</Button>
              <Button size="small" icon={<DownloadOutlined />} href={row.video_url} target="_blank">下载</Button>
            </>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(row.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="📋 历史记录"
      style={{ borderRadius: 12 }}
      extra={<Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>}
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={tasks}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal open={!!previewUrl} onCancel={() => setPreviewUrl('')} footer={null} width={800}>
        <video src={previewUrl} controls autoPlay style={{ width: '100%', borderRadius: 8 }} />
      </Modal>
    </Card>
  )
}
