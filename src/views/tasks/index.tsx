import { useEffect, useState } from 'react';
import { Input, Select, Table, message } from 'antd';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import { RangeBar } from '../../components/range-bar';
import { TaskStatusTag } from '../../components/status-tag';
import type { DateParams, TaskRow, TasksOverview } from '../../models/types.ts';
import { fmtInt, fmtSec, fmtTime, fmtYuan, presetRange } from '../../utils/format.ts';
import { go } from '../../utils/router.ts';
import styles from './index.module.scss';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  { label: '排队中', value: 'queued' }, { label: '处理中', value: 'running' }, { label: '待复核', value: 'review' },
  { label: '成功', value: 'succeeded' }, { label: '失败', value: 'failed' }, { label: '已拦截', value: 'blocked' },
];
const TYPE_OPTIONS = [
  { label: '抠图', value: 'cutout' }, { label: '证件照', value: 'id_photo' }, { label: '变清晰', value: 'enhance' },
  { label: 'AI出图', value: 'generate' }, { label: 'AI改图', value: 'edit' },
];

/** 任务排障：失败原因排行 + 任务列表。按 taskId / userId 查询不受时间范围限制。 */
export const TasksPage = () => {
  const [range, setRange] = useState<DateParams>(() => presetRange(7));
  const [status, setStatus] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [overview, setOverview] = useState<TasksOverview | null>(null);
  const [data, setData] = useState<{ total: number; items: TaskRow[] }>({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void api.tasksOverview(range).then(setOverview).catch((e: Error) => message.error(e.message));
  }, [range]);

  useEffect(() => {
    setLoading(true);
    // 输入 36 位 id 时，按 taskId 精确找；找不到再当作 userId 找
    const isId = /^[0-9a-f-]{36}$/i.test(keyword);
    const query = { ...range, page, pageSize: PAGE_SIZE, status, type };
    const run = async () => {
      if (!isId) return api.tasks(query);
      const byTask = await api.tasks({ ...query, taskId: keyword });
      return byTask.total ? byTask : api.tasks({ ...query, userId: keyword });
    };
    void run().then(setData).catch((e: Error) => message.error(e.message)).finally(() => setLoading(false));
  }, [range, status, type, keyword, page]);

  const reset = <T,>(setter: (v: T) => void) => (v: T) => { setPage(1); setter(v); };

  return (
    <div>
      <PageHeader title="任务" desc="排查失败、拦截和卡住的任务。点击一行查看完整链路。" actions={<RangeBar onChange={reset(setRange)} />} />
      <Card title="失败与拦截原因（前 10）" className={styles.reasons}>
        <Table
          size="small" rowKey={(r) => `${r.status}:${r.reason}`} pagination={false} loading={!overview} dataSource={overview?.failureReasons ?? []}
          columns={[
            { title: '状态', dataIndex: 'status', width: 100, render: (v: string) => <TaskStatusTag status={v} label={v === 'failed' ? '失败' : '已拦截'} /> },
            { title: '原因（取前 80 字）', dataIndex: 'reason' },
            { title: '次数', dataIndex: 'count', width: 100, align: 'right' },
          ]}
        />
      </Card>
      <Card>
        <div className={styles.filters}>
          <Input.Search className={styles.search} allowClear placeholder="taskId 或 userId" onSearch={reset(setKeyword)} />
          <Select allowClear placeholder="状态" options={STATUS_OPTIONS} value={status} onChange={reset(setStatus)} />
          <Select allowClear placeholder="功能" options={TYPE_OPTIONS} value={type} onChange={reset(setType)} />
        </div>
        <Table<TaskRow>
          rowKey="id" size="small" loading={loading} dataSource={data.items}
          pagination={{ current: page, pageSize: PAGE_SIZE, total: data.total, showSizeChanger: false, onChange: setPage }}
          onRow={(r) => ({ onClick: () => go(`/tasks/${r.id}`) })}
          columns={[
            { title: '时间', dataIndex: 'createdAt', render: fmtTime },
            { title: '功能', dataIndex: 'typeLabel' },
            { title: '状态', render: (_: unknown, r) => <TaskStatusTag status={r.status} label={r.statusLabel} /> },
            { title: '耗时', dataIndex: 'durationSec', align: 'right', render: fmtSec },
            { title: '模型', dataIndex: 'providers', render: (v: string) => v || '-' },
            { title: '果子(预估/结算)', align: 'right', render: (_: unknown, r) => `${fmtInt(r.estimatedCredits)} / ${fmtInt(r.settledCredits)}` },
            { title: '成本', dataIndex: 'costMilliYuan', align: 'right', render: (v: number) => (v ? fmtYuan(v) : '-') },
            { title: '失败原因', dataIndex: 'errorMessage', ellipsis: true },
            { title: '用户', dataIndex: 'userId', render: (v: string) => <span className={styles.id}>{v.slice(0, 8)}</span> },
          ]}
        />
      </Card>
    </div>
  );
};