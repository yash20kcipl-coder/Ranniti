import {
  SET_APP_VERSIONS,
  SET_SETTINGS_DATA,
  SET_SETTINGS_SAVING,
  SET_SETTINGS_LOADING,
  SET_WHATSAPP_SYNCING,
  SET_WHATSAPP_TEMPLATES,
  SET_SETTINGS_ACTIVE_TAB,
  SET_SURVEY_FIELD_POINTS,
  SET_SURVEY_POINTS_LOADING,
  SET_SURVEY_POINTS_SAVING,
} from '../actions/settings';
import {
  SET_TENANT_WEB_USERS,
  SET_TENANT_WEB_USERS_LOADING,
  ADD_TENANT_WEB_USER,
  UPDATE_TENANT_WEB_USER,
  DELETE_TENANT_WEB_USER,
  type WebUserRecord,
} from '../actions/tenantWebUser';
import type { CampaignSettings, WhatsAppTemplate, AppVersionConfig, SurveyFieldPointsConfig } from '@/types/settings.types';

export interface SettingsState {
  saving: boolean;
  loading: boolean;
  syncing: boolean;
  activeTab: string;
  appVersions: AppVersionConfig[];
  settings: CampaignSettings | null;
  whatsappTemplates: WhatsAppTemplate[];
  webUsers: WebUserRecord[];
  webUsersLoading: boolean;
  surveyFieldPoints: SurveyFieldPointsConfig | null;
  surveyPointsLoading: boolean;
  surveyPointsSaving: boolean;
}

const initialState: SettingsState = {
  saving: false,
  syncing: false,
  loading: false,
  settings: null,
  appVersions: [],
  whatsappTemplates: [],
  webUsers: [],
  webUsersLoading: false,
  activeTab: 'whatsapp-templates',
  surveyFieldPoints: null,
  surveyPointsLoading: false,
  surveyPointsSaving: false,
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

    case SET_SURVEY_FIELD_POINTS:
      return { ...state, surveyFieldPoints: action.payload };

    case SET_SURVEY_POINTS_LOADING:
      return { ...state, surveyPointsLoading: action.payload };

    case SET_SURVEY_POINTS_SAVING:
      return { ...state, surveyPointsSaving: action.payload };

    case SET_TENANT_WEB_USERS_LOADING:
      return { ...state, webUsersLoading: action.payload };

    case SET_TENANT_WEB_USERS:
      return {
        ...state,
        webUsers: Array.isArray(action.payload)
          ? action.payload
          : Array.isArray(action.payload?.data)
            ? action.payload.data
            : (state.webUsers || []),
      };

    case ADD_TENANT_WEB_USER:
      return {
        ...state,
        webUsers: [action.payload, ...state.webUsers],
      };

    case UPDATE_TENANT_WEB_USER:
      return {
        ...state,
        webUsers: state.webUsers.map((u) => (u.id === action.payload.id ? action.payload : u)),
      };

    case DELETE_TENANT_WEB_USER:
      return {
        ...state,
        webUsers: state.webUsers.filter((u) => u.id !== action.payload),
      };

    default:
      return state;
  }
}
