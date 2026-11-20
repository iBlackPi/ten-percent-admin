export type AdminRole = 'super_admin' | 'operator' | 'viewer';
export type Permission = 'read_dashboard' | 'read_analytics' | 'read_users' | 'read_tasks' | 'manage_admins' | 'security_audit' | 'manage_settings' | 'adjust_credits';

/** 地图服务配置（Key 只回脱敏值） */
/** from：Key 来自后台设置还是服务器 .env；都没有为 null */
export interface MapKeyView { configured: boolean; masked: string; from: 'admin' | 'env' | null; updatedAt: string | null }
/** 前端静态图片：path 是相对静态目录的路径，url 是公开链接 */
export interface StaticAsset { path: string; url: string; size: number; uploadedAt: string }
export interface MapConfigView { provider: 'tianditu'; browser: MapKeyView; server: MapKeyView; tencentStatic: MapKeyView }
/** 灰度开关：off 关闭 / whitelist 只对白名单 / all 全量 */
export type FeatureMode = 'off' | 'whitelist' | 'all';
export interface FeatureView { key: 'video' | 'live'; label: string; mode: FeatureMode; members: Array<{ id: string; label: string }>; updatedAt: string | null }

export interface ModelProviderSetting {
  id: 'dashscope' | 'deepseek' | 'openai' | 'ark';
  label: string;
  kind: 'text' | 'image';
  baseUrl: string;
  model: string;
  hasKey: boolean;
  maskedKey: string;
}

export interface ImageRoutingView {
  default: 'seedream' | 'qwen' | null;
  fallback: boolean;
  effective: 'seedream' | 'qwen' | null;
  effectiveLabel: string | null;
  problem: string | null;
  configured: Array<'seedream' | 'qwen'>;
  recentUsage: Array<{ provider: string; model: string; images: number; failed: number }>;
}

export interface ModelPriceRow {
  id: string; label: string; provider: 'seedream' | 'qwen';
  /** 单次估算成本（元）：典型尺寸、不带参考图 */
  costYuan: number;
  autoGenerate: number; autoEdit: number;
  overrideGenerate: number | null; overrideEdit: number | null;
  generate: number; edit: number;
}
export interface SinglePrice { auto: number; override: number | null; current: number }
export interface PricesView { yuanPerCredit: number; models: ModelPriceRow[]; enhanceAi: SinglePrice; eraseVolc: SinglePrice }
export interface PriceOverridesInput {
  models: Record<string, { generate?: number; edit?: number }>;
  enhanceAi?: number;
  eraseVolc?: number;
}

export interface ModelSettingsView { providers: ModelProviderSetting[]; imageRouting: ImageRoutingView; prices: PricesView }

export interface PromptView {
  key: string;
  group: string;
  title: string;
  desc: string;
  placeholders: string[];
  needsJson: boolean;
  default: string;
  content: string;
  overridden: boolean;
  updatedAt: string | null;
}

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
  id: string; email: string; phone: string; kind: 'guest' | 'registered'; createdAt: string; lastSeenAt: string | null;
  tasks: number; succeeded: number; activeDays30: number; savedAssets: number; balance: number | null; memoryOn: boolean;
  lastTaskStatus: string | null; lastTaskStatusLabel: string;
}

export interface UserDetail {
  id: string; email: string; phone: string; wechatBound: boolean; kind: 'guest' | 'registered'; createdAt: string; lastSeenAt: string | null; balance: number | null;
  memory: { enabled: boolean; autoLearn: boolean; activeItems: number };
  tasks: { total: number; succeeded: number; failed: number; blocked: number; activeDays30: number };
  tasksByType: { type: string; label: string; count: number }[];
  assets: { saved: number; total: number };
}

export interface TimelineItem {
  id: string; type: 'task' | 'credit' | 'moderation' | 'asset' | 'behavior'; title: string; occurredAt: string; taskId?: string; status?: string;
}

export interface UserAnalytics {
  newUsers: number; newRegistered: number; guestToRegisterRate: number | null; withTaskRate: number | null; withSavedRate: number | null;
  d1: { base: number; kept: number; rate: number | null };
  d7: { base: number; kept: number; rate: number | null };
  activeUsers: number; repeatUsers: number; tasksPerActiveUser: number | null;
}

export interface TaskRow {
  id: string; userId: string; type: string; typeLabel: string; status: string; statusLabel: string; createdAt: string;
  durationSec: number | null; estimatedCredits: number; settledCredits: number; costMilliYuan: number; providers: string; errorMessage: string; callError: string;
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

/** 用户行为（埋点）筛选：端、用户类型（未登录 / 游客 / 正式用户） */
export type BehaviorPlatform = 'web' | 'h5' | 'weapp';
export type BehaviorKind = 'anon' | 'guest' | 'member';
export interface BehaviorParams extends DateParams { platform?: BehaviorPlatform; kind?: BehaviorKind }

export interface BehaviorOverview {
  totals: { uv: number; users: number; sessions: number; pv: number; events: number; avgSessionSec: number | null; p50SessionSec: number | null };
  daily: Array<{ day: string; uv: number; users: number; pv: number; web: number; h5: number; weapp: number }>;
  channels: Array<{ channel: string; uv: number }>;
}

export interface BehaviorToolRow {
  tool: string; openUv: number; runUv: number; runs: number; succeeded: number; failed: number;
  successRate: number | null; avgMs: number | null; runRate: number | null;
}
export interface BehaviorAction { count: number; uv: number; ok: number; fail: number }
export interface BehaviorFeatures {
  tools: BehaviorToolRow[];
  failures: Array<{ tool: string; reason: string; count: number }>;
  actions: Record<string, BehaviorAction | undefined>;
  orders: { created: number; paid: number; paidUsers: number; paidFen: number };
}

export interface FunnelStep { key: string; label: string; count: number }
export interface FunnelOptions { steps: Array<{ key: string; label: string }>; presets: Array<{ key: string; label: string; steps: string[] }> }
export interface RetentionRow { group: string; size: number; d1: number | null; d3: number | null; d7: number | null; d14: number | null }
export interface PageRow { page: string; pv: number; uv: number; avgMs: number | null; exitRate: number | null }
export interface BehaviorEvent {
  id: string; event: string; userId: string | null; deviceId: string; sessionId: string; platform: string; page: string | null;
  props: Record<string, unknown>; createdAt: string;
}
