import request from '../utils/request';
import type { ApiResponse } from '../types';

export interface KnowledgeDoubt {
  id?: number;
  userId?: number;
  semesterKey: string;
  subjectKey: string;
  content: string;
  createTime?: string;
  updateTime?: string;
}

// 获取疑难点
export const getDoubt = (semesterKey: string, subjectKey: string) => {
  return request.get<any, ApiResponse<KnowledgeDoubt>>('/knowledge/doubt', {
    params: { semesterKey, subjectKey }
  });
};

// 保存疑难点
export const saveDoubt = (data: { semesterKey: string; subjectKey: string; content: string }) => {
  return request.post<any, ApiResponse<KnowledgeDoubt>>('/knowledge/doubt', data);
};
