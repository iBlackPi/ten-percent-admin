import { useEffect, useState } from 'react';
import { Table, message } from 'antd';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import { RangeBar } from '../../components/range-bar';
import type { DateParams, ProviderBoard } from '../../models/types.ts';
import { fmtInt, fmtPercent, fmtYuan, presetRange } from '../../utils/format.ts';
import styles from './index.module.scss';

/** AI 服务商看板：回答“今天变慢或失败多，是哪家模型的问题”。成本为估算，价格表里没有的模型不计成本。 */
export const ProvidersPage = () => {
  const [range, setRange] = useState<DateParams>(() => presetRange(7));
  const [board, setBoard] = useState<ProviderBoard | null>(null);

  useEffect(() => {
    void api.providers(range).then(setBoard).catch((e: Error) => message.error(e.message));
  }, [range]);

  return (
    <div>
      <PageHeader title="AI 服务商" desc="模型调用记录里没有单次耗时，暂不展示延迟。成本为估算值。" actions={<RangeBar onChange={setRange} />} />
      <Card title="服务商 / 模型" className={styles.block}>
        <Table
          size="small" rowKey={(r) => `${r.provider}:${r.model}`} pagination={false} loading={!board} dataSource={board?.providers ?? []}
          columns={[
            { title: '服务商', dataIndex: 'provider' },
            { title: '模型', dataIndex: 'model' },
            { title: '调用数', dataIndex: 'calls', align: 'right', render: fmtInt },
            { title: '失败数', dataIndex: 'failed', align: 'right', render: fmtInt },
            { title: '成功率', dataIndex: 'successRate', align: 'right', render: fmtPercent },
            { title: '图片数', dataIndex: 'images', align: 'right', render: fmtInt },
            { title: '估算成本', dataIndex: 'costMilliYuan', align: 'right', render: (v: number, r) => (r.unpricedCalls ? `${fmtYuan(v)}（${r.unpricedCalls} 次无价格）` : fmtYuan(v)) },
            { title: '成功单次成本', dataIndex: 'costPerSuccessMilliYuan', align: 'right', render: fmtYuan },
          ]}
        />
      </Card>
      <Card title="失败原因（前 15）">
        <Table
          size="small" rowKey={(r) => `${r.provider}:${r.model}:${r.reason}`} pagination={false} loading={!board} dataSource={board?.errors ?? []}
          columns={[
            { title: '服务商 / 模型', render: (_: unknown, r) => `${r.provider} / ${r.model}` },
            { title: '原因（取前 80 字）', dataIndex: 'reason' },
            { title: '次数', dataIndex: 'count', align: 'right', width: 100 },
          ]}
        />
      </Card>
    </div>
  );
};
