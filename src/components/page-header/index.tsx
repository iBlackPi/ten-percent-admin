import type { ReactNode } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { go } from '../../utils/router.ts';
import styles from './index.module.scss';

export const PageHeader = ({ title, desc, actions, back }: { title: ReactNode; desc?: ReactNode; actions?: ReactNode; back?: string }) => (
  <header className={styles.head}>
    <div className={styles.main}>
      {back ? (
        <button type="button" className={styles.back} onClick={() => go(back)}><ArrowLeftOutlined /><span>返回</span></button>
      ) : null}
      <h1 className={styles.title}>{title}</h1>
      {desc ? <p className={styles.desc}>{desc}</p> : null}
    </div>
    {actions ? <div className={styles.actions}>{actions}</div> : null}
  </header>
);

export const Card = ({ children, title, extra, className }: { children: ReactNode; title?: ReactNode; extra?: ReactNode; className?: string }) => (
  <section className={className ? `${styles.card} ${className}` : styles.card}>
    {title || extra ? (
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>{title}</h2>
        {extra}
      </div>
    ) : null}
    {children}
  </section>
);
