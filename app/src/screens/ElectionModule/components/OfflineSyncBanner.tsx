import React, { useState } from 'react';
import { electionStyles } from '../styles';
import { useLanguage } from '../../../languages';
import { useDispatch, useSelector } from 'react-redux';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { RootState, AppDispatch } from '../../../store/store';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { syncOfflineVotesAction } from '../../../store/actions/mobileElection';

interface OfflineSyncBannerProps {
  electionId?: string;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ electionId }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { styles } = useAppTheme(electionStyles);
  const offlineQueue = useSelector((state: RootState) => state.election?.offlineQueue || []);
  const [syncing, setSyncing] = useState(false);

  if (!offlineQueue.length) {
    return null;
  }

  const handleSync = async () => {
    try {
      setSyncing(true);
      await dispatch(syncOfflineVotesAction(electionId));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.offlineSyncBar}>
      <View style={styles.offlineSyncLeft}>
        <MaterialDesignIcons name="cloud-sync" size={20} color="#92400E" />
        <Text style={styles.offlineSyncText}>
          {offlineQueue.length} {t('pendingOfflineSync')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.offlineSyncBtn}
        onPress={handleSync}
        disabled={syncing}
        activeOpacity={0.8}
      >
        {syncing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.offlineSyncBtnText}>{t('syncNow')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
