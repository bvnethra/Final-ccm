// src/super-admin/pages/PlatformAuditPage.tsx
import { PlatformAuditTable } from '../components/audit/PlatformAuditTable';
import { PageHeader } from '../components/ui/PageHeader';

export default function PlatformAuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Audit Trail"
        description="Chronological, tamper-evident security audit log of all platform events and tenant modifications."
      />
      <PlatformAuditTable />
    </div>
  );
}
