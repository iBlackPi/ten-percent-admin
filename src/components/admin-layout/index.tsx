import type { ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Layout, Menu } from 'antd';
import {
  ApiOutlined, AuditOutlined, DashboardOutlined, MessageOutlined, FundOutlined, EditOutlined, PictureOutlined, SettingOutlined, LogoutOutlined, RobotOutlined, TeamOutlined, UnorderedListOutlined, UserOutlined,
} from '@ant-design/icons';
import type { Permission } from '../../models/types.ts';
import { ROLE_LABEL } from '../../models/types.ts';
import { useStores } from '../../stores/root.tsx';
import { go } from '../../utils/router.ts';
import styles from './index.module.scss';

const { Sider, Content } = Layout;

interface NavItem { key: string; label: string; icon: ReactNode; permission: Permission }

const NAV: NavItem[] = [
  { key: 'dashboard', label: '总览', icon: <DashboardOutlined />, permission: 'read_dashboard' },
  { key: 'behavior', label: '用户行为', icon: <FundOutlined />, permission: 'read_analytics' },
  { key: 'users', label: '用户', icon: <TeamOutlined />, permission: 'read_users' },
  { key: 'tasks', label: '任务', icon: <UnorderedListOutlined />, permission: 'read_tasks' },
  { key: 'feedback', label: '用户反馈', icon: <MessageOutlined />, permission: 'manage_feedback' },
  { key: 'ai', label: 'AI 服务商', icon: <RobotOutlined />, permission: 'read_analytics' },
  { key: 'models', label: '模型配置', icon: <ApiOutlined />, permission: 'manage_settings' },
  { key: 'prompts', label: '提示词', icon: <EditOutlined />, permission: 'manage_settings' },
  { key: 'static-assets', label: '静态资源', icon: <PictureOutlined />, permission: 'manage_settings' },
  { key: 'admins', label: '管理员', icon: <UserOutlined />, permission: 'manage_admins' },
  { key: 'audit', label: '操作审计', icon: <AuditOutlined />, permission: 'security_audit' },
  { key: 'settings', label: '系统设置', icon: <SettingOutlined />, permission: 'manage_settings' },
];

/** 左侧菜单只显示当前角色有权限的项；详情页归到所属一级菜单高亮。 */
export const AdminLayout = observer(({ section, children }: { section: string; children: ReactNode }) => {
  const { session } = useStores();
  const items = NAV.filter((n) => session.can(n.permission)).map(({ key, label, icon }) => ({ key, label, icon }));
  return (
    <Layout className={styles.layout}>
      <Sider width={200} theme="light" className={styles.sider}>
        <div className={styles.brand}>图果 · 管理后台</div>
        <Menu mode="inline" selectedKeys={[section]} items={items} onClick={(e) => go(`/${e.key}`)} className={styles.menu} />
        <div className={styles.account}>
          <div className={styles.name}>{session.admin?.displayName || session.admin?.email}</div>
          <div className={styles.role}>{session.admin ? ROLE_LABEL[session.admin.role] : ''}</div>
          <Button size="small" icon={<LogoutOutlined />} onClick={() => void session.logout()}>退出登录</Button>
        </div>
      </Sider>
      <Content className={styles.content}>{children}</Content>
    </Layout>
  );
});
