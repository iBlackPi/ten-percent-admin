import { useState } from 'react';
import { DatePicker, Segmented } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { DateParams } from '../../models/types.ts';
import { DATE_FORMAT, presetRange } from '../../utils/format.ts';
import styles from './index.module.scss';

type Preset = 'today' | '7' | '30' | 'custom';
type Dates = null | [Dayjs | null, Dayjs | null];
const MAX_DAYS = 30;

/** 时间筛选：今天 / 近 7 天 / 近 30 天 / 自定义。自定义最长 30 天，与接口限制一致。 */
export const RangeBar = ({ onChange }: { onChange: (range: DateParams) => void }) => {
  const [preset, setPreset] = useState<Preset>('7');
  const [start, setStart] = useState<Dayjs | null>(null);

  const pick = (value: Preset) => {
    setPreset(value);
    if (value === 'today') onChange(presetRange(1));
    if (value === '7') onChange(presetRange(7));
    if (value === '30') onChange(presetRange(30));
  };

  const pickCustom = (dates: Dates) => {
    if (dates?.[0] && dates[1]) onChange({ from: dates[0].format(DATE_FORMAT), to: dates[1].format(DATE_FORMAT) });
  };

  const disabledDate = (d: Dayjs) => d.isAfter(dayjs(), 'day') || (start !== null && Math.abs(d.diff(start, 'day')) >= MAX_DAYS);

  return (
    <div className={styles.bar}>
      <Segmented
        value={preset}
        onChange={(v) => pick(v as Preset)}
        options={[{ label: '今天', value: 'today' }, { label: '近 7 天', value: '7' }, { label: '近 30 天', value: '30' }, { label: '自定义', value: 'custom' }]}
      />
      {preset === 'custom' ? (
        <DatePicker.RangePicker
          className={styles.picker}
          allowClear={false}
          disabledDate={disabledDate}
          onCalendarChange={(dates: Dates) => setStart(dates?.[0] && !dates[1] ? dates[0] : null)}
          onChange={pickCustom}
        />
      ) : null}
    </div>
  );
};
