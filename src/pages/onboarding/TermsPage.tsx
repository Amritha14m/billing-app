import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-600" />
          <h1 className="text-xl font-bold text-slate-900">Terms of Service</h1>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p className="font-semibold text-slate-900">Effective Date: October 2026</p>

        <h2 className="font-bold text-slate-900 text-base pt-2">1. Use of Service</h2>
        <p>
          By downloading, accessing, or using BizLedger, you agree to these Terms. BizLedger is designed for retail, wholesale, and service enterprises operating under Indian GST regulations.
        </p>

        <h2 className="font-bold text-slate-900 text-base pt-2">2. Accuracy of Financial Records</h2>
        <p>
          The business owner is responsible for ensuring the accuracy of GSTIN numbers, tax percentages, HSN codes, and invoice entries generated in the application. BizLedger computes GST accurately according to official rules, but tax filings remain the responsibility of the registered entity.
        </p>

        <h2 className="font-bold text-slate-900 text-base pt-2">3. Multi-Device Synchronization & Backups</h2>
        <p>
          Users are strongly encouraged to maintain periodic JSON backups via Settings &gt; Backup & Restore or keep cloud synchronization active.
        </p>
      </div>
    </div>
  );
};
