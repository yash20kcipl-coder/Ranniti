import { Router } from 'express';
import { tenantReportController } from '../../controllers/tenant/report.controller';

const router = Router();

router.get('/voter-sync', tenantReportController.getVoterSyncReport);
router.get('/voter-sync/export', tenantReportController.exportVoterSyncExcel);
router.get('/voting', tenantReportController.getVotingReport);
router.get('/voting/export', tenantReportController.exportVotingReportExcel);
router.get('/volunteer-outreach/export', tenantReportController.exportVolunteerOutreachExcel);
router.get('/volunteer-outreach-voters', tenantReportController.getVolunteerOutreachVoters);

export const tenantReportRoutes = router;
