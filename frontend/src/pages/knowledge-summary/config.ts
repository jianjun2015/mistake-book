// 知识总结配置
export interface GradeConfig {
  key: string;
  name: string;
  semesters: SemesterConfig[];
}

export interface SemesterConfig {
  key: string;
  name: string;
  subjects: SubjectConfig[];
}

export interface SubjectConfig {
  key: string;
  name: string;
  icon: string;
  color: string;
  htmlFile: string;
}

// 年级配置
export const gradeConfigs: GradeConfig[] = [
  {
    key: 'grade1',
    name: '一年级',
    semesters: [
      {
        key: 'grade1-up',
        name: '上学期',
        subjects: [
          { key: 'chinese', name: '语文', icon: '📖', color: '#eb2f96', htmlFile: 'chinese.html' },
          { key: 'math', name: '数学', icon: '🔢', color: '#ff4d4f', htmlFile: 'math.html' },
          { key: 'english', name: '英语', icon: '🔤', color: '#faad14', htmlFile: 'english.html' },
          { key: 'key', name: '重点', icon: '⭐', color: '#722ed1', htmlFile: 'key.html' },
        ]
      },
      {
        key: 'grade1-down',
        name: '下学期',
        subjects: [
          { key: 'chinese', name: '语文', icon: '📖', color: '#eb2f96', htmlFile: 'chinese.html' },
          { key: 'math', name: '数学', icon: '🔢', color: '#ff4d4f', htmlFile: 'math.html' },
          { key: 'english', name: '英语', icon: '🔤', color: '#faad14', htmlFile: 'english.html' },
          { key: 'key', name: '重点', icon: '⭐', color: '#722ed1', htmlFile: 'key.html' },
        ]
      }
    ]
  },
  {
    key: 'grade2',
    name: '二年级',
    semesters: [
      {
        key: 'grade2-up',
        name: '上学期',
        subjects: [
          { key: 'chinese', name: '语文', icon: '📖', color: '#eb2f96', htmlFile: 'chinese.html' },
          { key: 'math', name: '数学', icon: '🔢', color: '#ff4d4f', htmlFile: 'math.html' },
          { key: 'english', name: '英语', icon: '🔤', color: '#faad14', htmlFile: 'english.html' },
          { key: 'key', name: '重点', icon: '⭐', color: '#722ed1', htmlFile: 'key.html' },
        ]
      },
      {
        key: 'grade2-down',
        name: '下学期',
        subjects: [
          { key: 'chinese', name: '语文', icon: '📖', color: '#eb2f96', htmlFile: 'chinese.html' },
          { key: 'math', name: '数学', icon: '🔢', color: '#ff4d4f', htmlFile: 'math.html' },
          { key: 'english', name: '英语', icon: '🔤', color: '#faad14', htmlFile: 'english.html' },
          { key: 'key', name: '重点', icon: '⭐', color: '#722ed1', htmlFile: 'key.html' },
        ]
      }
    ]
  },
  {
    key: 'grade3',
    name: '三年级',
    semesters: [
      {
        key: 'grade3-up',
        name: '上学期',
        subjects: [
          { key: 'chinese', name: '语文', icon: '📖', color: '#eb2f96', htmlFile: 'chinese.html' },
          { key: 'math', name: '数学', icon: '🔢', color: '#ff4d4f', htmlFile: 'math.html' },
          { key: 'english', name: '英语', icon: '🔤', color: '#faad14', htmlFile: 'english.html' },
          { key: 'key', name: '重点', icon: '⭐', color: '#722ed1', htmlFile: 'key.html' },
        ]
      },
      {
        key: 'grade3-down',
        name: '下学期',
        subjects: [
          { key: 'chinese', name: '语文', icon: '📖', color: '#eb2f96', htmlFile: 'chinese.html' },
          { key: 'math', name: '数学', icon: '🔢', color: '#ff4d4f', htmlFile: 'math.html' },
          { key: 'english', name: '英语', icon: '🔤', color: '#faad14', htmlFile: 'english.html' },
          { key: 'key', name: '重点', icon: '⭐', color: '#722ed1', htmlFile: 'key.html' },
        ]
      }
    ]
  },
  {
    key: 'grade4',
    name: '四年级',
    semesters: [
      {
        key: 'grade4-up',
        name: '上学期',
        subjects: [
          { key: 'chinese', name: '语文', icon: '📖', color: '#eb2f96', htmlFile: 'chinese.html' },
          { key: 'math', name: '数学', icon: '🔢', color: '#ff4d4f', htmlFile: 'math.html' },
          { key: 'english', name: '英语', icon: '🔤', color: '#faad14', htmlFile: 'english.html' },
          { key: 'key', name: '重点', icon: '⭐', color: '#722ed1', htmlFile: 'key.html' },
        ]
      },
      {
        key: 'grade4-down',
        name: '下学期',
        subjects: [
          { key: 'chinese', name: '语文', icon: '📖', color: '#eb2f96', htmlFile: 'chinese.html' },
          { key: 'math', name: '数学', icon: '🔢', color: '#ff4d4f', htmlFile: 'math.html' },
          { key: 'english', name: '英语', icon: '🔤', color: '#faad14', htmlFile: 'english.html' },
          { key: 'key', name: '重点', icon: '⭐', color: '#722ed1', htmlFile: 'key.html' },
        ]
      }
    ]
  },
  {
    key: 'grade5',
    name: '五年级',
    semesters: [
      {
        key: 'grade5-up',
        name: '上学期',
        subjects: [
          { key: 'chinese', name: '语文', icon: '📖', color: '#eb2f96', htmlFile: 'chinese.html' },
          { key: 'math', name: '数学', icon: '🔢', color: '#ff4d4f', htmlFile: 'math.html' },
          { key: 'english', name: '英语', icon: '🔤', color: '#faad14', htmlFile: 'english.html' },
          { key: 'key', name: '重点', icon: '⭐', color: '#722ed1', htmlFile: 'key.html' },
        ]
      },
      {
        key: 'grade5-down',
        name: '下学期',
        subjects: [
          { key: 'chinese', name: '语文', icon: '📖', color: '#eb2f96', htmlFile: 'chinese.html' },
          { key: 'math', name: '数学', icon: '🔢', color: '#ff4d4f', htmlFile: 'math.html' },
          { key: 'english', name: '英语', icon: '🔤', color: '#faad14', htmlFile: 'english.html' },
          { key: 'key', name: '重点', icon: '⭐', color: '#722ed1', htmlFile: 'key.html' },
        ]
      }
    ]
  }
];

// 获取年级配置
export const getGradeConfig = (gradeKey: string): GradeConfig | undefined => {
  return gradeConfigs.find(g => g.key === gradeKey);
};

// 获取学期配置
export const getSemesterConfig = (semesterKey: string): { grade: GradeConfig; semester: SemesterConfig } | undefined => {
  for (const grade of gradeConfigs) {
    const semester = grade.semesters.find(s => s.key === semesterKey);
    if (semester) {
      return { grade, semester };
    }
  }
  return undefined;
};
