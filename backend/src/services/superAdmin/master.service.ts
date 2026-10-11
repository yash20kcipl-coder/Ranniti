import {
  Religion,
  Caste,
  State,
  District,
  Taluka,
  Village,
  ParliamentaryConstituency,
  AssemblyConstituency,
  Ward,
  Party,
  Booth,
} from '../../models/master.model';
import { ApiError } from '../../utils/apiError';
import { MasterQueries } from '../../queries/master.queries';
import { SyncManifestService } from '../syncManifest.service';
import { MasterBroadcastSync } from '../sync/masterBroadcastSync.service';

export class MasterService {
  // Religions
  async getReligions(): Promise<Religion[]> {
    return MasterQueries.getReligions();
  }

  async getReligionById(id: string): Promise<Religion> {
    const religion = await MasterQueries.getReligionById(id);
    if (!religion) throw ApiError.notFound('Religion not found');
    return religion;
  }

  async createReligion(name: string): Promise<Religion> {
    const created = await MasterQueries.createReligion(name);
    await SyncManifestService.bumpVersion('religions');
    MasterBroadcastSync.broadcastToAllTenants('religions', created).catch(() => {});
    return created;
  }

  async updateReligion(id: string, name?: string): Promise<Religion> {
    const updated = await MasterQueries.updateReligion(id, name);
    if (!updated) throw ApiError.notFound('Religion not found');
    await SyncManifestService.bumpVersion('religions');
    MasterBroadcastSync.broadcastToAllTenants('religions', updated).catch(() => {});
    return updated;
  }

  async deleteReligion(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteReligion(id);
    if (!deleted) throw ApiError.notFound('Religion not found');
    await SyncManifestService.bumpVersion('religions');
    MasterBroadcastSync.broadcastDeleteToAllTenants('religions', id).catch(() => {});
  }

  // Castes
  async getCastes(): Promise<Caste[]> {
    return MasterQueries.getCastes();
  }

  async createCaste(
    name: string,
    category: 'General' | 'OBC' | 'SC' | 'ST' | 'Other',
    religionId?: string,
    parentCasteId?: string,
    religionName?: string,
    parentCasteName?: string
  ): Promise<Caste> {
    const created = await MasterQueries.createCaste(name, category, religionId, parentCasteId, religionName, parentCasteName);
    await SyncManifestService.bumpVersion('castes');
    MasterBroadcastSync.broadcastToAllTenants('castes', created).catch(() => {});
    return created;
  }

  async updateCaste(id: string, name?: string, category?: string, religionId?: string, parentCasteId?: string): Promise<Caste> {
    const updated = await MasterQueries.updateCaste(id, name, category, religionId, parentCasteId);
    if (!updated) throw ApiError.notFound('Caste not found');
    await SyncManifestService.bumpVersion('castes');
    MasterBroadcastSync.broadcastToAllTenants('castes', updated).catch(() => {});
    return updated;
  }

  async deleteCaste(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteCaste(id);
    if (!deleted) throw ApiError.notFound('Caste not found');
    await SyncManifestService.bumpVersion('castes');
    MasterBroadcastSync.broadcastDeleteToAllTenants('castes', id).catch(() => {});
  }

  // States
  async getStates(): Promise<State[]> {
    return MasterQueries.getStates();
  }

  async createState(name: string): Promise<State> {
    const created = await MasterQueries.createState(name);
    await SyncManifestService.bumpVersion('states');
    MasterBroadcastSync.broadcastToAllTenants('states', created).catch(() => {});
    return created;
  }

  async updateState(id: string, name?: string, code?: string): Promise<State> {
    const updated = await MasterQueries.updateState(id, name, code);
    if (!updated) throw ApiError.notFound('State not found');
    await SyncManifestService.bumpVersion('states');
    MasterBroadcastSync.broadcastToAllTenants('states', updated).catch(() => {});
    return updated;
  }

  async deleteState(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteState(id);
    if (!deleted) throw ApiError.notFound('State not found');
    await SyncManifestService.bumpVersion('states');
    MasterBroadcastSync.broadcastDeleteToAllTenants('states', id).catch(() => {});
  }

  // Districts
  async getDistricts(stateId?: string): Promise<District[]> {
    return MasterQueries.getDistricts(stateId);
  }

  async createDistrict(stateId: string, name: string): Promise<District> {
    const created = await MasterQueries.createDistrict(stateId, name);
    await SyncManifestService.bumpVersion('districts');
    MasterBroadcastSync.broadcastToAllTenants('districts', created).catch(() => {});
    return created;
  }

  async updateDistrict(id: string, name?: string, stateId?: string): Promise<District> {
    const updated = await MasterQueries.updateDistrict(id, name, stateId);
    if (!updated) throw ApiError.notFound('District not found');
    await SyncManifestService.bumpVersion('districts');
    MasterBroadcastSync.broadcastToAllTenants('districts', updated).catch(() => {});
    return updated;
  }

  async deleteDistrict(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteDistrict(id);
    if (!deleted) throw ApiError.notFound('District not found');
    await SyncManifestService.bumpVersion('districts');
    MasterBroadcastSync.broadcastDeleteToAllTenants('districts', id).catch(() => {});
  }

  // Talukas
  async getTalukas(districtId?: string, stateId?: string): Promise<Taluka[]> {
    return MasterQueries.getTalukas(districtId, stateId);
  }

  async getTalukaById(id: string): Promise<Taluka> {
    const taluka = await MasterQueries.getTalukaById(id);
    if (!taluka) throw ApiError.notFound('Taluka not found');
    return taluka;
  }

  async createTaluka(districtId: string, name: string): Promise<Taluka> {
    const created = await MasterQueries.createTaluka(districtId, name);
    MasterBroadcastSync.broadcastToAllTenants('talukas', created).catch(() => {});
    return created;
  }

  async updateTaluka(id: string, districtId?: string, name?: string): Promise<Taluka> {
    const updated = await MasterQueries.updateTaluka(id, districtId, name);
    if (!updated) throw ApiError.notFound('Taluka not found');
    MasterBroadcastSync.broadcastToAllTenants('talukas', updated).catch(() => {});
    return updated;
  }

  async deleteTaluka(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteTaluka(id);
    if (!deleted) throw ApiError.notFound('Taluka not found');
    MasterBroadcastSync.broadcastDeleteToAllTenants('talukas', id).catch(() => {});
  }

  // Villages
  async getVillages(params?: any, districtId?: string, stateId?: string): Promise<any> {
    return MasterQueries.getVillages(params, districtId, stateId);
  }

  async getVillageById(id: string): Promise<Village> {
    const village = await MasterQueries.getVillageById(id);
    if (!village) throw ApiError.notFound('Village not found');
    return village;
  }

  async createVillage(talukaId: string, name: string): Promise<Village> {
    const created = await MasterQueries.createVillage(talukaId, name);
    MasterBroadcastSync.broadcastToAllTenants('villages', created).catch(() => {});
    return created;
  }

  async updateVillage(id: string, talukaId?: string, name?: string): Promise<Village> {
    const updated = await MasterQueries.updateVillage(id, talukaId, name);
    if (!updated) throw ApiError.notFound('Village not found');
    MasterBroadcastSync.broadcastToAllTenants('villages', updated).catch(() => {});
    return updated;
  }

  async deleteVillage(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteVillage(id);
    if (!deleted) throw ApiError.notFound('Village not found');
    MasterBroadcastSync.broadcastDeleteToAllTenants('villages', id).catch(() => {});
  }

  // Parliamentary Constituencies (PC)
  async getPcs(stateId?: string): Promise<ParliamentaryConstituency[]> {
    return MasterQueries.getPcs(stateId);
  }

  async createPc(stateId: string, pcNumber: number, name: string): Promise<ParliamentaryConstituency> {
    const created = await MasterQueries.createPc(stateId, pcNumber, name);
    await SyncManifestService.bumpVersion('pcs');
    MasterBroadcastSync.broadcastToAllTenants('parliamentary_constituencies', created).catch(() => {});
    return created;
  }

  async updatePc(id: string, name?: string, pcNumber?: number, stateId?: string): Promise<ParliamentaryConstituency> {
    const updated = await MasterQueries.updatePc(id, name, pcNumber, stateId);
    if (!updated) throw ApiError.notFound('Parliamentary Constituency not found');
    await SyncManifestService.bumpVersion('pcs');
    MasterBroadcastSync.broadcastToAllTenants('parliamentary_constituencies', updated).catch(() => {});
    return updated;
  }

  async deletePc(id: string): Promise<void> {
    const deleted = await MasterQueries.deletePc(id);
    if (!deleted) throw ApiError.notFound('Parliamentary Constituency not found');
    await SyncManifestService.bumpVersion('pcs');
    MasterBroadcastSync.broadcastDeleteToAllTenants('parliamentary_constituencies', id).catch(() => {});
  }

  // Assembly Constituencies (AC)
  async getAcs(pcId?: string, districtId?: string, stateId?: string): Promise<AssemblyConstituency[]> {
    return MasterQueries.getAcs(pcId, districtId, stateId);
  }

  async createAc(pcId: string, acNumber: number, name: string, districtId?: string): Promise<AssemblyConstituency> {
    const created = await MasterQueries.createAc(pcId, acNumber, name, districtId);
    await SyncManifestService.bumpVersion('acs');
    MasterBroadcastSync.broadcastToAllTenants('assembly_constituencies', created).catch(() => {});
    return created;
  }

  async updateAc(id: string, name?: string, acNumber?: number, pcId?: string, districtId?: string): Promise<AssemblyConstituency> {
    const updated = await MasterQueries.updateAc(id, name, acNumber, pcId, districtId);
    if (!updated) throw ApiError.notFound('Assembly Constituency not found');
    await SyncManifestService.bumpVersion('acs');
    MasterBroadcastSync.broadcastToAllTenants('assembly_constituencies', updated).catch(() => {});
    return updated;
  }

  async deleteAc(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteAc(id);
    if (!deleted) throw ApiError.notFound('Assembly Constituency not found');
    await SyncManifestService.bumpVersion('acs');
    MasterBroadcastSync.broadcastDeleteToAllTenants('assembly_constituencies', id).catch(() => {});
  }

  // Parties
  async getParties(): Promise<Party[]> {
    return MasterQueries.getParties();
  }

  async getPartyById(id: string): Promise<Party | null> {
    return MasterQueries.getPartyById(id);
  }

  async createParty(name: string, abbreviation: string, symbolLogo?: string, alliance?: string): Promise<Party> {
    const created = await MasterQueries.createParty(name, abbreviation, symbolLogo, alliance);
    MasterBroadcastSync.broadcastToAllTenants('parties', created).catch(() => {});
    return created;
  }

  async updateParty(id: string, name?: string, abbreviation?: string, symbolLogo?: string, alliance?: string): Promise<Party | null> {
    const updated = await MasterQueries.updateParty(id, name, abbreviation, symbolLogo, alliance);
    if (updated) {
      MasterBroadcastSync.broadcastToAllTenants('parties', updated).catch(() => {});
    }
    return updated;
  }

  async deleteParty(id: string): Promise<boolean> {
    const deleted = await MasterQueries.deleteParty(id);
    if (deleted) {
      MasterBroadcastSync.broadcastDeleteToAllTenants('parties', id).catch(() => {});
    }
    return deleted;
  }

  // Wards
  async getWards(params?: any, acId?: string): Promise<any> {
    return MasterQueries.getWards(params, acId);
  }

  async getWardById(id: string): Promise<Ward> {
    const ward = await MasterQueries.getWardById(id);
    if (!ward) throw ApiError.notFound('Ward not found');
    return ward;
  }

  async createWard(data: { acId: string; wardNumber: number; name: string }): Promise<Ward> {
    const created = await MasterQueries.createWard(data);
    MasterBroadcastSync.broadcastToScopedTenants('wards', created, data.acId).catch(() => {});
    return created;
  }

  async updateWard(id: string, data: { acId?: string; wardNumber?: number; name?: string }): Promise<Ward> {
    const updated = await MasterQueries.updateWard(id, data);
    if (!updated) throw ApiError.notFound('Ward not found');
    const acId = (updated as any).ac_id || (updated as any).acId || data.acId;
    if (acId) {
      MasterBroadcastSync.broadcastToScopedTenants('wards', updated, acId).catch(() => {});
    } else {
      MasterBroadcastSync.broadcastToAllTenants('wards', updated).catch(() => {});
    }
    return updated;
  }

  async deleteWard(id: string): Promise<void> {
    const existing = await MasterQueries.getWardById(id).catch(() => null);
    const deleted = await MasterQueries.deleteWard(id);
    if (!deleted) throw ApiError.notFound('Ward not found');
    const acId = (existing as any)?.ac_id || (existing as any)?.acId;
    if (acId) {
      MasterBroadcastSync.broadcastDeleteToScopedTenants('wards', id, acId).catch(() => {});
    } else {
      MasterBroadcastSync.broadcastDeleteToAllTenants('wards', id).catch(() => {});
    }
  }

  // Booths
  async getBoothOptions(filter: { acId?: string; wardId?: string; search?: string; limit?: number }): Promise<any[]> {
    return MasterQueries.getBoothOptions(filter);
  }

  async getBooths(params?: any, wardId?: string): Promise<any> {
    return MasterQueries.getBooths(params, wardId);
  }

  async createBooth(data: { acId: string; wardId?: string; boothNumber: number; name: string; locationBuilding?: string; totalVoters?: number }): Promise<Booth> {
    const created = await MasterQueries.createBooth(data);
    MasterBroadcastSync.broadcastToScopedTenants('booths', created, data.acId).catch(() => {});
    return created;
  }

  async updateBooth(id: string, data: { acId?: string; wardId?: string; boothNumber?: number; name?: string; locationBuilding?: string; totalVoters?: number }): Promise<Booth> {
    const updated = await MasterQueries.updateBooth(id, data);
    if (!updated) throw ApiError.notFound('Booth not found');
    const acId = (updated as any).ac_id || (updated as any).acId || data.acId;
    if (acId) {
      MasterBroadcastSync.broadcastToScopedTenants('booths', updated, acId).catch(() => {});
    } else {
      MasterBroadcastSync.broadcastToAllTenants('booths', updated).catch(() => {});
    }
    return updated;
  }

  async deleteBooth(id: string): Promise<void> {
    const existing = await MasterQueries.getBoothOptions({ search: id, limit: 1 }).catch(() => []);
    const deleted = await MasterQueries.deleteBooth(id);
    if (!deleted) throw ApiError.notFound('Booth not found');
    const acId = existing[0]?.acId;
    if (acId) {
      MasterBroadcastSync.broadcastDeleteToScopedTenants('booths', id, acId).catch(() => {});
    } else {
      MasterBroadcastSync.broadcastDeleteToAllTenants('booths', id).catch(() => {});
    }
  }
}

export const masterService = new MasterService();
