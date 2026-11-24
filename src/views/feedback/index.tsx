import { useCallback, useEffect, useState } from 'react';
import { Button, Drawer, Image, Input, Segmented, Select, Table, Tag, message } from 'antd';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import type { FeedbackItem, FeedbackList, FeedbackStatus } from '../../models/types.ts';
import { fmtDateTime } from '../../utils/format.ts';
import { go, useRoute } from '../../utils/router.ts';
import styles from './index.module.scss';

const PAGE_SIZE = 20;
const STATUS_LABEL: Record<FeedbackStatus, string> = { new: '待处理', processing: '处理中', resolved: '已解决', ignored: '已忽略' };
const STATUS_COLOR: Record<FeedbackStatus, string> = { new: 'red', processing: 'blue', resolved: 'green', ignored: 'default' };
const CATEGORY_OPTIONS = [
  { label: '遇到问题', value: 'bug' }, { label: '功能建议', value: 'suggestion' }, { label: '吐槽', value: 'complaint' }, { label: '其他', value: 'other' },
];
const PLATFORM_LABEL: Record<string, string> = { web: '网页', h5: '手机网页', weapp: '小程序' };

/** 用户反馈：查看、改状态、写备注。邮件里的链接带 ?id=，打开后直接展开该条。 */
export const FeedbackPage = () => {
  const route = useRoute();
  const linkedId = route.query.get('id') ?? undefined;
  const [status, setStatus] = useState<string>('all');
  const [category, setCategory] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FeedbackList>({ total: 0, items: [], statusCounts: {} });
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<FeedbackItem | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return api.feedbacks({ page, pageSize: PAGE_SIZE, status: status === 'all' ? undefined : status, category, keyword: keyword || undefined, id: linkedId })
      .then(setData).catch((e: Error) => message.error(e.message)).finally(() => setLoading(false));
  }, [page, status, category, keyword, linkedId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (linkedId && data.items[0]?.id === linkedId) { setCurrent(data.items[0]); setNote(data.items[0].adminNote); }
  }, [linkedId, data.items]);

  const open = (item: FeedbackItem) => { setCurrent(item); setNote(item.adminNote); };
  const close = () => { setCurrent(null); if (linkedId) go('/feedback'); };

  const save = async (patch: { status?: FeedbackStatus; adminNote?: string }) => {
    if (!current) return;
    setSaving(true);
    try {
      const next = await api.updateFeedback(current.id, patch);
      setCurrent(next);
      setData((d) => ({ ...d, items: d.items.map((i) => (i.id === next.id ? next : i)) }));
      message.success('已保存');
      void load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const counts = data.statusCounts;
  const all = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const statusOptions = [
    { label: `全部 ${all}`, value: 'all' },
    ...(Object.keys(STATUS_LABEL) as FeedbackStatus[]).map((s) => ({ label: `${STATUS_LABEL[s]} ${counts[s] ?? 0}`, value: s })),
  ];

  return (
    <div>
      <PageHeader title="用户反馈" desc="用户在设置里提交的吐槽、问题和建议。新反馈会同时发邮件到通知邮箱。" />
      <Card>
        <div className={styles.filters}>
          <Segmented value={status} options={statusOptions} onChange={(v) => { setPage(1); setStatus(String(v)); }} />
          <Select allowClear placeholder="类型" value={category} options={CATEGORY_OPTIONS} onChange={(v) => { setPage(1); setCategory(v); }} />
          <Input.Search className={styles.search} allowClear placeholder="内容、联系方式、手机号、邮箱" onSearch={(v) => { setPage(1); setKeyword(v); }} />
        </div>
        <Table<FeedbackItem>
          rowKey="id" size="small" loading={loading} dataSource={data.items}
          pagination={{ current: page, pageSize: PAGE_SIZE, total: data.total, showSizeChanger: false, onChange: setPage }}
          onRow={(r) => ({ onClick: () => open(r) })}
          columns={[
            { title: '状态', dataIndex: 'status', width: 90, render: (v: FeedbackStatus) => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag> },
            { title: '类型', dataIndex: 'categoryLabel', width: 90 },
            { title: '内容', dataIndex: 'content', render: (v: string, r) => <div className={styles.summary}>{v}{r.images.length ? `（${r.images.length} 张图）` : ''}</div> },
            { title: '用户', render: (_: unknown, r) => (<div><div>{r.userLabel}</div>{r.contact ? <div className={styles.sub}>{r.contact}</div> : null}</div>) },
            { title: '来源', dataIndex: 'platform', width: 100, render: (v: string) => PLATFORM_LABEL[v] ?? v },
            { title: '提交时间', dataIndex: 'createdAt', width: 150, render: fmtDateTime },
          ]}
        />
      </Card>
      <Drawer open={!!current} onClose={close} width={560} title={current ? `${current.categoryLabel} · ${fmtDateTime(current.createdAt)}` : ''}>
        {current ? (
          <div>
            <div className={styles.section}><div className={styles.content}>{current.content}</div></div>
            {current.images.length ? (
              <div className={styles.section}>
                <div className={styles.label}>截图</div>
                <div className={styles.thumbs}>
                  <Image.PreviewGroup>
                    {current.images.map((img) => <Image key={img.url} src={img.thumb} width={96} height={96} preview={{ src: img.url }} />)}
                  </Image.PreviewGroup>
                </div>
              </div>
            ) : null}
            <div className={styles.section}>
              <div className={styles.label}>用户</div>
              <div>
                {current.userId ? <a onClick={() => go(`/users/${current.userId}`)}>{current.userLabel}</a> : current.userLabel}
                {current.isGuest ? <Tag>游客</Tag> : null}
              </div>
              <div className={styles.label}>联系方式（用户主动留的）</div>
              <div>{current.contact || '未留'}</div>
            </div>
            <div className={styles.section}>
              <div className={styles.label}>环境</div>
              <div className={styles.env}>
                {PLATFORM_LABEL[current.platform] ?? current.platform}
                {Object.entries(current.clientEnv).map(([k, v]) => <div key={k}>{k}：{v}</div>)}
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.label}>处理状态</div>
              <Segmented
                value={current.status} disabled={saving}
                options={(Object.keys(STATUS_LABEL) as FeedbackStatus[]).map((s) => ({ label: STATUS_LABEL[s], value: s }))}
                onChange={(v) => void save({ status: v as FeedbackStatus })}
              />
            </div>
            <div className={styles.section}>
              <div className={styles.label}>内部备注（用户看不到）</div>
              <Input.TextArea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
              <div className={styles.actions}>
                <Button type="primary" loading={saving} disabled={note === current.adminNote} onClick={() => void save({ adminNote: note })}>保存备注</Button>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};
