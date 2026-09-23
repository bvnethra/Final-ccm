// application/src/pages/commercial/QuotationDetailPage.tsx
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuotations, useCalibrationRequests } from '../../hooks/useOperations';
import { useClients } from '../../hooks/useClientMaster';
import { OfficialQuotationView } from '../../components/commercial/OfficialQuotationView';
import { Button } from '../../components/ui/UIPrimitives';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: quotations = [], isLoading: isLoadingQuotes } = useQuotations();
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: requests = [] } = useCalibrationRequests();

  if (isLoadingQuotes || isLoadingClients) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-[#6B7280]">
          <div className="size-8 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Official Quotation...</span>
        </div>
      </div>
    );
  }

  const quote = quotations.find(
    (q) =>
      q.id === id ||
      q.quotation_number === id ||
      q.reference_no === id ||
      q.reference_no?.includes(id || '')
  );

  if (!quote) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4 text-center">
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm flex items-center justify-center gap-2">
          <AlertCircle className="size-5 shrink-0" />
          <span>Quotation "{id}" could not be found or has been removed.</span>
        </div>
        <Link to="/commercial/quotations">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4" /> Back
          </Button>
        </Link>
      </div>
    );
  }

  const request = requests.find((r) => r.id === quote.request_id);
  const client =
    clients.find((c) => c.id === request?.client_id) ||
    quote.calibration_requests?.clients;

  const handleGenerateInvoice = () => {
    navigate('/commercial/quotations');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <OfficialQuotationView
        quotation={quote}
        client={client}
        request={request}
        onGenerateInvoice={quote.status === 'APPROVED' ? handleGenerateInvoice : undefined}
        isFullPage={true}
      />
    </div>
  );
};

export default QuotationDetailPage;
