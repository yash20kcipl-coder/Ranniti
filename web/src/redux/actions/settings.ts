import api from '@/services/api';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';
import type { CampaignSettings, WhatsAppTemplate } from '@/types/settings.types';

export const SET_SETTINGS_DATA = 'SET_SETTINGS_DATA';
export const SET_SETTINGS_SAVING = 'SET_SETTINGS_SAVING';
export const SET_SETTINGS_LOADING = 'SET_SETTINGS_LOADING';
export const SET_WHATSAPP_SYNCING = 'SET_WHATSAPP_SYNCING';
export const SET_WHATSAPP_TEMPLATES = 'SET_WHATSAPP_TEMPLATES';
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

export const sendTestPushNotification = (payload: {
  title: string;
  body: string;
  targetType?: string;
  targetValue?: string;
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post('/tenant/settings/push/test', payload);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

export const sendTestWhatsAppMessage = (payload: {
  templateId?: string;
  phoneNumber: string;
  sampleVariables?: Record<string, string>;
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post('/tenant/settings/whatsapp/test', payload);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

// ==========================================
// SUPER ADMIN SETTINGS ACTIONS (Master DB)
// ==========================================

export const fetchSuperAdminSettings = (showLoader = true) => {
  return async (dispatch: AppDispatch) => {
    if (showLoader) dispatch(setSettingsLoading(true));
    try {
      const res = await api.get('/super-admin/settings');
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

export const updateSuperAdminSettings = (payload: Partial<CampaignSettings>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      const res = await api.put('/super-admin/settings', payload);
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

export const fetchSuperAdminWhatsAppTemplates = (filters?: { category?: string; status?: string; search?: string }) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsLoading(true));
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const res = await api.get(`/super-admin/settings/whatsapp/templates?${params.toString()}`);
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

export const createSuperAdminWhatsAppTemplate = (payload: Partial<WhatsAppTemplate>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      const res = await api.post('/super-admin/settings/whatsapp/templates', payload);
      const created = res.data?.data || res.data;
      await dispatch(fetchSuperAdminWhatsAppTemplates());
      return created;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSettingsSaving(false));
    }
  };
};

export const updateSuperAdminWhatsAppTemplate = (id: string, payload: Partial<WhatsAppTemplate>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      const res = await api.put(`/super-admin/settings/whatsapp/templates/${id}`, payload);
      const updated = res.data?.data || res.data;
      await dispatch(fetchSuperAdminWhatsAppTemplates());
      return updated;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSettingsSaving(false));
    }
  };
};

export const deleteSuperAdminWhatsAppTemplate = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      await api.delete(`/super-admin/settings/whatsapp/templates/${id}`);
      await dispatch(fetchSuperAdminWhatsAppTemplates());
      return true;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSettingsSaving(false));
    }
  };
};

export const syncSuperAdminMetaTemplates = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(setWhatsAppSyncing(true));
    try {
      const res = await api.post('/super-admin/settings/whatsapp/templates/sync');
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

// ==========================================
// TENANT SETTINGS ACTIONS (Tenant DB)
// ==========================================

export const fetchTenantSettings = (showLoader = true) => {
  return async (dispatch: AppDispatch) => {
    if (showLoader) dispatch(setSettingsLoading(true));
    try {
      const res = await api.get('/tenant/settings');
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

export const updateTenantSettings = (payload: Partial<CampaignSettings>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      const res = await api.put('/tenant/settings', payload);
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

export const fetchTenantWhatsAppTemplates = (filters?: { category?: string; status?: string; search?: string }) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsLoading(true));
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const res = await api.get(`/tenant/settings/whatsapp/templates?${params.toString()}`);
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

export const createTenantWhatsAppTemplate = (payload: Partial<WhatsAppTemplate>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      const res = await api.post('/tenant/settings/whatsapp/templates', payload);
      const created = res.data?.data || res.data;
      await dispatch(fetchTenantWhatsAppTemplates());
      return created;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSettingsSaving(false));
    }
  };
};

export const updateTenantWhatsAppTemplate = (id: string, payload: Partial<WhatsAppTemplate>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      const res = await api.put(`/tenant/settings/whatsapp/templates/${id}`, payload);
      const updated = res.data?.data || res.data;
      await dispatch(fetchTenantWhatsAppTemplates());
      return updated;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSettingsSaving(false));
    }
  };
};

export const deleteTenantWhatsAppTemplate = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSettingsSaving(true));
    try {
      await api.delete(`/tenant/settings/whatsapp/templates/${id}`);
      await dispatch(fetchTenantWhatsAppTemplates());
      return true;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSettingsSaving(false));
    }
  };
};

export const syncTenantMetaTemplates = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(setWhatsAppSyncing(true));
    try {
      const res = await api.post('/tenant/settings/whatsapp/templates/sync');
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
