import {
  Smartphone,
  Apple,
  AlertTriangle,
  CheckCircle2,
  Edit,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Save,
  Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import type { AppVersionConfig } from '@/types/settings.types';
import { ConfirmModal } from '@/components/common/ConfirmModal';

interface AppVersionSectionProps {
  appVersions: AppVersionConfig[];
  saving: boolean;
  onUpdateVersion: (idOrPlatform: string, payload: Partial<AppVersionConfig>) => Promise<any>;
}

export const AppVersionSection: React.FC<AppVersionSectionProps> = ({
  appVersions,
  saving,
  onUpdateVersion,
}) => {
  const [editingConfig, setEditingConfig] = useState<AppVersionConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmMaintenance, setConfirmMaintenance] = useState<{
    open: boolean;
    config: AppVersionConfig | null;
  }>({ open: false, config: null });

  const androidConfig = appVersions.find((v) => v.platform === 'android');
  const iosConfig = appVersions.find((v) => v.platform === 'ios');

  const handleEditClick = (config: AppVersionConfig) => {
    setEditingConfig({ ...config });
    setIsModalOpen(true);
  };

  const handleToggleMaintenance = (config: AppVersionConfig) => {
    setConfirmMaintenance({ open: true, config });
  };

  const handleConfirmMaintenanceToggle = async () => {
    if (!confirmMaintenance.config) return;
    const target = confirmMaintenance.config;
    const newStatus = !target.maintenanceMode;

    try {
      await onUpdateVersion(target.id || target.platform, {
        maintenanceMode: newStatus,
      });
      toast.success(
        `${target.platform.toUpperCase()} maintenance mode ${newStatus ? 'ENABLED' : 'DISABLED'}`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update maintenance mode');
    } finally {
      setConfirmMaintenance({ open: false, config: null });
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;

    try {
      await onUpdateVersion(editingConfig.id || editingConfig.platform, editingConfig);
      toast.success(`${editingConfig.platform.toUpperCase()} app version rules saved successfully!`);
      setIsModalOpen(false);
      setEditingConfig(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save version configuration');
    }
  };

  const renderPlatformCard = (platform: 'android' | 'ios', config?: AppVersionConfig) => {
    const isAndroid = platform === 'android';
    const title = isAndroid ? 'Android App (Google Play Store)' : 'iOS App (Apple App Store)';
    const Icon = isAndroid ? Smartphone : Apple;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
        <div>
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${isAndroid
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-sky-600 shadow-sky-600/30'
                  }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target Platform: <span className="font-semibold uppercase">{platform}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {config?.maintenanceMode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  MAINTENANCE ACTIVE
                </span>
              )}
              {config?.forceUpdate && !config?.maintenanceMode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  FORCE UPDATE ON
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Min Version</p>
              <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                v{config?.minVersion || '1.0.0'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latest Version</p>
              <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">
                v{config?.latestVersion || '1.0.0'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Force Update</p>
              <p className="text-sm font-bold mt-1">
                {config?.forceUpdate ? (
                  <span className="text-rose-600 font-black">ENABLED</span>
                ) : (
                  <span className="text-slate-500">DISABLED</span>
                )}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Maintenance</p>
              <p className="text-sm font-bold mt-1">
                {config?.maintenanceMode ? (
                  <span className="text-amber-600 font-black">ACTIVE</span>
                ) : (
                  <span className="text-emerald-600 font-bold">OFF</span>
                )}
              </p>
            </div>
          </div>

          {/* Title & Message Preview */}
          <div className="space-y-3 bg-slate-50/70 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Update Modal Title</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {config?.updateTitle || 'App Update Available'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Release Notes / Message</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                {config?.updateMessage || 'No release message set.'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Store Deep Link URL</p>
              {config?.storeUrl ? (
                <a
                  href={config.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 mt-0.5 truncate"
                >
                  <span className="truncate">{config.storeUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
              ) : (
                <p className="text-xs text-slate-400 italic mt-0.5">No store URL configured</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button Controls */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          {config && (
            <>
              <button
                type="button"
                onClick={() => handleEditClick(config)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                Configure App Version
              </button>

              <button
                type="button"
                onClick={() => handleToggleMaintenance(config)}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${config.maintenanceMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
              >
                <Radio className="w-4 h-4" />
                {config.maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Live App Force Update Control
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Mobile Version & Maintenance Management
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Configure minimum required versions, force updates, custom release notes, and emergency maintenance blocks for Android and iOS devices across the entire campaign network.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderPlatformCard('android', androidConfig)}
        {renderPlatformCard('ios', iosConfig)}
      </div>

      {/* Edit Version Modal */}
      {editingConfig && (
        <Modal
          maxWidth="lg"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Configure ${editingConfig.platform.toUpperCase()} App Version & Release`}
        >
          <form onSubmit={handleSaveModal} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Minimum Required Version (minVersion)"
                type="text"
                value={editingConfig.minVersion}
                onChange={(e) => setEditingConfig({ ...editingConfig, minVersion: e.target.value })}
                placeholder="e.g. 1.0.0"
                helperText="Apps on lower version will be forced to update."
                required
              />

              <FormInput
                label="Latest Store Version (latestVersion)"
                type="text"
                value={editingConfig.latestVersion}
                onChange={(e) => setEditingConfig({ ...editingConfig, latestVersion: e.target.value })}
                placeholder="e.g. 1.2.0"
                helperText="Triggers recommended soft update prompt."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <FormInput
                label="Force Update Prompt Toggle"
                type="select"
                value={editingConfig.forceUpdate ? 'true' : 'false'}
                onChange={(e) =>
                  setEditingConfig({ ...editingConfig, forceUpdate: e.target.value === 'true' })
                }
                options={[
                  { label: 'Disabled (Soft Prompt Allowed)', value: 'false' },
                  { label: 'Enabled (Strict Force Update Lock)', value: 'true' },
                ]}
              />

              <FormInput
                label="Maintenance Mode Toggle"
                type="select"
                value={editingConfig.maintenanceMode ? 'true' : 'false'}
                onChange={(e) =>
                  setEditingConfig({ ...editingConfig, maintenanceMode: e.target.value === 'true' })
                }
                options={[
                  { label: 'Off (Normal Operation)', value: 'false' },
                  { label: 'Active (Emergency Maintenance Lock)', value: 'true' },
                ]}
              />
            </div>

            <FormInput
              label="App Update Title"
              type="text"
              value={editingConfig.updateTitle}
              onChange={(e) => setEditingConfig({ ...editingConfig, updateTitle: e.target.value })}
              placeholder="App Update Available"
              required
            />

            <FormInput
              label="Update Message / Release Notes"
              type="textarea"
              value={editingConfig.updateMessage}
              onChange={(e) => setEditingConfig({ ...editingConfig, updateMessage: e.target.value })}
              placeholder="What's new in this release..."
              rows={3}
              required
            />

            <FormInput
              label="Store Deep Link / Direct App URL"
              type="text"
              value={editingConfig.storeUrl}
              onChange={(e) => setEditingConfig({ ...editingConfig, storeUrl: e.target.value })}
              placeholder="https://play.google.com/store/apps/details?id=com.ranniti.app"
              helperText="Google Play Store or Apple App Store URL"
              required
            />

            {editingConfig.maintenanceMode && (
              <FormInput
                label="Maintenance Notice Message"
                type="textarea"
                value={editingConfig.maintenanceMessage}
                onChange={(e) =>
                  setEditingConfig({ ...editingConfig, maintenanceMessage: e.target.value })
                }
                placeholder="Ranniti is under scheduled maintenance..."
                rows={2}
              />
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving...' : 'Save Version Settings'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Modal for Emergency Maintenance Mode */}
      <ConfirmModal
        isOpen={confirmMaintenance.open}
        onClose={() => setConfirmMaintenance({ open: false, config: null })}
        onConfirm={handleConfirmMaintenanceToggle}
        title={
          confirmMaintenance.config?.maintenanceMode
            ? `Disable Maintenance Mode for ${confirmMaintenance.config?.platform.toUpperCase()}?`
            : `Enable Emergency Maintenance Mode for ${confirmMaintenance.config?.platform.toUpperCase()}?`
        }
        message={
          confirmMaintenance.config?.maintenanceMode
            ? 'This will restore normal mobile app access for all users on this platform.'
            : 'WARNING: Enabling maintenance mode will instantly block all mobile app users on this platform with a maintenance screen until disabled.'
        }
        confirmText={
          confirmMaintenance.config?.maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'
        }
        variant={confirmMaintenance.config?.maintenanceMode ? 'info' : 'danger'}
        isLoading={saving}
      />
    </div>
  );
};

export default AppVersionSection;
