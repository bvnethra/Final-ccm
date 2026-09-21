import { PlatformAuditTable } from '../components/audit/PlatformAuditTable';

export default function PlatformAuditPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E7EB] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Platform Audit Trail</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Chronological, tamper-evident security audit log of all platform events and tenant modifications.
        </p>
      </div>

      <PlatformAuditTable />
    </div>
  );
}
