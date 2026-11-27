import { query as masterQuery } from '../../queries/dbPool';

export interface ConstituencyScope {
  resolvedAcIds: string[];
  resolvedPcIds: string[];
  resolvedDistrictIds: string[];
}

/**
 * Resolves full constituency scope:
 * 1. Resolves all AC IDs (from direct acIds + child ACs of pcIds)
 * 2. Resolves all PC IDs (from direct pcIds + parent PCs of all resolved ACs)
 */
export async function resolveConstituencyScope(
  acIds: string[] = [],
  pcIds: string[] = []
): Promise<ConstituencyScope> {
  const acIdSet = new Set<string>((acIds || []).filter(Boolean));

  if (pcIds && pcIds.length > 0) {
    const childAcRes = await masterQuery(
      `SELECT id FROM assembly_constituencies WHERE pc_id = ANY($1::uuid[])`,
      [pcIds]
    );
    for (const r of childAcRes.rows) {
      if (r.id) acIdSet.add(r.id);
    }
  }

  const resolvedAcIds = Array.from(acIdSet);
  const pcIdSet = new Set<string>((pcIds || []).filter(Boolean));

  if (resolvedAcIds.length > 0) {
    const parentPcRes = await masterQuery(
      `SELECT DISTINCT pc_id FROM assembly_constituencies WHERE id = ANY($1::uuid[]) AND pc_id IS NOT NULL`,
      [resolvedAcIds]
    );
    for (const r of parentPcRes.rows) {
      if (r.pc_id) pcIdSet.add(r.pc_id);
    }
  }

  const resolvedPcIds = Array.from(pcIdSet);

  const districtIdSet = new Set<string>();
  if (resolvedAcIds.length > 0) {
    const distRes = await masterQuery(
      `SELECT DISTINCT district_id FROM assembly_constituencies WHERE id = ANY($1::uuid[]) AND district_id IS NOT NULL`,
      [resolvedAcIds]
    );
    for (const r of distRes.rows) {
      if (r.district_id) districtIdSet.add(r.district_id);
    }
  }
  const resolvedDistrictIds = Array.from(districtIdSet);

  return {
    resolvedAcIds,
    resolvedPcIds,
    resolvedDistrictIds,
  };
}
