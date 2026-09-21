// application/src/components/masters/items/ItemMasterDetailPresenter.tsx
import React from 'react';
import type { ItemMaster } from '../../../types/domain';
import { ItemMasterDetailView } from './ItemMasterDetailView';
import { Button } from '../../ui/UIPrimitives';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface ItemMasterDetailPresenterProps {
  item?: ItemMaster;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const ItemMasterDetailPresenter: React.FC<ItemMasterDetailPresenterProps> = ({
  item,
  isLoading,
  errorMessage,
}) => {
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-[#6B7280]">
          <div className="size-8 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
          <span>Loading instrument specifications...</span>
        </div>
      </div>
    );
  }

  if (errorMessage || !item) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="p-4 bg-[#FEF2F2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm">
          {errorMessage || 'Instrument record not found'}
        </div>
        <Link to="/masters/items">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4" /> Return to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return <ItemMasterDetailView item={item} />;
};
