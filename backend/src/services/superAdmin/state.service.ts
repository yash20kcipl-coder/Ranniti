import { MasterQueries } from '../../queries/master.queries';

export class SuperAdminStateService {
  static async getAllStates() {
    return MasterQueries.getStates();
  }
  static async createState(name: string) {
    return MasterQueries.createState(name);
  }
}
