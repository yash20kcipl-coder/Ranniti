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

  // BOOTHS
  getBooths = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const acId = req.query.acId as string | undefined;
    const booths = await masterService.getBooths(acId);
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

  // ORGANIZATIONS
  getOrganizations = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const orgs = await masterService.getOrganizations();
    const response = ApiResponse.success(orgs, 'Organizations retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createOrganization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const org = await masterService.createOrganization(req.body);
    const response = ApiResponse.success(org, 'Organization created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateOrganization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const org = await masterService.updateOrganization(id, req.body);
    const response = ApiResponse.success(org, 'Organization updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteOrganization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await masterService.deleteOrganization(id);
    const response = ApiResponse.success(null, 'Organization deleted successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const masterController = new MasterController();
