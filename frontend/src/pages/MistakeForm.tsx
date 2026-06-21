import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, Upload, Space, message, Card, Divider, Spin } from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import MainLayout from '../components/layout/MainLayout';
import { createMistake, updateMistake, getMistake } from '../api/mistake';
import { useAuth } from '../context/AuthContext';
import { SUBJECTS } from '../types';

const { TextArea } = Input;

const MistakeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const isEdit = !!id;

  // 编辑模式：加载错题数据
  useEffect(() => {
    if (isEdit) {
      loadMistakeData();
    }
  }, [id]);

  const loadMistakeData = async () => {
    if (!id) return;
    setPageLoading(true);
    try {
      const res = await getMistake(Number(id));
      const mistake = res.data;

      // 回显表单数据
      form.setFieldsValue({
        title: mistake.title,
        content: mistake.content,
        subject: mistake.subject,
        difficulty: mistake.difficulty,
        correctAnswer: mistake.correctAnswer,
        wrongReason: mistake.wrongReason,
        tags: mistake.tags?.join(','),
      });

      // 回显图片
      if (mistake.images && mistake.images.length > 0) {
        const existingImages = mistake.images.map((img: any) => img.imageUrl);
        setUploadedImages(existingImages);

        const existingFileList: UploadFile[] = mistake.images.map((img: any, index: number) => ({
          uid: `-${index}`,
          name: `图片${index + 1}`,
          status: 'done',
          url: img.imageUrl,
          response: { code: 200, data: { imageUrl: img.imageUrl } },
        }));
        setFileList(existingFileList);
      }
    } catch (error) {
      console.error('加载错题失败', error);
      message.error('加载错题失败');
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange: UploadProps['onChange'] = ({ file, fileList: newFileList }) => {
    setFileList(newFileList);

    if (file.status === 'done' && file.response) {
      const response = file.response as any;
      if (response.code === 200) {
        setUploadedImages(prev => [...prev, response.data.imageUrl]);
        message.success(`${file.name} 上传成功`);
      }
    } else if (file.status === 'error') {
      message.error(`${file.name} 上传失败`);
    }
  };

  const handleRemove = (file: UploadFile) => {
    const imageUrl = file.response?.data?.imageUrl || file.url;
    if (imageUrl) {
      setUploadedImages(prev => prev.filter(url => url !== imageUrl));
    }
    return true;
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const submitData = {
        title: values.title,
        content: values.content,
        subject: values.subject,
        difficulty: values.difficulty,
        correctAnswer: values.correctAnswer,
        wrongReason: values.wrongReason,
        tags: values.tags,
        images: uploadedImages,
      };

      if (isEdit) {
        await updateMistake(Number(id), submitData);
        message.success('错题更新成功');
      } else {
        await createMistake(submitData);
        message.success('错题添加成功');
      }
      navigate('/mistakes');
    } catch (error) {
      console.error(isEdit ? '更新失败' : '添加失败', error);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/mistakes')}
          style={{ marginBottom: 16 }}
        >
          返回列表
        </Button>

        <Card title={isEdit ? '编辑错题' : '添加错题'} bordered={false}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              difficulty: 3,
              status: 0,
            }}
          >
            <Form.Item
              label="题目摘要"
              name="title"
              extra="简要描述这道错题的知识点"
            >
              <Input placeholder="例如：二次函数最值问题" maxLength={200} />
            </Form.Item>

            <Form.Item
              label="学科"
              name="subject"
              rules={[{ required: true, message: '请选择学科' }]}
            >
              <Select placeholder="请选择学科">
                {SUBJECTS.map((s) => (
                  <Select.Option key={s.code} value={s.code}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="题目内容"
              name="content"
              rules={[{ required: true, message: '请输入题目内容' }]}
            >
              <TextArea rows={4} placeholder="输入题目内容，支持复制粘贴文本" />
            </Form.Item>

            <Form.Item label="题目图片">
              <Upload.Dragger
                name="file"
                multiple
                maxCount={5}
                listType="picture"
                action="/api/images/upload"
                headers={{ Authorization: `Bearer ${token || ''}` }}
                data={{ imageType: 1 }}
                fileList={fileList}
                onChange={handleChange}
                onRemove={handleRemove}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
                <p className="ant-upload-hint">
                  支持 JPG/PNG/GIF 格式，单次上传不超过10MB，最多5张
                </p>
              </Upload.Dragger>
            </Form.Item>

            <Divider />

            <Form.Item label="正确答案" name="correctAnswer">
              <TextArea rows={3} placeholder="输入正确答案" />
            </Form.Item>

            <Form.Item label="错误分析" name="wrongReason">
              <TextArea rows={3} placeholder="分析为什么做错，错在哪里" />
            </Form.Item>

            <Form.Item label="难度" name="difficulty" rules={[{ required: true }]}>
              <Select placeholder="请选择难度">
                {[1, 2, 3, 4, 5].map((d) => (
                  <Select.Option key={d} value={d}>
                    {'⭐'.repeat(d)}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="标签" name="tags" extra="多个标签用逗号分隔">
              <Input placeholder="例如：函数,最值,二次函数" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading} size="large">
                  {isEdit ? '更新错题' : '保存错题'}
                </Button>
                <Button size="large" onClick={() => navigate('/mistakes')}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default MistakeFormPage;
