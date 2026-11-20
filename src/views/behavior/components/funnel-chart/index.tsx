import { Progress } from 'antd';
import type { FunnelStep } from '../../../../models/types.ts';
import { fmtInt, fmtPercent } from '../../../../utils/format.ts';
import styles from './index.module.scss';

/** 漏斗：每步一条横条，长度按第一步人数缩放；右侧是相对上一步和相对第一步的转化率。 */
export const FunnelChart = ({ steps }: { steps: FunnelStep[] }) => {
  const first = steps[0]?.count ?? 0;
  return (
    <div className={styles.funnel}>
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1]!.count : 0;
        return (
          <div key={s.key} className={styles.step}>
            <div className={styles.label}>{`${i + 1}. ${s.label}`}</div>
            <Progress className={styles.track} percent={first ? (s.count / first) * 100 : 0} showInfo={false} strokeColor="#2176D9" size={['100%', 20]} />
            <div className={styles.count}>{fmtInt(s.count)}</div>
            <div className={styles.rate}>{i ? `较上一步 ${fmtPercent(prev ? s.count / prev : null)}` : ''}</div>
            <div className={styles.rate}>{i ? `较第一步 ${fmtPercent(first ? s.count / first : null)}` : ''}</div>
          </div>
        );
      })}
    </div>
  );
};
