import AdminLayout from "@/components/layouts/AdminLayout";
import { OfficesProvider } from "@/components/contexts/OfficesContext";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <OfficesProvider>
      <AdminLayout>{children}</AdminLayout>
    </OfficesProvider>
  );
}
