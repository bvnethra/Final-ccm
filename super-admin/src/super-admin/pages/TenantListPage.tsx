// src/super-admin/pages/TenantListPage.tsx
import React from 'react';
import { TenantTable } from '../components/tenants/TenantTable';

export default function TenantListPage() {
  return (
    <div className="space-y-5">
      <TenantTable />
    </div>
  );
}
