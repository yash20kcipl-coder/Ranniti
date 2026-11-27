import * as XLSX from 'xlsx';
import type {
  ElectionRecord,
  UploadValidationResult,
  ElectionType,
} from '../types/electionGis.types';
import officialMappingRaw from '../data/official_pc_ac_mapping.json';

const officialMappings: Array<{
  stateName: string;
  pcNumber: number;
  pcName: string;
  acNumber: number;
  name: string;
}> = officialMappingRaw as any;

const STANDARD_FIELD_SYNONYMS: Record<string, string[]> = {
  state_code: ['state_code', 'statecode', 'state_id', 'st_code', 'state'],
  state_name: ['state_name', 'statename', 'state', 'st_name'],
  pc_code: ['pc_code', 'pccode', 'pc_id', 'pc_no', 'pc_number', 'parliamentary_constituency_code'],
  pc_name: ['pc_name', 'pcname', 'constituency', 'parliamentary_constituency', 'pc'],
  ac_code: ['ac_code', 'accode', 'ac_id', 'ac_no', 'ac_number', 'assembly_constituency_code'],
  ac_name: ['ac_name', 'acname', 'assembly_constituency', 'segment', 'ac'],
  booth_code: ['booth_code', 'boothcode', 'booth_id', 'booth_no', 'booth_number', 'part_number'],
  booth_name: ['booth_name', 'boothname', 'building_name', 'polling_station'],
  party: ['party', 'party_name', 'winning_party', 'political_party'],
  candidate: ['candidate', 'candidate_name', 'winning_candidate', 'winner'],
  votes: ['votes', 'total_votes', 'votes_received', 'votes_cast'],
  vote_share: ['vote_share', 'voteshare', 'votes_pct', 'share_pct', 'percentage'],
  turnout: ['turnout', 'turnout_pct', 'voter_turnout', 'turnout_percentage'],
  margin: ['margin', 'margin_pct', 'winning_margin', 'lead'],
  election_year: ['election_year', 'year', 'electionyear'],
  election_type: ['election_type', 'type', 'electiontype'],
  custom_metric: ['custom_metric', 'metric', 'score', 'target', 'index'],
};

class UploadService {
  async parseAndValidateFile(file: File): Promise<UploadValidationResult> {
    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

    if (!['csv', 'xlsx', 'xls', 'geojson', 'json'].includes(fileExt)) {
      throw new Error(`Unsupported file extension: .${fileExt}. Please upload CSV, XLSX, or XLS.`);
    }

    if (fileExt === 'geojson' || fileExt === 'json') {
      return this.parseGeoJsonFile(file);
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Workbook contains no sheets.');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: Array<Record<string, any>> = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
    });

    if (rawRows.length === 0) {
      throw new Error('Uploaded file is empty.');
    }

    const headers = Object.keys(rawRows[0] || {});
    const detectedMappings = this.autoDetectColumns(headers);

    return this.validateRows(rawRows, detectedMappings, fileName, file.size, fileExt as any);
  }

  autoDetectColumns(headers: string[]): Record<string, string> {
    const mappings: Record<string, string> = {};
    for (const h of headers) {
      const cleanHeader = h.toLowerCase().trim().replace(/[\s\-_]+/g, '_');
      for (const [targetField, synonyms] of Object.entries(STANDARD_FIELD_SYNONYMS)) {
        if (synonyms.includes(cleanHeader) && !mappings[targetField]) {
          mappings[targetField] = h;
          break;
        }
      }
    }
    return mappings;
  }

  validateRows(
    rows: Array<Record<string, any>>,
    mappings: Record<string, string>,
    fileName: string,
    fileSize: number,
    fileType: 'csv' | 'xlsx' | 'xls'
  ): UploadValidationResult {
    const missingColumns: string[] = [];
    const requiredFields = ['party', 'candidate'];
    for (const req of requiredFields) {
      if (!mappings[req]) {
        missingColumns.push(req);
      }
    }

    if (!mappings['pc_name'] && !mappings['pc_code'] && !mappings['ac_name'] && !mappings['ac_code']) {
      missingColumns.push('pc_name or pc_code or ac_name');
    }

    const validRecords: ElectionRecord[] = [];
    const unmatchedRecords: Array<{
      rowNumber: number;
      pcName?: string;
      acName?: string;
      state?: string;
      reason: string;
    }> = [];

    const seenKeys = new Set<string>();
    let duplicateCount = 0;
    let matchedConstituencies = 0;

    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const pcNameVal = mappings['pc_name'] ? String(row[mappings['pc_name']]).trim() : '';
      const pcCodeVal = mappings['pc_code'] ? row[mappings['pc_code']] : '';
      const acNameVal = mappings['ac_name'] ? String(row[mappings['ac_name']]).trim() : '';
      const acCodeVal = mappings['ac_code'] ? row[mappings['ac_code']] : '';
      const stateVal = mappings['state_name'] ? String(row[mappings['state_name']]).trim() : (mappings['state_code'] ? String(row[mappings['state_code']]).trim() : 'India');
      const partyVal = mappings['party'] ? String(row[mappings['party']]).trim() : 'Independent';
      const candVal = mappings['candidate'] ? String(row[mappings['candidate']]).trim() : 'Candidate';

      const votesVal = mappings['votes'] ? Number(row[mappings['votes']]) || 0 : 0;
      const turnoutVal = mappings['turnout'] ? parseFloat(String(row[mappings['turnout']]).replace('%', '')) || 65 : 65;
      const marginVal = mappings['margin'] ? parseFloat(String(row[mappings['margin']]).replace('%', '')) || 10 : 10;
      const voteShareVal = mappings['vote_share'] ? parseFloat(String(row[mappings['vote_share']]).replace('%', '')) || 50 : 50;
      const yearVal = mappings['election_year'] ? Number(row[mappings['election_year']]) || 2024 : 2024;
      const typeVal: ElectionType = mappings['election_type'] ? (String(row[mappings['election_type']]).toUpperCase().includes('VS') ? 'VS' : 'LS') : 'LS';
      const customVal = mappings['custom_metric'] ? Number(row[mappings['custom_metric']]) || 0 : undefined;

      const dedupeKey = `${yearVal}_${pcNameVal}_${acNameVal}_${partyVal}_${candVal}`.toLowerCase();
      if (seenKeys.has(dedupeKey)) {
        duplicateCount++;
        return;
      }
      seenKeys.add(dedupeKey);

      let isMatched = false;
      if (acNameVal) {
        const found = officialMappings.some(
          (m) =>
            m.name.toLowerCase() === acNameVal.toLowerCase() ||
            (acCodeVal && m.acNumber === Number(acCodeVal))
        );
        if (found) isMatched = true;
      } else if (pcNameVal) {
        const found = officialMappings.some(
          (m) =>
            m.pcName.toLowerCase() === pcNameVal.toLowerCase() ||
            (pcCodeVal && m.pcNumber === Number(pcCodeVal))
        );
        if (found) isMatched = true;
      } else {
        isMatched = true;
      }

      if (isMatched) {
        matchedConstituencies++;
        validRecords.push({
          id: `rec-${idx + 1}`,
          stateCode: stateVal.slice(0, 2).toUpperCase(),
          stateName: stateVal,
          pcCode: pcCodeVal || pcNameVal,
          pcName: pcNameVal || 'PC',
          acCode: acCodeVal || undefined,
          acName: acNameVal || undefined,
          winningParty: partyVal,
          winningCandidate: candVal,
          totalVotes: votesVal || 1200000,
          validVotes: Math.round(votesVal * 0.985),
          notaVotes: Math.round(votesVal * 0.015),
          notaPercentage: 1.5,
          turnoutPercentage: turnoutVal,
          marginVotes: Math.round((marginVal / 100) * votesVal),
          marginPercentage: marginVal,
          voteSharePercentage: voteShareVal,
          electionYear: yearVal,
          electionType: typeVal,
          customMetric: customVal,
        });
      } else {
        unmatchedRecords.push({
          rowNumber: rowNum,
          pcName: pcNameVal,
          acName: acNameVal,
          state: stateVal,
          reason: 'Constituency name or code not found in official delimitation table',
        });
      }
    });

    return {
      fileName,
      fileSize,
      fileType,
      totalRows: rows.length,
      validRows: validRecords.length,
      missingColumns,
      duplicateCount,
      matchedConstituencies,
      unmatchedRecords,
      previewRows: rows.slice(0, 8),
      detectedMappings: mappings,
      parsedData: validRecords,
    };
  }

  async parseGeoJsonFile(file: File): Promise<UploadValidationResult> {
    const text = await file.text();
    const geojson = JSON.parse(text);
    const features = geojson.features || [];

    const parsedData: ElectionRecord[] = features.map((f: any, idx: number) => {
      const p = f.properties || {};
      return {
        id: `geojson-${idx + 1}`,
        stateCode: (p.st_name || p.state_name || 'IN').slice(0, 2).toUpperCase(),
        stateName: p.st_name || p.state_name || 'India',
        pcCode: p.pc_id || p.pc_code || p.pc_no || idx + 1,
        pcName: p.pc_name || p.pcName || `PC-${idx + 1}`,
        acCode: p.ac_no || p.ac_code,
        acName: p.ac_name || p.acName,
        winningParty: p.winning_party || p.party || 'BJP',
        winningCandidate: p.winning_candidate || p.candidate || 'Elected Candidate',
        totalVotes: Number(p.total_votes || p.total_voters || 1200000),
        validVotes: Math.round(Number(p.total_votes || 1200000) * 0.98),
        notaVotes: 15000,
        notaPercentage: 1.4,
        turnoutPercentage: parseFloat(String(p.turnout_pct || p.turnout || 66).replace('%', '')),
        marginVotes: 85000,
        marginPercentage: parseFloat(String(p.margin_pct || p.margin || 10).replace('%', '')),
        voteSharePercentage: parseFloat(String(p.votes_pct || p.vote_share || 52).replace('%', '')),
        electionYear: 2024,
        electionType: 'LS',
      };
    });

    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: 'geojson',
      totalRows: features.length,
      validRows: parsedData.length,
      missingColumns: [],
      duplicateCount: 0,
      matchedConstituencies: parsedData.length,
      unmatchedRecords: [],
      previewRows: features.slice(0, 6).map((f: any) => f.properties || {}),
      detectedMappings: {
        pc_name: 'pc_name',
        turnout: 'turnout_pct',
        party: 'winning_party',
      },
      parsedData,
    };
  }
}

export const uploadService = new UploadService();
export default uploadService;
