import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Descriptions, Form, InputNumber, Input, Modal, Radio, Spin, Tag, Timeline, message } from 'antd';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import { MetricCard, MetricGrid } from '../../components/metric-card';
import type { TimelineItem, UserDetail } from '../../models/types.ts';
import { fmtDateTime, fmtInt, fmtPercent, fmtTime } from '../../utils/format.ts';
import { useStores } from '../../stores/root.tsx';
import { go } from '../../utils/router.ts';
import styles from './index.module.scss';

const DOT: Record<TimelineItem['type'], string> = { task: 'blue', credit: 'gold', moderation: 'red', asset: 'green', behavior: 'gray' };

/** 用户详情：回答“这个用户经历了什么”。默认不展示原图、prompt、记忆内容。 */
export const UserDetailPage = observer(({ id }: { id: string }) => {
  const { session } = useStores();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [adjusting, setAdjusting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<{ mode: 'add' | 'sub'; amount: number; reason: string }>();

  const load = () => {
    const fail = (e: Error) => message.error(e.message);
    void api.userDetail(id).then(setUser).catch(fail);
    void api.userTimeline(id).then(setTimeline).catch(fail);
  };
  useEffect(load, [id]);

  const submit = async (v: { mode: 'add' | 'sub'; amount: number; reason: string }) => {
    setSubmitting(true);
    try {
      const r = await api.adjustCredits(id, { delta: v.mode === 'add' ? v.amount : -v.amount, reason: v.reason });
      message.success(`已调整，余额 ${r.before} → ${r.after}`);
      setAdjusting(false);
      form.resetFields();
      load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <Spin />;
  const { tasks } = user;
  return (
    <div>
      <PageHeader back="/users" title={user.phone || user.email || '游客'} desc={user.id} />
      <Card className={styles.info}>
        <Descriptions size="small" column={3}>
          <Descriptions.Item label="手机号">{user.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="微信">{user.wechatBound ? '已绑定' : '未绑定'}</Descriptions.Item>
          <Descriptions.Item label="类型">{user.kind === 'guest' ? <Tag>游客</Tag> : <Tag color="green">注册用户</Tag>}</Descriptions.Item>
          <Descriptions.Item label="注册时间">{fmtDateTime(user.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="最近活跃">{fmtDateTime(user.lastSeenAt)}</Descriptions.Item>
          <Descriptions.Item label="果子余额">
            {fmtInt(user.balance)}
            {session.can('adjust_credits') ? <Button size="small" className={styles.adjust} onClick={() => setAdjusting(true)}>调整果子</Button> : null}
          </Descriptions.Item>
          <Descriptions.Item label="记忆">{user.memory.enabled ? `开（${user.memory.activeItems} 条生效）` : '关'}{user.memory.enabled && !user.memory.autoLearn ? '，不自动学习' : ''}</Descriptions.Item>
          <Descriptions.Item label="保存图片">{fmtInt(user.assets.saved)}</Descriptions.Item>
        </Descriptions>
      </Card>
      <MetricGrid>
        <MetricCard label="总任务" value={fmtInt(tasks.total)} sub={`成功 ${tasks.succeeded} / 失败 ${tasks.failed} / 拦截 ${tasks.blocked}`} />
        <MetricCard label="成功率" value={fmtPercent(tasks.succeeded + tasks.failed + tasks.blocked ? tasks.succeeded / (tasks.succeeded + tasks.failed + tasks.blocked) : null)} />
        <MetricCard label="近 30 天活跃天数" value={fmtInt(tasks.activeDays30)} hint="有云端任务的自然日数量。" />
        {user.tasksByType.map((t) => <MetricCard key={t.type} label={t.label} value={fmtInt(t.count)} />)}
      </MetricGrid>
      <Card title="行为时间线（最近 100 条）">
        <Timeline
          className={styles.timeline}
          items={timeline.map((item) => ({
            color: DOT[item.type],
            children: (
              <div>
                <span className={styles.time}>{fmtTime(item.occurredAt)}</span>
                <span>{item.title}</span>
                {item.taskId ? <a className={styles.link} onClick={() => go(`/tasks/${item.taskId}`)}>查看任务</a> : null}
              </div>
            ),
          }))}
        />
      </Card>
      <Modal title="调整果子" open={adjusting} confirmLoading={submitting} onCancel={() => setAdjusting(false)} onOk={() => form.submit()} destroyOnClose okText="确认调整">
        <p className={styles.tip}>当前余额 {fmtInt(user.balance)}。调整会立即生效，用户在“果子明细”里能看到一条“赠送 / 充值”或“扣除”记录，原因只记在后台审计里。</p>
        <Form form={form} layout="vertical" initialValues={{ mode: 'add' }} onFinish={(v) => void submit(v)}>
          <Form.Item name="mode" label="操作">
            <Radio.Group options={[{ label: '充值', value: 'add' }, { label: '扣减', value: 'sub' }]} optionType="button" />
          </Form.Item>
          <Form.Item name="amount" label="果子数量" rules={[{ required: true, message: '请输入数量' }, { type: 'number', min: 1, max: 100000, message: '数量需在 1 到 100000 之间' }]}>
            <InputNumber precision={0} min={1} max={100000} className={styles.amount} />
          </Form.Item>
          <Form.Item name="reason" label="原因（必填，记入审计）" rules={[{ required: true, min: 2, message: '请填写原因，例如：内测用户补偿' }]}>
            <Input.TextArea rows={2} maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});
