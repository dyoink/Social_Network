import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5204/',
  timeout: 10_000,
});

/**
 * Tự động set Content-Type phù hợp.
 * FormData → để browser tự set multipart/form-data (kèm boundary).
 * Còn lại → application/json.
 */
api.interceptors.request.use((config) => {
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = config.headers['Content-Type'] ?? 'application/json';
  }
  return config;
});

/**
 * Tự động đính kèm JWT token vào mọi request.
 * Đọc trực tiếp từ localStorage để tránh circular import với authStore.
 */
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
      const token = parsed?.state?.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Bỏ qua nếu parse lỗi
    }
  }
  return config;
});

/**
 * Xử lý lỗi 401 — token hết hạn hoặc không hợp lệ.
 * Tự động xóa auth state và chuyển về trang đăng nhập.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      // Dùng window.location thay vì navigate để đảm bảo state được clear hoàn toàn
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

import type { ApiResponseOfUploadResultDto } from './api-generated';

/**
 * Upload ảnh qua FormData — bypass Orval generated code (IFormFile mapping lỗi).
 */
export async function uploadImage(file: File): Promise<ApiResponseOfUploadResultDto> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<ApiResponseOfUploadResultDto>('/api/Upload/image', formData);
  return res.data;
}

export default api;