import React from 'react';
import {
  FamilyInfluencerAssignModal,
  SocialInfluencerAssignModal,
  LinkToInfluencerModal,
} from '@/components/common/influencer';
import { ImportModal } from '@/components/common/ImportModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import type { FamilyInfluencerTarget, SocialInfluencerTarget } from '@/components/common/influencer';

interface VoterModalsProps {
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (open: boolean) => void;
  selectedVoter: any;
  onDeleteConfirm: () => Promise<void>;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  onBulkImport: (records: Record<string, any>[]) => Promise<void>;
  familyModalOpen: boolean;
  setFamilyModalOpen: (open: boolean) => void;
  targetFamilyInfluencer: FamilyInfluencerTarget | null;
  setTargetFamilyInfluencer: (target: FamilyInfluencerTarget | null) => void;
  socialModalOpen: boolean;
  setSocialModalOpen: (open: boolean) => void;
  targetSocialInfluencer: SocialInfluencerTarget | null;
  setTargetSocialInfluencer: (target: SocialInfluencerTarget | null) => void;
  linkModalOpen: boolean;
  setLinkModalOpen: (open: boolean) => void;
  linkTargetVoterIds: string[];
  setLinkTargetVoterIds: (ids: string[]) => void;
  linkInfluencerType: 'family' | 'social';
  onInfluencerSuccess: () => void;
  sampleParams?: Record<string, any>;
}

export const VoterModals: React.FC<VoterModalsProps> = ({
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  selectedVoter,
  onDeleteConfirm,
  isImportModalOpen,
  setIsImportModalOpen,
  onBulkImport,
  familyModalOpen,
  setFamilyModalOpen,
  targetFamilyInfluencer,
  setTargetFamilyInfluencer,
  socialModalOpen,
  setSocialModalOpen,
  targetSocialInfluencer,
  setTargetSocialInfluencer,
  linkModalOpen,
  setLinkModalOpen,
  linkTargetVoterIds,
  setLinkTargetVoterIds,
  linkInfluencerType,
  onInfluencerSuccess,
  sampleParams,
}) => {
  return (
    <>
      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onDeleteConfirm}
        title="Delete Voter Record"
        description={`Are you sure you want to delete voter record with EPIC '${selectedVoter?.epicNo}'? This action cannot be undone.`}
        confirmText="Delete Record"
        variant="danger"
      />

      {/* EXCEL IMPORT MODAL */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Voters from Excel"
        categoryKey="voters"
        sampleParams={sampleParams}
        fields={[]}
        onImport={onBulkImport}
      />

      {/* DEDICATED INFLUENCER MODALS */}
      <FamilyInfluencerAssignModal
        isOpen={familyModalOpen}
        onClose={() => {
          setFamilyModalOpen(false);
          setTargetFamilyInfluencer(null);
        }}
        influencer={targetFamilyInfluencer}
        onSuccess={() => {
          setFamilyModalOpen(false);
          setTargetFamilyInfluencer(null);
          onInfluencerSuccess();
        }}
      />

      <SocialInfluencerAssignModal
        isOpen={socialModalOpen}
        onClose={() => {
          setSocialModalOpen(false);
          setTargetSocialInfluencer(null);
        }}
        influencer={targetSocialInfluencer}
        onSuccess={() => {
          setSocialModalOpen(false);
          setTargetSocialInfluencer(null);
          onInfluencerSuccess();
        }}
      />

      <LinkToInfluencerModal
        isOpen={linkModalOpen}
        onClose={() => {
          setLinkModalOpen(false);
          setLinkTargetVoterIds([]);
        }}
        voterIds={linkTargetVoterIds}
        type={linkInfluencerType}
        onSuccess={() => {
          setLinkModalOpen(false);
          setLinkTargetVoterIds([]);
          onInfluencerSuccess();
        }}
      />
    </>
  );
};
