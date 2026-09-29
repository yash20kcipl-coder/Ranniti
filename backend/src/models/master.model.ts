export interface State {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface District {
  id: string;
  stateId: string;
  stateName?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParliamentaryConstituency {
  id: string;
  stateId: string;
  stateName?: string;
  pcNumber: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssemblyConstituency {
  id: string;
  pcId: string;
  pcName?: string;
  districtId?: string;
  districtName?: string;
  acNumber: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Block {
  id: string;
  acId: string;
  code?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booth {
  id: string;
  acId: string;
  acName?: string;
  blockId?: string;
  boothNumber: number;
  name: string;
  locationBuilding?: string;
  totalVoters?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Religion {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Caste {
  id: string;
  name: string;
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'Other';
  religionId?: string;
  religionName?: string;
  parentCasteId?: string;
  parentCasteName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Party {
  id: string;
  name: string;
  abbreviation: string;
  symbolLogo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  acId?: string;
  acName?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}
