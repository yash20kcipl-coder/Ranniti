import { MasterQueries } from '../../queries/master.queries';

export class SuperAdminAcService {
  static async getAcs(pcId?: string, districtId?: string, stateId?: string) {
    return MasterQueries.getAcs(pcId, districtId, stateId);
  }
  static async createAc(pcId: string, acNumber: number, name: string, districtId?: string) {
    return MasterQueries.createAc(pcId, acNumber, name, districtId);
  }
}
