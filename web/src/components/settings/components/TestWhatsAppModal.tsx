import React, { useState } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { CheckCircle2, Phone, Sparkles } from 'lucide-react';
import type { WhatsAppTemplate } from '@/types/settings.types';
import { sendTestWhatsAppMessage } from '@/redux/actions/settings';

interface TestWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: WhatsAppTemplate | null;
}

export const TestWhatsAppModal: React.FC<TestWhatsAppModalProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  const dispatch = useAppDispatch();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!template) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please provide a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await dispatch(
        sendTestWhatsAppMessage({
          templateId: template.id,
          phoneNumber: phoneNumber.trim(),
          sampleVariables: {
            voter_name: 'Aditya Sharma',
            epic_no: 'VTR8899221',
            booth_name: 'Booth 12 - ZP School',
            serial_no: '105',
            polling_date: '15 Nov 2026',
            booth_address: 'Room No. 3, North Wing',
            candidate_name: 'Rajesh Kadam',
          },
        })
      );
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch test WhatsApp message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Send Test WhatsApp Message"
      subtitle={`Testing template "${template.name}" via Meta Cloud API`}
      maxWidth="md"
      onSubmit={handleSubmit}
      submitText={isLoading ? 'Sending...' : 'Send Test Now'}
      cancelText="Close"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Interactive Sandbox Dispatch</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-800 dark:text-emerald-400">
            A real-time WhatsApp payload will be assembled with sample voter variables and dispatched via Meta Cloud API sandbox to your test number.
          </p>
        </div>

        <div>
          <FormInput
            name="test_phone"
            type="tel"
            label="Recipient Mobile Number (with country code or 10 digits)"
            placeholder="e.g. +91 9876543210 or 9876543210"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber((e.target as any)?.value ?? e);
              setError(null);
            }}
            required
            icon={<Phone className="w-4 h-4 text-slate-400" />}
            error={error || undefined}
          />
        </div>

        {/* Success Confirmation Box */}
        {result && (
          <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp Message Dispatched Successfully!</span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5 font-mono">
              <p>Message ID: <span className="text-emerald-700 dark:text-emerald-300">{result.messageId}</span></p>
              <p>Status: <span className="font-bold text-emerald-600">{result.status}</span></p>
              <p>Recipient: {result.phoneNumber}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TestWhatsAppModal;
