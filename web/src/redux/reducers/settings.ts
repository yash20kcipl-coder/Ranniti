import {
  SET_APP_VERSIONS,
  SET_SETTINGS_DATA,
  SET_SETTINGS_SAVING,
  SET_SETTINGS_LOADING,
  SET_WHATSAPP_SYNCING,
  SET_WHATSAPP_TEMPLATES,
  SET_SETTINGS_ACTIVE_TAB,
} from '../actions/settings';
import type { CampaignSettings, WhatsAppTemplate, AppVersionConfig } from '@/types/settings.types';

export interface SettingsState {
  saving: boolean;
  loading: boolean;
  syncing: boolean;
  activeTab: string;
  appVersions: AppVersionConfig[];
  settings: CampaignSettings | null;
  whatsappTemplates: WhatsAppTemplate[];
}

const initialState: SettingsState = {
  saving: false,
  syncing: false,
  loading: false,
  settings: null,
  appVersions: [],
  whatsappTemplates: [],
  activeTab: 'whatsapp-templates',
};

export default function settingsReducer(
  state: SettingsState = initialState,
  action: { type: string; payload?: any }
): SettingsState {
  switch (action.type) {
    case SET_SETTINGS_LOADING:
      return { ...state, loading: action.payload };

    case SET_SETTINGS_SAVING:
      return { ...state, saving: action.payload };

    case SET_SETTINGS_DATA:
      return { ...state, settings: action.payload };

    case SET_APP_VERSIONS:
      return {
        ...state,
        appVersions: Array.isArray(action.payload)
          ? action.payload
          : Array.isArray(action.payload?.data)
            ? action.payload.data
            : (state.appVersions || []),
      };

    case SET_WHATSAPP_TEMPLATES:
      return {
        ...state,
        whatsappTemplates: Array.isArray(action.payload)
          ? action.payload
          : Array.isArray(action.payload?.data)
            ? action.payload.data
            : (state.whatsappTemplates || []),
      };

    case SET_WHATSAPP_SYNCING:
      return { ...state, syncing: action.payload };

    case SET_SETTINGS_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };

    default:
      return state;
  }
}

