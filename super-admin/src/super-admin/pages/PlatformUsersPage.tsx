import { PlatformUserTable } from '../components/users/PlatformUserTable';

export default function PlatformUsersPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Users & Operators</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage system governance privileges across operational and administrative accounts.
        </p>
      </div>

      <PlatformUserTable />
    </div>
  );
}
