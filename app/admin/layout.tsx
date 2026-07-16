import AdminLayout from "@/components/layouts/AdminLayout";
import { OfficesProvider } from "@/components/contexts/OfficesContext";
import { DepartmentsProvider } from "@/components/contexts/DepartmentsContext";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <DepartmentsProvider>
      <OfficesProvider>
        <AdminLayout>{children}</AdminLayout>
      </OfficesProvider>
    </DepartmentsProvider>
  );
}
