import React from 'react';
import { ElectionDashboard } from '@/components/Dashboard/ElectionDashboard';

export const MapPreviewPage: React.FC = () => {
  return (
    <div className="space-y-4 pb-6">
      <ElectionDashboard />
    </div>
  );
};

export default MapPreviewPage;
