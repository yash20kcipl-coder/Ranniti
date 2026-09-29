import { z } from 'zod';

const preprocessUuid = () =>
  z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === '' || val === 'null' || val === 'undefined' || val === null) return null;
    return val;
  }, z.string().uuid().optional().nullable());

const preprocessInt = () =>
  z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === '' || val === null || val === 'null' || val === 'undefined') return null;
    if (typeof val === 'string' && /^-?\d+$/.test(val)) return parseInt(val, 10);
    return val;
  }, z.number().int().optional().nullable());

const preprocessBool = () =>
  z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return false;
  }, z.boolean().optional());

const preprocessString = () =>
  z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === '' || val === 'null' || val === 'undefined' || val === null) return null;
    if (typeof val === 'object' && val !== null) {
      if (typeof (val as any).url === 'string') return (val as any).url;
      if (typeof (val as any).path === 'string') return (val as any).path;
      if (typeof (val as any).value === 'string') return (val as any).value;
      return null;
    }
    return val;
  }, z.string().optional().nullable());

export const voterIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Voter ID is required'),
  }),
});

export const createVoterSchema = z.object({
  body: z.object({
    epicNo: z.string().min(1, 'EPIC Number (IdCardNo) is required'),
    stateId: preprocessUuid(),
    districtId: preprocessUuid(),
    pcId: preprocessUuid(),
    acId: preprocessUuid(),
    boothId: preprocessUuid(),
    serialNo: preprocessInt(),
    sectionNo: preprocessInt(),
    houseNo: z.string().optional().nullable(),

    firstName: z.string().optional().nullable(),
    engFirstName: z.string().optional().nullable(),
    middleName: z.string().optional().nullable(),
    engMiddleName: z.string().optional().nullable(),
    surname: z.string().optional().nullable(),
    engSurname: z.string().optional().nullable(),

    gender: z.string().optional().nullable(),
    dob: z.string().optional().nullable(),
    age: preprocessInt(),
    mobileNo: z.string().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')).or(z.literal('null')),
    aadhaarNo: z.string().optional().nullable(),
    panNo: z.string().optional().nullable(),

    professionType: z.string().optional().nullable(),
    profession: z.string().optional().nullable(),
    religionId: preprocessUuid(),
    casteId: preprocessUuid(),
    subcasteName: z.string().optional().nullable(),
    voterType: z.string().optional().default('Voter'),

    status: z.string().optional().default('ACTIVE'),
    isDead: preprocessBool(),
    bloodGroup: z.string().optional().nullable(),
    avatar: preprocessString(),
    taluka: z.string().optional().nullable(),
    village: z.string().optional().nullable(),
    fullAddress: z.string().optional().nullable(),
    voterAddress: z.string().optional().nullable(),

    partyId: preprocessUuid(),
    familyInfluencerId: preprocessUuid(),
    socialInfluencerId: preprocessUuid(),
    isFamilyInfluencer: preprocessBool(),
    isSocialInfluencer: preprocessBool(),

    organizationId: preprocessUuid(),
  }),
});

export const updateVoterSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Voter ID is required'),
  }),
  body: createVoterSchema.shape.body.partial(),
});

export const voterQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 25)),
    search: z.string().optional(),
    stateId: z.string().optional(),
    districtId: z.string().optional(),
    boothId: z.string().optional(),
    acId: z.string().optional(),
    sectionNo: z.string().optional(),
    gender: z.string().optional(),
    voterType: z.string().optional(),
    status: z.string().optional(),
    isDead: z.string().optional(),
    religionId: z.string().optional(),
    casteId: z.string().optional(),
    partyId: z.string().optional(),
    ageGroup: z.string().optional(),
    familyInfluencerId: z.string().optional(),
    socialInfluencerId: z.string().optional(),
    isFamilyInfluencer: z.string().optional(),
    isSocialInfluencer: z.string().optional(),
    influencerStatus: z.string().optional(),
    type: z.string().optional(),
    organizationId: z.string().optional(),
  }),
});

export const bulkAssignInfluencerSchema = z.object({
  body: z.object({
    influencerId: z.string().uuid('Valid Influencer ID is required').optional().nullable(),
    influencerType: z.enum(['family', 'social'], { required_error: 'Influencer type must be family or social' }),
    voterIds: z.array(z.string().uuid()).min(1, 'At least one voter ID must be provided'),
  }),
});

export const familyCandidatesQuerySchema = z.object({
  query: z.object({
    influencerId: z.string().min(1, 'Influencer ID is required'),
    boothId: z.string().optional(),
    search: z.string().optional(),
    houseNo: z.string().optional(),
    sameHouseOnly: z.string().optional(),
    sameSurnameOnly: z.string().optional(),
    unassignedOnly: z.string().optional(),
    sectionNo: z.string().optional(),
    gender: z.string().optional(),
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
  }),
});

export const socialCandidatesQuerySchema = z.object({
  query: z.object({
    influencerId: z.string().min(1, 'Influencer ID is required'),
    boothId: z.string().optional(),
    search: z.string().optional(),
    sectionNo: z.string().optional(),
    gender: z.string().optional(),
    voterType: z.string().optional(),
    casteId: z.string().optional(),
    unassignedOnly: z.string().optional(),
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
  }),
});

