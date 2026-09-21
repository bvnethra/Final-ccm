import { PlatformAuditTable } from '../components/audit/PlatformAuditTable';

export default function PlatformAuditPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Audit Trail</h1>
        <p className="text-slate-500 text-sm mt-1">
          Chronological, tamper-evident security audit log of all platform events and tenant modifications.
        </p>
      </div>

      <PlatformAuditTable />
    </div>
  );
}
