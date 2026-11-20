import { useEffect, useState } from 'react';
import { Alert, Button, Descriptions, Input, Popconfirm, Tag, message } from 'antd';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import type { MapConfigView, MapKeyView } from '../../models/types.ts';
import { fmtDateTime } from '../../utils/format.ts';
import { FeatureFlags } from './feature-flags';
import styles from './index.module.scss';

/** 用输入的 Key 请求一张天地图瓦片：能加载说明 Key 有效、当前域名在白名单里 */
const probeTile = (tk: string): Promise<boolean> => new Promise((resolve) => {
  const img = new Image();
  const timer = window.setTimeout(() => resolve(false), 8000);
  img.onload = () => { window.clearTimeout(timer); resolve(true); };
  img.onerror = () => { window.clearTimeout(timer); resolve(false); };
  img.src = `https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=3&TILEROW=3&TILECOL=6&tk=${encodeURIComponent(tk)}`;
});

const FROM_LABEL = { admin: '后台设置', env: '服务器 .env' } as const;

interface KeyRowProps {
  title: string;
  hint: string;
  placeholder: string;
  info: MapKeyView | undefined;
  /** 只有浏览器端 Key 能在后台页面里测试（服务端 Key 不能从浏览器请求） */
  canTest: boolean;
  onSave: (value: string) => Promise<void>;
}

const KeyRow = ({ title, hint, placeholder, info, canTest, onSave }: KeyRowProps) => {
  const [key, setKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const run = async (value: string) => {
    setSaving(true);
    try {
      await onSave(value);
      setKey('');
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    const ok = await probeTile(key.trim());
    setTesting(false);
    if (ok) message.success('瓦片加载成功，Key 可用');
    else message.error('瓦片加载失败：请检查 Key 是否为浏览器端 Key，以及当前域名是否在天地图控制台的白名单里');
  };

  return (
    <div className={styles.keyBlock}>
      <div className={styles.keyHead}>
        <span className={styles.keyTitle}>{title}</span>
        <Tag color={info?.configured ? 'green' : 'default'}>{info?.configured ? '已配置' : '未配置'}</Tag>
      </div>
      <p className={styles.hint}>{hint}</p>
      <Descriptions size="small" column={1} className={styles.info}>
        <Descriptions.Item label="当前 Key">{info?.masked || '-'}</Descriptions.Item>
        <Descriptions.Item label="来源">{info?.from ? FROM_LABEL[info.from] : '-'}</Descriptions.Item>
        {info?.from === 'admin' ? <Descriptions.Item label="最后修改">{fmtDateTime(info.updatedAt)}</Descriptions.Item> : null}
      </Descriptions>
      <div className={styles.row}>
        <Input.Password className={styles.input} placeholder={placeholder} value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />
        {canTest ? <Button disabled={!key.trim()} loading={testing} onClick={() => void test()}>测试</Button> : null}
        <Button type="primary" disabled={!key.trim()} loading={saving} onClick={() => void run(key.trim())}>保存</Button>
        {info?.from === 'admin' ? (
          <Popconfirm title="清空后改用服务器 .env 里的 Key（没有则视为未配置），确定吗？" onConfirm={() => void run('')}>
            <Button danger loading={saving}>清空</Button>
          </Popconfirm>
        ) : null}
      </div>
    </div>
  );
};

/** 系统设置：地图服务。保存后用户端立即生效，不用重新发布 */
export const SettingsPage = () => {
  const [view, setView] = useState<MapConfigView | null>(null);

  useEffect(() => { void api.mapConfig().then(setView).catch((e: Error) => message.error(e.message)); }, []);

  const save = (field: 'browserKey' | 'serverKey' | 'tencentStaticKey') => async (value: string) => {
    try {
      setView(await api.saveMapConfig({ [field]: value }));
      message.success(value ? '已保存，用户端立即生效' : '已清空');
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  return (
    <div>
      <PageHeader title="系统设置" desc="平台级配置，保存后立即生效，所有操作都会写入审计。" />
      <Card className={styles.section} title="地图服务 · 天地图">
        <Alert
          className={styles.tip}
          type="info"
          showIcon
          message="两个 Key 要在天地图控制台分别创建「浏览器端」和「服务端」两个应用，类型不能混用。后台没填时使用服务器 .env 里的值。"
        />
        <KeyRow
          title="浏览器端 Key"
          hint="PC 端「我的足迹」的地图底图。Key 会出现在用户网页的请求里，请在天地图控制台为它设置域名白名单。未配置时足迹页显示地点列表。"
          placeholder="粘贴天地图浏览器端 Key（tk）"
          info={view?.browser}
          canTest
          onSave={save('browserKey')}
        />
        <KeyRow
          title="服务端 Key"
          hint="后端把照片的经纬度转成地名（精确到区县、街道）并提供附近地点推荐。只在服务器使用，不会发给用户端，加密保存。未配置时只保留坐标。"
          placeholder="粘贴天地图服务端 Key（tk）"
          info={view?.server}
          canTest={false}
          onSave={save('serverKey')}
        />
      </Card>
      <Card className={styles.section} title="地图服务 · 腾讯位置服务">
        <KeyRow
          title="静态图 Key"
          hint="小程序「Citywalk 路线图」的底图，由服务器代取，不会发给用户端，加密保存。需在腾讯位置服务控制台为这个 Key 开通「静态图」服务；静态图有每日调用上限，同一张底图服务器会缓存一天。"
          placeholder="粘贴腾讯位置服务 Key"
          info={view?.tencentStatic}
          canTest={false}
          onSave={save('tencentStaticKey')}
        />
      </Card>
      <FeatureFlags />
    </div>
  );
};
