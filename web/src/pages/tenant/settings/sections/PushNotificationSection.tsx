import React, { useState } from 'react';
import type { CampaignSettings, PushTriggerConfig } from '../types/settings.types';
import {
  FcmCredentialsCard,
  NotificationTriggersCard,
  TestNotificationModal,
} from '../components';

interface PushNotificationSectionProps {
  settings: CampaignSettings;
  onChange: (updated: Partial<CampaignSettings>) => void;
}

export const PushNotificationSection: React.FC<PushNotificationSectionProps> = ({
  settings,
  onChange,
}) => {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const handleTriggersChange = (newTriggers: PushTriggerConfig) => {
    onChange({ pushTriggers: newTriggers });
  };

  return (
    <div className="space-y-6">
      {/* FCM Credentials Card */}
      <FcmCredentialsCard
        settings={settings}
        onChange={onChange}
        onOpenTestModal={() => setIsTestModalOpen(true)}
      />

      {/* Automated Triggers Card */}
      <NotificationTriggersCard
        triggers={settings.pushTriggers}
        onChange={handleTriggersChange}
      />

      {/* Test Notification Modal */}
      <TestNotificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
};

export default PushNotificationSection;
