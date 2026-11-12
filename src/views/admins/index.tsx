import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Select, Table, Tag, message } from 'antd';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import { ROLE_LABEL, type AdminAccount, type AdminRole } from '../../models/types.ts';
import { fmtDateTime } from '../../utils/format.ts';
import { useStores } from '../../stores/root.tsx';
import styles from './index.module.scss';

const ROLE_OPTIONS = (Object.keys(ROLE_LABEL) as AdminRole[]).map((value) => ({ value, label: ROLE_LABEL[value] }));
const PASSWORD_RULE = { min: 10, pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/, message: '密码至少 10 位，且同时包含字母和数字' };

/** 管理员管理：仅 super_admin。禁用、改角色、重置密码会立即让对方现有登录失效，并写入审计。 */
export const AdminsPage = () => {
  const { session } = useStores();
  const [list, setList] = useState<AdminAccount[]>([]);
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState<AdminAccount | null>(null);
  const [form] = Form.useForm<{ email: string; displayName: string; password: string; role: AdminRole }>();
  const [resetForm] = Form.useForm<{ password: string }>();

  const load = () => void api.admins().then(setList).catch((e: Error) => message.error(e.message));
  useEffect(load, []);

  const run = async (action: () => Promise<void>, done: string) => {
    try {
      await action();
      message.success(done);
      load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  return (
    <div>
      <PageHeader title="管理员" desc="创建账号后请当面或通过安全渠道告知初始密码。" actions={<Button type="primary" onClick={() => setOpen(true)}>新增管理员</Button>} />
      <Card>
        <Table<AdminAccount>
          rowKey="id" size="small" pagination={false} dataSource={list}
          columns={[
            { title: '邮箱', dataIndex: 'email' },
            { title: '姓名', dataIndex: 'displayName' },
            {
              title: '角色', dataIndex: 'role', render: (v: AdminRole, r) => (
                <Select
                  size="small" value={v} options={ROLE_OPTIONS} disabled={r.id === session.admin?.id} className={styles.role}
                  onChange={(role) => void run(() => api.updateAdmin(r.id, { role }), '角色已更新，对方需要重新登录')}
                />
              ),
            },
            { title: '状态', dataIndex: 'status', render: (v: string) => (v === 'active' ? <Tag color="green">正常</Tag> : <Tag>已禁用</Tag>) },
            { title: '最近登录', dataIndex: 'lastLoginAt', render: fmtDateTime },
            {
              title: '操作', render: (_: unknown, r) => (
                <div className={styles.ops}>
                  <Button size="small" onClick={() => setResetting(r)}>重置密码</Button>
                  {r.id === session.admin?.id ? null : (
                    <Button
                      size="small" danger={r.status === 'active'}
                      onClick={() => void run(() => api.updateAdmin(r.id, { status: r.status === 'active' ? 'disabled' : 'active' }), r.status === 'active' ? '已禁用' : '已启用')}
                    >
                      {r.status === 'active' ? '禁用' : '启用'}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal title="新增管理员" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form
          form={form} layout="vertical" initialValues={{ role: 'viewer' }}
          onFinish={(v) => void run(() => api.createAdmin(v), '已创建').then(() => { setOpen(false); form.resetFields(); })}
        >
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="displayName" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="password" label="初始密码" rules={[{ required: true }, PASSWORD_RULE]}><Input.Password autoComplete="new-password" /></Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}><Select options={ROLE_OPTIONS} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`重置密码：${resetting?.email ?? ''}`} open={Boolean(resetting)} onCancel={() => setResetting(null)} onOk={() => resetForm.submit()} destroyOnClose>
        <Form
          form={resetForm} layout="vertical"
          onFinish={(v) => void run(() => api.updateAdmin(resetting!.id, { password: v.password }), '密码已重置，对方需要重新登录').then(() => { setResetting(null); resetForm.resetFields(); })}
        >
          <Form.Item name="password" label="新密码" rules={[{ required: true }, PASSWORD_RULE]}><Input.Password autoComplete="new-password" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
