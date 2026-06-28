import React, { useState } from 'react';
import { Card, Collapse, Button, Space, Tag } from 'antd';
import { BookOutlined, CodeOutlined, GlobalOutlined, StarOutlined } from '@ant-design/icons';
import MainLayout from '../../components/layout/MainLayout';
import { gradeConfigs } from './config';
import type { SubjectConfig } from './config';

const { Panel } = Collapse;

const subjectIcons: Record<string, React.ReactNode> = {
  chinese: <BookOutlined />,
  math: <CodeOutlined />,
  english: <GlobalOutlined />,
  key: <StarOutlined />,
};

const KnowledgeSummaryPage: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<string>('grade1');
  const [selectedSemester, setSelectedSemester] = useState<string>('grade1-up');

  const currentGrade = gradeConfigs.find(g => g.key === selectedGrade);
  const currentSemester = currentGrade?.semesters.find(s => s.key === selectedSemester);

  const handleSubjectClick = (semesterKey: string, subject: SubjectConfig) => {
    // 跳转到对应的 HTML 页面
    const url = `/knowledge/${semesterKey}/${subject.htmlFile}`;
    window.open(url, '_blank');
  };

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
          <Card title={`${currentGrade?.name} ${currentSemester.name} - 知识点`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {currentSemester.subjects.map(subject => (
                <Card
                  key={subject.key}
                  hoverable
                  style={{ borderColor: subject.color }}
                  onClick={() => handleSubjectClick(selectedSemester, subject)}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>{subject.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: subject.color }}>
                      {subject.name}
                    </div>
                    <Tag color={subject.color} style={{ marginTop: 8 }}>
                      点击查看
                    </Tag>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* 知识点列表 */}
        <Card title="📖 知识点目录" style={{ marginTop: 16 }}>
          <Collapse>
            {gradeConfigs.map(grade => (
              <Panel header={grade.name} key={grade.key}>
                {grade.semesters.map(semester => (
                  <div key={semester.key} style={{ marginBottom: 16 }}>
                    <h4 style={{ marginBottom: 8 }}>{semester.name}</h4>
                    <Space wrap>
                      {semester.subjects.map(subject => (
                        <Button
                          key={subject.key}
                          icon={subjectIcons[subject.key]}
                          style={{ color: subject.color, borderColor: subject.color }}
                          onClick={() => handleSubjectClick(semester.key, subject)}
                        >
                          {subject.name}
                        </Button>
                      ))}
                    </Space>
                  </div>
                ))}
              </Panel>
            ))}
          </Collapse>
        </Card>
      </div>
    </MainLayout>
  );
};

export default KnowledgeSummaryPage;
