import { useEffect, useMemo, useState } from 'react';
import { Table, message } from 'antd';
import { api } from '../../api';
import { Card } from '../../components/page-header';
import { MetricCard, MetricGrid } from '../../components/metric-card';
import { TrendChart } from '../../components/trend-chart';
import type { BehaviorFeatures, BehaviorOverview, BehaviorParams } from '../../models/types.ts';
import { fmtInt, fmtPercent, fmtSec } from '../../utils/format.ts';
import styles from './index.module.scss';

/** 概览：来了多少人、用了多久、从哪来，以及关键行为的人数。 */
export const OverviewTab = ({ params }: { params: BehaviorParams }) => {
  const [data, setData] = useState<BehaviorOverview | null>(null);
  const [features, setFeatures] = useState<BehaviorFeatures | null>(null);
  useEffect(() => {
    const fail = (e: Error) => message.error(e.message);
    void api.behaviorOverview(params).then(setData).catch(fail);
    void api.behaviorFeatures(params).then(setFeatures).catch(fail);
  }, [params]);

  const dates = useMemo(() => data?.daily.map((d) => d.day) ?? [], [data]);
  const visits = useMemo(() => [
    { name: '访客', data: data?.daily.map((d) => d.uv) ?? [], color: '#2176D9' },
    { name: '登录用户', data: data?.daily.map((d) => d.users) ?? [], color: '#46B90C' },
  ], [data]);
  const byPlatform = useMemo(() => [
    { name: 'PC', data: data?.daily.map((d) => d.web) ?? [], color: '#2176D9' },
    { name: 'H5', data: data?.daily.map((d) => d.h5) ?? [], color: '#E6AD0C' },
    { name: '小程序', data: data?.daily.map((d) => d.weapp) ?? [], color: '#46B90C' },
  ], [data]);
  const t = data?.totals;
  const a = features?.actions ?? {};
  const uvOf = (e: string) => a[e]?.uv ?? 0;
  const rateOf = (e: string) => (t?.uv ? uvOf(e) / t.uv : null);

  return (
    <>
      <MetricGrid>
        <MetricCard label="访客" value={fmtInt(t?.uv)} hint="去重设备数。同一台设备换账号算一个访客；H5 和 PC 在同一浏览器里算同一台设备。" sub={`其中登录用户 ${fmtInt(t?.users)}`} />
        <MetricCard label="浏览量" value={fmtInt(t?.pv)} sub={t?.uv ? `人均 ${(t.pv / t.uv).toFixed(1)} 页` : undefined} />
        <MetricCard label="会话" value={fmtInt(t?.sessions)} hint="30 分钟无操作算一次新会话。" sub={t?.uv ? `人均 ${(t.sessions / t.uv).toFixed(1)} 次` : undefined} />
        <MetricCard label="会话时长" value={fmtSec(t?.p50SessionSec)} hint="会话内第一条到最后一条事件的间隔，取中位数；只有一条事件的会话不计。" sub={`平均 ${fmtSec(t?.avgSessionSec)}`} />
        <MetricCard label="使用过工具" value={fmtPercent(rateOf('tool_open'))} hint="打开过任一工具页的访客占比。" sub={`${fmtInt(uvOf('tool_open'))} 人`} />
        <MetricCard label="发起过创作" value={fmtPercent(rateOf('creation_send'))} sub={`${fmtInt(uvOf('creation_send'))} 人`} />
        <MetricCard label="下载 / 保存过" value={fmtPercent(rateOf('download'))} hint="下载到本地或保存到我的影像。" sub={`${fmtInt(uvOf('download'))} 人`} />
        <MetricCard label="分享过" value={fmtPercent(rateOf('share_create'))} sub={`${fmtInt(uvOf('share_create'))} 人`} />
      </MetricGrid>
      <div className={styles.row}>
        <Card title="访客趋势"><TrendChart dates={dates} series={visits} /></Card>
        <Card title="各端访客"><TrendChart dates={dates} series={byPlatform} /></Card>
      </div>
      <div className={styles.row}>
        <Card title="首次来源渠道（前 10）">
          <Table
            size="small" rowKey="channel" pagination={false} loading={!data} dataSource={data?.channels ?? []}
            columns={[
              { title: '渠道', dataIndex: 'channel', render: (v: string) => (v === 'direct' ? '直接访问' : v) },
              { title: '访客', dataIndex: 'uv', align: 'right', render: fmtInt },
            ]}
          />
        </Card>
        <Card title="付费（服务端订单）">
          <MetricGrid>
            <MetricCard label="下单" value={fmtInt(features?.orders.created)} />
            <MetricCard label="支付成功" value={fmtInt(features?.orders.paid)} sub={`${fmtInt(features?.orders.paidUsers)} 人`} />
            <MetricCard label="收入" value={features ? `¥${(features.orders.paidFen / 100).toFixed(2)}` : '-'} hint="以 payment_orders 表为准，不受埋点丢失影响。按用户类型筛选对这里不生效。" />
          </MetricGrid>
        </Card>
      </div>
    </>
  );
};
