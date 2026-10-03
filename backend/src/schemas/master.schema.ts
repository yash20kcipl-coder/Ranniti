import { z } from 'zod';

// ID Parameter Validation
export const masterIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
});

// Religion Schemas
export const createReligionSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Religion name must be at least 2 characters'),
  }),
});

export const updateReligionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2).optional(),
  }),
});

// Caste Schemas
export const createCasteSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Caste name must be at least 2 characters'),
    category: z.enum(['General', 'OBC', 'SC', 'ST', 'Other']),
    religionId: z.string().uuid().optional(),
  }),
});

export const updateCasteSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2).optional(),
    category: z.enum(['General', 'OBC', 'SC', 'ST', 'Other']).optional(),
    religionId: z.string().uuid().optional(),
  }),
});

// State Schemas
export const createStateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'State name required'),
  }),
});

// District Schemas
export const createDistrictSchema = z.object({
  body: z.object({
    stateId: z.string().uuid('State ID must be a valid UUID'),
    name: z.string().min(2, 'District name required'),
  }),
});

// Taluka Schemas
export const createTalukaSchema = z.object({
  body: z.object({
    districtId: z.string().uuid('District ID must be a valid UUID'),
    name: z.string().min(2, 'Taluka name required'),
  }),
});

export const updateTalukaSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    districtId: z.string().uuid().optional(),
    name: z.string().min(2).optional(),
  }),
});

// Village Schemas
export const createVillageSchema = z.object({
  body: z.object({
    talukaId: z.string().uuid('Taluka ID must be a valid UUID'),
    name: z.string().min(2, 'Village name required'),
  }),
});

export const updateVillageSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    talukaId: z.string().uuid().optional(),
    name: z.string().min(2).optional(),
  }),
});

// Parliamentary Constituency (PC) Schemas
export const createPcSchema = z.object({
  body: z.object({
    stateId: z.string().uuid('State ID must be a valid UUID'),
    pcNumber: z.number().int().positive('PC Number required'),
    name: z.string().min(2, 'Parliamentary Constituency name required'),
  }),
});

// Assembly Constituency (AC) Schemas
export const createAcSchema = z.object({
  body: z.object({
    pcId: z.string().uuid('PC ID must be a valid UUID'),
    districtId: z.string().uuid().optional(),
    acNumber: z.number().int().positive('AC Number required'),
    name: z.string().min(2, 'Assembly Constituency name required'),
  }),
});

// Ward Schemas
export const createWardSchema = z.object({
  body: z.object({
    acId: z.string().uuid('Assembly constituency ID must be a valid UUID'),
    wardNumber: z.number().int().positive('Ward number must be a positive integer'),
    name: z.string().min(1, 'Ward name required'),
    stateId: z.string().uuid().optional().nullable(),
    districtId: z.string().uuid().optional().nullable(),
    pcId: z.string().uuid().optional().nullable(),
  }),
});

export const updateWardSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    acId: z.string().uuid().optional(),
    wardNumber: z.number().int().positive().optional(),
    name: z.string().min(1).optional(),
    stateId: z.string().uuid().optional().nullable(),
    districtId: z.string().uuid().optional().nullable(),
    pcId: z.string().uuid().optional().nullable(),
  }),
});

// Party Schemas
export const createPartySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Party name required'),
    abbreviation: z.string().min(1, 'Abbreviation required (e.g. BJP, INC, AAP)'),
    symbolLogo: z.string().optional(),
  }),
});

// Booth Schemas
export const createBoothSchema = z.object({
  body: z.object({
    acId: z.string().uuid('Assembly constituency ID must be a valid UUID'),
    wardId: z.string().uuid().optional().nullable(),
    boothNumber: z.number().int().positive('Booth number must be a positive integer'),
    name: z.string().min(2, 'Booth name required'),
    locationBuilding: z.string().optional().nullable(),
    totalVoters: z.number().int().nonnegative().optional(),
    stateId: z.string().uuid().optional().nullable(),
    districtId: z.string().uuid().optional().nullable(),
    pcId: z.string().uuid().optional().nullable(),
  }),
});
