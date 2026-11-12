import { useEffect, useState } from 'react';
import { Checkbox, Input, Select, Table, Tag, message } from 'antd';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import { TaskStatusTag } from '../../components/status-tag';
import type { UserRow } from '../../models/types.ts';
import { fmtDateTime, fmtInt } from '../../utils/format.ts';
import { go } from '../../utils/router.ts';
import styles from './index.module.scss';

const PAGE_SIZE = 20;

/** 用户列表：只含元数据（脱敏邮箱、任务数、点数），不含原图、prompt、记忆内容。 */
export const UsersPage = () => {
  const [keyword, setKeyword] = useState('');
  const [kind, setKind] = useState<string | undefined>();
  const [hasFailed, setHasFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; items: UserRow[] }>({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    void api.users({ page, pageSize: PAGE_SIZE, keyword: keyword || undefined, kind, hasFailed: hasFailed || undefined })
      .then(setData).catch((e: Error) => message.error(e.message)).finally(() => setLoading(false));
  }, [page, keyword, kind, hasFailed]);

  const reset = <T,>(setter: (v: T) => void) => (v: T) => { setPage(1); setter(v); };

  return (
    <div>
      <PageHeader title="用户" desc="按 userId 全串或邮箱片段搜索。邮箱脱敏显示，不展示用户的图片和描述文字。" />
      <Card>
        <div className={styles.filters}>
          <Input.Search className={styles.search} allowClear placeholder="userId 或邮箱片段" onSearch={reset(setKeyword)} />
          <Select
            allowClear placeholder="用户类型" value={kind} onChange={reset(setKind)}
            options={[{ label: '注册用户', value: 'registered' }, { label: '游客', value: 'guest' }]}
          />
          <Checkbox checked={hasFailed} onChange={(e) => reset(setHasFailed)(e.target.checked)}>有失败任务</Checkbox>
        </div>
        <Table<UserRow>
          rowKey="id" size="small" loading={loading} dataSource={data.items}
          pagination={{ current: page, pageSize: PAGE_SIZE, total: data.total, showSizeChanger: false, onChange: setPage }}
          onRow={(r) => ({ onClick: () => go(`/users/${r.id}`) })}
          columns={[
            { title: '用户', render: (_: unknown, r) => <div><div>{r.email || '游客'}</div><div className={styles.id}>{r.id}</div></div> },
            { title: '类型', dataIndex: 'kind', render: (v: string) => (v === 'guest' ? <Tag>游客</Tag> : <Tag color="green">注册</Tag>) },
            { title: '注册时间', dataIndex: 'createdAt', render: fmtDateTime },
            { title: '最近活跃', dataIndex: 'lastSeenAt', render: fmtDateTime },
            { title: '任务(成功/总)', align: 'right', render: (_: unknown, r) => `${fmtInt(r.succeeded)} / ${fmtInt(r.tasks)}` },
            { title: '30 天活跃天数', dataIndex: 'activeDays30', align: 'right' },
            { title: '保存图片', dataIndex: 'savedAssets', align: 'right' },
            { title: '果子余额', dataIndex: 'balance', align: 'right', render: fmtInt },
            { title: '记忆', dataIndex: 'memoryOn', render: (v: boolean) => (v ? '开' : '关') },
            { title: '最近任务', render: (_: unknown, r) => (r.lastTaskStatus ? <TaskStatusTag status={r.lastTaskStatus} label={r.lastTaskStatusLabel} /> : '-') },
          ]}
        />
      </Card>
    </div>
  );
};
