-- BizLedger Production PostgreSQL Database Schema Migration
-- Compatible with Supabase PostgreSQL with Row Level Security (RLS)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. BUSINESSES
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    pincode VARCHAR(10),
    gst_registered BOOLEAN DEFAULT FALSE,
    gstin VARCHAR(15),
    business_type VARCHAR(100) DEFAULT 'Retail',
    logo_url TEXT,
    financial_year_start DATE DEFAULT '2026-04-01',
    currency VARCHAR(10) DEFAULT 'INR',
    invoice_prefix VARCHAR(50) DEFAULT 'INV/',
    invoice_next_number INTEGER DEFAULT 1,
    default_terms TEXT,
    bank_name VARCHAR(150),
    account_no VARCHAR(50),
    ifsc_code VARCHAR(20),
    upi_id VARCHAR(100),
    signature_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUSINESS MEMBERS & ROLES
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'accountant', 'salesperson', 'inventory_manager', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- 4. PARTIES (CUSTOMERS & SUPPLIERS)
CREATE TABLE IF NOT EXISTS public.parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'supplier', 'both')),
    contact_person VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(255),
    billing_address TEXT,
    shipping_address TEXT,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    pincode VARCHAR(10),
    gst_type VARCHAR(50) DEFAULT 'unregistered',
    gstin VARCHAR(15),
    opening_balance NUMERIC(15, 2) DEFAULT 0.00,
    balance_type VARCHAR(20) DEFAULT 'receivable' CHECK (balance_type IN ('receivable', 'payable')),
    current_balance NUMERIC(15, 2) DEFAULT 0.00,
    credit_limit NUMERIC(15, 2) DEFAULT 0.00,
    payment_due_days INTEGER DEFAULT 15,
    notes TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parties_business_id ON public.parties(business_id);
CREATE INDEX IF NOT EXISTS idx_parties_type ON public.parties(type);

-- 5. ITEMS & INVENTORY
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('product', 'service')),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    category_name VARCHAR(100) DEFAULT 'General',
    description TEXT,
    hsn_code VARCHAR(20),
    unit VARCHAR(20) DEFAULT 'PCS',
    sale_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    mrp NUMERIC(15, 2),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    is_tax_inclusive BOOLEAN DEFAULT TRUE,
    current_stock NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    opening_stock NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    low_stock_alert NUMERIC(15, 2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_items_business_id ON public.items(business_id);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON public.items(barcode);

-- 6. STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    item_name VARCHAR(255),
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'sale_return', 'purchase_return', 'adjustment', 'opening')),
    reference_id VARCHAR(100),
    reference_type VARCHAR(50),
    reference_number VARCHAR(100),
    quantity NUMERIC(15, 2) NOT NULL, -- Positive for inward addition, negative for outward deduction
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_item ON public.stock_movements(business_id, item_id);

-- 7. TRANSACTIONS (SALES INVOICES, PURCHASES, ESTIMATES, ETC.)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    party_id VARCHAR(100) NOT NULL,
    party_name VARCHAR(255),
    party_phone VARCHAR(20),
    party_gstin VARCHAR(15),
    party_state VARCHAR(100),
    party_address TEXT,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('sales_invoice', 'estimate', 'sales_order', 'delivery_challan', 'credit_note', 'purchase_bill', 'purchase_order', 'debit_note')),
    document_number VARCHAR(100) NOT NULL,
    document_date DATE NOT NULL,
    due_date DATE,
    place_of_supply VARCHAR(2) NOT NULL,
    is_gst BOOLEAN DEFAULT TRUE,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_discount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    round_off NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    balance_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    status VARCHAR(20) DEFAULT 'final' CHECK (status IN ('draft', 'final', 'cancelled')),
    payment_mode VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    terms TEXT,
    converted_from_id VARCHAR(100),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, document_type, document_number)
);
CREATE INDEX IF NOT EXISTS idx_transactions_business_type ON public.transactions(business_id, document_type);
CREATE INDEX IF NOT EXISTS idx_transactions_party ON public.transactions(party_id);

-- 8. TRANSACTION LINE ITEMS
CREATE TABLE IF NOT EXISTS public.transaction_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(20),
    unit VARCHAR(20) DEFAULT 'PCS',
    quantity NUMERIC(15, 2) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL,
    taxable_amount NUMERIC(15, 2) NOT NULL,
    cgst_rate NUMERIC(5, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(15, 2) DEFAULT 0.00,
    sgst_rate NUMERIC(5, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(15, 2) DEFAULT 0.00,
    igst_rate NUMERIC(5, 2) DEFAULT 0.00,
    igst_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transaction_lines_tx ON public.transaction_lines(transaction_id);

-- 9. CASH & BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    account_name VARCHAR(150) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('cash', 'bank', 'other')),
    account_number VARCHAR(50),
    bank_name VARCHAR(150),
    ifsc VARCHAR(20),
    opening_balance NUMERIC(15, 2) DEFAULT 0.00,
    current_balance NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'cash',
    account_id VARCHAR(100),
    payee VARCHAR(255),
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an active member of the business
CREATE OR REPLACE FUNCTION public.is_business_member(business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.business_members
        WHERE business_members.business_id = $1
        AND business_members.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.businesses
        WHERE businesses.id = $1
        AND businesses.owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Business Member Isolation Policies
CREATE POLICY "Users can access their business members" ON public.business_members
    FOR ALL USING (user_id = auth.uid() OR public.is_business_member(business_id));

CREATE POLICY "Users can access their businesses" ON public.businesses
    FOR ALL USING (owner_id = auth.uid() OR public.is_business_member(id));

CREATE POLICY "Users can access their parties" ON public.parties
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Users can access their items" ON public.items
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Users can access their stock movements" ON public.stock_movements
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Users can access their transactions" ON public.transactions
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Users can access their accounts" ON public.accounts
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Users can access their expenses" ON public.expenses
    FOR ALL USING (public.is_business_member(business_id));
