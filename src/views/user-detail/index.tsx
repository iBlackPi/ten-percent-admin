import { useEffect, useState } from 'react';
import { Descriptions, Spin, Tag, Timeline, message } from 'antd';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import { MetricCard, MetricGrid } from '../../components/metric-card';
import type { TimelineItem, UserDetail } from '../../models/types.ts';
import { fmtDateTime, fmtInt, fmtPercent, fmtTime } from '../../utils/format.ts';
import { go } from '../../utils/router.ts';
import styles from './index.module.scss';

const DOT: Record<TimelineItem['type'], string> = { task: 'blue', credit: 'gold', moderation: 'red', asset: 'green' };

/** 用户详情：回答“这个用户经历了什么”。默认不展示原图、prompt、记忆内容。 */
export const UserDetailPage = ({ id }: { id: string }) => {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  useEffect(() => {
    const fail = (e: Error) => message.error(e.message);
    void api.userDetail(id).then(setUser).catch(fail);
    void api.userTimeline(id).then(setTimeline).catch(fail);
  }, [id]);

  if (!user) return <Spin />;
  const { tasks } = user;
  return (
    <div>
      <PageHeader back="/users" title={user.email || '游客'} desc={user.id} />
      <Card className={styles.info}>
        <Descriptions size="small" column={3}>
          <Descriptions.Item label="类型">{user.kind === 'guest' ? <Tag>游客</Tag> : <Tag color="green">注册用户</Tag>}</Descriptions.Item>
          <Descriptions.Item label="注册时间">{fmtDateTime(user.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="最近活跃">{fmtDateTime(user.lastSeenAt)}</Descriptions.Item>
          <Descriptions.Item label="果子余额">{fmtInt(user.balance)}</Descriptions.Item>
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
    </div>
  );
};
