import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 max-w-2xl mx-auto"
      style={{
        paddingTop: 'calc(1.5rem + var(--safe-area-top))',
        paddingBottom: 'calc(1.5rem + var(--safe-area-bottom))',
        paddingLeft: 'calc(1rem + var(--safe-area-left))',
        paddingRight: 'calc(1rem + var(--safe-area-right))',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-600" />
          <h1 className="text-xl font-bold text-slate-900">Privacy Policy</h1>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p className="font-semibold text-slate-900">Effective Date: October 2026</p>

        <h2 className="font-bold text-slate-900 text-base pt-2">1. Scope and Philosophy</h2>
        <p>
          BizLedger is committed to safeguarding business owners' financial information and personal privacy. We do not sell your transactional data or share customer details with third parties.
        </p>

        <h2 className="font-bold text-slate-900 text-base pt-2">2. Device Permissions Policy</h2>
        <p>
          BizLedger requests only permissions strictly necessary to execute its primary billing and inventory functions:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Notifications:</strong> Used exclusively for payment reminders and stock alerts.</li>
          <li><strong>Camera:</strong> Used on-demand solely for optical barcode scanning and product photos.</li>
          <li><strong>Storage/Files:</strong> Scoped access to store company logos, export PDF invoices, and save offline backups.</li>
        </ul>
        <p className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900 font-medium">
          <strong>No Invasive Access:</strong> BizLedger does NOT request access to SMS, phone call logs, or device state. Payment reminders are delivered transparently via the user's native share sheet or WhatsApp intent.
        </p>

        <h2 className="font-bold text-slate-900 text-base pt-2">3. Data Storage & Security</h2>
        <p>
          Your billing data is stored locally on your device in encrypted IndexedDB storage and optionally synchronized to your private Supabase PostgreSQL database protected by Row-Level Security (RLS).
        </p>

        <h2 className="font-bold text-slate-900 text-base pt-2">4. Contact Us</h2>
        <p>
          For privacy inquiries or data deletion requests, contact privacy@bizledger.app.
        </p>
      </div>
    </div>
  );
};
