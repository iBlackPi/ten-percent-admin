/** 埋点里的英文键 → 后台显示的中文名。没收录的原样显示。 */
export const TOOL_LABEL: Record<string, string> = {
  compress: '图片压缩', resize: '改尺寸 / 裁剪', convert: '格式转换', cutout: '智能抠图', id_photo: '证件照', 'id-photo': '证件照',
  enhance: '变清晰', erase: '去水印 / 去杂物', edit: 'AI 改图', generate: 'AI 出图', collage: '拼图', watermark: '加水印',
  mosaic: '图片打码', 'aigc-detect': 'AI 图片鉴别', creation: '图片创作',
};

export const PLATFORM_LABEL: Record<string, string> = { web: 'PC', h5: 'H5', weapp: '小程序' };

export const PAGE_LABEL: Record<string, string> = {
  home: '首页', create: '图片创作', tools: '图片工具', photos: '我的影像', 'photos/detail': '图片详情', 'photos/timeline': '时光旅行',
  'photos/footprints': '我的足迹', 'photos/moments': '照片', tasks: '创作任务', 'task-detail': '任务详情', memory: '小果记忆',
  credits: '获取果子', recharge: '充值', account: '设置', settings: '设置', mine: '我的', login: '登录', portal: '门户', legal: '用户协议',
  share: '分享页', photo: '图片详情', record: '打卡', moments: '照片', timeline: '时光旅行', footprints: '我的足迹', admin: '内容复核',
};

export const toolName = (k: string): string => TOOL_LABEL[k] ?? k;

export const pageName = (k: string): string => {
  if (PAGE_LABEL[k]) return PAGE_LABEL[k]!;
  const m = /^tools?\/(.+)$/.exec(k);
  return m ? `工具 · ${toolName(m[1]!)}` : k;
};

export const fmtMs = (v: number | null | undefined): string => {
  if (v === null || v === undefined) return '-';
  if (v < 1000) return `${Math.round(v)} 毫秒`;
  if (v < 60_000) return `${(v / 1000).toFixed(1)} 秒`;
  return `${(v / 60_000).toFixed(1)} 分钟`;
};
