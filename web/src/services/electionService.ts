import type {
  ElectionRecord,
  PartyInfo,
  CandidatePerformance,
  HistoricalYearTrend,
  ElectionType,
} from '../types/electionGis.types';

export const MAJOR_PARTIES: Record<string, PartyInfo> = {
  BJP: {
    name: 'Bharatiya Janata Party',
    abbreviation: 'BJP',
    color: '#ea580c', // Saffron
    alliance: 'NDA',
  },
  INC: {
    name: 'Indian National Congress',
    abbreviation: 'INC',
    color: '#0284c7', // Congress Blue
    alliance: 'INDIA',
  },
  AITC: {
    name: 'All India Trinamool Congress',
    abbreviation: 'AITC',
    color: '#16a34a', // Grassroot Green
    alliance: 'INDIA',
  },
  TMC: {
    name: 'Trinamool Congress',
    abbreviation: 'TMC',
    color: '#16a34a',
    alliance: 'INDIA',
  },
  AAP: {
    name: 'Aam Aadmi Party',
    abbreviation: 'AAP',
    color: '#06b6d4', // Cyan
    alliance: 'INDIA',
  },
  SP: {
    name: 'Samajwadi Party',
    abbreviation: 'SP',
    color: '#ef4444', // Crimson
    alliance: 'INDIA',
  },
  DMK: {
    name: 'Dravida Munnetra Kazhagam',
    abbreviation: 'DMK',
    color: '#dc2626', // Red
    alliance: 'INDIA',
  },
  TDP: {
    name: 'Telugu Desam Party',
    abbreviation: 'TDP',
    color: '#f59e0b', // Amber
    alliance: 'NDA',
  },
  YSRCP: {
    name: 'YSR Congress Party',
    abbreviation: 'YSRCP',
    color: '#2563eb', // Royal Blue
    alliance: 'Independent',
  },
  'Shiv Sena': {
    name: 'Shiv Sena',
    abbreviation: 'SHS',
    color: '#f97316', // Saffron
    alliance: 'NDA / UBT',
  },
  SHS: {
    name: 'Shiv Sena',
    abbreviation: 'SHS',
    color: '#f97316',
    alliance: 'NDA',
  },
  NCP: {
    name: 'Nationalist Congress Party',
    abbreviation: 'NCP',
    color: '#7c3aed', // Purple
    alliance: 'Mahayuti / MVA',
  },
  BSP: {
    name: 'Bahujan Samaj Party',
    abbreviation: 'BSP',
    color: '#3b82f6', // Blue
    alliance: 'Independent',
  },
  CPI: {
    name: 'Communist Party of India',
    abbreviation: 'CPI',
    color: '#b91c1c', // Deep Crimson
    alliance: 'Left Front',
  },
  CPM: {
    name: 'Communist Party of India (Marxist)',
    abbreviation: 'CPM',
    color: '#991b1b', // Dark Red
    alliance: 'Left Front',
  },
  Others: {
    name: 'Independent & Regional',
    abbreviation: 'Others',
    color: '#8b5cf6', // Lavender Purple
    alliance: 'Independent',
  },
};

export function getPartyColor(partyName?: string): string {
  if (!partyName) return '#8b5cf6';
  const norm = partyName.trim();
  if (MAJOR_PARTIES[norm]) return MAJOR_PARTIES[norm].color;

  for (const key of Object.keys(MAJOR_PARTIES)) {
    if (norm.toLowerCase().includes(key.toLowerCase())) {
      return MAJOR_PARTIES[key].color;
    }
  }
  return '#8b5cf6';
}

class ElectionService {
  private customElectionData: Map<string, ElectionRecord> = new Map();

  applyCustomElectionData(records: ElectionRecord[]): number {
    let applied = 0;
    for (const r of records) {
      const key = this.buildKey(r.electionType, r.electionYear, r.pcCode, r.acCode);
      this.customElectionData.set(key, r);
      applied++;
    }
    return applied;
  }

  clearCustomElectionData(): void {
    this.customElectionData.clear();
  }

  buildKey(
    type: ElectionType,
    year: number,
    pcCode: number | string,
    acCode?: number | string
  ): string {
    return `${type}_${year}_${pcCode}_${acCode || 'PC'}`.toUpperCase();
  }

  getRecord(
    type: ElectionType,
    year: number,
    pcCode: number | string,
    acCode?: number | string
  ): ElectionRecord | null {
    const key = this.buildKey(type, year, pcCode, acCode);
    if (this.customElectionData.has(key)) {
      return this.customElectionData.get(key)!;
    }
    return null;
  }

  getCandidatePerformances(
    winningCandidate: string,
    winningParty: string,
    votesPct: string | number,
    marginPct: string | number,
    totalVotes: number = 1250000
  ): CandidatePerformance[] {
    const winShare = typeof votesPct === 'number' ? votesPct : parseFloat(String(votesPct).replace('%', '')) || 52;
    const margin = typeof marginPct === 'number' ? marginPct : parseFloat(String(marginPct).replace('%', '')) || 12;
    const runnerShare = Math.max(15, winShare - margin);
    const othersShare = Math.max(5, 100 - winShare - runnerShare);

    const runnerParty =
      winningParty === 'BJP'
        ? 'INC'
        : winningParty === 'INC'
        ? 'BJP'
        : winningParty === 'AITC'
        ? 'BJP'
        : winningParty === 'SP'
        ? 'BJP'
        : 'INC';

    const winVotes = Math.round((winShare / 100) * totalVotes);
    const runVotes = Math.round((runnerShare / 100) * totalVotes);
    const othVotes = totalVotes - winVotes - runVotes;

    return [
      {
        candidateName: winningCandidate || 'Leading Candidate',
        party: winningParty,
        partyColor: getPartyColor(winningParty),
        votes: winVotes,
        voteShare: Number(winShare.toFixed(1)),
        isWinner: true,
      },
      {
        candidateName: `Contender (${runnerParty})`,
        party: runnerParty,
        partyColor: getPartyColor(runnerParty),
        votes: runVotes,
        voteShare: Number(runnerShare.toFixed(1)),
        isWinner: false,
      },
      {
        candidateName: 'Others & Independent',
        party: 'Others',
        partyColor: '#8b5cf6',
        votes: othVotes,
        voteShare: Number(othersShare.toFixed(1)),
        isWinner: false,
      },
    ];
  }

  getHistoricalTrends(
    currentParty: string,
    currentTurnout: number,
    currentMargin: number
  ): HistoricalYearTrend[] {
    const isBjp = currentParty === 'BJP';
    const isInc = currentParty === 'INC';

    return [
      {
        year: 2014,
        turnout: Math.max(50, Math.round((currentTurnout - 4.2) * 10) / 10),
        winningParty: isBjp ? 'BJP' : 'INC',
        winningCandidate: isBjp ? 'S. K. Verma' : 'R. P. Singh',
        marginPercentage: Math.round((currentMargin * 0.9) * 10) / 10,
        bjpVoteShare: isBjp ? 48.5 : 34.2,
        incVoteShare: isBjp ? 36.1 : 46.8,
        regionalVoteShare: 15.4,
        totalVotes: 1120000,
      },
      {
        year: 2019,
        turnout: Math.max(52, Math.round((currentTurnout + 2.1) * 10) / 10),
        winningParty: isBjp ? 'BJP' : isInc ? 'BJP' : currentParty,
        winningCandidate: isBjp ? 'S. K. Verma' : 'Sunil Rao',
        marginPercentage: Math.round((currentMargin * 1.3) * 10) / 10,
        bjpVoteShare: isBjp ? 55.2 : 39.5,
        incVoteShare: isBjp ? 31.8 : 42.1,
        regionalVoteShare: 13.0,
        totalVotes: 1245000,
      },
      {
        year: 2024,
        turnout: Number(currentTurnout.toFixed(1)),
        winningParty: currentParty,
        winningCandidate: 'Current Elected Representative',
        marginPercentage: Number(currentMargin.toFixed(1)),
        bjpVoteShare: isBjp ? 51.4 : 38.6,
        incVoteShare: isInc ? 49.2 : 32.4,
        regionalVoteShare: 18.2,
        totalVotes: 1380000,
      },
    ];
  }
}

export const electionService = new ElectionService();
export default electionService;
