import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Radio, Switch, Table, Tag, message } from 'antd';
import { api } from '../../api';
import { PageHeader } from '../../components/page-header';
import type { ImageRoutingView, ModelPriceRow, ModelProviderSetting, ModelSettingsView, PricesView } from '../../models/types.ts';
import styles from './index.module.scss';

const GROUPS: Array<{ kind: ModelProviderSetting['kind']; title: string; desc: string }> = [
  { kind: 'text', title: '文本模型', desc: '小果理解一句话、看图问问、闲聊。' },
  { kind: 'image', title: '生图模型', desc: 'AI 出图、AI 改图、AI 变清晰。方舟的模型名可以填多个，按优先级依次尝试，也都会出现在小程序/H5 创作页底部的模型选择里（果子数按模型成本自动折算，排第一的是默认模型）；百炼的 qwen-image 系列同样可选。换模型、换地址在这里改，保存后立即生效，不用发布。' },
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
          <Form.Item
            label={provider.id === 'ark' ? '模型（可填多个，按优先级）' : '模型'}
            name="model"
            rules={[{ required: true, message: '请输入模型名' }]}
            extra={provider.id === 'ark' ? '多个模型用英文逗号隔开，排在前面的优先；前一个调用失败才会用后一个。例：doubao-seedream-5-5-261028,doubao-seedream-5-0-flash-260915,doubao-seedream-5-0-pro-260628' : undefined}
          >
            <Input />
          </Form.Item>
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

type Draft = Record<string, { generate: number | null; edit: number | null }>;

/**
 * 果子价格：临时调价，保存后立即生效，不用发布。
 * 每格留空 = 按成本自动折算（1 果子按 0.05 元成本）；填了就以填的为准。价格至少 1 果子。
 * 改价只影响之后新建的任务，已经扣下的果子不变。
 */
const PricesCard = ({ prices, onSaved }: { prices: PricesView; onSaved: (next: ModelSettingsView) => void }) => {
  const [saving, setSaving] = useState(false);
  const initial = (): Draft => Object.fromEntries(prices.models.map((m) => [m.id, { generate: m.overrideGenerate, edit: m.overrideEdit }]));
  const [draft, setDraft] = useState<Draft>(initial);
  const [enhance, setEnhance] = useState<number | null>(prices.enhanceAi.override);
  const [erase, setErase] = useState<number | null>(prices.eraseVolc.override);
  useEffect(() => { setDraft(initial()); setEnhance(prices.enhanceAi.override); setErase(prices.eraseVolc.override); }, [prices]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (id: string, key: 'generate' | 'edit', value: number | null) => setDraft((d) => ({ ...d, [id]: { ...d[id]!, [key]: value } }));
  const save = async () => {
    setSaving(true);
    try {
      const models: Record<string, { generate?: number; edit?: number }> = {};
      for (const [id, v] of Object.entries(draft)) {
        const row: { generate?: number; edit?: number } = {};
        if (v.generate !== null) row.generate = v.generate;
        if (v.edit !== null) row.edit = v.edit;
        if (row.generate !== undefined || row.edit !== undefined) models[id] = row;
      }
      onSaved(await api.savePrices({ models, ...(enhance !== null ? { enhanceAi: enhance } : {}), ...(erase !== null ? { eraseVolc: erase } : {}) }));
      message.success('价格已保存，新任务立即按新价格收费');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const cell = (row: ModelPriceRow, key: 'generate' | 'edit') => {
    const auto = key === 'generate' ? row.autoGenerate : row.autoEdit;
    return (
      <InputNumber
        min={1} max={500} precision={0} placeholder={`自动 ${auto}`} value={draft[row.id]?.[key] ?? null}
        onChange={(v) => set(row.id, key, typeof v === 'number' ? v : null)}
      />
    );
  };
  const margin = (row: ModelPriceRow, credits: number) => (credits > 0 ? `${Math.round((1 - row.costYuan / (credits * 0.09)) * 100)}%` : '-');

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>果子价格</h3>
      <p className={styles.sectionDesc}>
        用户在创作页选哪个模型，就按哪个模型的价格扣果子。每格留空 = 按成本自动折算（1 果子按 {prices.yuanPerCredit} 元成本）；填了就以填的为准。
        改价只影响之后新建的任务。毛利按最低档充值价（0.09 元/果子）估算，只算生图模型成本。
      </p>
      <Table<ModelPriceRow>
        size="small" pagination={false} rowKey="id" dataSource={prices.models}
        columns={[
          { title: '模型', dataIndex: 'label', render: (_, r) => <span>{r.label}<span className={styles.modelId}>{r.id}</span></span> },
          { title: '成本（元/次）', dataIndex: 'costYuan', width: 110, render: (v: number) => v.toFixed(2) },
          { title: '出图（果子）', width: 130, render: (_, r) => cell(r, 'generate') },
          { title: '改图（果子）', width: 130, render: (_, r) => cell(r, 'edit') },
          { title: '现在收（出图/改图）', width: 150, render: (_, r) => `${r.generate} / ${r.edit}` },
          { title: '出图毛利', width: 90, render: (_, r) => margin(r, r.generate) },
        ]}
      />
      <div className={styles.priceExtra}>
        <span>AI 变清晰</span>
        <InputNumber min={1} max={500} precision={0} placeholder={`自动 ${prices.enhanceAi.auto}`} value={enhance} onChange={(v) => setEnhance(typeof v === 'number' ? v : null)} />
        <span className={styles.priceNote}>现在收 {prices.enhanceAi.current} 果子，固定用最便宜的 Flash</span>
      </div>
      <div className={styles.priceExtra}>
        <span>精准去除</span>
        <InputNumber min={1} max={500} precision={0} placeholder={`默认 ${prices.eraseVolc.auto}`} value={erase} onChange={(v) => setErase(typeof v === 'number' ? v : null)} />
        <span className={styles.priceNote}>现在收 {prices.eraseVolc.current} 果子，火山图像擦除修复，成本约 0.002 元</span>
      </div>
      <div className={styles.actions}>
        <Button type="primary" loading={saving} onClick={() => void save()}>保存价格</Button>
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
            {group.kind === 'image' ? <PricesCard prices={state.prices} onSaved={setState} /> : null}
            {items.map((provider) => <ProviderCard key={provider.id} provider={provider} onSaved={setState} />)}
          </div>
        );
      }) : null}
    </div>
  );
};
