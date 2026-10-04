import { ApiError } from '../../utils/apiError';
import { RoleQueries } from '../../queries/role.queries';
import type { TenantRole, TenantUserRole } from '../../models/role.model';

export class RoleService {
  // ─── Super Admin Tenant Role Packages ──────────────────────────────────────

  async getAllTenantRoles(): Promise<TenantRole[]> {
    return await RoleQueries.getAllTenantRoles();
  }

  async getTenantRoleById(id: string): Promise<TenantRole> {
    const role = await RoleQueries.getTenantRoleById(id);
    if (!role) {
      throw new ApiError(404, 'Tenant Role Package not found');
    }
    return role;
  }

  async createTenantRole(data: {
    roleName: string;
    description?: string;
    allowedTabs: any;
    isActive?: boolean;
  }): Promise<TenantRole> {
    if (!data.roleName || !data.roleName.trim()) {
      throw new ApiError(400, 'Role Package name is required');
    }
    return await RoleQueries.createTenantRole(data);
  }

  async updateTenantRole(id: string, data: any): Promise<TenantRole> {
    await this.getTenantRoleById(id);
    const updated = await RoleQueries.updateTenantRole(id, data);
    if (!updated) {
      throw new ApiError(500, 'Failed to update Tenant Role Package');
    }
    return updated;
  }

  async deleteTenantRole(id: string): Promise<boolean> {
    await this.getTenantRoleById(id);
    return await RoleQueries.deleteTenantRole(id);
  }

  async setDefaultTenantRole(id: string): Promise<TenantRole> {
    await this.getTenantRoleById(id);
    const updated = await RoleQueries.setDefaultTenantRole(id);
    if (!updated) {
      throw new ApiError(500, 'Failed to set default Tenant Role Package');
    }
    return updated;
  }

  // ─── Tenant Custom User Roles ─────────────────────────────────────────────

  async getAllTenantUserRoles(tenantDbName?: string): Promise<TenantUserRole[]> {
    return await RoleQueries.getAllTenantUserRoles(tenantDbName);
  }

  async getTenantUserRoleById(id: string, tenantDbName?: string): Promise<TenantUserRole> {
    const role = await RoleQueries.getTenantUserRoleById(id, tenantDbName);
    if (!role) {
      throw new ApiError(404, 'Tenant User Role not found');
    }
    return role;
  }

  async createTenantUserRole(data: {
    tenantDbName?: string;
    roleName: string;
    roleKey: string;
    description?: string;
    accessibleTabs: any;
    voterPermissions: any;
    canCreateRoles?: string[];
    isSystemDefault?: boolean;
    createdBy?: string;
  }): Promise<TenantUserRole> {
    if (!data.roleName || !data.roleName.trim()) {
      throw new ApiError(400, 'User Role name is required');
    }
    if (!data.roleKey) {
      throw new ApiError(400, 'User Role category key is required');
    }

    return await RoleQueries.createTenantUserRole(data);
  }

  async updateTenantUserRole(id: string, data: any, tenantDbName?: string): Promise<TenantUserRole> {
    await this.getTenantUserRoleById(id, tenantDbName);
    const updated = await RoleQueries.updateTenantUserRole(id, { ...data, tenantDbName });
    if (!updated) {
      throw new ApiError(500, 'Failed to update Tenant User Role');
    }
    return updated;
  }

  async deleteTenantUserRole(id: string, tenantDbName?: string): Promise<boolean> {
    const role = await this.getTenantUserRoleById(id, tenantDbName);
    if (role.isSystemDefault) {
      throw new ApiError(400, 'System default roles cannot be deleted');
    }
    return await RoleQueries.deleteTenantUserRole(id, tenantDbName);
  }
}

export const roleService = new RoleService();
