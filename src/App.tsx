import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Result, Spin } from 'antd';
import { setUnauthorizedHandler } from './api/client.ts';
import { AdminLayout } from './components/admin-layout';
import type { Permission } from './models/types.ts';
import { useStores } from './stores/root.tsx';
import { useRoute } from './utils/router.ts';
import { AdminsPage } from './views/admins';
import { AuditPage } from './views/audit';
import { DashboardPage } from './views/dashboard';
import { LoginPage } from './views/login';
import { ProvidersPage } from './views/providers';
import { SettingsPage } from './views/settings';
import { TaskDetailPage } from './views/task-detail';
import { TasksPage } from './views/tasks';
import { UserDetailPage } from './views/user-detail';
import { UsersPage } from './views/users';
import styles from './app.module.scss';

const SECTION_PERMISSION: Record<string, Permission> = {
  dashboard: 'read_dashboard', users: 'read_users', tasks: 'read_tasks', ai: 'read_analytics', admins: 'manage_admins', audit: 'security_audit', settings: 'manage_settings',
};

export const App = observer(() => {
  const { session } = useStores();
  const route = useRoute();

  useEffect(() => {
    setUnauthorizedHandler(() => session.clear());
    void session.bootstrap();
  }, [session]);

  if (session.loading) return <div className={styles.loading}><Spin size="large" /></div>;
  if (!session.admin) return <LoginPage />;

  const [section = 'dashboard', sub = ''] = route.path;
  const required = SECTION_PERMISSION[section];
  let page: JSX.Element;
  if (!required) page = <DashboardPage />;
  else if (!session.can(required)) page = <Result status="403" title="当前角色没有权限访问这个页面" />;
  else if (section === 'users' && sub) page = <UserDetailPage key={sub} id={sub} />;
  else if (section === 'users') page = <UsersPage />;
  else if (section === 'tasks' && sub) page = <TaskDetailPage key={sub} id={sub} />;
  else if (section === 'tasks') page = <TasksPage />;
  else if (section === 'ai') page = <ProvidersPage />;
  else if (section === 'admins') page = <AdminsPage />;
  else if (section === 'audit') page = <AuditPage />;
  else if (section === 'settings') page = <SettingsPage />;
  else page = <DashboardPage />;

  return <AdminLayout section={required ? section : 'dashboard'}>{page}</AdminLayout>;
});
