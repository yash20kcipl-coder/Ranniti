import pcsList from './parliamentary_constituencies.json';
import acsList from './assembly_constituencies.json';
import geographyLocal from './geography_local.json';

export const initialPcs = pcsList;
export const initialAcs = acsList;
export const initialTalukas = geographyLocal.talukas;
export const initialVillages = geographyLocal.villages;
export const initialWards = geographyLocal.wards;
export const initialBooths = geographyLocal.booths;
