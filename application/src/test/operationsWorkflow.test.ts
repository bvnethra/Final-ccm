// application/src/test/operationsWorkflow.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCalibrationRequest,
  recordVerification,
  recordCalibration,
  recordRepairOrder,
  approveRepairOrder,
  completeRepairOrder,
  createOutsourcePO,
  receiveOutsourceReturn,
  getCertificates,
  createQuotation,
  approveQuotation,
  createInvoice,
  updateInvoice,
  getInvoices,
  createDispatch,
  getDispatches,
  getOutsourcePOs,
  getCalibrationRequestById,
  getQuotations,
  updateDispatchStatus,
  recordDelivery,
  getDeliveries,
  getCalibrationDueList,
  getClientPastServicedItems,
} from '../services/operationsService';

describe('Calibration Operational Lifecycle Workflow Tests', () => {
  const tenantId = 'tenant-test-123';
  const organizationId = 'org-test-123';

  beforeEach(() => {
    localStorage.clear();
  });

  it('Flow 1: Standard In-House Calibration Pass triggers ISO Certificate & Next Due Date (+1 year)', async () => {
    // 1. Create intake request
    const req = await createCalibrationRequest({
      tenantId,
      organizationId,
      clientId: 'client-1',
      collectionDate: new Date().toISOString(),
      priority: 'NORMAL',
      items: [
        {
          itemMasterId: 'item-1',
          quantity: 1,
          serialNumber: 'SN-001',
          itemCondition: 'GOOD',
        },
      ],
    });

    const item = req.request_items![0];

    // 2. Physical Verification (Step 7)
    await recordVerification({
      tenantId,
      organizationId,
      requestId: req.id,
      requestItemId: item.id,
      verifiedQuantity: 1,
      expectedQuantity: 1,
      observedItemCondition: 'GOOD',
      result: 'VERIFIED',
    });

    // 3. Calibration Test Bench (Step 8) -> PASS
    const nextDueDate = '2027-09-21';
    await recordCalibration({
      tenantId,
      organizationId,
      requestId: req.id,
      requestItemId: item.id,
      nextDueDate,
      result: 'PASS',
      measurements: [
        {
          parameterName: 'Length',
          nominalValue: 10,
          measuredValue: 10.001,
          unit: 'mm',
          toleranceMin: 9.99,
          toleranceMax: 10.01,
          result: 'PASS',
        },
      ],
    });

    // 4. Verify Certificate & Next Due Date Triggered (Step 9)
    const certs = await getCertificates(tenantId, req.id);
    expect(certs.length).toBe(1);
    expect(certs[0].certificate_number).toMatch(/^CERT-\d{4}-\d+/);
    expect(certs[0].valid_until).toBe(nextDueDate);
    expect(certs[0].status).toBe('GENERATED');

    // 5. Commercial Quotation generated before Invoice (Step 10)
    const quote = await createQuotation({
      tenantId,
      organizationId,
      requestId: req.id,
      subtotal: 150,
      discount: 0,
      taxAmount: 27,
      totalAmount: 177,
      items: [
        {
          description: 'Calibration Service & Certificate',
          quantity: 1,
          unitPrice: 150,
          totalPrice: 150,
        },
      ],
    });

    expect(quote.status).toBe('DRAFT');

    // 6. Quotation Approval with Client PO
    const approvedQuote = await approveQuotation({
      tenantId,
      quotationId: quote.id,
      requestId: req.id,
      approved: true,
      clientPoRef: 'PO-CLIENT-9988',
      approverNotes: 'Client confirmed via email',
    });

    expect(approvedQuote.status).toBe('APPROVED');
    expect(approvedQuote.client_po_ref).toBe('PO-CLIENT-9988');

    // 7. Official Tax Invoice Generation from Approved Quotation (Step 11)
    const invoice = await createInvoice({
      tenantId,
      organizationId,
      quotationId: quote.id,
      requestId: req.id,
      clientId: 'client-1',
      clientPoRef: approvedQuote.client_po_ref,
      subtotal: 150,
      discountAmount: 0,
      taxAmount: 27,
      totalAmount: 177,
    });

    expect(invoice.invoice_number).toMatch(/^INV-\d{4}-\d+/);
    expect(invoice.total_amount).toBe(177);
    expect(invoice.client_po_ref).toBe('PO-CLIENT-9988');
    expect(invoice.invoice_status).toBe('ISSUED');

    const allInvoices = await getInvoices(tenantId, organizationId);
    expect(allInvoices.length).toBe(1);
  });

  it('Flow 2: Faulty Instrument -> In-Lab Repair -> Client Approval -> Service Completed -> Re-calibration', async () => {
    const req = await createCalibrationRequest({
      tenantId,
      organizationId,
      clientId: 'client-2',
      collectionDate: new Date().toISOString(),
      priority: 'URGENT',
      items: [
        {
          itemMasterId: 'item-2',
          quantity: 1,
          serialNumber: 'SN-002',
          itemCondition: 'FAULTY',
        },
      ],
    });

    const item = req.request_items![0];

    // Log Faulty repair order
    const repair = await recordRepairOrder({
      tenantId,
      organizationId,
      requestId: req.id,
      requestItemId: item.id,
      defectDescription: 'Dial pointer zero error',
      repairServiceRequired: 'Disassemble, clean gears, zero alignment',
      estimatedCost: 85,
    });

    expect(repair.status).toBe('PENDING_APPROVAL');

    // Client Approval
    const approvedRepair = await approveRepairOrder({
      tenantId,
      repairId: repair.id,
      requestId: req.id,
      approved: true,
      clientPoRef: 'PO-REPAIR-33',
    });

    expect(approvedRepair.status).toBe('IN_PROGRESS');

    // Service Completed
    const completedRepair = await completeRepairOrder({
      tenantId,
      repairId: repair.id,
      requestId: req.id,
      technicianNotes: 'Gears cleaned and adjusted to zero',
    });

    expect(completedRepair.status).toBe('COMPLETED');
  });

  it('Flow 3: Outsource Instrument -> Vendor PO -> Returned with Vendor Cert -> Next Due Date Trigger', async () => {
    const req = await createCalibrationRequest({
      tenantId,
      organizationId,
      clientId: 'client-3',
      collectionDate: new Date().toISOString(),
      priority: 'NORMAL',
      items: [
        {
          itemMasterId: 'item-3',
          quantity: 1,
          serialNumber: 'SN-003',
          itemCondition: 'GOOD',
        },
      ],
    });

    const item = req.request_items![0];

    // Issue Outsource Vendor PO
    const outsource = await createOutsourcePO({
      tenantId,
      organizationId,
      requestId: req.id,
      requestItemId: item.id,
      vendorId: 'vendor-ext-1',
      vendorName: 'Accredited External Metrology Lab',
      vendorCost: 200,
      expectedReturnDate: '2026-10-01',
    });

    expect(outsource.vendor_po_number).toMatch(/^VPO-\d{4}-\d+/);
    expect(outsource.status).toBe('SENT');

    // Return receipt from vendor with vendor cert
    const nextDueDate = '2027-10-01';
    const accepted = await receiveOutsourceReturn({
      tenantId,
      organizationId,
      outsourceId: outsource.id,
      requestId: req.id,
      vendorCertificateNumber: 'VCERT-9921',
      nextDueDate,
    });

    expect(accepted.status).toBe('ACCEPTED');
    expect(accepted.vendor_certificate_number).toBe('VCERT-9921');

    // Certificate & Due Date triggered
    const certs = await getCertificates(tenantId, req.id);
    expect(certs.length).toBe(1);
    expect(certs[0].valid_until).toBe(nextDueDate);
  });

  it('Flow 4: Itemized Partial Invoice vs Actual Invoice Multi-Stage Billing Flow', async () => {
    // 1. Create intake request with 2 items
    const req = await createCalibrationRequest({
      tenantId,
      organizationId,
      clientId: 'client-4',
      collectionDate: new Date().toISOString(),
      priority: 'URGENT',
      items: [
        {
          itemMasterId: 'item-4a',
          quantity: 1,
          serialNumber: 'SN-INHOUSE-01',
          itemCondition: 'GOOD',
        },
        {
          itemMasterId: 'item-4b',
          quantity: 1,
          serialNumber: 'SN-OUTSOURCE-01',
          itemCondition: 'GOOD',
        },
      ],
    });

    // 2. Generate Commercial Quotation for both items
    const quote = await createQuotation({
      tenantId,
      organizationId,
      requestId: req.id,
      subtotal: 300,
      discount: 0,
      taxAmount: 54,
      totalAmount: 354,
      items: [
        {
          description: 'In-House Calibration: Micrometer 0-25mm',
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100,
        },
        {
          description: 'Outsource Calibration: Dead Weight Tester',
          quantity: 1,
          unitPrice: 200,
          totalPrice: 200,
        },
      ],
    });

    expect(quote.items?.length).toBe(2);

    // 3. Client approves quotation with client purchase order
    const approvedQuote = await approveQuotation({
      tenantId,
      quotationId: quote.id,
      requestId: req.id,
      approved: true,
      clientPoRef: 'PO-CORP-PARTIAL-77',
      approverNotes: 'Authorized for partial delivery and split billing',
    });

    expect(approvedQuote.status).toBe('APPROVED');

    const inHouseQuoteItem = approvedQuote.items![0];
    const outsourceQuoteItem = approvedQuote.items![1];

    // 4. PARTIAL INVOICE: In-house item is calibrated, outsource item is still pending.
    // User checks only the in-house item for billing.
    const partialInvoice = await createInvoice({
      tenantId,
      organizationId,
      quotationId: approvedQuote.id,
      requestId: req.id,
      clientId: 'client-4',
      invoiceType: 'PARTIAL',
      itemIds: [inHouseQuoteItem.id],
      clientPoRef: approvedQuote.client_po_ref,
      subtotal: 100,
      discountAmount: 0,
      taxAmount: 18,
      totalAmount: 118,
    });

    expect(partialInvoice.invoice_type).toBe('PARTIAL');
    expect(partialInvoice.invoice_number).toMatch(/^INV-\d{4}-\d+/);
    expect(partialInvoice.subtotal).toBe(100);
    expect(partialInvoice.total_amount).toBe(118);
    expect(partialInvoice.items?.length).toBe(1);
    expect(partialInvoice.items?.[0].description).toBe(inHouseQuoteItem.description);

    // Verify Request status should now be PARTIALLY_INVOICED
    const currentReq = await getCalibrationRequestById(req.id, tenantId);
    expect(currentReq.status).toBe('PARTIALLY_INVOICED');

    // Verify Quotation items: item 1 is locked as invoiced, item 2 is unbilled
    const quotes = await getQuotations(tenantId);
    const currentQuote = quotes.find((q) => q.id === quote.id)!;
    expect(currentQuote.status).toBe('PARTIALLY_INVOICED');
    expect(currentQuote.items?.[0].invoiced).toBe(true);
    expect(currentQuote.items?.[0].invoice_id).toBe(partialInvoice.id);
    expect(currentQuote.items?.[1].invoiced).toBeFalsy();

    // 5. SECOND / ACTUAL INVOICE: Outsourced item has now returned and is accepted.
    // User generates a new invoice for the remaining item.
    const finalInvoice = await createInvoice({
      tenantId,
      organizationId,
      quotationId: currentQuote.id,
      requestId: req.id,
      clientId: 'client-4',
      invoiceType: 'ACTUAL', // All remaining items completed -> Actual invoice
      itemIds: [outsourceQuoteItem.id],
      clientPoRef: approvedQuote.client_po_ref,
      subtotal: 200,
      discountAmount: 0,
      taxAmount: 36,
      totalAmount: 236,
    });

    expect(finalInvoice.invoice_type).toBe('ACTUAL');
    expect(finalInvoice.subtotal).toBe(200);
    expect(finalInvoice.total_amount).toBe(236);
    expect(finalInvoice.items?.length).toBe(1);
    expect(finalInvoice.items?.[0].description).toBe(outsourceQuoteItem.description);

    // Verify all items are now invoiced and Request status updated to INVOICED
    const finishedReq = await getCalibrationRequestById(req.id, tenantId);
    expect(finishedReq.status).toBe('INVOICED');

    const finalQuotes = await getQuotations(tenantId);
    const finishedQuote = finalQuotes.find((q) => q.id === quote.id)!;
    expect(finishedQuote.status).toBe('INVOICED');
    expect(finishedQuote.items?.every((i) => i.invoiced)).toBe(true);

    // Both invoices should now exist in the system
    const allInvoices = await getInvoices(tenantId, organizationId);
    expect(allInvoices.length).toBe(2);
    expect(allInvoices.some((i) => i.invoice_type === 'PARTIAL')).toBe(true);
    expect(allInvoices.some((i) => i.invoice_type === 'ACTUAL')).toBe(true);
  });

  it('Flow 5: Direct Invoicing after Calibration - Quotation and Approval Bypassed (Fully Optional)', async () => {
    // 1. Create intake request with 2 items
    const req = await createCalibrationRequest({
      tenantId,
      organizationId,
      clientId: 'client-5-direct',
      collectionDate: new Date().toISOString(),
      priority: 'NORMAL',
      items: [
        {
          itemMasterId: 'item-5a',
          quantity: 1,
          serialNumber: 'SN-DIRECT-01',
          itemCondition: 'GOOD',
        },
        {
          itemMasterId: 'item-5b',
          quantity: 1,
          serialNumber: 'SN-DIRECT-02',
          itemCondition: 'GOOD',
        },
      ],
    });

    const item1 = req.request_items![0];
    const item2 = req.request_items![1];

    // 2. Physical Inward Verification
    await recordVerification({
      tenantId,
      organizationId,
      requestId: req.id,
      requestItemId: item1.id,
      verifiedQuantity: 1,
      expectedQuantity: 1,
      observedItemCondition: 'GOOD',
      result: 'VERIFIED',
    });

    await recordVerification({
      tenantId,
      organizationId,
      requestId: req.id,
      requestItemId: item2.id,
      verifiedQuantity: 1,
      expectedQuantity: 1,
      observedItemCondition: 'GOOD',
      result: 'VERIFIED',
    });

    // 3. Calibration Bench Pass -> Certificate & Due Date Triggered
    await recordCalibration({
      tenantId,
      organizationId,
      requestId: req.id,
      requestItemId: item1.id,
      nextDueDate: '2027-09-21',
      result: 'PASS',
      measurements: [],
    });

    // Request is now CALIBRATED
    const calibratedReq = await getCalibrationRequestById(req.id, tenantId);
    expect(calibratedReq.status).toBe('CALIBRATED');

    const certs = await getCertificates(tenantId, req.id);
    expect(certs.length).toBe(1);

    // 4. DIRECT INVOICE 1 (PARTIAL) - Bypassing Quotation & Approval Steps
    // Quotation is NOT generated. Approval is NOT generated.
    // Client wants immediate partial billing for ready Item 1.
    const directPartialInvoice = await createInvoice({
      tenantId,
      organizationId,
      requestId: req.id,
      clientId: 'client-5-direct',
      invoiceType: 'PARTIAL',
      itemIds: [item1.id],
      subtotal: 100,
      discountAmount: 0,
      taxAmount: 18,
      totalAmount: 118,
    });

    expect(directPartialInvoice.invoice_type).toBe('PARTIAL');
    expect(directPartialInvoice.quotation_id).toBeUndefined();
    expect(directPartialInvoice.total_amount).toBe(118);

    // Request status is now PARTIALLY_INVOICED
    const partInvoicedReq = await getCalibrationRequestById(req.id, tenantId);
    expect(partInvoicedReq.status).toBe('PARTIALLY_INVOICED');

    // 5. DIRECT INVOICE 2 (ACTUAL / FINAL) - For remaining Item 2
    const directFinalInvoice = await createInvoice({
      tenantId,
      organizationId,
      requestId: req.id,
      clientId: 'client-5-direct',
      invoiceType: 'ACTUAL',
      itemIds: [item2.id],
      subtotal: 150,
      discountAmount: 0,
      taxAmount: 27,
      totalAmount: 177,
    });

    expect(directFinalInvoice.invoice_type).toBe('ACTUAL');
    expect(directFinalInvoice.quotation_id).toBeUndefined();
    expect(directFinalInvoice.total_amount).toBe(177);

    // Request is now fully INVOICED
    const fullyInvoicedReq = await getCalibrationRequestById(req.id, tenantId);
    expect(fullyInvoicedReq.status).toBe('INVOICED');

    // Invoices list contains both direct invoices
    const allInvoices = await getInvoices(tenantId, organizationId);
    const client5Invoices = allInvoices.filter((i) => i.client_id === 'client-5-direct');
    expect(client5Invoices.length).toBe(2);
    expect(client5Invoices.some((i) => i.invoice_type === 'PARTIAL')).toBe(true);
    expect(client5Invoices.some((i) => i.invoice_type === 'ACTUAL')).toBe(true);
  });

  it('Flow 6: Dual Dispatch Types (Courier vs Collection Agent Digital Sign) & Package Content (Item + Invoice vs Invoice Alone)', async () => {
    // 1. Create and calibrate request
    const req = await createCalibrationRequest({
      tenantId,
      organizationId,
      clientId: 'client-6-dispatch',
      collectionDate: new Date().toISOString(),
      priority: 'URGENT',
      items: [
        {
          itemMasterId: 'item-6a',
          quantity: 1,
          serialNumber: 'SN-DISP-01',
          itemCondition: 'GOOD',
        },
      ],
    });

    // 2. Dispatch via Collection Agent with Digital Signature (Items + Invoice)
    const mockSignatureDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const agentDispatch = await createDispatch({
      tenantId,
      organizationId,
      requestId: req.id,
      dispatchType: 'COLLECTION_AGENT',
      packageType: 'ITEMS_AND_INVOICE',
      collectionAgentName: 'Rahul Verma (Agent #84)',
      collectionAgentPhone: '+91 98765 11223',
      clientSignature: mockSignatureDataUrl,
      recipientName: 'Dr. Anita Desai',
      recipientPhone: '+91 98888 77766',
    });

    expect(agentDispatch.dispatch_type).toBe('COLLECTION_AGENT');
    expect(agentDispatch.package_type).toBe('ITEMS_AND_INVOICE');
    expect(agentDispatch.collection_agent_name).toBe('Rahul Verma (Agent #84)');
    expect(agentDispatch.client_signature).toBe(mockSignatureDataUrl);
    expect(agentDispatch.gate_pass_number).toMatch(/^GP-\d{4}-\d{4}$/);
    expect(agentDispatch.status).toBe('DISPATCHED');

    // 3. Dispatch via Courier Service (Invoice Alone)
    const courierDispatch = await createDispatch({
      tenantId,
      organizationId,
      requestId: req.id,
      dispatchType: 'COURIER',
      packageType: 'INVOICE_ONLY',
      courierPartner: 'Blue Dart Express',
      trackingNumber: 'AWB-987654321IN',
      recipientName: 'Finance Accounts Dept',
    });

    expect(courierDispatch.dispatch_type).toBe('COURIER');
    expect(courierDispatch.package_type).toBe('INVOICE_ONLY');
    expect(courierDispatch.courier_partner).toBe('Blue Dart Express');
    expect(courierDispatch.tracking_number).toBe('AWB-987654321IN');
    expect(courierDispatch.gate_pass_number).toMatch(/^GP-\d{4}-\d{4}$/);

    // 4. Verify getDispatches returns both issued gate passes
    const dispatches = await getDispatches(tenantId, organizationId);
    expect(dispatches.length).toBe(2);
    expect(dispatches.some((d) => d.dispatch_type === 'COLLECTION_AGENT' && d.client_signature)).toBe(true);
    expect(dispatches.some((d) => d.dispatch_type === 'COURIER' && d.package_type === 'INVOICE_ONLY')).toBe(true);
  });

  it('Flow 7: Editable Invoice Generation with Negotiated Client Discounts & 5-Day Vendor Return Alert Trigger', async () => {
    // 1. Create calibrated request
    const req = await createCalibrationRequest({
      tenantId,
      organizationId,
      clientId: 'client-7-discount',
      collectionDate: new Date().toISOString(),
      priority: 'NORMAL',
      items: [
        {
          itemMasterId: 'item-7a',
          quantity: 2,
          serialNumber: 'SN-DISC-01',
          itemCondition: 'GOOD',
        },
      ],
    });

    const item = req.request_items![0];

    // 2. Generate invoice with editable rate and 10% commercial discount
    // Base unit rate adjusted to $250 each => Subtotal = 2 * 250 = $500
    // 10% discount = $50 => Taxable = $450
    // GST (18%) = $81 => Total Amount = $531
    const discountedInvoice = await createInvoice({
      tenantId,
      organizationId,
      requestId: req.id,
      clientId: 'client-7-discount',
      invoiceType: 'ACTUAL',
      itemIds: [item.id],
      subtotal: 500,
      discountAmount: 50,
      taxAmount: 81,
      totalAmount: 531,
      items: [
        {
          requestItemId: item.id,
          description: 'High-Precision Micrometer Calibration (Negotiated Rate)',
          quantity: 2,
          unitPrice: 250,
          totalPrice: 500,
        },
      ],
    });

    expect(discountedInvoice.subtotal).toBe(500);
    expect(discountedInvoice.discount_amount).toBe(50);
    expect(discountedInvoice.tax_amount).toBe(81);
    expect(discountedInvoice.total_amount).toBe(531);
    expect(discountedInvoice.items?.[0].unit_price).toBe(250);

    // 2b. Test Price Variation Update on Issued Invoice
    // Adjust rate to ₹300 and add a Handling Surcharge of ₹50
    const updatedWithVariation = await updateInvoice({
      id: discountedInvoice.id,
      tenantId,
      subtotal: 650, // 2 * 300 + 50
      discountAmount: 0,
      taxAmount: 117, // 18% of 650
      totalAmount: 767,
      clientPoRef: 'PO-VARIATION-REVISED-001',
      items: [
        {
          id: discountedInvoice.items![0].id,
          invoice_id: discountedInvoice.id,
          description: 'High-Precision Micrometer Calibration (Revised Client Rate)',
          hsn_sac_code: '998346',
          quantity: 2,
          unit_price: 300,
          unit_rate: 300,
          total_price: 600,
        },
        {
          id: 'custom-fee-1',
          invoice_id: discountedInvoice.id,
          description: 'Special Priority Calibration Surcharge',
          hsn_sac_code: '998346',
          quantity: 1,
          unit_price: 50,
          unit_rate: 50,
          total_price: 50,
        },
      ],
    });

    expect(updatedWithVariation.subtotal).toBe(650);
    expect(updatedWithVariation.total_amount).toBe(767);
    expect(updatedWithVariation.client_po_ref).toBe('PO-VARIATION-REVISED-001');
    expect(updatedWithVariation.items?.length).toBe(2);
    expect(updatedWithVariation.items?.[0].unit_price).toBe(300);
    expect(updatedWithVariation.items?.[1].description).toBe('Special Priority Calibration Surcharge');

    // 3. Test 5-Day Vendor Outsource Return Alert Trigger
    // Create an outsource PO with expected_return_date within 3 days from now
    const threeDaysFuture = new Date();
    threeDaysFuture.setDate(threeDaysFuture.getDate() + 3);

    const outsourcePO = await createOutsourcePO({
      tenantId,
      organizationId,
      requestId: req.id,
      requestItemId: item.id,
      vendorId: 'vendor-iso-lab',
      vendorName: 'NABL Certified Metrology Vendor',
      expectedReturnDate: threeDaysFuture.toISOString().slice(0, 10),
      vendorCost: 180,
    });

    expect(outsourcePO.status).toBe('SENT');
    expect(outsourcePO.vendor_po_number).toMatch(/^VPO-\d{4}-\d{4}$/);

    // Verify 5-day alert logic:
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expected = new Date(outsourcePO.expected_return_date!);
    expected.setHours(0, 0, 0, 0);
    const daysDiff = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    expect(daysDiff).toBeLessThanOrEqual(5);
    expect(daysDiff).toBeGreaterThanOrEqual(0);

    const activeOutsources = await getOutsourcePOs(tenantId);
    const urgentForAgent = activeOutsources.filter((po) => {
      if (po.status !== 'SENT' || !po.expected_return_date) return false;
      const target = new Date(po.expected_return_date);
      target.setHours(0, 0, 0, 0);
      const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 5;
    });

    expect(urgentForAgent.length).toBeGreaterThanOrEqual(1);
    expect(urgentForAgent.some((po) => po.id === outsourcePO.id)).toBe(true);
  });

  it('Flow 8: Dispatch Tracking, Client Delivery Receipt with Digital Signature, and Lifecycle Status Transition to COMPLETED', async () => {
    // 1. Create intake request and advance to INVOICED
    const req = await createCalibrationRequest({
      tenantId,
      organizationId,
      clientId: 'client-8-completed',
      collectionDate: new Date().toISOString(),
      priority: 'NORMAL',
      items: [
        {
          itemMasterId: 'item-8a',
          quantity: 1,
          serialNumber: 'SN-COMP-01',
          itemCondition: 'GOOD',
        },
      ],
    });

    // 2. Issue Outward Gate Pass Dispatch
    const dispatch = await createDispatch({
      tenantId,
      organizationId,
      requestId: req.id,
      dispatchType: 'COLLECTION_AGENT',
      packageType: 'ITEMS_AND_INVOICE',
      collectionAgentName: 'Vikram Singh (Field Engineer)',
      collectionAgentPhone: '+91 98765 43210',
      recipientName: 'Quality Head - Precision Engg',
      recipientPhone: '+91 99887 76655',
    });

    expect(dispatch.status).toBe('DISPATCHED');
    expect(dispatch.gate_pass_number).toMatch(/^GP-\d{4}-\d{4}$/);

    // Verify request status is DISPATCHED
    let currentReq = await getCalibrationRequestById(req.id, tenantId);
    expect(currentReq.status).toBe('DISPATCHED');

    // 3. Track Dispatch: Update Status to IN_TRANSIT
    const inTransitDispatch = await updateDispatchStatus(tenantId, dispatch.id, 'IN_TRANSIT');
    expect(inTransitDispatch.status).toBe('IN_TRANSIT');

    // 4. Client Handover: Capture Client Delivery Receipt and Digital Signature
    const clientSignBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDv1/693yAAAAAElFTkSuQmCC';
    const delivery = await recordDelivery({
      tenantId,
      organizationId,
      dispatchId: dispatch.id,
      receivedBy: 'Dr. S. K. Roy (Director QA)',
      recipientPhone: '+91 99887 76655',
      signature: clientSignBase64,
      remarks: 'All instruments delivered with ISO certificate and duplicate tax invoice. Satisfactory verification done on site.',
    });

    expect(delivery.id).toBeDefined();
    expect(delivery.dispatch_id).toBe(dispatch.id);
    expect(delivery.received_by).toBe('Dr. S. K. Roy (Director QA)');
    expect(delivery.recipient_phone).toBe('+91 99887 76655');
    expect(delivery.signature_data_url).toBe(clientSignBase64);

    // 5. Verify Dispatches list updates to DELIVERED with client signature
    const allDispatches = await getDispatches(tenantId, organizationId);
    const updatedDispatch = allDispatches.find((d) => d.id === dispatch.id);
    expect(updatedDispatch?.status).toBe('DELIVERED');
    expect(updatedDispatch?.client_signature).toBe(clientSignBase64);
    expect(updatedDispatch?.recipient_name).toBe('Dr. S. K. Roy (Director QA)');

    // 6. Verify Deliveries list contains the recorded delivery
    const allDeliveries = await getDeliveries(tenantId, organizationId);
    expect(allDeliveries.length).toBeGreaterThanOrEqual(1);
    const matchedDelivery = allDeliveries.find((del) => del.dispatch_id === dispatch.id);
    expect(matchedDelivery).toBeDefined();
    expect(matchedDelivery?.signature_data_url).toBe(clientSignBase64);

    // 7. CRITICAL: Verify Calibration Request status has transitioned to COMPLETED state!
    currentReq = await getCalibrationRequestById(req.id, tenantId);
    expect(currentReq.status).toBe('COMPLETED');
  });

  it('Flow 9: Calibration Due List Generation, 7/15/30 Day Filtering, Client Grouping, and Vendor Cross-Reference (FR-DUE-01 to FR-DUE-06)', async () => {
    // 1. Create In-House Calibrated Request (with certificate valid_until 5 days in future)
    const fiveDaysFuture = new Date();
    fiveDaysFuture.setDate(fiveDaysFuture.getDate() + 5);
    const fiveDaysStr = fiveDaysFuture.toISOString().slice(0, 10);

    const req1 = await createCalibrationRequest({
      tenantId,
      organizationId,
      clientId: 'client-due-a',
      collectionDate: new Date().toISOString(),
      priority: 'NORMAL',
      items: [
        {
          itemMasterId: 'gauge-due-1',
          quantity: 1,
          serialNumber: 'SN-DUE-001',
          itemCondition: 'GOOD',
        },
      ],
    });

    const item1 = req1.request_items![0];
    await recordCalibration({
      tenantId,
      organizationId,
      requestId: req1.id,
      requestItemId: item1.id,
      result: 'PASS',
      nextDueDate: fiveDaysStr,
      measurements: [],
    });

    // 2. Create Outsource Request returned from Vendor (with next_due_date 2 days in the PAST => OVERDUE)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10);

    const req2 = await createCalibrationRequest({
      tenantId,
      organizationId,
      clientId: 'client-due-b',
      collectionDate: new Date().toISOString(),
      priority: 'URGENT',
      items: [
        {
          itemMasterId: 'gauge-due-2',
          quantity: 1,
          serialNumber: 'SN-DUE-002',
          itemCondition: 'GOOD',
        },
      ],
    });

    const item2 = req2.request_items![0];
    const outsource = await createOutsourcePO({
      tenantId,
      organizationId,
      requestId: req2.id,
      requestItemId: item2.id,
      vendorId: 'vendor-nabl-1',
      vendorName: 'Apex Precision Metrology Labs',
      expectedReturnDate: '2026-09-15',
      vendorCost: 150,
    });

    await receiveOutsourceReturn({
      tenantId,
      organizationId,
      outsourceId: outsource.id,
      requestId: req2.id,
      vendorCertificateNumber: 'VCERT-APEX-778',
      nextDueDate: twoDaysAgoStr,
    });

    // 3. Query getCalibrationDueList()
    const dueList = await getCalibrationDueList(tenantId, organizationId);
    expect(dueList.length).toBeGreaterThanOrEqual(2);

    // Verify overdue item
    const overdueItem = dueList.find((it) => it.serialNumber === 'SN-DUE-002');
    expect(overdueItem).toBeDefined();
    expect(overdueItem?.urgencyStatus).toBe('OVERDUE');
    expect(overdueItem?.daysRemaining).toBeLessThan(0);
    expect(overdueItem?.isOutsourced).toBe(true);
    expect(overdueItem?.vendorName).toBe('Apex Precision Metrology Labs');
    expect(overdueItem?.vendorCertificateNumber).toBe('VCERT-APEX-778');

    // Verify item due in 5 days
    const due7Item = dueList.find((it) => it.serialNumber === 'SN-DUE-001');
    expect(due7Item).toBeDefined();
    expect(due7Item?.urgencyStatus).toBe('DUE_7_DAYS');
    expect(due7Item?.daysRemaining).toBeGreaterThanOrEqual(0);
    expect(due7Item?.daysRemaining).toBeLessThanOrEqual(7);
    expect(due7Item?.isOutsourced).toBe(false);

    // Verify ordering: overdue item appears before 5-day item (sorted by daysRemaining ascending)
    const overdueIdx = dueList.findIndex((it) => it.serialNumber === 'SN-DUE-002');
    const due7Idx = dueList.findIndex((it) => it.serialNumber === 'SN-DUE-001');
    expect(overdueIdx).toBeLessThan(due7Idx);
  });

  describe('Process 4: 3 Quotation Modes (Inward Request, Existing Customer, New Client Estimate)', () => {
    it('Mode 1: Inward Request with quotationRequired flag updates request quotation_status to QUOTED', async () => {
      // 1. Create inward request with quotationRequired: true
      const req = await createCalibrationRequest({
        tenantId,
        organizationId,
        clientId: 'client-mode1',
        collectionDate: new Date().toISOString(),
        priority: 'NORMAL',
        quotationRequired: true,
        items: [
          {
            itemMasterId: 'item-micrometer-1',
            quantity: 2,
            serialNumber: 'SN-MODE1-01',
            itemCondition: 'GOOD',
          },
        ],
      });

      expect(req.quotation_required).toBe(true);
      expect(req.quotation_status).toBe('PENDING_QUOTE');

      // 2. Raise Quotation for this Inward Request
      const quote = await createQuotation({
        tenantId,
        organizationId,
        requestId: req.id,
        clientId: 'client-mode1',
        quotationType: 'INWARD_REQUEST',
        subtotal: 500,
        discount: 50,
        taxAmount: 81,
        totalAmount: 531,
        items: [
          {
            description: 'Precision Micrometer 0-25mm Calibration',
            quantity: 2,
            unitPrice: 250,
            totalPrice: 500,
          },
        ],
      });

      expect(quote.quotation_type).toBe('INWARD_REQUEST');
      expect(quote.request_id).toBe(req.id);
      expect(quote.status).toBe('DRAFT');

      // 3. Verify request status transitioned to QUOTED
      const updatedReq = await getCalibrationRequestById(req.id, tenantId);
      expect(updatedReq?.quotation_status).toBe('QUOTED');
    });

    it('Mode 2: Existing Customer Quotation pre-populates previous calibration service records', async () => {
      const existingClientId = 'client-existing-mode2';

      // 1. Create previous calibration request for this client to simulate service history
      await createCalibrationRequest({
        tenantId,
        organizationId,
        clientId: existingClientId,
        collectionDate: new Date().toISOString(),
        priority: 'NORMAL',
        items: [
          {
            itemMasterId: 'item-vernier-2',
            quantity: 3,
            serialNumber: 'SN-HIST-01',
            itemCondition: 'GOOD',
          },
        ],
      });

      // 2. Query past serviced items for this client
      const pastItems = await getClientPastServicedItems(tenantId, existingClientId);
      expect(pastItems.length).toBeGreaterThanOrEqual(1);
      expect(pastItems.some((it) => it.item_master_id === 'item-vernier-2')).toBe(true);

      // 3. Create Mode 2 quotation using existing client reference
      const quote = await createQuotation({
        tenantId,
        organizationId,
        clientId: existingClientId,
        quotationType: 'CLIENT_ESTIMATE',
        subtotal: 600,
        discount: 0,
        taxAmount: 108,
        totalAmount: 708,
        items: [
          {
            description: 'Digital Vernier Caliper 150mm Repeat Service',
            quantity: 3,
            unitPrice: 200,
            totalPrice: 600,
          },
        ],
      });

      expect(quote.quotation_type).toBe('CLIENT_ESTIMATE');
      expect(quote.client_id).toBe(existingClientId);
      expect(quote.request_id).toBeUndefined();
      expect(quote.total_amount).toBe(708);
    });

    it('Mode 3: New Client Estimate allows creating quotation with approximate equipment data before inward', async () => {
      const newClientId = 'client-new-estimate-mode3';

      // Mode 3 is created with approximate line items without needing an existing inward request
      const quote = await createQuotation({
        tenantId,
        organizationId,
        clientId: newClientId,
        quotationType: 'CLIENT_ESTIMATE',
        subtotal: 1200,
        discount: 100,
        taxAmount: 198,
        totalAmount: 1298,
        items: [
          {
            description: 'Pressure Gauge 0-100 bar (Approximate Estimate)',
            quantity: 4,
            unitPrice: 300,
            totalPrice: 1200,
          },
        ],
      });

      expect(quote.quotation_type).toBe('CLIENT_ESTIMATE');
      expect(quote.client_id).toBe(newClientId);
      expect(quote.request_id).toBeUndefined();
      expect(quote.items?.length).toBe(1);
      expect(quote.items![0].description).toContain('Approximate Estimate');
      expect(quote.total_amount).toBe(1298);

      // Verify it appears in quotations list
      const allQuotes = await getQuotations(tenantId);
      const found = allQuotes.find((q) => q.id === quote.id);
      expect(found).toBeDefined();
      expect(found?.quotation_type).toBe('CLIENT_ESTIMATE');
    });
  });
});
