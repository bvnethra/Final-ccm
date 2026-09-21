// application/src/hooks/useVendorReminders.ts
import { useMemo } from 'react';
import { useOutsourcePOs } from './useOperations';

export interface VendorReminder {
  poId: string;
  poNumber: string;
  vendorName: string;
  requestId: string;
  expectedReturnDate: string;
  daysRemaining: number;
  isOverdue: boolean;
  urgency: 'OVERDUE' | 'CRITICAL' | 'UPCOMING';
  message: string;
}

export function useVendorReminders() {
  const { data: outsourcePOs = [], isLoading } = useOutsourcePOs();

  const reminders: VendorReminder[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return outsourcePOs
      .filter((po) => po.status === 'SENT' && po.expected_return_date)
      .map((po) => {
        const expected = new Date(po.expected_return_date!);
        expected.setHours(0, 0, 0, 0);
        const diffTime = expected.getTime() - today.getTime();
        const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isOverdue = daysDiff < 0;
        const urgency: 'OVERDUE' | 'CRITICAL' | 'UPCOMING' = isOverdue
          ? 'OVERDUE'
          : daysDiff <= 2
          ? 'CRITICAL'
          : 'UPCOMING';

        let message = '';
        if (isOverdue) {
          message = `Overdue by ${Math.abs(daysDiff)} day(s)! Collect items from ${po.vendor_name || 'vendor'} & raise invoice.`;
        } else if (daysDiff === 0) {
          message = `Due today! Collect vendor items & raise invoice.`;
        } else {
          message = `Due in ${daysDiff} day(s) (${expected.toLocaleDateString()}). Collect vendor items & raise invoice.`;
        }

        return {
          poId: po.id,
          poNumber: po.vendor_po_number,
          vendorName: po.vendor_name || 'Authorized Vendor',
          requestId: po.request_id,
          expectedReturnDate: po.expected_return_date!,
          daysRemaining: daysDiff,
          isOverdue,
          urgency,
          message,
        };
      })
      .filter((r) => r.daysRemaining <= 5)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [outsourcePOs]);

  return {
    reminders,
    count: reminders.length,
    isLoading,
  };
}
