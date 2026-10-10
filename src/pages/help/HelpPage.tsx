import React from 'react';
import { HelpCircle, BookOpen, Keyboard, ShieldCheck, PhoneCall } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const HelpPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Help & Learning Center
        </h1>
        <p className="text-xs text-slate-500">
          GST guidelines, shortcuts, offline sync instructions, and user assistance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-brand-600" />
              <CardTitle>Desktop Keyboard Shortcuts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Quick Global Search</span>
              <kbd className="px-2 py-0.5 bg-slate-100 border rounded font-mono text-[10px]">Ctrl + K</kbd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Print Active Invoice</span>
              <kbd className="px-2 py-0.5 bg-slate-100 border rounded font-mono text-[10px]">Ctrl + P</kbd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Hardware Barcode Reader</span>
              <span className="text-emerald-700 font-medium">Automatic (Enter key delimited)</span>
            </div>
          </CardContent>
        </Card>

        {/* GST Billing Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <CardTitle>GST Calculation Principles</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-slate-600">
            <p>
              • <strong>Intra-State Supply:</strong> If supplier and customer states are identical, GST is split equally into <strong>CGST (Rate/2)</strong> and <strong>SGST (Rate/2)</strong>.
            </p>
            <p>
              • <strong>Inter-State Supply:</strong> If customer place of supply is outside your state, full tax applies as <strong>IGST (Full Rate)</strong>.
            </p>
            <p>
              • <strong>Tax-Inclusive Pricing:</strong> When retail prices include tax, BizLedger reverse-computes taxable base and taxes to avoid double-taxation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
