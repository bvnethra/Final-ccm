import { PlatformUserTable } from '../components/users/PlatformUserTable';

export default function PlatformUsersPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Platform Users & Operators</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Manage system governance privileges across SUPER_ADMIN and PLATFORM_SUPPORT accounts.
        </p>
      </div>

      <PlatformUserTable />
    </div>
  );
}
