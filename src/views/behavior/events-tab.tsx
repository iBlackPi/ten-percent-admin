import { useEffect, useState } from 'react';
import { Button, Input, Table, message } from 'antd';
import { api } from '../../api';
import { Card } from '../../components/page-header';
import type { BehaviorEvent, BehaviorParams } from '../../models/types.ts';
import { fmtTime } from '../../utils/format.ts';
import { go } from '../../utils/router.ts';
import { PLATFORM_LABEL, pageName } from './labels.ts';
import styles from './index.module.scss';

interface Filter { userId: string; deviceId: string; event: string }

/** 事件明细：按用户、设备或事件名查最近 200 条原始事件，用来验收埋点和排查个案。 */
export const EventsTab = ({ params }: { params: BehaviorParams }) => {
  const [draft, setDraft] = useState<Filter>({ userId: '', deviceId: '', event: '' });
  const [filter, setFilter] = useState<Filter>(draft);
  const [list, setList] = useState<BehaviorEvent[] | null>(null);

  useEffect(() => {
    setList(null);
    const q = { ...params, userId: filter.userId || undefined, deviceId: filter.deviceId || undefined, event: filter.event || undefined };
    void api.behaviorEvents(q).then(setList).catch((e: Error) => message.error(e.message));
  }, [params, filter]);

  const set = (k: keyof Filter) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [k]: e.target.value.trim() });

  return (
    <Card title="事件明细（最近 200 条）">
      <div className={styles.filters}>
        <Input allowClear placeholder="用户 ID" value={draft.userId} onChange={set('userId')} />
        <Input allowClear placeholder="设备 ID" value={draft.deviceId} onChange={set('deviceId')} />
        <Input allowClear placeholder="事件名，如 执行工具" value={draft.event} onChange={set('event')} />
        <Button type="primary" onClick={() => setFilter(draft)}>查询</Button>
      </div>
      <Table
        size="small" rowKey="id" loading={!list} dataSource={list ?? []} pagination={{ pageSize: 50, showSizeChanger: false }}
        columns={[
          { title: '时间', dataIndex: 'createdAt', render: fmtTime, width: 140 },
          { title: '事件', dataIndex: 'eventLabel', width: 140, render: (v: string, r) => <span title={r.event}>{v}</span> },
          { title: '端', dataIndex: 'platform', render: (v: string) => PLATFORM_LABEL[v] ?? v, width: 70 },
          { title: '页面', dataIndex: 'page', render: (v: string | null) => (v ? pageName(v) : '-'), width: 140 },
          {
            title: '用户', dataIndex: 'userId', width: 120,
            render: (v: string | null, r) => (v
              ? <a onClick={() => go(`/users/${v}`)}>{v.slice(0, 8)}</a>
              : <a onClick={() => { const next = { ...draft, deviceId: r.deviceId }; setDraft(next); setFilter(next); }}>{`设备 ${r.deviceId.slice(0, 8)}`}</a>),
          },
          { title: '属性', dataIndex: 'propsText', render: (v: string, r) => <span className={styles.props} title={JSON.stringify(r.props)}>{v || '-'}</span> },
        ]}
      />
    </Card>
  );
};
