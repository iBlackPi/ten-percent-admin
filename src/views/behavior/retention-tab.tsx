import { useEffect, useState } from 'react';
import { Segmented, Table, message } from 'antd';
import { api } from '../../api';
import { Card } from '../../components/page-header';
import type { BehaviorParams, RetentionRow } from '../../models/types.ts';
import { fmtInt, fmtPercent } from '../../utils/format.ts';
import { PLATFORM_LABEL, toolName } from './labels.ts';
import styles from './index.module.scss';

type By = 'day' | 'platform' | 'feature';
const GROUP_TITLE: Record<By, string> = { day: '首次访问日', platform: '首次使用的端', feature: '首日用过的功能' };

/** 留存：新设备首次访问后第 N 天还回来的比例。按功能分组能看出「用过哪个功能的人更愿意回来」。 */
export const RetentionTab = ({ params }: { params: BehaviorParams }) => {
  const [by, setBy] = useState<By>('day');
  const [list, setList] = useState<RetentionRow[] | null>(null);
  useEffect(() => {
    setList(null);
    void api.retention({ ...params, by }).then(setList).catch((e: Error) => message.error(e.message));
  }, [params, by]);

  const groupText = (v: string) => (by === 'platform' ? PLATFORM_LABEL[v] ?? v : by === 'feature' ? toolName(v) : v);
  const rateCol = (key: 'd1' | 'd3' | 'd7' | 'd14', title: string) => ({
    title, dataIndex: key, align: 'right' as const, render: fmtPercent,
    sorter: (x: RetentionRow, y: RetentionRow) => (x[key] ?? -1) - (y[key] ?? -1),
  });

  return (
    <Card
      title="新用户留存"
      extra={<Segmented value={by} onChange={(v) => setBy(v as By)} options={[{ label: '按日期', value: 'day' }, { label: '按端', value: 'platform' }, { label: '按首日功能', value: 'feature' }]} />}
    >
      <p className={styles.tip}>
        新设备 = 区间内首次出现、且之前 30 天没出现过的设备。第 N 天留存 = 首次访问后第 N 天当天又有任何行为。还没到第 N 天的设备不进分母，显示「-」表示还没有数据。
      </p>
      <Table
        size="small" rowKey="group" pagination={false} loading={!list} dataSource={list ?? []}
        columns={[
          { title: GROUP_TITLE[by], dataIndex: 'group', render: groupText },
          { title: '新设备', dataIndex: 'size', align: 'right', render: fmtInt, sorter: (x, y) => x.size - y.size },
          rateCol('d1', '次日'), rateCol('d3', '第 3 天'), rateCol('d7', '第 7 天'), rateCol('d14', '第 14 天'),
        ]}
      />
    </Card>
  );
};
