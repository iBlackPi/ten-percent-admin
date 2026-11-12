import { useEffect, useMemo, useState } from 'react';
import { Alert, Table, message } from 'antd';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import { MetricCard, MetricGrid } from '../../components/metric-card';
import { RangeBar } from '../../components/range-bar';
import { TrendChart } from '../../components/trend-chart';
import type { Anomaly, DateParams, Overview, TasksOverview, TrendPoint, UserAnalytics } from '../../models/types.ts';
import { fmtInt, fmtPercent, fmtSec, fmtYuan, presetRange } from '../../utils/format.ts';
import styles from './index.module.scss';

/** 总览：回答“有没有人来、任务成功了吗、成本是否健康”。口径见各指标的悬停说明。 */
export const DashboardPage = () => {
  const [range, setRange] = useState<DateParams>(() => presetRange(7));
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [users, setUsers] = useState<UserAnalytics | null>(null);
  const [tasks, setTasks] = useState<TasksOverview | null>(null);

  useEffect(() => {
    const fail = (e: Error) => message.error(e.message);
    void api.overview(range).then(setOverview).catch(fail);
    void api.trends(range).then(setTrends).catch(fail);
    void api.userAnalytics(range).then(setUsers).catch(fail);
    void api.tasksOverview(range).then(setTasks).catch(fail);
  }, [range]);

  useEffect(() => {
    const load = () => void api.anomalies().then(setAnomalies).catch(() => undefined);
    load();
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const dates = useMemo(() => trends.map((t) => t.date), [trends]);
  const flow = useMemo(() => [
    { name: '活跃用户', data: trends.map((t) => t.activeUsers), color: '#2176D9' },
    { name: '新增用户', data: trends.map((t) => t.newUsers), color: '#12B886' },
    { name: '任务数', data: trends.map((t) => t.tasks), color: '#E6AD0C' },
    { name: '成功任务', data: trends.map((t) => t.succeeded), color: '#46B90C' },
  ], [trends]);
  const cost = useMemo(() => [
    { name: 'AI 成本(元)', data: trends.map((t) => Number((t.costMilliYuan / 1000).toFixed(2))), color: '#D9221E' },
    { name: '果子消耗', data: trends.map((t) => t.creditsSettled), color: '#9B8AC0' },
  ], [trends]);

  return (
    <div>
      <PageHeader title="总览" desc="时间按北京时间自然日统计。今日数据有约 1 分钟缓存。" actions={<RangeBar onChange={setRange} />} />

      {anomalies.length ? (
        <div className={styles.anomalies}>
          {anomalies.map((a) => <Alert key={a.title} type={a.level === 'error' ? 'error' : 'warning'} showIcon message={a.title} description={a.detail} />)}
        </div>
      ) : null}

      <MetricGrid>
        <MetricCard label="活跃用户" value={fmtInt(overview?.users.active)} hint="区间内发起过云端任务的去重用户。端侧工具（压缩、改尺寸、转格式）不上传图片，暂无埋点，不计入。" />
        <MetricCard label="新增用户" value={fmtInt(overview?.users.newUsers)} sub={`其中已注册 ${fmtInt(overview?.users.newRegistered)}`} hint="含游客。游客首次使用云端工具时自动创建。" />
        <MetricCard label="任务数" value={fmtInt(overview?.tasks.total)} sub={`成功 ${fmtInt(overview?.tasks.succeeded)} / 失败 ${fmtInt(overview?.tasks.failed)} / 拦截 ${fmtInt(overview?.tasks.blocked)}`} />
        <MetricCard label="任务成功率" value={fmtPercent(overview?.tasks.successRate)} hint="成功 ÷ 已结束（成功+失败+拦截）。排队中、处理中、待复核不计入。" sub={`p95 耗时 ${fmtSec(overview?.tasks.p95Sec)}`} />
        <MetricCard label="AI 成本" value={fmtYuan(overview?.ai.costMilliYuan)} hint="来自模型调用记录的估算成本。价格表里没有的模型不计入成本。" sub={overview?.ai.unpricedCalls ? `${overview.ai.unpricedCalls} 次调用没有价格` : `调用 ${fmtInt(overview?.ai.calls)} 次`} />
        <MetricCard label="果子消耗" value={fmtInt(overview?.credits.settled)} sub={`退回 ${fmtInt(overview?.credits.released)}`} hint="果子流水里 settle 的合计；退回为 release。" />
      </MetricGrid>

      <div className={styles.row}>
        <Card title="用户与任务趋势"><TrendChart dates={dates} series={flow} /></Card>
        <Card title="成本与果子趋势"><TrendChart dates={dates} series={cost} /></Card>
      </div>

      <MetricGrid>
        <MetricCard label="D1 留存" value={fmtPercent(users?.d1.rate)} sub={`${fmtInt(users?.d1.kept)} / ${fmtInt(users?.d1.base)} 注册用户`} hint="区间内注册的用户，注册次日当天又发起了云端任务。只统计已满 1 天的注册用户。" />
        <MetricCard label="D7 留存" value={fmtPercent(users?.d7.rate)} sub={`${fmtInt(users?.d7.kept)} / ${fmtInt(users?.d7.base)} 注册用户`} hint="注册后第 7 天当天又发起了云端任务（精确第 7 天，不是 7 天内）。" />
        <MetricCard label="新用户做过任务" value={fmtPercent(users?.withTaskRate)} hint="区间内新增用户里，至少发起过一次云端任务的占比。" />
        <MetricCard label="新用户保存过图片" value={fmtPercent(users?.withSavedRate)} hint="区间内新增用户里，保存过图片到“我的影像”的占比。" />
        <MetricCard label="人均任务数" value={users?.tasksPerActiveUser === null || users === null ? '-' : users.tasksPerActiveUser.toFixed(1)} sub={`累计发起过 2 次以上任务的活跃用户 ${fmtInt(users?.repeatUsers)}`} />
      </MetricGrid>

      <Card title="功能使用与成功率">
        <Table
          size="small" rowKey="type" pagination={false} loading={!tasks} dataSource={tasks?.byType ?? []}
          columns={[
            { title: '功能', dataIndex: 'label' },
            { title: '使用人数', dataIndex: 'users', align: 'right' },
            { title: '任务数', dataIndex: 'total', align: 'right' },
            { title: '成功率', dataIndex: 'successRate', align: 'right', render: fmtPercent },
            { title: '成功后保存率', dataIndex: 'savedRate', align: 'right', render: fmtPercent },
            { title: 'p95 耗时', dataIndex: 'p95Sec', align: 'right', render: fmtSec },
          ]}
        />
      </Card>
    </div>
  );
};
