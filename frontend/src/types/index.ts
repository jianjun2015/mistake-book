export interface Mistake {
  id: number;
  userId: number;
  title: string;
  content: string;
  correctAnswer: string;
  wrongReason: string;
  subject: string;
  difficulty: number;
  tags: string[];
  status: number; // 0-未掌握, 1-半掌握, 2-已掌握
  reviewCount: number;
  nextReviewTime: string;
  createTime: string;
  updateTime: string;
  images: ImageInfo[];
}

export interface ImageInfo {
  id: number;
  imageUrl: string;
  imageType: number; // 1-题目图片, 2-答案图片, 3-解析图片
  sortOrder: number;
}

export interface MistakeForm {
  title?: string;
  content: string;
  correctAnswer?: string;
  wrongReason?: string;
  subject?: string;
  difficulty?: number;
  tags?: string;
  status?: number;
}

export interface Subject {
  code: string;
  name: string;
  color: string;
}

export const SUBJECTS: Subject[] = [
  { code: 'MATH', name: '数学', color: '#ff4d4f' },
  { code: 'PHYSICS', name: '物理', color: '#1890ff' },
  { code: 'CHEMISTRY', name: '化学', color: '#52c41a' },
  { code: 'BIOLOGY', name: '生物', color: '#722ed1' },
  { code: 'ENGLISH', name: '英语', color: '#faad14' },
  { code: 'CHINESE', name: '语文', color: '#eb2f96' },
];

export const SUBJECT_MAP = SUBJECTS.reduce((map, s) => {
  map[s.code] = s;
  return map;
}, {} as Record<string, Subject>);

export const STATUS_MAP = {
  0: { label: '未掌握', color: 'error' },
  1: { label: '半掌握', color: 'warning' },
  2: { label: '已掌握', color: 'success' },
};

export const IMAGE_TYPE_MAP = {
  1: '题目图片',
  2: '答案图片',
  3: '解析图片',
  4: '其他',
};

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ========== 用户认证相关类型 ==========

export interface UserInfo {
  id: number;
  username: string;
  grade: number;
  gradeName: string;
  gender: number;
  genderName: string;
  createTime: string;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
  grade: number;
  gender: number;
}

export interface LoginResult {
  token: string;
  user: UserInfo;
}

export const GRADE_OPTIONS = [
  { value: 1, label: '一年级' },
  { value: 2, label: '二年级' },
  { value: 3, label: '三年级' },
  { value: 4, label: '四年级' },
  { value: 5, label: '五年级' },
  { value: 6, label: '六年级' },
  { value: 7, label: '初一' },
  { value: 8, label: '初二' },
  { value: 9, label: '初三' },
  { value: 10, label: '高一' },
  { value: 11, label: '高二' },
  { value: 12, label: '高三' },
];

export const GENDER_OPTIONS = [
  { value: 1, label: '男' },
  { value: 2, label: '女' },
];
