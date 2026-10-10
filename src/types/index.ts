export type UserRole = 'owner' | 'admin' | 'accountant' | 'salesperson' | 'inventory_manager' | 'viewer';

export interface Business {
  id: string;
  name: string;
  owner_id?: string;
  mobile: string;
  email: string;
  address: string;
  state: string;
  state_code: string;
  pincode: string;
  gst_registered: boolean;
  gstin?: string;
  business_type: string;
  logo_url?: string;
  financial_year_start: string;
  currency: string;
  invoice_prefix: string;
  invoice_next_number: number;
  default_terms?: string;
  bank_name?: string;
  account_no?: string;
  ifsc_code?: string;
  upi_id?: string;
  signature_url?: string;
  created_at: string;
  updated_at: string;
}

export type PartyType = 'customer' | 'supplier' | 'both';
export type GstType = 'unregistered' | 'regular' | 'composition' | 'consumer' | 'overseas';
export type BalanceDirection = 'receivable' | 'payable';

export interface Party {
  id: string;
  business_id: string;
  name: string;
  type: PartyType;
  contact_person?: string;
  phone: string;
  email?: string;
  billing_address?: string;
  shipping_address?: string;
  state: string;
  state_code: string;
  pincode?: string;
  gst_type: GstType;
  gstin?: string;
  opening_balance: number;
  balance_type: BalanceDirection;
  current_balance: number; // Positive = Receivable (asset), Negative = Payable (liability)
  credit_limit?: number;
  payment_due_days?: number;
  notes?: string;
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
}

export type ItemType = 'product' | 'service';

export interface Item {
  id: string;
  business_id: string;
  name: string;
  type: ItemType;
  sku?: string;
  barcode?: string;
  category_id?: string;
  category_name?: string;
  description?: string;
  hsn_code?: string;
  unit: string;
  sale_price: number;
  purchase_price: number;
  mrp?: number;
  tax_rate: number; // 0, 5, 12, 18, 28
  is_tax_inclusive: boolean;
  current_stock: number;
  opening_stock: number;
  low_stock_alert: number;
  created_at: string;
  updated_at: string;
}

export type MovementType = 'sale' | 'purchase' | 'sale_return' | 'purchase_return' | 'adjustment' | 'opening';

export interface StockMovement {
  id: string;
  business_id: string;
  item_id: string;
  item_name?: string;
  movement_type: MovementType;
  reference_id?: string;
  reference_type?: string;
  reference_number?: string;
  quantity: number; // positive for addition, negative for deduction
  unit_price: number;
  reason?: string;
  created_at: string;
}

export type DocumentType = 
  | 'sales_invoice' 
  | 'estimate' 
  | 'sales_order' 
  | 'delivery_challan' 
  | 'credit_note' 
  | 'purchase_bill' 
  | 'purchase_order' 
  | 'debit_note';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type TransactionStatus = 'draft' | 'final' | 'cancelled';
export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card';

export interface TransactionLine {
  id: string;
  transaction_id?: string;
  item_id: string;
  item_name: string;
  hsn_code?: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_amount: number;
}

export interface Transaction {
  id: string;
  business_id: string;
  party_id: string;
  party_name?: string;
  party_phone?: string;
  party_gstin?: string;
  party_state?: string;
  party_address?: string;
  document_type: DocumentType;
  document_number: string;
  document_date: string;
  due_date?: string;
  place_of_supply: string;
  is_gst: boolean;
  subtotal: number;
  total_discount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  round_off: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: PaymentStatus;
  status: TransactionStatus;
  payment_mode?: PaymentMode;
  notes?: string;
  terms?: string;
  converted_from_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  lines: TransactionLine[];
}

export interface Payment {
  id: string;
  business_id: string;
  party_id: string;
  party_name?: string;
  payment_type: 'payment_in' | 'payment_out';
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_mode: PaymentMode;
  account_id?: string;
  account_name?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  transaction_id: string;
  transaction_number?: string;
  amount_allocated: number;
  created_at: string;
}

export interface Account {
  id: string;
  business_id: string;
  account_name: string;
  account_type: 'cash' | 'bank' | 'other';
  account_number?: string;
  bank_name?: string;
  ifsc?: string;
  opening_balance: number;
  current_balance: number;
  created_at: string;
}

export interface AccountTransaction {
  id: string;
  business_id: string;
  account_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  reference_type: string;
  reference_id?: string;
  transfer_to_account_id?: string;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  business_id: string;
  category_name: string;
  amount: number;
  expense_date: string;
  payment_mode: PaymentMode;
  account_id?: string;
  payee?: string;
  gst_treatment?: string;
  tax_amount: number;
  notes?: string;
  receipt_url?: string;
  created_at: string;
}

export interface OtherIncome {
  id: string;
  business_id: string;
  category_name: string;
  amount: number;
  income_date: string;
  payment_mode: PaymentMode;
  account_id?: string;
  party_id?: string;
  party_name?: string;
  notes?: string;
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  business_id: string;
  table_name: string;
  action: 'insert' | 'update' | 'delete';
  record_id: string;
  payload: any;
  created_at: string;
  retry_count: number;
  last_error?: string;
  status: 'pending' | 'processing' | 'failed' | 'synced';
}

export interface DashboardMetrics {
  todaySales: number;
  todayPurchases: number;
  totalReceivables: number;
  totalPayables: number;
  cashInHand: number;
  bankBalance: number;
  totalExpenses: number;
  estimatedProfit: number;
  lowStockCount: number;
  overduePaymentsCount: number;
}
