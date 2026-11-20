import { useEffect, useState } from 'react';
import { Table, Tooltip, message } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { api } from '../../api';
import { Card } from '../../components/page-header';
import { MetricCard, MetricGrid } from '../../components/metric-card';
import type { BehaviorFeatures, BehaviorParams } from '../../models/types.ts';
import { fmtInt, fmtPercent } from '../../utils/format.ts';
import { fmtMs, toolName } from './labels.ts';
import styles from './index.module.scss';

const head = (title: string, hint: string) => <Tooltip title={hint}><span>{title} <QuestionCircleOutlined className={styles.hint} /></span></Tooltip>;

/** 功能使用：哪个工具有人点、点了有没有用、用了成没成功、为什么失败。 */
export const FeaturesTab = ({ params }: { params: BehaviorParams }) => {
  const [data, setData] = useState<BehaviorFeatures | null>(null);
  useEffect(() => { void api.behaviorFeatures(params).then(setData).catch((e: Error) => message.error(e.message)); }, [params]);
  const a = data?.actions ?? {};
  const cs = a.creation_send;
  const cr = a.creation_result;

  return (
    <>
      <Card title="工具">
        <Table
          size="small" rowKey="tool" pagination={false} loading={!data} dataSource={data?.tools ?? []}
          columns={[
            { title: '工具', dataIndex: 'tool', render: toolName },
            { title: head('打开人数', '进入工具页的去重设备。'), dataIndex: 'openUv', align: 'right', render: fmtInt, sorter: (x, y) => x.openUv - y.openUv },
            { title: head('执行人数', '点了开始处理的去重设备。'), dataIndex: 'runUv', align: 'right', render: fmtInt, sorter: (x, y) => x.runUv - y.runUv },
            { title: head('打开→执行', '低说明入口吸引人，但页面上手难或用户发现不符合预期。'), dataIndex: 'runRate', align: 'right', render: fmtPercent, sorter: (x, y) => (x.runRate ?? 0) - (y.runRate ?? 0) },
            { title: '执行次数', dataIndex: 'runs', align: 'right', render: fmtInt, sorter: (x, y) => x.runs - y.runs },
            { title: head('成功率', '成功 ÷（成功 + 失败）。离开页面没等到结果的不计。'), dataIndex: 'successRate', align: 'right', render: fmtPercent, sorter: (x, y) => (x.successRate ?? 0) - (y.successRate ?? 0) },
            { title: head('平均耗时', '成功的那些，从点击到拿到结果。'), dataIndex: 'avgMs', align: 'right', render: fmtMs, sorter: (x, y) => (x.avgMs ?? 0) - (y.avgMs ?? 0) },
          ]}
        />
      </Card>
      <div className={styles.row}>
        <Card title="图片创作">
          <MetricGrid>
            <MetricCard label="发起" value={fmtInt(cs?.count)} sub={`${fmtInt(cs?.uv)} 人`} />
            <MetricCard label="出图成功" value={fmtInt(cr?.ok)} sub={`失败 ${fmtInt(cr?.fail)}`} hint="每出一张结果图记一次；一轮对话可能出多张。" />
            <MetricCard label="主动停止" value={fmtInt(a.creation_stop?.count)} hint="停止多说明等待太久或方向不对。" />
          </MetricGrid>
        </Card>
        <Card title="其他行为">
          <MetricGrid>
            <MetricCard label="下载 / 保存" value={fmtInt(a.download?.count)} sub={`${fmtInt(a.download?.uv)} 人`} />
            <MetricCard label="上传到我的影像" value={fmtInt(a.upload?.count)} sub={`${fmtInt(a.upload?.uv)} 人`} />
            <MetricCard label="分享" value={fmtInt(a.share_create?.count)} sub={`${fmtInt(a.share_create?.uv)} 人`} />
            <MetricCard label="播放 Live 图" value={fmtInt(a.live_play?.count)} sub={`${fmtInt(a.live_play?.uv)} 人`} />
            <MetricCard label="前端报错" value={fmtInt(a.js_error?.count)} hint="按 10% 采样，实际约为 10 倍；同一条报错一次会话只记一次。" />
          </MetricGrid>
        </Card>
      </div>
      <Card title="失败原因（前 20）">
        <Table
          size="small" rowKey={(r) => `${r.tool}:${r.reason}`} pagination={false} loading={!data} dataSource={data?.failures ?? []}
          columns={[
            { title: '工具', dataIndex: 'tool', render: toolName },
            { title: '原因', dataIndex: 'reason', render: (v: string) => ({ failed: '处理失败', blocked: '内容拦截', error: '请求出错', canceled: '已取消' } as Record<string, string>)[v] ?? v },
            { title: '次数', dataIndex: 'count', align: 'right', render: fmtInt },
          ]}
        />
      </Card>
    </>
  );
};
