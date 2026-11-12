import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useStores } from '../../stores/root.tsx';
import styles from './index.module.scss';

export const LoginPage = () => {
  const { session } = useStores();
  const [loading, setLoading] = useState(false);

  const submit = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await session.login(values.email.trim(), values.password);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <h1 className={styles.title}>图果 · 管理后台</h1>
        <p className={styles.desc}>仅限内部员工使用</p>
        <Form layout="vertical" onFinish={(v) => void submit(v)} requiredMark={false}>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入正确的邮箱' }]}>
            <Input autoComplete="username" autoFocus />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
        </Form>
      </div>
    </div>
  );
};
