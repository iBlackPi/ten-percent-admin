import { http } from './client.ts';
import type {
  AdminAccount, AdminRole, FeatureMode, FeatureView, MapConfigView, Anomaly, AuditItem, DateParams, MeResponse, Overview, Paged, ProviderBoard, TaskDetail, TaskRow, TasksOverview,
  ModelSettingsView, PriceOverridesInput, PromptView, StaticAsset, TimelineItem, TrendPoint, UserAnalytics, UserDetail, UserRow,
  FeedbackItem, FeedbackList, FeedbackStatus, BehaviorEvent, BehaviorFeatures, BehaviorOverview, BehaviorParams, FunnelOptions, FunnelStep, PageRow, RetentionRow,
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
  adjustCredits: async (id: string, body: { delta: number; reason: string }): Promise<{ before: number; after: number }> =>
    (await http.post<{ before: number; after: number }>(`/users/${id}/credits`, body)).data,

  tasksOverview: (p: DateParams) => get<TasksOverview>('/tasks/overview', p),
  tasks: (p: DateParams & { page: number; pageSize: number; status?: string; type?: string; userId?: string; taskId?: string; provider?: string }) =>
    get<Paged<TaskRow>>('/tasks', p),
  taskDetail: (id: string) => get<TaskDetail>(`/tasks/${id}`),
  providers: (p: DateParams) => get<ProviderBoard>('/ai/providers', p),

  behaviorOverview: (p: BehaviorParams) => get<BehaviorOverview>('/behavior/overview', p),
  behaviorFeatures: (p: BehaviorParams) => get<BehaviorFeatures>('/behavior/features', p),
  funnelOptions: () => get<FunnelOptions>('/behavior/funnel/steps'),
  funnel: (p: BehaviorParams & { steps: string }) => get<FunnelStep[]>('/behavior/funnel', p),
  retention: (p: BehaviorParams & { by: 'day' | 'platform' | 'feature' }) => get<RetentionRow[]>('/behavior/retention', p),
  behaviorPages: (p: BehaviorParams) => get<PageRow[]>('/behavior/pages', p),
  behaviorEvents: (p: BehaviorParams & { userId?: string; deviceId?: string; event?: string }) => get<BehaviorEvent[]>('/behavior/events', p),

  feedbacks: (p: { page: number; pageSize: number; status?: string; category?: string; keyword?: string; id?: string }) => get<FeedbackList>('/feedback', p),
  updateFeedback: async (id: string, body: { status?: FeedbackStatus; adminNote?: string }): Promise<FeedbackItem> => (await http.patch<FeedbackItem>(`/feedback/${id}`, body)).data,

  admins: () => get<AdminAccount[]>('/admins'),
  createAdmin: async (body: { email: string; displayName: string; password: string; role: AdminRole }): Promise<void> => { await http.post('/admins', body); },
  updateAdmin: async (id: string, body: { status?: 'active' | 'disabled'; role?: AdminRole; password?: string }): Promise<void> => { await http.patch(`/admins/${id}`, body); },
  audit: (p: { page: number; pageSize: number }) => get<Paged<AuditItem>>('/audit', p),

  mapConfig: () => get<MapConfigView>('/settings/map'),
  saveMapConfig: async (body: { browserKey?: string; serverKey?: string; tencentStaticKey?: string }): Promise<MapConfigView> => (await http.put<MapConfigView>('/settings/map', body)).data,
  features: async (): Promise<FeatureView[]> => (await get<{ items: FeatureView[] }>('/settings/features')).items,
  saveFeature: async (key: string, body: { mode: FeatureMode; members: string[] }): Promise<FeatureView[]> =>
    (await http.put<{ items: FeatureView[] }>(`/settings/features/${key}`, body)).data.items,

  staticAssets: async (): Promise<StaticAsset[]> => (await get<{ items: StaticAsset[] }>('/static-assets')).items,
  uploadStaticAsset: async (file: File, folder: string): Promise<StaticAsset> => {
    const form = new FormData();
    form.append('folder', folder);
    form.append('file', file);
    return (await http.post<StaticAsset>('/static-assets', form, { timeout: 120_000 })).data;
  },

  modelSettings: () => get<ModelSettingsView>('/settings/models'),
  savePrices: async (body: PriceOverridesInput): Promise<ModelSettingsView> => (await http.put<ModelSettingsView>('/settings/models/prices', body)).data,
  saveModelProvider: async (id: string, body: { baseUrl: string; model: string; apiKey?: string }): Promise<ModelSettingsView> =>
    (await http.put<ModelSettingsView>(`/settings/models/providers/${id}`, body)).data,
  saveImageRouting: async (body: { default: 'seedream' | 'qwen'; fallback: boolean }): Promise<ModelSettingsView> =>
    (await http.put<ModelSettingsView>('/settings/models/image-routing', body)).data,
  testModel: async (providerId: string): Promise<{ ok: true; model: string }> => (await http.post<{ ok: true; model: string }>('/settings/models/test', { providerId })).data,
  prompts: async (): Promise<PromptView[]> => (await get<{ items: PromptView[] }>('/settings/prompts')).items,
  savePrompt: async (key: string, content: string): Promise<PromptView[]> => (await http.put<{ items: PromptView[] }>(`/settings/prompts/${key}`, { content })).data.items,
  resetPrompt: async (key: string): Promise<PromptView[]> => (await http.delete<{ items: PromptView[] }>(`/settings/prompts/${key}`)).data.items,
};
