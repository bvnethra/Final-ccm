// src/super-admin/pages/TenantListPage.tsx
import { TenantTable } from '../components/tenants/TenantTable';
import { PageHeader } from '../components/ui/PageHeader';
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
      <PageHeader
        title="Enterprise Tenants"
        description="Search, inspect, filter, and govern all registered enterprise tenant accounts across the platform."
        actions={
          !isSupport ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/tenants/new')}
              className="text-xs gap-1.5 h-8 px-3.5 rounded-[4px] bg-[#0274BB] hover:bg-[#003B8C] text-white font-semibold shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Onboard Tenant</span>
            </Button>
          ) : undefined
        }
      />
      <TenantTable />
    </div>
  );
}
