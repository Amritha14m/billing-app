-- BizLedger Schema Migration: Parties Audit, Reminders & Enhanced Khata
-- Date: 2026-10-13

-- 1. PARTY REMINDERS LOG
CREATE TABLE IF NOT EXISTS public.party_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    message TEXT NOT NULL,
    channel VARCHAR(50) DEFAULT 'whatsapp',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE public.party_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR PARTY REMINDERS & AUDIT LOGS
CREATE POLICY "Users can access their party reminders" ON public.party_reminders
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Users can access their audit logs" ON public.audit_logs
    FOR ALL USING (public.is_business_member(business_id));
