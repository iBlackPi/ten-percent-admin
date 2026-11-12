import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import styles from './index.module.scss';

/** 指标卡：大数字 + 口径说明（悬停查看）+ 一行补充信息。 */
export const MetricCard = ({ label, value, hint, sub }: { label: string; value: ReactNode; hint?: string; sub?: ReactNode }) => (
  <div className={styles.card}>
    <div className={styles.label}>
      <span>{label}</span>
      {hint ? <Tooltip title={hint}><QuestionCircleOutlined className={styles.hint} /></Tooltip> : null}
    </div>
    <div className={styles.value}>{value}</div>
    {sub ? <div className={styles.sub}>{sub}</div> : null}
  </div>
);

export const MetricGrid = ({ children }: { children: ReactNode }) => <div className={styles.grid}>{children}</div>;
