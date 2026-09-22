// application/src/types/domain.ts

export type RequestPriority = 'NORMAL' | 'URGENT';
export type RequestStatus =
  | 'CREATED'
  | 'VERIFIED'
  | 'DISCREPANCY'
  | 'CALIBRATING'
  | 'CALIBRATED'
  | 'FAULTY'
  | 'REPAIR_IN_PROGRESS'
  | 'OUTSOURCED'
  | 'OUTSOURCE_RETURNED'
  | 'QUOTATION'
  | 'APPROVED'
  | 'PARTIALLY_INVOICED'
  | 'INVOICED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'COMPLETED';

export type ItemCondition = 'GOOD' | 'DAMAGED' | 'FAULTY' | 'SCRATCHED';
export type VerificationResult = 'VERIFIED' | 'DISCREPANCY' | 'REJECTED';
export type CalibrationResult = 'PASS' | 'FAIL';

export type PaymentTerm = 'IMMEDIATE' | '30_DAYS' | '60_DAYS';

export interface Client {
  id: string;
  tenant_id: string;
  organization_id?: string;
  client_code: string;
  client_name: string;
  address: string;
  billing_address?: string;
  city: string;
  state: string;
  pin: string;
  gst_tax_number: string;
  contact_person: string;
  email: string;
  phone: string;
  phone_numbers?: string[];
  email_addresses?: string[];
  payment_term: PaymentTerm;
  status: 'ACTIVE' | 'INACTIVE';
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_by?: string;
  updated_by_name?: string;
  updated_at?: string;
}

export interface ClientFormData {
  client_code?: string;
  client_name: string;
  address: string;
  billing_address?: string;
  same_as_registered_address?: boolean;
  city: string;
  state: string;
  pin: string;
  gst_tax_number: string;
  contact_person: string;
  phone_numbers: string[];
  email_addresses: string[];
  payment_term: PaymentTerm;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Vendor {
  id: string;
  tenant_id: string;
  organization_id?: string;
  vendor_code: string;
  vendor_name: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  gst_tax_number: string;
  contact_person: string;
  email: string;
  phone: string;
  phone_numbers?: string[];
  email_addresses?: string[];
  serviced_categories: string[];
  status: 'ACTIVE' | 'INACTIVE';
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_by?: string;
  updated_by_name?: string;
  updated_at?: string;
}

export interface VendorFormData {
  vendor_code?: string;
  vendor_name: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  gst_tax_number: string;
  contact_person: string;
  phone_numbers: string[];
  email_addresses: string[];
  serviced_categories: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ItemMaster {
  id: string;
  tenant_id: string;
  organization_id?: string;
  item_code: string;
  item_name: string;
  item_category?: string;
  item_type?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  range_min: number;
  range_max: number;
  range_unit: string;
  measurement_range?: string;
  least_count: number;
  least_count_unit: string;
  standard_cost: number;
  calibration_frequency?: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_by?: string;
  updated_by_name?: string;
  updated_at?: string;
}

export interface ItemMasterFormData {
  item_code?: string;
  item_name: string;
  item_category?: string;
  manufacturer?: string;
  model?: string;
  range_min: number;
  range_max: number;
  range_unit: string;
  least_count: number;
  least_count_unit: string;
  standard_cost: number;
  calibration_frequency?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RequestAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  base64Data?: string;
  url?: string;
  uploaded_at: string;
}

export interface CalibrationRequest {
  id: string;
  tenant_id: string;
  organization_id: string;
  request_number: string;
  client_id: string;
  collection_agent_id?: string;
  collection_agent_name?: string;
  collection_date: string;
  priority: RequestPriority;
  client_po_ref?: string;
  status: RequestStatus;
  remarks?: string;
  attachments?: RequestAttachment[];
  created_at: string;
  updated_at: string;
  clients?: Client;
  request_items?: RequestItem[];
}

export interface RequestItem {
  id: string;
  tenant_id: string;
  organization_id: string;
  request_id: string;
  item_master_id?: string;
  serial_number?: string;
  accessories?: string;
  quantity: number;
  received_quantity: number;
  item_condition: ItemCondition;
  status: string;
  remarks?: string;
  created_at: string;
  item_masters?: ItemMaster;
}

export interface Verification {
  id: string;
  tenant_id: string;
  organization_id: string;
  request_id: string;
  request_item_id: string;
  verified_by?: string;
  verified_at: string;
  verified_quantity: number;
  expected_quantity: number;
  observed_item_condition: string;
  result: VerificationResult;
  discrepancy_reason?: string;
  remarks?: string;
  created_at: string;
}

export interface CalibrationMeasurement {
  id?: string;
  tenant_id: string;
  organization_id: string;
  calibration_id?: string;
  parameter_name: string;
  nominal_value: number;
  measured_value: number;
  unit: string;
  tolerance_min: number;
  tolerance_max: number;
  result: 'PASS' | 'FAIL';
  created_at?: string;
}

export interface Calibration {
  id: string;
  tenant_id: string;
  organization_id: string;
  request_id: string;
  request_item_id: string;
  calibrated_by?: string;
  calibration_date: string;
  next_due_date: string;
  environmental_temperature?: number;
  environmental_humidity?: number;
  result: CalibrationResult;
  remarks?: string;
  created_at: string;
  measurements?: CalibrationMeasurement[];
}

export interface Certificate {
  id: string;
  tenant_id: string;
  organization_id: string;
  request_id: string;
  calibration_id: string;
  request_item_id?: string;
  certificate_number: string;
  issued_at: string;
  valid_until: string;
  pdf_storage_path?: string;
  status: 'GENERATED' | 'REVOKED';
  created_at: string;
}

export interface Quotation {
  id: string;
  tenant_id: string;
  organization_id: string;
  request_id: string;
  quotation_number: string;
  reference_no?: string;
  quotation_date?: string;
  kind_attn?: string;
  phone_no?: string;
  subject?: string;
  enquiry_ref?: string;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total_amount: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'PARTIALLY_INVOICED' | 'INVOICED' | 'REJECTED';
  client_po_ref?: string;
  approver_notes?: string;
  approved_at?: string;
  created_at: string;
  items?: QuotationItem[];
  calibration_requests?: CalibrationRequest;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  range?: string;
  remarks?: string;
  hsn_sac_code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  invoiced?: boolean;
  invoice_id?: string;
  invoice_number?: string;
}

export type CalibrationOutcome = 'CALIBRATED' | 'FAULTY' | 'OUTSOURCED';

export interface RepairOrder {
  id: string;
  tenant_id: string;
  organization_id: string;
  request_id: string;
  request_item_id: string;
  defect_description: string;
  repair_service_required: string;
  estimated_cost: number;
  parts_required?: string;
  client_approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  client_approved_at?: string;
  client_po_ref?: string;
  technician_notes?: string;
  status: 'PENDING_APPROVAL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completed_at?: string;
  created_at: string;
}

export interface OutsourcePOItem {
  id: string;
  description: string;
  due_on?: string;
  quantity: number;
  unit_rate: number;
  per?: string;
  total_price: number;
}

export interface OutsourcePO {
  id: string;
  tenant_id: string;
  organization_id: string;
  request_id: string;
  request_item_id: string;
  vendor_id: string;
  vendor_name?: string;
  vendor_po_number: string;
  voucher_no?: string;
  sent_date: string;
  expected_return_date?: string;
  received_date?: string;
  vendor_cost?: number;
  vendor_certificate_number?: string;
  next_due_date?: string;
  remarks?: string;
  status: 'SENT' | 'RETURNED' | 'ACCEPTED';
  created_at: string;
  updated_at?: string;
  payment_terms?: string;
  dispatched_through?: string;
  destination?: string;
  terms_of_delivery?: string;
  items?: OutsourcePOItem[];
  subtotal?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_amount?: number;
}

export type InvoiceType = 'PARTIAL' | 'ACTUAL';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  quotation_item_id?: string;
  description: string;
  hsn_sac_code?: string;
  quantity: number;
  unit_price: number;
  unit_rate?: number;
  total_price: number;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  organization_id: string;
  request_id: string;
  quotation_id?: string;
  client_id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  invoice_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  client_po_ref?: string;
  dispatched_through?: string;
  invoice_status: 'ISSUED' | 'PAID' | 'CANCELLED';
  created_at: string;
  items?: InvoiceItem[];
  clients?: Client;
  quotations?: Quotation;
}

export type DispatchType = 'COURIER' | 'COLLECTION_AGENT';
export type DispatchPackageType = 'ITEMS_AND_INVOICE' | 'INVOICE_ONLY';

export interface Dispatch {
  id: string;
  tenant_id: string;
  organization_id: string;
  request_id: string;
  gate_pass_number: string;
  dispatch_type?: DispatchType;
  package_type?: DispatchPackageType;
  courier_partner?: string;
  tracking_number?: string;
  collection_agent_name?: string;
  collection_agent_phone?: string;
  client_signature?: string;
  invoice_id?: string;
  dispatched_by?: string;
  dispatch_date: string;
  recipient_name: string;
  recipient_phone?: string;
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  created_at: string;
}

export interface Delivery {
  id: string;
  tenant_id: string;
  organization_id: string;
  dispatch_id: string;
  delivered_at: string;
  received_by: string;
  recipient_phone?: string;
  signature_storage_path?: string;
  signature_data_url?: string;
  remarks?: string;
  created_at: string;
}

export interface CalibrationDueItem {
  id: string;
  itemMasterId: string;
  itemName: string;
  itemCode?: string;
  itemCategory?: string;
  serialNumber: string;
  clientId: string;
  clientName: string;
  clientCode: string;
  clientEmail?: string;
  clientPhone?: string;
  requestId: string;
  requestNumber: string;
  certificateNumber?: string;
  lastCalibratedDate: string;
  nextDueDate: string;
  daysRemaining: number;
  urgencyStatus: 'OVERDUE' | 'DUE_7_DAYS' | 'DUE_15_DAYS' | 'DUE_30_DAYS' | 'UPCOMING';
  isOutsourced: boolean;
  vendorName?: string;
  vendorCertificateNumber?: string;
}

export interface LabIssuerProfile {
  id?: string;
  tenant_id?: string;
  organization_id?: string;
  name: string;
  division?: string;
  logo_url?: string;
  logo_text?: string;
  logo_tagline?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  state_code: string;
  pin: string;
  phones: string;
  mobile?: string;
  email: string;
  gstin: string;
  udyam?: string;
  bank_name?: string;
  account_no?: string;
  branch_ifsc?: string;
}

