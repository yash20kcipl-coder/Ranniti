import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { IndiaHeatMap } from '@/components/maps/IndiaHeatMap';

export const MapPreviewPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 pb-6">
      {/* Reusable PageHeader per Rule 18 */}
      <PageHeader
        title="Indian Election GIS Heat Map"
        subtitle="Multi-level Continuous Zoom: Parliamentary Constituencies (543 PCs) → Assembly Segments (4,182 ACs) → Polling Booths"
        icon={<Map className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        actions={
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        }
      />

      {/* Main India Heat Map Container */}
      <IndiaHeatMap />
    </div>
  );
};

export default MapPreviewPage;
