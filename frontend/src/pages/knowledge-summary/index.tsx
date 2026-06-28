import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Tabs, Input, Empty, message } from 'antd';
import MainLayout from '../../components/layout/MainLayout';
import { gradeConfigs } from './config';
import type { SubjectConfig } from './config';
import { getDoubt, saveDoubt } from '../../api/knowledge';

const { TextArea } = Input;

const KnowledgeSummaryPage: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<string>('grade3');
  const [selectedSemester, setSelectedSemester] = useState<string>('grade3-down');
  const [selectedSubject, setSelectedSubject] = useState<SubjectConfig | null>(null);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [doubtContent, setDoubtContent] = useState<string>('');
  const [, setDoubtId] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const currentGrade = gradeConfigs.find(g => g.key === selectedGrade);
  const currentSemester = currentGrade?.semesters.find(s => s.key === selectedSemester);

  // 加载疑难点内容
  useEffect(() => {
    if (selectedSubject && selectedSemester) {
      loadDoubt();
    }
  }, [selectedSubject, selectedSemester]);

  const loadDoubt = async () => {
    if (!selectedSubject || !selectedSemester) return;
    
    try {
      const res = await getDoubt(selectedSemester, selectedSubject.key);
      if (res.data) {
        setDoubtContent(res.data.content || '');
        setDoubtId(res.data.id);
      }
    } catch (err) {
      console.error('加载疑难点失败', err);
      setDoubtContent('');
      setDoubtId(undefined);
    }
  };

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

  const handleSaveDoubt = async () => {
    if (!selectedSubject || !selectedSemester) return;
    
    setSaving(true);
    try {
      await saveDoubt({
        semesterKey: selectedSemester,
        subjectKey: selectedSubject.key,
        content: doubtContent,
      });
      message.success('保存成功！');
    } catch (err) {
      console.error('保存疑难点失败', err);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
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
          {selectedSubject.examFile ? (
            <iframe
              src={getTabUrl(selectedSubject.examFile)}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
              title="试卷"
            />
          ) : (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#fafafa',
              borderRadius: '8px'
            }}>
              <Empty description="暂无试卷" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'doubt',
      label: '❓ 疑难点',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Card 
            title={`${currentGrade?.name} ${currentSemester?.name} - ${selectedSubject.name} 疑难点`} 
            size="small"
          >
            <TextArea
              value={doubtContent}
              onChange={(e) => setDoubtContent(e.target.value)}
              placeholder={`记录${currentGrade?.name}${currentSemester?.name}${selectedSubject.name}的疑难点...`}
              rows={15}
              style={{ fontSize: '14px' }}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="primary" loading={saving} onClick={handleSaveDoubt}>
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
      </div>
    </MainLayout>
  );
};

export default KnowledgeSummaryPage;
