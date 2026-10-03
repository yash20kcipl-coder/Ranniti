import api from '@/services/api';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';
import type { CampaignSettings, WhatsAppTemplate } from '@/pages/tenant/settings/types/settings.types';

export const SET_SETTINGS_LOADING = 'SET_SETTINGS_LOADING';
export const SET_SETTINGS_SAVING = 'SET_SETTINGS_SAVING';
export const SET_SETTINGS_DATA = 'SET_SETTINGS_DATA';
export const SET_WHATSAPP_TEMPLATES = 'SET_WHATSAPP_TEMPLATES';
export const SET_WHATSAPP_SYNCING = 'SET_WHATSAPP_SYNCING';
export const SET_SETTINGS_ACTIVE_TAB = 'SET_SETTINGS_ACTIVE_TAB';

export const setSettingsLoading = (loading: boolean) => ({
  type: SET_SETTINGS_LOADING,
  payload: loading,
});

export const setSettingsSaving = (saving: boolean) => ({
  type: SET_SETTINGS_SAVING,
  payload: saving,
});

export const setSettingsData = (data: CampaignSettings) => ({
  type: SET_SETTINGS_DATA,
  payload: data,
});

export const setWhatsAppTemplates = (templates: WhatsAppTemplate[]) => ({
  type: SET_WHATSAPP_TEMPLATES,
  payload: templates,
});

export const setWhatsAppSyncing = (syncing: boolean) => ({
  type: SET_WHATSAPP_SYNCING,
  payload: syncing,
});

export const setSettingsActiveTab = (tab: string) => ({
  type: SET_SETTINGS_ACTIVE_TAB,
  payload: tab,
});

/**
 * Fetch campaign & system settings
 */
export const fetchCampaignSettings = (showLoader = true) => {
  return async (dispatch: AppDispatch) => {
    if (showLoader) dispatch(setSettingsLoading(true));
    try {
      const res = await api.get('/settings');
      const data = res.data?.data || res.data;
      dispatch(setSettingsData(data));
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      if (showLoader) dispatch(setSettingsLoading(false));
    }
  };
};

/**
 * Update campaign & system settings
 */
export const updateCampaignSettings = (payload: Partial<CampaignSettings>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      const res = await api.put('/settings', payload);
      const data = res.data?.data || res.data;
      dispatch(setSettingsData(data));
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSettingsSaving(false));
    }
  };
};

/**
 * Trigger test push notification
 */
export const sendTestPushNotification = (payload: {
  title: string;
  body: string;
  targetType?: string;
  targetValue?: string;
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post('/settings/push/test', payload);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Fetch all WhatsApp templates with optional filtering
 */
export const fetchWhatsAppTemplates = (filters?: { category?: string; status?: string; search?: string }) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsLoading(true));
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const res = await api.get(`/settings/whatsapp/templates?${params.toString()}`);
      const data = res.data?.data || res.data || [];
      dispatch(setWhatsAppTemplates(Array.isArray(data) ? data : []));
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSettingsLoading(false));
    }
  };
};

/**
 * Create a new WhatsApp template
 */
export const createWhatsAppTemplate = (payload: Partial<WhatsAppTemplate>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      const res = await api.post('/settings/whatsapp/templates', payload);
      const created = res.data?.data || res.data;
      // Refresh templates
      await dispatch(fetchWhatsAppTemplates());
      return created;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSettingsSaving(false));
    }
  };
};

/**
 * Update an existing WhatsApp template
 */
export const updateWhatsAppTemplate = (id: string, payload: Partial<WhatsAppTemplate>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      const res = await api.put(`/settings/whatsapp/templates/${id}`, payload);
      const updated = res.data?.data || res.data;
      await dispatch(fetchWhatsAppTemplates());
      return updated;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSettingsSaving(false));
    }
  };
};

/**
 * Delete a WhatsApp template
 */
export const deleteWhatsAppTemplate = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      await api.delete(`/settings/whatsapp/templates/${id}`);
      await dispatch(fetchWhatsAppTemplates());
      return true;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSettingsSaving(false));
    }
  };
};

/**
 * Sync WhatsApp template approval statuses with Meta
 */
export const syncMetaWhatsAppTemplates = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(setWhatsAppSyncing(true));
    try {
      const res = await api.post('/settings/whatsapp/templates/sync');
      const data = res.data?.data || res.data || [];
      dispatch(setWhatsAppTemplates(Array.isArray(data) ? data : []));
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setWhatsAppSyncing(false));
    }
  };
};

/**
 * Send test WhatsApp message
 */
export const sendTestWhatsAppMessage = (payload: {
  templateId?: string;
  phoneNumber: string;
  sampleVariables?: Record<string, string>;
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post('/settings/whatsapp/test', payload);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};
