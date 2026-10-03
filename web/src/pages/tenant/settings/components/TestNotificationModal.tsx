import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { useAppDispatch } from '@/redux/hooks';
import { sendTestPushNotification } from '@/redux/actions/settings';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface TestNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestNotificationModal: React.FC<TestNotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('War Room Alert: Evening Booth Sync');
  const [body, setBody] = useState('Please sync today\'s voter verification logs before 08:00 PM.');
  const [targetType, setTargetType] = useState('broadcast');
  const [targetValue, setTargetValue] = useState('all_field_workers');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and message body are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await dispatch(
        sendTestPushNotification({
          title: title.trim(),
          body: body.trim(),
          targetType,
          targetValue,
        })
      );
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch test notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Send Test Push Notification"
      subtitle="Dispatch test ping to verified mobile devices via Firebase Cloud Messaging"
      maxWidth="md"
      onSubmit={handleSubmit}
      submitText={isLoading ? 'Dispatching...' : 'Send Test Notification'}
      cancelText="Close"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <FormInput
          name="test_target_type"
          type="select"
          label="Target Audience"
          value={targetType}
          onChange={(e) => setTargetType((e.target as any)?.value ?? e)}
          options={[
            { label: 'Broadcast to All Active Field Workers', value: 'broadcast' },
            { label: 'Booth Captains Only', value: 'booth_captains' },
            { label: 'Specific Device FCM Registration Token', value: 'token' },
          ]}
        />

        {targetType === 'token' && (
          <FormInput
            name="test_target_token"
            label="Device FCM Token"
            placeholder="e.g. c7-X... (from mobile debug log)"
            value={targetValue}
            onChange={(e) => setTargetValue((e.target as any)?.value ?? e)}
            required
          />
        )}

        <FormInput
          name="test_title"
          label="Notification Title"
          placeholder="e.g. Booth Review Meeting Tonight"
          value={title}
          onChange={(e) => setTitle((e.target as any)?.value ?? e)}
          required
        />

        <FormInput
          name="test_body"
          type="textarea"
          label="Notification Message Body"
          placeholder="e.g. Please gather at the Mandal Office at 7:00 PM."
          value={body}
          onChange={(e) => setBody((e.target as any)?.value ?? e)}
          rows={3}
          required
        />

        {result && (
          <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Notification Dispatched Successfully!</span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono space-y-0.5">
              <p>Message ID: <span className="text-emerald-700 dark:text-emerald-300">{result.messageId}</span></p>
              <p>Status: <span className="font-bold text-emerald-600">{result.status}</span></p>
              <p className="text-[11px] text-slate-500 font-sans mt-1">{result.summary}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TestNotificationModal;
