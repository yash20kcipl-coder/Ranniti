import { MasterQueries } from '../../queries/master.queries';

export class SuperAdminPcService {
  static async getPcs(stateId?: string) {
    return MasterQueries.getPcs(stateId);
  }
  static async createPc(stateId: string, pcNumber: number, name: string) {
    return MasterQueries.createPc(stateId, pcNumber, name);
  }
}
