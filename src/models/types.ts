export type AdminRole = 'super_admin' | 'operator' | 'viewer';
export type Permission = 'read_dashboard' | 'read_analytics' | 'read_users' | 'read_tasks' | 'manage_admins' | 'security_audit' | 'manage_settings';

/** 地图服务配置（Key 只回脱敏值） */
/** from：Key 来自后台设置还是服务器 .env；都没有为 null */
export interface MapKeyView { configured: boolean; masked: string; from: 'admin' | 'env' | null; updatedAt: string | null }
export interface MapConfigView { provider: 'tianditu'; browser: MapKeyView; server: MapKeyView }

export const ROLE_LABEL: Record<AdminRole, string> = { super_admin: '超级管理员', operator: '运营', viewer: '只读' };

export interface AdminIdentity { id: string; email: string; displayName: string; role: AdminRole }
export interface MeResponse { admin: AdminIdentity; permissions: Permission[] }

export interface Overview {
  users: { active: number; newUsers: number; newRegistered: number };
  tasks: { total: number; succeeded: number; failed: number; blocked: number; review: number; successRate: number | null; avgSec: number | null; p95Sec: number | null };
  ai: { calls: number; succeeded: number; costMilliYuan: number; unpricedCalls: number };
  credits: { settled: number; released: number };
}

export interface TrendPoint {
  date: string; activeUsers: number; newUsers: number; tasks: number; succeeded: number; costMilliYuan: number; creditsSettled: number;
}

export interface Anomaly { level: 'warn' | 'error'; title: string; detail: string }

export interface Paged<T> { total: number; items: T[] }

export interface UserRow {
  id: string; email: string; kind: 'guest' | 'registered'; createdAt: string; lastSeenAt: string | null;
  tasks: number; succeeded: number; activeDays30: number; savedAssets: number; balance: number | null; memoryOn: boolean;
  lastTaskStatus: string | null; lastTaskStatusLabel: string;
}

export interface UserDetail {
  id: string; email: string; kind: 'guest' | 'registered'; createdAt: string; lastSeenAt: string | null; balance: number | null;
  memory: { enabled: boolean; autoLearn: boolean; activeItems: number };
  tasks: { total: number; succeeded: number; failed: number; blocked: number; activeDays30: number };
  tasksByType: { type: string; label: string; count: number }[];
  assets: { saved: number; total: number };
}

export interface TimelineItem {
  id: string; type: 'task' | 'credit' | 'moderation' | 'asset'; title: string; occurredAt: string; taskId?: string; status?: string;
}

export interface UserAnalytics {
  newUsers: number; newRegistered: number; guestToRegisterRate: number | null; withTaskRate: number | null; withSavedRate: number | null;
  d1: { base: number; kept: number; rate: number | null };
  d7: { base: number; kept: number; rate: number | null };
  activeUsers: number; repeatUsers: number; tasksPerActiveUser: number | null;
}

export interface TaskRow {
  id: string; userId: string; type: string; typeLabel: string; status: string; statusLabel: string; createdAt: string;
  durationSec: number | null; estimatedCredits: number; settledCredits: number; costMilliYuan: number; providers: string; errorMessage: string;
}

export interface TasksOverview {
  byType: {
    type: string; label: string; total: number; users: number; succeeded: number; failed: number; blocked: number; review: number;
    successRate: number | null; savedRate: number | null; p95Sec: number | null;
  }[];
  failureReasons: { status: string; reason: string; count: number }[];
}

export interface TaskDetail {
  id: string; userId: string; type: string; typeLabel: string; status: string; statusLabel: string; progress: string; errorMessage: string;
  memoryMode: string; estimatedCredits: number; settledCredits: number; createdAt: string; updatedAt: string; hasSource: boolean; hasResult: boolean;
  moderation: { stage: string; decision: string; labels: string[]; provider: string; reviewResult: string | null; createdAt: string }[];
  calls: {
    provider: string; model: string; purpose: string; status: string; credits: number; costMilliYuan: number | null; images: number;
    inputTokens: number; outputTokens: number; errorMessage: string; createdAt: string;
  }[];
  ledger: { action: string; amount: number; balanceAfter: number; createdAt: string }[];
}

export interface ProviderBoard {
  providers: {
    provider: string; model: string; calls: number; succeeded: number; failed: number; successRate: number | null;
    costMilliYuan: number; unpricedCalls: number; images: number; costPerSuccessMilliYuan: number | null;
  }[];
  errors: { provider: string; model: string; reason: string; count: number }[];
}

export interface AdminAccount {
  id: string; email: string; displayName: string; role: AdminRole; status: 'active' | 'disabled'; lastLoginAt: string | null; createdAt: string;
}

export interface AuditItem {
  id: string; action: string; resourceType: string | null; resourceId: string | null; reason: string | null; requestId: string | null;
  createdAt: string; adminEmail: string;
}

export interface DateParams { from: string; to: string }
