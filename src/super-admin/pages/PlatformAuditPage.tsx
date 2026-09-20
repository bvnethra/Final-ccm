import { PlatformAuditTable } from '../components/audit/PlatformAuditTable';

export default function PlatformAuditPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Platform Audit Trail</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Chronological, tamper-evident security audit log of all platform events and tenant modifications.
        </p>
      </div>

      <PlatformAuditTable />
    </div>
  );
}
