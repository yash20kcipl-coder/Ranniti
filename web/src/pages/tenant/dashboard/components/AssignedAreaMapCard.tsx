import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { Card, CardFooterLink } from '@/components/common/Card';
import { IndiaMap } from '@/components/Map/IndiaMap';
import type { GeoLevel } from '@/types/electionGis.types';
import { MapPin, Compass, Plus, Minus } from 'lucide-react';
import type { TenantDashboardOverviewPayload } from '@/redux/actions/tenantDashboardOverview';

interface AssignedAreaMapCardProps {
  data: TenantDashboardOverviewPayload | null;
  loading: boolean;
}

export const AssignedAreaMapCard: React.FC<AssignedAreaMapCardProps> = ({ data, loading }) => {
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const [isMapInteractive, setIsMapInteractive] = useState(false);

  useEffect(() => {
    if (!isMapInteractive) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (mapWrapperRef.current && !mapWrapperRef.current.contains(e.target as Node)) {
        setIsMapInteractive(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMapInteractive]);

  const assignedPcs = useMemo(
    () => data?.constituencies?.parliamentaryConstituencies || [],
    [data?.constituencies?.parliamentaryConstituencies]
  );
  const assignedAcs = useMemo(
    () => data?.constituencies?.assemblyConstituencies || [],
    [data?.constituencies?.assemblyConstituencies]
  );

  if (loading || !data) {
    return (
      <Card
        loading
        skeletonVariant="default"
        title="Assigned Area & Polling Stations"
        subtitle="Map view of your assigned constituency"
        icon={<Compass size={20} className="text-[#4338CA] dark:text-indigo-400" />}
        className="flex flex-col justify-between h-full min-h-[580px]"
      />
    );
  }

  const hasAssignedArea = assignedPcs.length > 0 || assignedAcs.length > 0;
  const primaryPc = assignedPcs[0];
  const primaryAc = assignedAcs[0];

  const constituencyLabel = primaryPc
    ? primaryPc.name
    : primaryAc
      ? primaryAc.name
      : 'Not Assigned';
  const constituencyCode = primaryPc?.pcNumber
    ? `PC #${primaryPc.pcNumber}`
    : primaryAc?.acNumber
      ? `AC #${primaryAc.acNumber}`
      : null;

  const mapLevel: GeoLevel =
    assignedAcs.length === 1
      ? 'ac'
      : assignedPcs.length > 0
        ? 'pc'
        : assignedAcs.length > 0
          ? 'ac'
          : 'india';

  const selectedState = primaryPc?.stateName || primaryAc?.stateName || null;
  const selectedPc = primaryPc?.name || null;
  const selectedAc = assignedAcs.length === 1 ? primaryAc?.name || null : null;

  return (
    <Card
      title="Your area"
      subtitle="The constituency you're assigned to work in"
      icon={<Compass size={20} className="text-[#4338CA] dark:text-indigo-400" />}
      badge={
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap ${hasAssignedArea
            ? 'bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#3730A3] dark:text-indigo-300'
            : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-400'
            }`}
        >
          {hasAssignedArea ? `${data.totalBooths.toLocaleString()} booths` : 'No area yet'}
        </span>
      }
      padding="none"
      headerClassName="px-5 py-3.5 border-[#EEF1F6] dark:border-slate-800/60"
      contentClassName="flex-1 flex flex-col"
      footerClassName="px-5 py-2.5 bg-[#FAFBFD] dark:bg-slate-900/60 border-[#EEF1F6] dark:border-slate-800/60"
      footer={
        <CardFooterLink
          hint="You can only see the area assigned to you."
        // label="Open map"
        // to={data.boothId ? `/dashboard/map-view?boothId=${data.boothId}` : '/dashboard/map-view'}
        />
      }
      className="flex flex-col h-full"
    >
      {hasAssignedArea ? (
        <div
          ref={mapWrapperRef}
          className="relative w-full flex-1 min-h-[316px] flex flex-col overflow-hidden bg-[#E6EEF9]"
        >
          <IndiaMap
            level={mapLevel}
            selectedState={selectedState}
            selectedPc={selectedPc}
            selectedAc={selectedAc}
            metric="winning_party"
            showLayerToggles={false}
            showControls={false}
            showLegend={false}
            showHoverTooltip={isMapInteractive}
            defaultShowCities={false}
            defaultShowSea={true}
            defaultShowStates={true}
            showStateContext={true}
            assignedAcNames={assignedAcs.map((a) => a.name)}
            autoFitSelection={true}
            interactive={isMapInteractive}
            onMapReady={(m) => {
              mapInstanceRef.current = m;
            }}
            minHeightClassName="min-h-[316px]"
            className="flex-1"
          />

          {/* Click-to-interact overlay so page scrolling isn't hijacked until clicked */}
          {!isMapInteractive && (
            <div
              onClick={() => setIsMapInteractive(true)}
              className="absolute inset-0 z-10 cursor-pointer bg-transparent"
              title="Click map to interact"
            />
          )}

          {/* Top-left Constituency Card */}
          <div className="absolute top-[14px] left-[14px] z-20 px-[14px] py-[10px] rounded-[14px] bg-white dark:bg-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.12)] pointer-events-none">
            <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#64748B] dark:text-slate-400">
              Your constituency
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[17px] leading-[24px] font-bold text-[#0F172A] dark:text-white">
                {constituencyLabel}
              </span>
              {constituencyCode && (
                <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#3730A3] dark:text-indigo-300 text-[12px] font-semibold">
                  {constituencyCode}
                </span>
              )}
            </div>
          </div>

          {/* Top-right Zoom In / Zoom Out Controls */}
          <div className="absolute top-[14px] right-[14px] z-20 flex flex-col rounded-[12px] bg-white dark:bg-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.12)] overflow-hidden">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => {
                setIsMapInteractive(true);
                mapInstanceRef.current?.zoomIn();
              }}
              className="w-[40px] h-[40px] border-b border-[#EEF1F6] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            >
              <Plus size={17} strokeWidth={2.4} className="text-[#334155] dark:text-slate-300" />
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => {
                setIsMapInteractive(true);
                mapInstanceRef.current?.zoomOut();
              }}
              className="w-[40px] h-[40px] hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            >
              <Minus size={17} strokeWidth={2.4} className="text-[#334155] dark:text-slate-300" />
            </button>
          </div>

          {/* Bottom-left Polling Booths Pill */}
          <div className="absolute left-[14px] bottom-[14px] z-20 flex items-center gap-2 px-[14px] py-2 rounded-full bg-white dark:bg-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.12)] text-[13px] text-[#334155] dark:text-slate-300 pointer-events-none">
            <span className="w-[10px] h-[10px] rounded-full bg-[#4338CA] border-2 border-white dark:border-slate-900 shadow-[0_0_0_1px_#4338CA]" />
            <span>
              <strong className="font-bold text-[#0F172A] dark:text-white tabular-nums">
                {data.totalBooths.toLocaleString()}
              </strong>{' '}
              polling booths in your area
            </span>
          </div>

          {/* Bottom-right Open Full Map Button */}
          {/* <button
            type="button"
            onClick={() =>
              navigate(
                data.boothId ? `/dashboard/map-view?boothId=${data.boothId}` : '/dashboard/map-view'
              )
            }
            className="absolute right-[14px] bottom-[14px] z-20 inline-flex items-center gap-2 min-h-[40px] px-4 rounded-[12px] bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-[0_2px_10px_rgba(15,23,42,0.12)] text-[13px] font-semibold text-[#4338CA] dark:text-indigo-400 cursor-pointer transition-colors"
          >
            Open full map <ExternalLink size={14} strokeWidth={2.2} />
          </button> */}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center flex-1 min-h-[316px] text-center px-6 py-6"
          style={{
            background:
              'radial-gradient(circle at 1px 1px, #CBD7EA 1px, transparent 0) 0 0 / 20px 20px, #EEF3FA',
          }}
        >
          <div className="w-16 h-16 rounded-full bg-white shadow-[0_2px_10px_rgba(15,23,42,0.1)] flex items-center justify-center">
            <MapPin size={28} strokeWidth={1.8} className="text-[#4338CA]" />
          </div>
          <h3 className="mt-4 text-[18px] leading-[24px] font-bold text-[#0F172A]">
            No area assigned yet
          </h3>
          <p className="mt-1 max-w-[340px] text-[14px] leading-[21px] text-[#475569]">
            Once your coordinator assigns you a constituency, your map and polling booths will show up here.
          </p>
        </div>
      )}
    </Card>
  );
};
