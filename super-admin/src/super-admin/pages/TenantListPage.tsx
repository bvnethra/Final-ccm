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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Enterprise Tenants</h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Search, inspect, filter, and govern all registered enterprise tenant accounts across the platform.
          </p>
        </div>

        {!isSupport && (
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/tenants/new')}
            className="text-xs gap-1.5 h-8 font-medium"
          >
            <Plus className="size-3.5" />
            <span>Onboard Tenant</span>
          </Button>
        )}
      </div>

      <TenantTable />
    </div>
  );
}
