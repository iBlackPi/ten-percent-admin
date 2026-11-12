import axios, { AxiosError, type AxiosInstance } from 'axios';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void): void => {
  onUnauthorized = fn;
};

/** 管理后台只用同域 HttpOnly Cookie 鉴权，不在前端存任何 token。 */
export const http: AxiosInstance = axios.create({
  baseURL: '/api/admin/v1',
  withCredentials: true,
  timeout: 30_000,
});

http.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ code?: string; message?: string }>) => {
    const status = error.response?.status ?? 0;
    if (status === 401 && onUnauthorized && !String(error.config?.url ?? '').startsWith('/auth/')) onUnauthorized();
    return Promise.reject(new ApiError(error.response?.data?.code ?? 'NETWORK', error.response?.data?.message ?? '网络异常，请稍后重试', status));
  },
);
