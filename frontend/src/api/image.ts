import request from '../utils/request';
import type { ApiResponse } from '../types';

// 上传图片
export const uploadImage = (file: File, mistakeId?: number, imageType: number = 1) => {
  const formData = new FormData();
  formData.append('file', file);
  if (mistakeId) formData.append('mistakeId', String(mistakeId));
  formData.append('imageType', String(imageType));
  return request.post<any, ApiResponse<{ id: number; imageUrl: string; imageType: number }>>(
    '/images/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
};

// 获取错题图片列表
export const getMistakeImages = (mistakeId: number) => {
  return request.get<any, ApiResponse<Array<{ id: number; imageUrl: string; imageType: number; sortOrder: number }>>>(
    `/images/mistake/${mistakeId}`
  );
};

// 删除图片
export const deleteImage = (id: number) => {
  return request.delete<any, ApiResponse<null>>(`/images/${id}`);
};
