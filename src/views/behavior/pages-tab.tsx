import { useEffect, useState } from 'react';
import { Table, Tooltip, message } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { api } from '../../api';
import { Card } from '../../components/page-header';
import type { BehaviorParams, PageRow } from '../../models/types.ts';
import { fmtInt, fmtPercent } from '../../utils/format.ts';
import { fmtMs, pageName } from './labels.ts';
import styles from './index.module.scss';

/** 页面：哪些页面有人看、停留多久、用户在哪一页走掉。 */
export const PagesTab = ({ params }: { params: BehaviorParams }) => {
  const [list, setList] = useState<PageRow[] | null>(null);
  useEffect(() => {
    setList(null);
    void api.behaviorPages(params).then(setList).catch((e: Error) => message.error(e.message));
  }, [params]);

  return (
    <Card title="页面">
      <Table
        size="small" rowKey="page" pagination={false} loading={!list} dataSource={list ?? []}
        columns={[
          { title: '页面', dataIndex: 'page', render: (v: string) => <Tooltip title={v}>{pageName(v)}</Tooltip> },
          { title: '浏览量', dataIndex: 'pv', align: 'right', render: fmtInt, sorter: (x, y) => x.pv - y.pv },
          { title: '访客', dataIndex: 'uv', align: 'right', render: fmtInt, sorter: (x, y) => x.uv - y.uv },
          {
            title: <Tooltip title="离开页面时记录的停留时间，超过 30 分钟的按挂机剔除。"><span>平均停留 <QuestionCircleOutlined className={styles.hint} /></span></Tooltip>,
            dataIndex: 'avgMs', align: 'right', render: fmtMs, sorter: (x, y) => (x.avgMs ?? 0) - (y.avgMs ?? 0),
          },
          {
            title: <Tooltip title="会话最后浏览的是这一页的次数 ÷ 浏览量。高说明用户在这里走掉。"><span>离开率 <QuestionCircleOutlined className={styles.hint} /></span></Tooltip>,
            dataIndex: 'exitRate', align: 'right', render: fmtPercent, sorter: (x, y) => (x.exitRate ?? 0) - (y.exitRate ?? 0),
          },
        ]}
      />
    </Card>
  );
};
