import dayjs from 'dayjs';
import type { DateParams } from '../models/types.ts';

export const fmtPercent = (v: number | null | undefined): string => (v === null || v === undefined ? '-' : `${(v * 100).toFixed(1)}%`);
export const fmtInt = (v: number | null | undefined): string => (v === null || v === undefined ? '-' : v.toLocaleString());
/** 成本以毫元存（1 元 = 1000），展示成元。 */
export const fmtYuan = (milli: number | null | undefined): string => (milli === null || milli === undefined ? '-' : `¥${(milli / 1000).toFixed(2)}`);
export const fmtSec = (v: number | null | undefined): string => (v === null || v === undefined ? '-' : v < 60 ? `${v.toFixed(1)} 秒` : `${(v / 60).toFixed(1)} 分钟`);
export const fmtTime = (v: string | null | undefined): string => (v ? dayjs(v).format('MM-DD HH:mm:ss') : '-');
export const fmtDateTime = (v: string | null | undefined): string => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-');

export const DATE_FORMAT = 'YYYY-MM-DD';

export const presetRange = (days: number): DateParams => ({
  from: dayjs().subtract(days - 1, 'day').format(DATE_FORMAT),
  to: dayjs().format(DATE_FORMAT),
});
