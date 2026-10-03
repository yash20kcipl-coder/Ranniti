import { Request, Response } from 'express';
import { attachFileUrls } from '../utils/fileUrl';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { masterService } from '../services/master.service';
import { MasterSyncService } from '../services/masterSync.service';

export class MasterController {
  // AUTO-SYNC ALL MASTERS
  syncMasters = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await MasterSyncService.syncAll();
    const response = ApiResponse.success(result, 'Master data synchronized successfully');
    res.status(response.statusCode).json(response.body);
  });

  // RELIGIONS
  getReligions = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const religions = await masterService.getReligions();
    const response = ApiResponse.success(religions, 'Religions retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getReligionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const religion = await masterService.getReligionById(id);
    const response = ApiResponse.success(religion, 'Religion retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createReligion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body;
    const religion = await masterService.createReligion(name);
    const response = ApiResponse.success(religion, 'Religion created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateReligion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { name } = req.body;
    const religion = await masterService.updateReligion(id, name);
    const response = ApiResponse.success(religion, 'Religion updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteReligion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deleteReligion(id);
    const response = ApiResponse.success(null, 'Religion deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  // CASTES
  getCastes = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const castes = await masterService.getCastes();
    const response = ApiResponse.success(castes, 'Castes retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createCaste = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, category, religionId, parentCasteId } = req.body;
    const caste = await masterService.createCaste(name, category, religionId, parentCasteId);
    const response = ApiResponse.success(caste, 'Caste created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateCaste = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { name, category, religionId, parentCasteId } = req.body;
    const caste = await masterService.updateCaste(id, name, category, religionId, parentCasteId);
    const response = ApiResponse.success(caste, 'Caste updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteCaste = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deleteCaste(id);
    const response = ApiResponse.success(null, 'Caste deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  // STATES
  getStates = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const states = await masterService.getStates();
    const response = ApiResponse.success(states, 'States retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createState = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, code } = req.body;
    const state = await masterService.createState(name);
    const response = ApiResponse.success(state, 'State created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateState = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { name, code } = req.body;
    const state = await masterService.updateState(id, name, code);
    const response = ApiResponse.success(state, 'State updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteState = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deleteState(id);
    const response = ApiResponse.success(null, 'State deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  // DISTRICTS
  getDistricts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stateId = req.query.stateId as string | undefined;
    const districts = await masterService.getDistricts(stateId);
    const response = ApiResponse.success(districts, 'Districts retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createDistrict = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { stateId, name } = req.body;
    const district = await masterService.createDistrict(stateId, name);
    const response = ApiResponse.success(district, 'District created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateDistrict = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { stateId, name } = req.body;
    const district = await masterService.updateDistrict(id, name, stateId);
    const response = ApiResponse.success(district, 'District updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteDistrict = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deleteDistrict(id);
    const response = ApiResponse.success(null, 'District deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  // TALUKAS
  getTalukas = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const districtId = req.query.districtId as string | undefined;
    const stateId = req.query.stateId as string | undefined;
    const talukas = await masterService.getTalukas(districtId, stateId);
    const response = ApiResponse.success(talukas, 'Talukas retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getTalukaById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const taluka = await masterService.getTalukaById(id);
    const response = ApiResponse.success(taluka, 'Taluka retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createTaluka = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { districtId, name } = req.body;
    const taluka = await masterService.createTaluka(districtId, name);
    const response = ApiResponse.success(taluka, 'Taluka created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateTaluka = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { districtId, name } = req.body;
    const taluka = await masterService.updateTaluka(id, districtId, name);
    const response = ApiResponse.success(taluka, 'Taluka updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteTaluka = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deleteTaluka(id);
    const response = ApiResponse.success(null, 'Taluka deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  // VILLAGES
  getVillages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const talukaId = req.query.talukaId as string | undefined;
    const districtId = req.query.districtId as string | undefined;
    const stateId = req.query.stateId as string | undefined;
    const villages = await masterService.getVillages(talukaId, districtId, stateId);
    const response = ApiResponse.success(villages, 'Villages retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getVillageById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const village = await masterService.getVillageById(id);
    const response = ApiResponse.success(village, 'Village retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createVillage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { talukaId, name } = req.body;
    const village = await masterService.createVillage(talukaId, name);
    const response = ApiResponse.success(village, 'Village created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateVillage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { talukaId, name } = req.body;
    const village = await masterService.updateVillage(id, talukaId, name);
    const response = ApiResponse.success(village, 'Village updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteVillage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deleteVillage(id);
    const response = ApiResponse.success(null, 'Village deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  // PARLIAMENTARY CONSTITUENCIES (PC)
  getPcs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stateId = req.query.stateId as string | undefined;
    const pcs = await masterService.getPcs(stateId);
    const response = ApiResponse.success(pcs, 'Parliamentary Constituencies retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createPc = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { stateId, pcNumber, name } = req.body;
    const pc = await masterService.createPc(stateId, pcNumber, name);
    const response = ApiResponse.success(pc, 'Parliamentary Constituency created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updatePc = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { stateId, pcNumber, name } = req.body;
    const pc = await masterService.updatePc(id, name, pcNumber, stateId);
    const response = ApiResponse.success(pc, 'Parliamentary Constituency updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deletePc = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deletePc(id);
    const response = ApiResponse.success(null, 'Parliamentary Constituency deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  // ASSEMBLY CONSTITUENCIES (AC)
  getAcs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pcId = req.query.pcId as string | undefined;
    const districtId = req.query.districtId as string | undefined;
    const stateId = req.query.stateId as string | undefined;
    const acs = await masterService.getAcs(pcId, districtId, stateId);
    const response = ApiResponse.success(acs, 'Assembly Constituencies retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createAc = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { pcId, acNumber, name, districtId } = req.body;
    const ac = await masterService.createAc(pcId, acNumber, name, districtId);
    const response = ApiResponse.success(ac, 'Assembly Constituency created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateAc = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { pcId, acNumber, name, districtId } = req.body;
    const ac = await masterService.updateAc(id, name, acNumber, pcId, districtId);
    const response = ApiResponse.success(ac, 'Assembly Constituency updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteAc = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deleteAc(id);
    const response = ApiResponse.success(null, 'Assembly Constituency deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  // PARTIES
  getParties = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parties = await masterService.getParties();
    const formattedParties = attachFileUrls(parties, ['symbolLogo'], req);
    const response = ApiResponse.success(formattedParties, 'Parties retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createParty = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, abbreviation, symbolLogo, alliance } = req.body;
    const party = await masterService.createParty(name, abbreviation, symbolLogo, alliance);
    const formattedParty = attachFileUrls(party, ['symbolLogo'], req);
    const response = ApiResponse.success(formattedParty, 'Party created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateParty = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { name, abbreviation, symbolLogo, alliance } = req.body;
    const party = await masterService.updateParty(id, name, abbreviation, symbolLogo, alliance);
    const formattedParty = attachFileUrls(party, ['symbolLogo'], req);
    const response = ApiResponse.success(formattedParty, 'Party updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteParty = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deleteParty(id);
    const response = ApiResponse.success(null, 'Party deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  // WARDS
  getWards = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const acId = req.query.acId as string | undefined;
    const wards = await masterService.getWards(acId);
    const response = ApiResponse.success(wards, 'Wards retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getWardById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const ward = await masterService.getWardById(id);
    const response = ApiResponse.success(ward, 'Ward retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createWard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { acId, wardNumber, name } = req.body;
    const ward = await masterService.createWard({ acId, wardNumber: Number(wardNumber), name });
    const response = ApiResponse.success(ward, 'Ward created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateWard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { acId, wardNumber, name } = req.body;
    const ward = await masterService.updateWard(id, {
      acId,
      wardNumber: wardNumber !== undefined ? Number(wardNumber) : undefined,
      name,
    });
    const response = ApiResponse.success(ward, 'Ward updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteWard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deleteWard(id);
    const response = ApiResponse.success(null, 'Ward deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  // BOOTHS
  getBooths = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const acId = req.query.acId as string | undefined;
    const wardId = req.query.wardId as string | undefined;
    const booths = await masterService.getBooths(acId, wardId);
    const response = ApiResponse.success(booths, 'Booths retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createBooth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const booth = await masterService.createBooth(req.body);
    const response = ApiResponse.success(booth, 'Booth created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateBooth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const booth = await masterService.updateBooth(id, req.body);
    const response = ApiResponse.success(booth, 'Booth updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteBooth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deleteBooth(id);
    const response = ApiResponse.success(null, 'Booth deleted successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const masterController = new MasterController();
