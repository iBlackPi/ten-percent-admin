import { useEffect, useState } from 'react';
import { Button, Select, Segmented, message } from 'antd';
import { api } from '../../api';
import { Card } from '../../components/page-header';
import type { BehaviorParams, FunnelOptions, FunnelStep } from '../../models/types.ts';
import { FunnelChart } from './components/funnel-chart';
import styles from './index.module.scss';

/** 漏斗：预置 4 条核心路径，也可自选 2 到 5 步。同一人从第一步起 24 小时内按顺序完成才算。 */
export const FunnelTab = ({ params }: { params: BehaviorParams }) => {
  const [options, setOptions] = useState<FunnelOptions | null>(null);
  const [preset, setPreset] = useState('activation');
  const [custom, setCustom] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [result, setResult] = useState<FunnelStep[] | null>(null);

  useEffect(() => {
    void api.funnelOptions().then((o) => { setOptions(o); setSteps(o.presets[0]?.steps ?? []); }).catch((e: Error) => message.error(e.message));
  }, []);
  useEffect(() => {
    if (steps.length < 2) return;
    setResult(null);
    void api.funnel({ ...params, steps: steps.join(',') }).then(setResult).catch((e: Error) => message.error(e.message));
  }, [params, steps]);

  const pickPreset = (key: string) => {
    setPreset(key);
    const p = options?.presets.find((x) => x.key === key);
    if (p) setSteps(p.steps);
  };

  return (
    <Card
      title="转化漏斗"
      extra={(
        <Segmented
          value={preset}
          onChange={(v) => pickPreset(String(v))}
          options={[...(options?.presets ?? []).map((p) => ({ label: p.label, value: p.key })), { label: '自定义', value: 'custom' }]}
        />
      )}
    >
      {preset === 'custom' ? (
        <div className={styles.funnelPicker}>
          <Select
            mode="multiple" className={styles.stepSelect} placeholder="按顺序选择 2 到 5 步" value={custom} maxCount={5}
            options={options?.steps.map((s) => ({ label: s.label, value: s.key }))} onChange={setCustom}
          />
          <Button type="primary" disabled={custom.length < 2} onClick={() => setSteps(custom)}>查看</Button>
        </div>
      ) : null}
      <p className={styles.tip}>
        人数按「有登录用登录账号，没登录用设备」去重。同一人从第一步起 24 小时内按顺序完成下一步才算转化。付费漏斗的最后一步是前端确认到账，实际收入以概览里的服务端订单为准。
      </p>
      {result ? <FunnelChart steps={result} /> : <div className={styles.empty}>{steps.length < 2 ? '请选择步骤' : '计算中…'}</div>}
    </Card>
  );
};
