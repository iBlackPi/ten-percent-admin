import { useEffect, useState } from 'react';
import { Descriptions, Spin, Table, Tag, message } from 'antd';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import { TaskStatusTag } from '../../components/status-tag';
import type { TaskDetail } from '../../models/types.ts';
import { fmtInt, fmtTime, fmtYuan } from '../../utils/format.ts';
import { go } from '../../utils/router.ts';
import styles from './index.module.scss';

const STAGE: Record<string, string> = { prompt: '描述文字', input: '输入图片', output: '生成结果' };
const DECISION: Record<string, { text: string; color: string }> = {
  pass: { text: '通过', color: 'green' }, review: { text: '待复核', color: 'orange' }, block: { text: '拦截', color: 'red' },
};
const LEDGER: Record<string, string> = { grant: '获得', reserve: '冻结', settle: '消耗', release: '退回' };
const PURPOSE: Record<string, string> = { generate: '生成', repaint: '重绘', text_edit: '文字编辑' };

/**
 * 任务详情：审核 → 模型调用 → 点数流水，串起一次任务的链路。
 * 不展示 prompt、原图、结果图和签名链接。
 */
export const TaskDetailPage = ({ id }: { id: string }) => {
  const [task, setTask] = useState<TaskDetail | null>(null);

  useEffect(() => {
    void api.taskDetail(id).then(setTask).catch((e: Error) => message.error(e.message));
  }, [id]);

  if (!task) return <Spin />;
  return (
    <div>
      <PageHeader back="/tasks" title={`${task.typeLabel}任务`} desc={task.id} />
      <Card className={styles.block}>
        <Descriptions size="small" column={3}>
          <Descriptions.Item label="状态"><TaskStatusTag status={task.status} label={task.statusLabel} /></Descriptions.Item>
          <Descriptions.Item label="进度">{task.progress}</Descriptions.Item>
          <Descriptions.Item label="用户"><a onClick={() => go(`/users/${task.userId}`)}>{task.userId}</a></Descriptions.Item>
          <Descriptions.Item label="创建时间">{fmtTime(task.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{fmtTime(task.updatedAt)}</Descriptions.Item>
          <Descriptions.Item label="果子(预估/结算)">{fmtInt(task.estimatedCredits)} / {fmtInt(task.settledCredits)}</Descriptions.Item>
          <Descriptions.Item label="记忆模式">{task.memoryMode === 'off' ? '临时模式（不读写记忆）' : '开'}</Descriptions.Item>
          <Descriptions.Item label="失败原因" span={2}>{task.errorMessage || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="内容审核" className={styles.block}>
        <Table
          size="small" rowKey={(r) => `${r.stage}:${r.createdAt}`} pagination={false} dataSource={task.moderation} locale={{ emptyText: '没有审核记录（非 AI 任务不审核）' }}
          columns={[
            { title: '时间', dataIndex: 'createdAt', render: fmtTime },
            { title: '环节', dataIndex: 'stage', render: (v: string) => STAGE[v] ?? v },
            { title: '结果', dataIndex: 'decision', render: (v: string) => <Tag color={DECISION[v]?.color}>{DECISION[v]?.text ?? v}</Tag> },
            { title: '风险标签', dataIndex: 'labels', render: (v: string[]) => (v.length ? v.map((l) => <Tag key={l}>{l}</Tag>) : '-') },
            { title: '服务商', dataIndex: 'provider', render: (v: string) => v || '-' },
            { title: '人工复核', dataIndex: 'reviewResult', render: (v: string | null) => v ?? '-' },
          ]}
        />
      </Card>
      <Card title="模型调用" className={styles.block}>
        <Table
          size="small" rowKey={(r) => `${r.provider}:${r.createdAt}`} pagination={false} dataSource={task.calls} locale={{ emptyText: '没有模型调用（端侧或本地处理的任务）' }}
          columns={[
            { title: '时间', dataIndex: 'createdAt', render: fmtTime },
            { title: '服务商 / 模型', render: (_: unknown, r) => `${r.provider} / ${r.model}` },
            { title: '用途', dataIndex: 'purpose', render: (v: string) => PURPOSE[v] ?? v },
            { title: '结果', dataIndex: 'status', render: (v: string) => <TaskStatusTag status={v} label={v === 'succeeded' ? '成功' : '失败'} /> },
            { title: '成本', dataIndex: 'costMilliYuan', align: 'right', render: (v: number | null) => (v === null ? '无价格' : fmtYuan(v)) },
            { title: '图片 / token', align: 'right', render: (_: unknown, r) => `${r.images} / ${r.inputTokens + r.outputTokens}` },
            { title: '错误', dataIndex: 'errorMessage', ellipsis: true },
          ]}
        />
      </Card>
      <Card title="果子流水">
        <Table
          size="small" rowKey={(r) => `${r.action}:${r.createdAt}`} pagination={false} dataSource={task.ledger} locale={{ emptyText: '没有果子流水（免费任务）' }}
          columns={[
            { title: '时间', dataIndex: 'createdAt', render: fmtTime },
            { title: '动作', dataIndex: 'action', render: (v: string) => LEDGER[v] ?? v },
            { title: '果子', dataIndex: 'amount', align: 'right' },
            { title: '操作后余额', dataIndex: 'balanceAfter', align: 'right' },
          ]}
        />
      </Card>
    </div>
  );
};
