import { Tenant } from '../../models/tenant.model';
import { TenantQueries } from '../../queries/tenant.queries';

export class SuperAdminTenantService {
  /**
   * Get all tenants with their provisioning statuses.
   */
  static async getAllTenants(): Promise<Tenant[]> {
    return TenantQueries.getAllTenants();
  }

  /**
   * Get provisioning status for a specific tenant by ID.
   */
  static async getTenantStatus(tenantId: string): Promise<Tenant | null> {
    return TenantQueries.getById(tenantId);
  }
}
