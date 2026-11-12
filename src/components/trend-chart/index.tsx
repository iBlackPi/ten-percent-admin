import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import styles from './index.module.scss';

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

export interface TrendSeries { name: string; data: number[]; color: string }

/** 折线图：按需引入 echarts 模块，随容器宽度自适应。 */
export const TrendChart = ({ dates, series }: { dates: string[]; series: TrendSeries[] }) => {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!box.current) return undefined;
    const chart = echarts.init(box.current);
    chart.setOption({
      color: series.map((s) => s.color),
      tooltip: { trigger: 'axis' },
      legend: { top: 0, right: 0, textStyle: { color: '#666' } },
      grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: dates.map((d) => d.slice(5)), boundaryGap: false, axisLine: { lineStyle: { color: '#E6E6E6' } }, axisLabel: { color: '#666' } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#EAEAEA' } }, axisLabel: { color: '#666' } },
      series: series.map((s) => ({ name: s.name, type: 'line', data: s.data, smooth: true, symbolSize: 6 })),
    });
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      chart.dispose();
    };
  }, [dates, series]);

  return <div ref={box} className={styles.chart} />;
};
