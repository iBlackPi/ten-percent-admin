import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, message } from 'antd';
import { api } from '../../api';
import { PageHeader } from '../../components/page-header';
import type { PromptView } from '../../models/types.ts';
import styles from './index.module.scss';

const GROUP_ORDER = ['助手', '意图与质检', '记忆与策划', '生图'];

/** 提示词管理：查看、修改、恢复默认。保存后下一轮对话 / 下一个出图任务生效，不用重启。 */
export const PromptsPage = () => {
  const [items, setItems] = useState<PromptView[]>([]);
  const [activeKey, setActiveKey] = useState('');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api.prompts().then((list) => { setItems(list); setActiveKey(list[0]?.key ?? ''); setDraft(list[0]?.content ?? ''); })
      .catch((e: Error) => message.error(e.message));
  }, []);

  const active = items.find((item) => item.key === activeKey);
  const groups = useMemo(() => GROUP_ORDER.map((group) => ({ group, list: items.filter((item) => item.group === group) })).filter((entry) => entry.list.length), [items]);
  const dirty = Boolean(active) && draft.trim() !== active?.content.trim();

  const pick = (key: string) => {
    if (key === activeKey) return;
    const switchTo = () => { setActiveKey(key); setDraft(items.find((item) => item.key === key)?.content ?? ''); };
    if (!dirty) return switchTo();
    Modal.confirm({ title: '有未保存的修改', content: '切换后这些修改会丢失。', okText: '放弃修改', cancelText: '继续编辑', onOk: switchTo });
  };

  const apply = (next: PromptView[], key: string) => {
    setItems(next);
    setDraft(next.find((item) => item.key === key)?.content ?? '');
  };

  const save = async () => {
    if (!active) return;
    setSaving(true);
    try {
      apply(await api.savePrompt(active.key, draft), active.key);
      message.success('已保存，下一轮对话 / 下一个出图任务开始生效');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (!active) return;
    Modal.confirm({
      title: '恢复默认？', content: `「${active.title}」会回到代码里的原始内容，你的修改会被删除。`, okText: '恢复默认', cancelText: '取消',
      onOk: async () => {
        try {
          apply(await api.resetPrompt(active.key), active.key);
          message.success('已恢复默认');
        } catch (error) {
          message.error((error as Error).message);
        }
      },
    });
  };

  return (
    <div>
      <PageHeader title="提示词" desc="修改小果和出图使用的提示词。所有修改都会写入操作审计。" />
      <div className={styles.layout}>
        <nav className={styles.nav}>
          {groups.map(({ group, list }) => (
            <div key={group}>
              <div className={styles.navGroup}>{group}</div>
              {list.map((item) => (
                <button key={item.key} type="button" className={item.key === activeKey ? `${styles.navItem} ${styles.navItemOn}` : styles.navItem} onClick={() => pick(item.key)}>
                  <span>{item.title}</span>
                  {item.overridden ? <span className={styles.dot} /> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {active ? (
          <section className={styles.editor}>
            <h3 className={styles.sectionTitle}>{active.title}{active.overridden ? <span className={styles.tag}>已修改</span> : null}</h3>
            <p className={styles.meta}>{active.desc}</p>
            {active.placeholders.length ? (
              <p className={styles.holders}>必须保留的占位符：{active.placeholders.map((name) => <span key={name} className={styles.holder}>{`{{${name}}}`}</span>)}。系统运行时会把它替换成真实内容，删掉或改名会无法保存。</p>
            ) : null}
            {active.needsJson ? <p className={styles.holders}>这条要求模型输出 JSON，内容里必须保留 “JSON” 这个词，输出格式的示例也不要删。</p> : null}
            {active.key === 'image.negative' ? <p className={styles.warn}>反向提示词只对阿里云百炼生效，火山方舟 Seedream 的接口没有这个参数。</p> : null}
            <Input.TextArea className={styles.text} value={draft} onChange={(event) => setDraft(event.target.value)} autoSize={{ minRows: 10, maxRows: 28 }} />
            <div className={styles.foot}>
              <span className={styles.count}>{draft.length} 字</span>
              <div className={styles.actions}>
                <Button disabled={!active.overridden} onClick={reset}>恢复默认</Button>
                <Button type="primary" loading={saving} disabled={!dirty} onClick={() => void save()}>保存</Button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};
