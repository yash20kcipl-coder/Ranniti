export interface PushTriggerConfig {
  dailyBriefing: boolean;
  briefingTime: string;
  surveyMilestones: boolean;
  pollDayTurnout: boolean;
  urgentBroadcasts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface FieldRulesConfig {
  geofencingEnabled: boolean;
  geofenceRadiusMeters: number;
  offlineSyncAllowed: boolean;
  mandatoryMobile: boolean;
  allowPhotoCapture: boolean;
}

export interface CampaignSettings {
  id?: string;
  organizationId?: string | null;
  // Push Notification Settings
  fcmProjectId?: string | null;
  fcmClientEmail?: string | null;
  fcmPrivateKey?: string | null;
  fcmServerKey?: string | null;
  apnsTeamId?: string | null;
  apnsKeyId?: string | null;
  apnsBundleId?: string | null;
  apnsAuthKey?: string | null;
  pushTriggers: PushTriggerConfig;
  // WhatsApp Settings
  whatsappWabaId?: string | null;
  whatsappPhoneNumberId?: string | null;
  whatsappAccessToken?: string | null;
  whatsappWebhookVerifyToken?: string | null;
  whatsappQualityRating?: string;
  whatsappDailyLimit?: string;
  // Campaign Profile
  candidateName?: string | null;
  partyName?: string | null;
  partySymbolUrl?: string | null;
  candidatePhotoUrl?: string | null;
  pollingDate?: string | null;
  electionType?: string;
  // Field Rules
  fieldRules: FieldRulesConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface WhatsAppButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phoneNumber?: string;
}

export interface WhatsAppTemplate {
  id: string;
  organizationId?: string | null;
  metaTemplateId?: string | null;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  headerContent?: string | null;
  bodyText: string;
  footerText?: string | null;
  buttons: WhatsAppButton[];
  variables: string[];
  metaStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DRAFT';
  metaRejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppVersionConfig {
  id: string;
  platform: 'android' | 'ios';
  minVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  updateTitle: string;
  updateMessage: string;
  storeUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SettingsTabKey = 'user-roles' | 'tenant-roles' | 'app-versions' | 'whatsapp-templates' | 'whatsapp-config' | 'push-notifications';

