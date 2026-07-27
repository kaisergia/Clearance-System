"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyStudentsPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/user-management?tab=users");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#b51b15] border-r-transparent mr-2" />
      <span className="text-xs text-gray-500 font-semibold">Redirecting to User Management...</span>
    </div>
  );
}
