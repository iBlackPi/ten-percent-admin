import { Tag } from 'antd';

const COLOR: Record<string, string> = {
  succeeded: 'success', failed: 'error', blocked: 'volcano', review: 'warning', running: 'processing', queued: 'default',
};

export const TaskStatusTag = ({ status, label }: { status: string; label?: string }) => (
  <Tag color={COLOR[status] ?? 'default'}>{label ?? status}</Tag>
);
