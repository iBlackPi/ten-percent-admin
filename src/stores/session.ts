import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api';
import type { AdminIdentity, Permission } from '../models/types.ts';

export class SessionStore {
  admin: AdminIdentity | null = null;
  permissions: Permission[] = [];
  loading = true;

  constructor() {
    makeAutoObservable(this);
  }

  can(permission: Permission): boolean {
    return this.permissions.includes(permission);
  }

  async bootstrap(): Promise<void> {
    try {
      const me = await api.me();
      runInAction(() => { this.admin = me.admin; this.permissions = me.permissions; });
    } catch {
      this.clear();
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  async login(email: string, password: string): Promise<void> {
    const me = await api.login(email, password);
    runInAction(() => { this.admin = me.admin; this.permissions = me.permissions; });
  }

  async logout(): Promise<void> {
    await api.logout().catch(() => undefined);
    this.clear();
  }

  clear(): void {
    runInAction(() => { this.admin = null; this.permissions = []; });
  }
}
