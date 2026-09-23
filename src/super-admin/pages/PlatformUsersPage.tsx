// src/super-admin/pages/PlatformUsersPage.tsx
import { PlatformUserTable } from '../components/users/PlatformUserTable';
import { PageHeader } from '../components/ui/PageHeader';

export default function PlatformUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Users & Operators"
        description="Manage system governance privileges across operational and administrative accounts."
      />
      <PlatformUserTable />
    </div>
  );
}
