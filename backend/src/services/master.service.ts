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
} from '../models/master.model';
import { ApiError } from '../utils/apiError';
import { MasterQueries } from '../queries/master.queries';

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
    return MasterQueries.createReligion(name);
  }

  async updateReligion(id: string, name?: string): Promise<Religion> {
    const updated = await MasterQueries.updateReligion(id, name);
    if (!updated) throw ApiError.notFound('Religion not found');
    return updated;
  }

  async deleteReligion(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteReligion(id);
    if (!deleted) throw ApiError.notFound('Religion not found');
  }

  // Castes
  async getCastes(): Promise<Caste[]> {
    return MasterQueries.getCastes();
  }

  async createCaste(name: string, category: 'General' | 'OBC' | 'SC' | 'ST' | 'Other', religionId?: string, parentCasteId?: string): Promise<Caste> {
    return MasterQueries.createCaste(name, category, religionId, parentCasteId);
  }

  async updateCaste(id: string, name?: string, category?: string, religionId?: string, parentCasteId?: string): Promise<Caste> {
    const updated = await MasterQueries.updateCaste(id, name, category, religionId, parentCasteId);
    if (!updated) throw ApiError.notFound('Caste not found');
    return updated;
  }

  async deleteCaste(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteCaste(id);
    if (!deleted) throw ApiError.notFound('Caste not found');
  }

  // States
  async getStates(): Promise<State[]> {
    return MasterQueries.getStates();
  }

  async createState(name: string): Promise<State> {
    return MasterQueries.createState(name);
  }

  async updateState(id: string, name?: string, code?: string): Promise<State> {
    const updated = await MasterQueries.updateState(id, name, code);
    if (!updated) throw ApiError.notFound('State not found');
    return updated;
  }

  async deleteState(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteState(id);
    if (!deleted) throw ApiError.notFound('State not found');
  }

  // Districts
  async getDistricts(stateId?: string): Promise<District[]> {
    return MasterQueries.getDistricts(stateId);
  }

  async createDistrict(stateId: string, name: string): Promise<District> {
    return MasterQueries.createDistrict(stateId, name);
  }

  async updateDistrict(id: string, name?: string, stateId?: string): Promise<District> {
    const updated = await MasterQueries.updateDistrict(id, name, stateId);
    if (!updated) throw ApiError.notFound('District not found');
    return updated;
  }

  async deleteDistrict(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteDistrict(id);
    if (!deleted) throw ApiError.notFound('District not found');
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
    return MasterQueries.createTaluka(districtId, name);
  }

  async updateTaluka(id: string, districtId?: string, name?: string): Promise<Taluka> {
    const updated = await MasterQueries.updateTaluka(id, districtId, name);
    if (!updated) throw ApiError.notFound('Taluka not found');
    return updated;
  }

  async deleteTaluka(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteTaluka(id);
    if (!deleted) throw ApiError.notFound('Taluka not found');
  }

  // Villages
  async getVillages(talukaId?: string, districtId?: string, stateId?: string): Promise<Village[]> {
    return MasterQueries.getVillages(talukaId, districtId, stateId);
  }

  async getVillageById(id: string): Promise<Village> {
    const village = await MasterQueries.getVillageById(id);
    if (!village) throw ApiError.notFound('Village not found');
    return village;
  }

  async createVillage(talukaId: string, name: string): Promise<Village> {
    return MasterQueries.createVillage(talukaId, name);
  }

  async updateVillage(id: string, talukaId?: string, name?: string): Promise<Village> {
    const updated = await MasterQueries.updateVillage(id, talukaId, name);
    if (!updated) throw ApiError.notFound('Village not found');
    return updated;
  }

  async deleteVillage(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteVillage(id);
    if (!deleted) throw ApiError.notFound('Village not found');
  }

  // Parliamentary Constituencies (PC)
  async getPcs(stateId?: string): Promise<ParliamentaryConstituency[]> {
    return MasterQueries.getPcs(stateId);
  }

  async createPc(stateId: string, pcNumber: number, name: string): Promise<ParliamentaryConstituency> {
    return MasterQueries.createPc(stateId, pcNumber, name);
  }

  async updatePc(id: string, name?: string, pcNumber?: number, stateId?: string): Promise<ParliamentaryConstituency> {
    const updated = await MasterQueries.updatePc(id, name, pcNumber, stateId);
    if (!updated) throw ApiError.notFound('Parliamentary Constituency not found');
    return updated;
  }

  async deletePc(id: string): Promise<void> {
    const deleted = await MasterQueries.deletePc(id);
    if (!deleted) throw ApiError.notFound('Parliamentary Constituency not found');
  }

  // Assembly Constituencies (AC)
  async getAcs(pcId?: string, districtId?: string, stateId?: string): Promise<AssemblyConstituency[]> {
    return MasterQueries.getAcs(pcId, districtId, stateId);
  }

  async createAc(pcId: string, acNumber: number, name: string, districtId?: string): Promise<AssemblyConstituency> {
    return MasterQueries.createAc(pcId, acNumber, name, districtId);
  }

  async updateAc(id: string, name?: string, acNumber?: number, pcId?: string, districtId?: string): Promise<AssemblyConstituency> {
    const updated = await MasterQueries.updateAc(id, name, acNumber, pcId, districtId);
    if (!updated) throw ApiError.notFound('Assembly Constituency not found');
    return updated;
  }

  async deleteAc(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteAc(id);
    if (!deleted) throw ApiError.notFound('Assembly Constituency not found');
  }

  // Parties
  async getParties(): Promise<Party[]> {
    return MasterQueries.getParties();
  }

  async getPartyById(id: string): Promise<Party | null> {
    return MasterQueries.getPartyById(id);
  }

  async createParty(name: string, abbreviation: string, symbolLogo?: string, alliance?: string): Promise<Party> {
    return MasterQueries.createParty(name, abbreviation, symbolLogo, alliance);
  }

  async updateParty(id: string, name?: string, abbreviation?: string, symbolLogo?: string, alliance?: string): Promise<Party | null> {
    return MasterQueries.updateParty(id, name, abbreviation, symbolLogo, alliance);
  }

  async deleteParty(id: string): Promise<boolean> {
    return MasterQueries.deleteParty(id);
  }

  // Wards
  async getWards(acId?: string): Promise<Ward[]> {
    return MasterQueries.getWards(acId);
  }

  async getWardById(id: string): Promise<Ward> {
    const ward = await MasterQueries.getWardById(id);
    if (!ward) throw ApiError.notFound('Ward not found');
    return ward;
  }

  async createWard(data: { acId: string; wardNumber: number; name: string }): Promise<Ward> {
    return MasterQueries.createWard(data);
  }

  async updateWard(id: string, data: { acId?: string; wardNumber?: number; name?: string }): Promise<Ward> {
    const updated = await MasterQueries.updateWard(id, data);
    if (!updated) throw ApiError.notFound('Ward not found');
    return updated;
  }

  async deleteWard(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteWard(id);
    if (!deleted) throw ApiError.notFound('Ward not found');
  }

  // Booths
  async getBooths(acId?: string, wardId?: string): Promise<Booth[]> {
    return MasterQueries.getBooths(acId, wardId);
  }

  async createBooth(data: { acId: string; wardId?: string; boothNumber: number; name: string; locationBuilding?: string; totalVoters?: number }): Promise<Booth> {
    return MasterQueries.createBooth(data);
  }

  async updateBooth(id: string, data: { acId?: string; wardId?: string; boothNumber?: number; name?: string; locationBuilding?: string; totalVoters?: number }): Promise<Booth> {
    const updated = await MasterQueries.updateBooth(id, data);
    if (!updated) throw ApiError.notFound('Booth not found');
    return updated;
  }

  async deleteBooth(id: string): Promise<void> {
    const deleted = await MasterQueries.deleteBooth(id);
    if (!deleted) throw ApiError.notFound('Booth not found');
  }
}

export const masterService = new MasterService();
