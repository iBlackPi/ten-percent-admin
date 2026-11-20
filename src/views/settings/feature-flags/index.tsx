import { useEffect, useState } from 'react';
import { Alert, Button, Input, Radio, Tag, message } from 'antd';
import { api } from '../../../api';
import { Card } from '../../../components/page-header';
import type { FeatureMode, FeatureView } from '../../../models/types.ts';
import { fmtDateTime } from '../../../utils/format.ts';
import styles from './index.module.scss';

const MODE_OPTIONS: Array<{ value: FeatureMode; label: string }> = [
  { value: 'off', label: '关闭' }, { value: 'whitelist', label: '只对白名单' }, { value: 'all', label: '全部用户' },
];
const MODE_TAG: Record<FeatureMode, { color: string; text: string }> = {
  off: { color: 'default', text: '已关闭' }, whitelist: { color: 'orange', text: '灰度中' }, all: { color: 'green', text: '已全量' },
};

/** 一个开关：模式 + 白名单（每行一个手机号 / 邮箱 / 用户 ID）。保存时服务端换成用户，找不到的会报出来 */
const FeatureRow = ({ item, onSaved }: { item: FeatureView; onSaved: (items: FeatureView[]) => void }) => {
  const [mode, setMode] = useState<FeatureMode>(item.mode);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      // 已有成员按 id 保留，新填的追加在后面
      const members = [...item.members.map((m) => m.id), ...text.split(/[\n,，\s]+/)].filter(Boolean);
      onSaved(await api.saveFeature(item.key, { mode, members }));
      setText('');
      message.success(mode === 'off' ? '已关闭，用户重新进入页面后入口消失' : '已保存，用户重新进入页面后生效');
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const removeMember = async (id: string) => {
    try {
      onSaved(await api.saveFeature(item.key, { mode: item.mode, members: item.members.filter((m) => m.id !== id).map((m) => m.id) }));
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  return (
    <div className={styles.block}>
      <div className={styles.head}>
        <span className={styles.title}>{item.label}</span>
        <Tag color={MODE_TAG[item.mode].color}>{MODE_TAG[item.mode].text}</Tag>
        {item.updatedAt ? <span className={styles.time}>最后修改 {fmtDateTime(item.updatedAt)}</span> : null}
      </div>
      <Radio.Group className={styles.modes} value={mode} onChange={(e) => setMode(e.target.value as FeatureMode)} options={MODE_OPTIONS} optionType="button" />
      <div className={styles.members}>
        {item.members.length ? item.members.map((m) => <Tag key={m.id} closable onClose={(e) => { e.preventDefault(); void removeMember(m.id); }}>{m.label}</Tag>) : <span className={styles.empty}>白名单为空</span>}
      </div>
      <Input.TextArea className={styles.input} autoSize={{ minRows: 2, maxRows: 6 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="添加白名单：每行一个手机号、邮箱或用户 ID" />
      <Button type="primary" loading={saving} onClick={() => void save()}>保存</Button>
    </div>
  );
};

/** 灰度开关：新功能先给白名单用户，稳定后全量；出问题直接点「关闭」，不用发版、不用重启 */
export const FeatureFlags = () => {
  const [items, setItems] = useState<FeatureView[] | null>(null);
  useEffect(() => { void api.features().then(setItems).catch((e: Error) => message.error(e.message)); }, []);

  return (
    <Card title="灰度开关">
      <Alert
        className={styles.tip} type="info" showIcon
        message="关闭后用户端隐藏入口、服务端拒绝新的上传；已经上传的内容照常可看、可删。游客始终不开放。保存后用户刷新或重新进入页面生效。"
      />
      {(items ?? []).map((item) => <FeatureRow key={`${item.key}-${item.updatedAt ?? ''}`} item={item} onSaved={setItems} />)}
    </Card>
  );
};
