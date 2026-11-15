import { useEffect, useState } from 'react';
import { Table, message } from 'antd';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import type { AuditItem } from '../../models/types.ts';
import { fmtDateTime } from '../../utils/format.ts';

const PAGE_SIZE = 20;
const ACTION: Record<string, string> = { 'admin.login': '登录', 'admin.logout': '退出登录', 'admin.create': '创建管理员', 'admin.update': '修改管理员', 'user.credits.adjust': '调整用户果子' };

/** 操作审计：登录、退出、管理员变更。普通查看数据不逐条记录。 */
export const AuditPage = () => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; items: AuditItem[] }>({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    void api.audit({ page, pageSize: PAGE_SIZE }).then(setData).catch((e: Error) => message.error(e.message)).finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <PageHeader title="操作审计" desc="记录登录、退出和管理员账号变更。" />
      <Card>
        <Table<AuditItem>
          rowKey="id" size="small" loading={loading} dataSource={data.items}
          pagination={{ current: page, pageSize: PAGE_SIZE, total: data.total, showSizeChanger: false, onChange: setPage }}
          columns={[
            { title: '时间', dataIndex: 'createdAt', render: fmtDateTime },
            { title: '操作人', dataIndex: 'adminEmail' },
            { title: '动作', dataIndex: 'action', render: (v: string) => ACTION[v] ?? v },
            { title: '对象', render: (_: unknown, r) => (r.resourceType ? `${r.resourceType}:${r.resourceId ?? ''}` : '-') },
            { title: '说明', dataIndex: 'reason', render: (v: string | null) => v ?? '-' },
            { title: '请求 ID', dataIndex: 'requestId', render: (v: string | null) => v ?? '-' },
          ]}
        />
      </Card>
    </div>
  );
};
