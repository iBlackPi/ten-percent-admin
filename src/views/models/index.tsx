import { useEffect, useState } from 'react';
import { Button, Form, Input, Radio, Switch, Tag, message } from 'antd';
import { api } from '../../api';
import { PageHeader } from '../../components/page-header';
import type { ImageRoutingView, ModelProviderSetting, ModelSettingsView } from '../../models/types.ts';
import styles from './index.module.scss';

const GROUPS: Array<{ kind: ModelProviderSetting['kind']; title: string; desc: string }> = [
  { kind: 'text', title: '文本模型', desc: '小果理解一句话、看图问问、闲聊。' },
  { kind: 'image', title: '生图模型', desc: 'AI 出图、AI 改图、AI 变清晰。接口地址和模型名一般不用改。' },
];

const IMAGE_LABEL = { seedream: '火山方舟 Seedream', qwen: '阿里云百炼 qwen-image' } as const;
const PROVIDER_ALIAS: Record<string, keyof typeof IMAGE_LABEL> = { seedream: 'seedream', qwen: 'qwen' };

const ProviderCard = ({ provider, onSaved }: { provider: ModelProviderSetting; onSaved: (next: ModelSettingsView) => void }) => {
  const [testing, setTesting] = useState(false);

  const save = async (values: { baseUrl: string; model: string; apiKey?: string }) => {
    try {
      onSaved(await api.saveModelProvider(provider.id, { baseUrl: values.baseUrl, model: values.model, ...(values.apiKey ? { apiKey: values.apiKey } : {}) }));
      message.success(`${provider.label} 已保存`);
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const result = await api.testModel(provider.id);
      message.success(`${result.model} 连通正常`);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        {provider.label}
        <Tag className={styles.tag} color={provider.hasKey ? 'green' : 'default'}>{provider.hasKey ? '已保存密钥' : '未保存密钥'}</Tag>
      </h3>
      <p className={styles.sectionDesc}>{provider.hasKey ? `当前密钥 ${provider.maskedKey}` : '没有保存密钥时，使用服务器 .env 里的配置。'}</p>
      <Form layout="vertical" initialValues={{ baseUrl: provider.baseUrl, model: provider.model }} onFinish={(values) => void save(values)}>
        <div className={styles.form}>
          <Form.Item label="接口地址" name="baseUrl" rules={[{ required: true, type: 'url', message: '请输入有效地址' }]}><Input /></Form.Item>
          <Form.Item label="模型" name="model" rules={[{ required: true, message: '请输入模型名' }]}><Input /></Form.Item>
          <Form.Item className={styles.formWide} label="API Key" name="apiKey">
            <Input.Password autoComplete="new-password" placeholder={provider.hasKey ? '不修改可留空' : '请输入 API Key'} />
          </Form.Item>
        </div>
        <div className={styles.actions}>
          <Button type="primary" htmlType="submit">保存</Button>
          <Button loading={testing} onClick={() => void test()}>测试连通</Button>
        </div>
      </Form>
    </section>
  );
};

/** 默认生图模型：选哪个、失败时换不换、近 7 天实际是谁在画。 */
const ImageRoutingCard = ({ routing, onSaved }: { routing: ImageRoutingView; onSaved: (next: ModelSettingsView) => void }) => {
  const [saving, setSaving] = useState(false);
  const choice = routing.default ?? routing.effective ?? 'seedream';

  const save = async (next: { default: 'seedream' | 'qwen'; fallback: boolean }) => {
    setSaving(true);
    try {
      onSaved(await api.saveImageRouting(next));
      message.success('默认生图模型已保存，下一张图开始生效');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>默认生图模型</h3>
      <p className={styles.sectionDesc}>所有 AI 出图、改图、AI 增强都先用这里选的模型。想对比效果，选一个、关掉「失败时改用另一个」，就不会被悄悄换掉。</p>
      <Radio.Group value={choice} disabled={saving} onChange={(event) => void save({ default: event.target.value as 'seedream' | 'qwen', fallback: routing.fallback })}>
        {(['seedream', 'qwen'] as const).map((key) => (
          <Radio.Button key={key} value={key} disabled={!routing.configured.includes(key)}>
            {IMAGE_LABEL[key]}{routing.configured.includes(key) ? '' : '（未配置密钥）'}
          </Radio.Button>
        ))}
      </Radio.Group>
      <div className={styles.switchRow}>
        <Switch checked={routing.fallback} disabled={saving} onChange={(fallback) => void save({ default: choice, fallback })} />
        <span className={styles.switchText}>首选模型失败时，改用另一个模型重试（会让结果混用两个模型）</span>
      </div>
      <p className={routing.problem ? styles.problem : styles.effective}>
        {routing.problem ?? `现在实际使用：${routing.effectiveLabel}${routing.default ? '' : '（还没手动选过，按已配置的模型自动选择）'}`}
      </p>
      <div className={styles.usage}>
        <div className={styles.usageTitle}>最近 7 天实际画图（以此为准，不看配置）</div>
        {routing.recentUsage.length === 0 ? <div className={styles.usageEmpty}>还没有记录</div> : routing.recentUsage.map((row) => (
          <div key={`${row.provider}-${row.model}`} className={styles.usageRow}>
            <span className={styles.usageModel}>{IMAGE_LABEL[PROVIDER_ALIAS[row.provider] ?? 'qwen']} · {row.model}</span>
            <span className={styles.usageNum}>{row.images} 张{row.failed ? `，失败 ${row.failed} 次` : ''}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

/** 模型配置：文本 / 生图模型的密钥、接口地址、模型名和默认生图模型。密钥加密保存，页面只显示脱敏后的内容。 */
export const ModelsPage = () => {
  const [state, setState] = useState<ModelSettingsView | null>(null);

  useEffect(() => {
    void api.modelSettings().then(setState).catch((e: Error) => message.error(e.message));
  }, []);

  return (
    <div>
      <PageHeader title="模型配置" desc="保存后立即生效，不用重新部署。密钥加密保存，所有修改都会写入操作审计。" />
      {state ? GROUPS.map((group) => {
        const items = state.providers.filter((provider) => provider.kind === group.kind);
        if (!items.length) return null;
        return (
          <div key={group.kind} className={styles.group}>
            <h2 className={styles.groupTitle}>{group.title}</h2>
            <p className={styles.groupDesc}>{group.desc}</p>
            {group.kind === 'image' ? <ImageRoutingCard routing={state.imageRouting} onSaved={setState} /> : null}
            {items.map((provider) => <ProviderCard key={provider.id} provider={provider} onSaved={setState} />)}
          </div>
        );
      }) : null}
    </div>
  );
};
