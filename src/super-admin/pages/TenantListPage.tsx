// src/super-admin/pages/TenantListPage.tsx
import { TenantTable } from '../components/tenants/TenantTable';
import { Button } from '../../components/ui/UIPrimitives';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../hooks/usePlatformAuth';

export default function TenantListPage() {
  const navigate = useNavigate();
  const { data: platformSession } = usePlatformAuth();
  const isSupport = platformSession?.isPlatformSupport;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Tenants</h1>
          <p className="text-slate-500 text-xs mt-1">
            Search, inspect, filter, and govern all registered enterprise tenant accounts across the platform.
          </p>
        </div>

        {!isSupport && (
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/tenants/new')}
            className="text-xs gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
          >
            <Plus className="size-4" />
            <span>Onboard Tenant</span>
          </Button>
        )}
      </div>

      <TenantTable />
    </div>
  );
}
