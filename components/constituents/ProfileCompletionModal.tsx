"use client";

import AddUserModal from "@/components/constituents/AddUserModal";

interface ProfileCompletionModalProps {
  isOpen: boolean;
}

export default function ProfileCompletionModal({ isOpen }: ProfileCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <AddUserModal
      isOpen={isOpen}
      onClose={() => {}}
      isFirstLoginMode={true}
    />
  );
}
