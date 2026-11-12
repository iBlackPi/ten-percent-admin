import { http } from './client.ts';
import type {
  AdminAccount, AdminRole, MapConfigView, Anomaly, AuditItem, DateParams, MeResponse, Overview, Paged, ProviderBoard, TaskDetail, TaskRow, TasksOverview,
  TimelineItem, TrendPoint, UserAnalytics, UserDetail, UserRow,
} from '../models/types.ts';

const get = async <T>(url: string, params?: object): Promise<T> => (await http.get<T>(url, { params })).data;

export const api = {
  login: async (email: string, password: string): Promise<MeResponse> => (await http.post<MeResponse>('/auth/login', { email, password })).data,
  logout: async (): Promise<void> => { await http.post('/auth/logout'); },
  me: () => get<MeResponse>('/auth/me'),

  overview: (p: DateParams) => get<Overview>('/dashboard/overview', p),
  trends: (p: DateParams) => get<TrendPoint[]>('/dashboard/trends', p),
  anomalies: () => get<Anomaly[]>('/dashboard/anomalies'),

  userAnalytics: (p: DateParams) => get<UserAnalytics>('/analytics/users', p),
  users: (p: { page: number; pageSize: number; keyword?: string; kind?: string; hasFailed?: boolean }) => get<Paged<UserRow>>('/users', p),
  userDetail: (id: string) => get<UserDetail>(`/users/${id}`),
  userTimeline: (id: string) => get<TimelineItem[]>(`/users/${id}/timeline`),

  tasksOverview: (p: DateParams) => get<TasksOverview>('/tasks/overview', p),
  tasks: (p: DateParams & { page: number; pageSize: number; status?: string; type?: string; userId?: string; taskId?: string; provider?: string }) =>
    get<Paged<TaskRow>>('/tasks', p),
  taskDetail: (id: string) => get<TaskDetail>(`/tasks/${id}`),
  providers: (p: DateParams) => get<ProviderBoard>('/ai/providers', p),

  admins: () => get<AdminAccount[]>('/admins'),
  createAdmin: async (body: { email: string; displayName: string; password: string; role: AdminRole }): Promise<void> => { await http.post('/admins', body); },
  updateAdmin: async (id: string, body: { status?: 'active' | 'disabled'; role?: AdminRole; password?: string }): Promise<void> => { await http.patch(`/admins/${id}`, body); },
  audit: (p: { page: number; pageSize: number }) => get<Paged<AuditItem>>('/audit', p),

  mapConfig: () => get<MapConfigView>('/settings/map'),
  saveMapConfig: async (body: { browserKey?: string; serverKey?: string }): Promise<MapConfigView> => (await http.put<MapConfigView>('/settings/map', body)).data,
};
