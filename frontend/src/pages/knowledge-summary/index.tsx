import React, { useState } from 'react';
import { Card, Button, Space, Tabs, Input } from 'antd';
import { BookOutlined, CodeOutlined, GlobalOutlined } from '@ant-design/icons';
import MainLayout from '../../components/layout/MainLayout';
import { gradeConfigs } from './config';
import type { SubjectConfig } from './config';

const { TextArea } = Input;

const subjectIcons: Record<string, React.ReactNode> = {
  chinese: <BookOutlined />,
  math: <CodeOutlined />,
  english: <GlobalOutlined />,
};

const KnowledgeSummaryPage: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<string>('grade3');
  const [selectedSemester, setSelectedSemester] = useState<string>('grade3-down');
  const [selectedSubject, setSelectedSubject] = useState<SubjectConfig | null>(null);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [doubtContent, setDoubtContent] = useState<string>('');

  const currentGrade = gradeConfigs.find(g => g.key === selectedGrade);
  const currentSemester = currentGrade?.semesters.find(s => s.key === selectedSemester);

  const handleSubjectClick = (subject: SubjectConfig) => {
    setSelectedSubject(subject);
    setActiveTab('summary');
  };

  const handleBack = () => {
    setSelectedSubject(null);
  };

  const getTabUrl = (file: string) => {
    return `/knowledge/${selectedSemester}/${file}`;
  };

  const tabItems = selectedSubject ? [
    {
      key: 'summary',
      label: '📝 总结',
      children: (
        <div style={{ height: '70vh' }}>
          <iframe
            src={getTabUrl(selectedSubject.summaryFile)}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
            title="知识总结"
          />
        </div>
      ),
    },
    {
      key: 'exam',
      label: '📋 试卷',
      children: (
        <div style={{ height: '70vh' }}>
          <iframe
            src={getTabUrl(selectedSubject.examFile)}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
            title="试卷"
          />
        </div>
      ),
    },
    {
      key: 'doubt',
      label: '❓ 疑难点',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Card title="📝 记录疑难点" size="small">
            <TextArea
              value={doubtContent}
              onChange={(e) => setDoubtContent(e.target.value)}
              placeholder="在这里记录你的疑难点..."
              rows={15}
              style={{ fontSize: '14px' }}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="primary" onClick={() => {
                // 保存到 localStorage
                const key = `doubt_${selectedSemester}_${selectedSubject.key}`;
                localStorage.setItem(key, doubtContent);
                alert('保存成功！');
              }}>
                保存
              </Button>
            </div>
          </Card>
        </div>
      ),
    },
  ] : [];

  // 如果选择了科目，显示详情页
  if (selectedSubject) {
    return (
      <MainLayout>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button onClick={handleBack}>← 返回</Button>
            <h2 style={{ margin: 0 }}>
              {selectedSubject.icon} {currentGrade?.name} {currentSemester?.name} - {selectedSubject.name}
            </h2>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </div>
      </MainLayout>
    );
  }

  // 否则显示选择页面
  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 24 }}>📚 知识总结</h2>

        {/* 年级选择 */}
        <Card title="选择年级" style={{ marginBottom: 16 }}>
          <Space wrap>
            {gradeConfigs.map(grade => (
              <Button
                key={grade.key}
                type={selectedGrade === grade.key ? 'primary' : 'default'}
                onClick={() => {
                  setSelectedGrade(grade.key);
                  setSelectedSemester(`${grade.key}-up`);
                }}
              >
                {grade.name}
              </Button>
            ))}
          </Space>
        </Card>

        {/* 学期选择 */}
        {currentGrade && (
          <Card title={`${currentGrade.name} - 选择学期`} style={{ marginBottom: 16 }}>
            <Space>
              {currentGrade.semesters.map(semester => (
                <Button
                  key={semester.key}
                  type={selectedSemester === semester.key ? 'primary' : 'default'}
                  onClick={() => setSelectedSemester(semester.key)}
                >
                  {semester.name}
                </Button>
              ))}
            </Space>
          </Card>
        )}

        {/* 科目列表 */}
        {currentSemester && (
          <Card title={`${currentGrade?.name} ${currentSemester.name} - 选择科目`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {currentSemester.subjects.map(subject => (
                <Card
                  key={subject.key}
                  hoverable
                  style={{ borderColor: subject.color }}
                  onClick={() => handleSubjectClick(subject)}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>{subject.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: subject.color }}>
                      {subject.name}
                    </div>
                    <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                      总结 · 试卷 · 疑难点
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* 科目目录 */}
        <Card title="📖 科目目录" style={{ marginTop: 16 }}>
          {gradeConfigs.map(grade => (
            <div key={grade.key} style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 12 }}>{grade.name}</h3>
              {grade.semesters.map(semester => (
                <div key={semester.key} style={{ marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 8, color: '#666' }}>{semester.name}</h4>
                  <Space wrap>
                    {semester.subjects.map(subject => (
                      <Button
                        key={subject.key}
                        icon={subjectIcons[subject.key]}
                        style={{ color: subject.color, borderColor: subject.color }}
                        onClick={() => {
                          setSelectedGrade(grade.key);
                          setSelectedSemester(semester.key);
                          handleSubjectClick(subject);
                        }}
                      >
                        {subject.name}
                      </Button>
                    ))}
                  </Space>
                </div>
              ))}
            </div>
          ))}
        </Card>
      </div>
    </MainLayout>
  );
};

export default KnowledgeSummaryPage;
