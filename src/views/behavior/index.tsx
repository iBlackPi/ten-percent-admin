import { useMemo, useState } from 'react';
import { Select, Tabs } from 'antd';
import { PageHeader } from '../../components/page-header';
import { RangeBar } from '../../components/range-bar';
import type { BehaviorKind, BehaviorParams, BehaviorPlatform, DateParams } from '../../models/types.ts';
import { presetRange } from '../../utils/format.ts';
import { OverviewTab } from './overview-tab.tsx';
import { FeaturesTab } from './features-tab.tsx';
import { FunnelTab } from './funnel-tab.tsx';
import { RetentionTab } from './retention-tab.tsx';
import { PagesTab } from './pages-tab.tsx';
import { EventsTab } from './events-tab.tsx';
import styles from './index.module.scss';

/**
 * 用户行为：PC / H5 / 小程序埋点的分析页。所有 Tab 共用时间、端、用户类型三个筛选。
 * 数据有 5 分钟缓存；只渲染当前 Tab，切换时才查询。
 */
export const BehaviorPage = () => {
  const [range, setRange] = useState<DateParams>(() => presetRange(7));
  const [platform, setPlatform] = useState<BehaviorPlatform | undefined>();
  const [kind, setKind] = useState<BehaviorKind | undefined>();
  const [tab, setTab] = useState('overview');
  const params = useMemo<BehaviorParams>(() => ({ ...range, platform, kind }), [range, platform, kind]);

  const filters = (
    <div className={styles.actions}>
      <Select
        allowClear placeholder="全部端" className={styles.select} value={platform} onChange={setPlatform}
        options={[{ label: 'PC', value: 'web' }, { label: 'H5', value: 'h5' }, { label: '小程序', value: 'weapp' }]}
      />
      <Select
        allowClear placeholder="全部用户" className={styles.select} value={kind} onChange={setKind}
        options={[{ label: '未登录', value: 'anon' }, { label: '游客', value: 'guest' }, { label: '正式用户', value: 'member' }]}
      />
      <RangeBar onChange={setRange} />
    </div>
  );

  return (
    <div>
      <PageHeader title="用户行为" desc="来自 PC、H5、小程序的埋点。按北京时间自然日统计，数据有约 5 分钟缓存。" actions={filters} />
      <Tabs
        activeKey={tab} onChange={setTab} destroyInactiveTabPane
        items={[
          { key: 'overview', label: '概览', children: <OverviewTab params={params} /> },
          { key: 'features', label: '功能使用', children: <FeaturesTab params={params} /> },
          { key: 'funnel', label: '漏斗', children: <FunnelTab params={params} /> },
          { key: 'retention', label: '留存', children: <RetentionTab params={params} /> },
          { key: 'pages', label: '页面', children: <PagesTab params={params} /> },
          { key: 'events', label: '事件明细', children: <EventsTab params={params} /> },
        ]}
      />
    </div>
  );
};
