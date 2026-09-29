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
    blockId: z.string().uuid().optional(),
    boothNumber: z.number().int().positive('Booth number must be a positive integer'),
    name: z.string().min(2, 'Booth name required'),
    locationBuilding: z.string().optional(),
    totalVoters: z.number().int().nonnegative().optional(),
  }),
});

// Organization Schemas
export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Organization name required'),
    code: z.string().min(2, 'Unique organization code required'),
    acId: z.string().uuid().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  }),
});
