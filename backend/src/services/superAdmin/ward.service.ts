import { MasterQueries } from '../../queries/master.queries';

export class SuperAdminWardService {
  static async getWards(acId?: string) {
    return MasterQueries.getWards(acId);
  }
  static async createWard(data: { acId: string; wardNumber: number; name: string }) {
    return MasterQueries.createWard(data);
  }
}
