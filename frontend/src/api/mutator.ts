import type { AxiosRequestConfig } from 'axios';
import api from './axios';

/**
 * Orval mutator — bọc axios instance có JWT interceptor.
 * Trả về data trực tiếp thay vì AxiosResponse để code gọi gọn hơn.
 */
export function customMutator<T>(config: AxiosRequestConfig): Promise<T> {
  return api.request<T>(config).then((res) => res.data);
}
