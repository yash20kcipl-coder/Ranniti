import { MasterQueries } from '../../queries/master.queries';

export class SuperAdminDistrictService {
  static async getDistricts(stateId?: string) {
    return MasterQueries.getDistricts(stateId);
  }
  static async createDistrict(stateId: string, name: string) {
    return MasterQueries.createDistrict(stateId, name);
  }
}
