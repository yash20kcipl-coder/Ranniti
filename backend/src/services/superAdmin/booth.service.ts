import { MasterQueries } from '../../queries/master.queries';

export class SuperAdminBoothService {
  static async getBooths(acId?: string, wardId?: string) {
    return MasterQueries.getBooths(acId, wardId);
  }
  static async createBooth(data: { acId: string; wardId?: string; boothNumber: number; name: string; locationBuilding?: string; totalVoters?: number }) {
    return MasterQueries.createBooth(data);
  }
}
