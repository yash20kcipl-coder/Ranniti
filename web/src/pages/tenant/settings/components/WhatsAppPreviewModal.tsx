import {
  CheckCheck,
  ExternalLink,
  CornerDownLeft,
  Phone,
  Send,
  Sparkles,
  ShieldCheck,
  MoreVertical,
  ArrowLeft,
  Camera,
  Smile,
  Mic,
  Paperclip,
} from 'lucide-react';
import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { AVAILABLE_VARIABLES } from './VariableChips';
import { SafeImage } from '@/components/common/SafeImage';
import type { WhatsAppTemplate } from '../types/settings.types';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: WhatsAppTemplate | null;
  onOpenTestSend?: (template: WhatsAppTemplate) => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  template,
  onOpenTestSend,
}) => {
  const [showSimulatedData, setShowSimulatedData] = useState(true);

  if (!template) return null;

  // Render text with interpolated values or raw placeholders
  const getRenderedBody = () => {
    let text = template.bodyText ? template.bodyText.replace(/\\n/g, '\n') : '';
    if (!showSimulatedData) return text;

    AVAILABLE_VARIABLES.forEach((v) => {
      const reg = new RegExp(`\\{\\{${v.key}\\}\\}`, 'g');
      text = text.replace(reg, v.sampleValue);
    });
    // Replace any remaining {{1}}, {{2}} numeric tokens with generic sample strings
    text = text.replace(/\{\{1\}\}/g, 'Ramesh Kumar');
    text = text.replace(/\{\{2\}\}/g, 'Booth 42 - Gandhi School');
    text = text.replace(/\{\{3\}\}/g, 'ABC1234567');
    return text;
  };

  const getRenderedHeader = () => {
    if (!template.headerContent) return null;
    let text = template.headerContent;
    if (template.headerType === 'TEXT') {
      text = text.replace(/^https?:\/\/[^/]+\//, '');
    }
    if (!showSimulatedData) return text;

    AVAILABLE_VARIABLES.forEach((v) => {
      const reg = new RegExp(`\\{\\{${v.key}\\}\\}`, 'g');
      text = text.replace(reg, v.sampleValue);
    });
    return text;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="WhatsApp Template Preview"
      subtitle={`Previewing "${template.name}" on Meta WhatsApp Business`}
      maxWidth="md"
      cancelText="Close"
    >
      <div className="space-y-4">
        {/* Toggle Simulated Voter Data */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Sample Voter Data Interpolation
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSimulatedData(!showSimulatedData)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${showSimulatedData
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
          >
            {showSimulatedData ? 'Showing Sample Values' : 'Showing Tokens {{var}}'}
          </button>
        </div>

        {/* Mobile Mockup Outer Frame */}
        <div className="mx-auto w-full max-w-[340px] rounded-[36px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800 relative">
          {/* Phone Top Notch / Speaker Bar */}
          <div className="flex justify-between items-center px-4 pt-1 pb-2 text-[10px] text-white/70">
            <span>9:41</span>
            <div className="w-20 h-3.5 bg-black rounded-full" />
            <div className="flex items-center gap-1">
              <span className="text-[9px]">5G</span>
              <span>100%</span>
            </div>
          </div>

          {/* WhatsApp Screen Content */}
          <div className="w-full rounded-[24px] bg-[#0b141a] overflow-hidden flex flex-col h-[460px] text-slate-100 shadow-inner relative font-sans">
            {/* WhatsApp App Bar */}
            <div className="bg-[#1f2c34] px-2.5 py-2 flex items-center justify-between border-b border-[#2a3942] z-10">
              <div className="flex items-center gap-2 min-w-0">
                <ArrowLeft className="w-4 h-4 text-slate-300 flex-shrink-0 cursor-pointer" />
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0 border border-emerald-400/40">
                  <SafeImage
                    src={null}
                    alt="Ranniti Campaign"
                    fallbackText="RC"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs text-slate-100 truncate max-w-[130px]">
                      Ranniti War Room
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20 flex-shrink-0" />
                  </div>
                  <p className="text-[10px] text-emerald-400 leading-none">Official Business Account</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300 pr-1">
                <Phone className="w-3.5 h-3.5" />
                <MoreVertical className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Chat Messages Scrollable Canvas with WhatsApp Wallpaper Background */}
            <div
              className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#0b141a]"
              style={{
                backgroundImage:
                  'radial-gradient(#1f2c34 1px, transparent 1px), radial-gradient(#1f2c34 1px, #0b141a 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
              }}
            >
              {/* Date Header Stamp */}
              <div className="text-center my-1">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#182229] text-[10px] text-slate-400 font-medium shadow-sm">
                  TODAY
                </span>
              </div>

              {/* Message Bubble */}
              <div className="max-w-[94%] ml-auto bg-[#005c4b] text-slate-100 rounded-2xl rounded-tr-sm shadow-md overflow-hidden text-xs">
                {/* Header Section */}
                {template.headerType === 'TEXT' && template.headerContent && (
                  <div className="px-3 pt-2.5 font-bold text-xs text-emerald-200 border-b border-emerald-700/40 pb-1.5">
                    {getRenderedHeader()}
                  </div>
                )}

                {template.headerType === 'IMAGE' && (
                  <div className="w-full h-32 bg-emerald-950/60 relative overflow-hidden flex items-center justify-center border-b border-emerald-700/40">
                    {template.headerContent ? (
                      <SafeImage
                        src={template.headerContent}
                        alt="Header Banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-emerald-300/80">
                        <Camera className="w-6 h-6" />
                        <span className="text-[10px]">Campaign Banner / Symbol</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Body Content */}
                <div className="p-3 whitespace-pre-line text-xs leading-relaxed text-slate-100 select-text">
                  {getRenderedBody()}
                </div>

                {/* Footer Disclaimer */}
                {template.footerText && (
                  <div className="px-3 pb-1 text-[10px] text-slate-300/70 italic">
                    {template.footerText}
                  </div>
                )}

                {/* Timestamp & Sent Double Checkmarks */}
                <div className="px-2.5 pb-1.5 flex items-center justify-end gap-1 text-[10px] text-emerald-200/80">
                  <span>10:42 AM</span>
                  <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                </div>

                {/* Interactive Action Buttons */}
                {template.buttons && template.buttons.length > 0 && (
                  <div className="border-t border-emerald-700/50 bg-[#005243] divide-y divide-emerald-700/50">
                    {template.buttons.map((btn, idx) => (
                      <div
                        key={idx}
                        className="py-2 px-3 text-center text-xs font-semibold text-[#53bdeb] flex items-center justify-center gap-1.5 hover:bg-emerald-700/30 transition-colors"
                      >
                        {btn.type === 'URL' && <ExternalLink className="w-3 h-3 text-[#53bdeb]" />}
                        {btn.type === 'PHONE_NUMBER' && <Phone className="w-3 h-3 text-[#53bdeb]" />}
                        {btn.type === 'QUICK_REPLY' && <CornerDownLeft className="w-3 h-3 text-[#53bdeb]" />}
                        <span>{btn.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Simulated WhatsApp Bottom Input Bar */}
            <div className="bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-[#2a3942]">
              <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 flex items-center justify-between text-slate-400 text-xs">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4" />
                  <span className="text-[11px] text-slate-400">Message</span>
                </div>
                <div className="flex items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5" />
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                <Mic className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        {onOpenTestSend && (
          <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTestSend(template);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Live Test WhatsApp Message</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WhatsAppPreviewModal;
