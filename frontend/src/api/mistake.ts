import request from '../utils/request';
import type { Mistake, MistakeForm, ApiResponse, PageResponse } from '../types';

// 获取错题列表
export const getMistakeList = (page: number = 1, size: number = 10) => {
  return request.get<any, ApiResponse<PageResponse<Mistake>>>('/mistakes', {
    params: { page, size },
  });
};

// 获取错题详情
export const getMistake = (id: number) => {
  return request.get<any, ApiResponse<Mistake>>(`/mistakes/${id}`);
};

// 创建错题
export const createMistake = (data: MistakeForm) => {
  return request.post<any, ApiResponse<Mistake>>('/mistakes', data);
};

// 更新错题
export const updateMistake = (id: number, data: MistakeForm) => {
  return request.put<any, ApiResponse<Mistake>>(`/mistakes/${id}`, data);
};

// 删除错题
export const deleteMistake = (id: number) => {
  return request.delete<any, ApiResponse<null>>(`/mistakes/${id}`);
};

// 更新掌握状态
export const updateMistakeStatus = (id: number, status: number) => {
  return request.put<any, ApiResponse<Mistake>>(`/mistakes/${id}/status`, null, {
    params: { status },
  });
};

// 搜索错题
export const searchMistakes = (keyword: string, page: number = 1, size: number = 10) => {
  return request.get<any, ApiResponse<PageResponse<Mistake>>>('/mistakes/search', {
    params: { keyword, page, size },
  });
};

// 按学科筛选
export const getMistakesBySubject = (subject: string, page: number = 1, size: number = 10) => {
  return request.get<any, ApiResponse<PageResponse<Mistake>>>(`/mistakes/subject/${subject}`, {
    params: { page, size },
  });
};

// 获取学科列表
export const getSubjects = () => {
  return request.get<any, ApiResponse<string[]>>('/mistakes/subjects');
};
