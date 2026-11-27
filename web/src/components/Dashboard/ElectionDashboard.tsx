import { Header } from './Header';
import toast from 'react-hot-toast';
import { Sidebar } from './Sidebar';
import type {
  GeoLevel,
  HeatmapMetric,
  ElectionType,
  CandidatePerformance,
  PollingBoothRecord,
  HistoricalYearTrend,
} from '../../types/electionGis.types';
import { IndiaMap } from '../Map/IndiaMap';
import { AnalyticsPanel } from './AnalyticsPanel';
import { FileUploadModal } from '../Upload/FileUploadModal';
import { BottomAnalyticsPanel } from './BottomAnalyticsPanel';
import { electionService } from '../../services/electionService';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { geoDataService, type StateMetadata } from '../../services/geoDataService';

// Synchronous PC boundary data for instant state calculation
import pcRawData from '../maps/india_pc_simplified.json';

export const ElectionDashboard: React.FC = () => {
  // Navigation Hierarchy State
  const [level, setLevel] = useState<GeoLevel>('india');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedPc, setSelectedPc] = useState<string | null>(null);
  const [selectedAc, setSelectedAc] = useState<string | null>(null);
  const [selectedBooth, setSelectedBooth] = useState<PollingBoothRecord | null>(null);

  // Filters State
  const [electionYear, setElectionYear] = useState<number>(2024);
  const [electionType, setElectionType] = useState<ElectionType>('LS');
  const [metric, setMetric] = useState<HeatmapMetric>('winning_party');

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // States list extracted from PC boundaries
  const states: StateMetadata[] = useMemo(() => {
    return geoDataService.getStatesFromPcData(pcRawData);
  }, []);

  // Telemetry state for selected item
  const [currentTurnout, setCurrentTurnout] = useState<number>(66.4);
  const [currentMargin, setCurrentMargin] = useState<number>(12.2);
  const [currentTotalVotes, setCurrentTotalVotes] = useState<number>(1280000);
  const [currentWinner, setCurrentWinner] = useState<string>('Jyoti Dhurve');
  const [currentParty, setCurrentParty] = useState<string>('BJP');
  const [candidates, setCandidates] = useState<CandidatePerformance[]>([]);
  const [historicalTrends, setHistoricalTrends] = useState<HistoricalYearTrend[]>([]);

  // Update telemetry when selection changes
  useEffect(() => {
    const cands = electionService.getCandidatePerformances(
      currentWinner,
      currentParty,
      currentTurnout,
      currentMargin,
      currentTotalVotes
    );
    setCandidates(cands);

    const trends = electionService.getHistoricalTrends(
      currentParty,
      currentTurnout,
      currentMargin
    );
    setHistoricalTrends(trends);
  }, [currentWinner, currentParty, currentTurnout, currentMargin, currentTotalVotes]);

  // Handle Level Navigation from Breadcrumbs or Sidebar
  const handleNavigateLevel = useCallback((targetLevel: GeoLevel) => {
    setLevel(targetLevel);
    if (targetLevel === 'india') {
      setSelectedState(null);
      setSelectedPc(null);
      setSelectedAc(null);
      setSelectedBooth(null);
      setCurrentWinner('National Consensus');
      setCurrentParty('BJP');
      setCurrentTurnout(65.8);
      setCurrentMargin(12.5);
      setCurrentTotalVotes(640000000);
    } else if (targetLevel === 'state') {
      setSelectedPc(null);
      setSelectedAc(null);
      setSelectedBooth(null);
    } else if (targetLevel === 'pc') {
      setSelectedAc(null);
      setSelectedBooth(null);
    } else if (targetLevel === 'ac') {
      setSelectedBooth(null);
    }
  }, []);

  // State selection handler
  const handleSelectState = useCallback((stateName: string) => {
    if (!stateName) {
      handleNavigateLevel('india');
      return;
    }
    setSelectedState(stateName);
    setLevel('state');
    setSelectedPc(null);
    setSelectedAc(null);
    setSelectedBooth(null);
    setCurrentWinner(`${stateName} State Assembly`);
    setCurrentParty('BJP');
    setCurrentTurnout(68.2);
    setCurrentMargin(14.0);
    setCurrentTotalVotes(32000000);
    toast.success(`Zoomed into ${stateName}`);
  }, [handleNavigateLevel]);

  // PC selection handler
  const handleSelectPc = useCallback((pcName: string, stateName: string, pcNumber?: number) => {
    setSelectedPc(pcName);
    setSelectedState(stateName);
    setLevel('pc');
    setSelectedAc(null);
    setSelectedBooth(null);

    const officialAcs = geoDataService.getOfficialAcsForPc(stateName, pcName, pcNumber);
    setCurrentWinner(`MP (${pcName})`);
    setCurrentParty('BJP');
    setCurrentTurnout(67.4);
    setCurrentMargin(11.8);
    setCurrentTotalVotes(1450000);
    toast.success(`Selected PC: ${pcName} (${officialAcs.length} Assembly Segments)`);
  }, []);

  // AC selection handler
  const handleSelectAc = useCallback((acName: string, acNumber: number, pcName: string, stateName: string) => {
    setSelectedAc(acName);
    if (pcName) setSelectedPc(pcName);
    if (stateName) setSelectedState(stateName);
    setLevel('ac');
    setSelectedBooth(null);

    setCurrentWinner(`MLA (${acName})`);
    setCurrentParty('INC');
    setCurrentTurnout(71.2);
    setCurrentMargin(8.4);
    setCurrentTotalVotes(185000);
    toast.success(`Selected AC: ${acName} (#${acNumber})`);
  }, []);

  // Booth selection handler
  const handleSelectBooth = useCallback((booth: PollingBoothRecord) => {
    setSelectedBooth(booth);
    setLevel('booth');
    setCurrentWinner(booth.winningCandidate);
    setCurrentParty(booth.winningParty);
    setCurrentTurnout(booth.turnoutPercentage);
    setCurrentMargin(booth.marginPercentage);
    setCurrentTotalVotes(booth.totalVoters);
    toast.success(`Selected Booth: #${booth.boothNumber}`);
  }, []);

  // Search Jump handler
  const handleSearchSelect = useCallback((type: 'pc' | 'ac', name: string, stateName: string) => {
    if (type === 'pc') {
      handleSelectPc(name, stateName);
    } else {
      handleSelectAc(name, 1, '', stateName);
    }
  }, [handleSelectPc, handleSelectAc]);

  // Data import completion
  const handleDataImported = useCallback((count: number) => {
    toast.success(`Successfully imported ${count} election records into GIS layers!`);
  }, []);

  // Reset View
  const handleReset = useCallback(() => {
    handleNavigateLevel('india');
    toast.success('Reset to All India View');
  }, [handleNavigateLevel]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] min-h-[820px] bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
      {/* 1. Navy Blue Master Header */}
      <Header
        level={level}
        selectedState={selectedState}
        selectedPc={selectedPc}
        selectedAc={selectedAc}
        selectedBooth={selectedBooth ? selectedBooth.boothName : null}
        electionYear={electionYear}
        electionType={electionType}
        onYearChange={setElectionYear}
        onTypeChange={setElectionType}
        onNavigateLevel={handleNavigateLevel}
        onOpenUpload={() => setIsUploadOpen(true)}
        onReset={handleReset}
      />

      {/* 2. Main Work Area: Left Sidebar + Center Map + Right Analytics Panel */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          level={level}
          metric={metric}
          states={states}
          selectedState={selectedState}
          onSelectLevel={handleNavigateLevel}
          onSelectMetric={setMetric}
          onSelectState={handleSelectState}
          onSearchSelect={handleSearchSelect}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Center Interactive Vector Map (No external raster tiles required) */}
        <main className="flex-1 relative h-full bg-[#dbeafe] overflow-hidden">
          <IndiaMap
            level={level}
            selectedState={selectedState}
            selectedPc={selectedPc}
            selectedAc={selectedAc}
            selectedBooth={selectedBooth ? selectedBooth.id : null}
            metric={metric}
            onSelectState={handleSelectState}
            onSelectPc={handleSelectPc}
            onSelectAc={handleSelectAc}
            onSelectBooth={handleSelectBooth}
            showNeighboringCountries={false}
            onNavigateUp={() => {
              if (level === 'booth') handleNavigateLevel('ac');
              else if (level === 'ac') handleNavigateLevel('pc');
              else if (level === 'pc') handleNavigateLevel('state');
              else if (level === 'state') handleNavigateLevel('india');
            }}
            className="w-full h-full rounded-none border-0"
          />
        </main>

        {/* Right Analytics Panel */}
        <AnalyticsPanel
          level={level}
          selectedState={selectedState}
          selectedPc={selectedPc}
          selectedAc={selectedAc}
          selectedBooth={selectedBooth}
          turnout={currentTurnout}
          margin={currentMargin}
          totalVotes={currentTotalVotes}
          winningParty={currentParty}
          winningCandidate={currentWinner}
          candidates={candidates}
          onDrillDown={() => {
            if (level === 'pc') setLevel('ac');
          }}
          onViewBooths={() => {
            setLevel('booth');
          }}
        />
      </div>

      {/* 3. Bottom Analytics Drawer */}
      <BottomAnalyticsPanel
        currentTurnout={currentTurnout}
        historicalTrends={historicalTrends}
        constituencyName={selectedAc || selectedPc || selectedState || 'All India'}
      />

      {/* 4. File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataImported={handleDataImported}
      />
    </div>
  );
};

export default ElectionDashboard;
