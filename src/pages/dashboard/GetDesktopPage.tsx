import React, { useState } from 'react';
import { Monitor, Copy, Share2, Check, ExternalLink, ShieldCheck, Laptop, Keyboard } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const GetDesktopPage: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // Web App URL detection
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const webAppUrl = isLocalhost
    ? window.location.origin
    : (import.meta.env.VITE_WEB_APP_URL || window.location.origin);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(webAppUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleShareLink = async () => {
    const shareData = {
      title: 'BizLedger Desktop Billing & Accounting',
      text: `Access your BizLedger accounting, GST billing, and stock ledger from any desktop browser:`,
      url: webAppUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-4 pb-16">
      {/* Hero Card */}
      <Card className="rounded-2xl border-slate-200/90 shadow-md overflow-hidden text-center p-6 sm:p-8 bg-gradient-to-b from-white to-slate-50/50">
        {!isNative && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
            <span>You are currently using BizLedger in your Desktop / Web Browser! All transactions sync in real-time.</span>
          </div>
        )}

        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Monitor className="w-8 h-8 stroke-[2.2]" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          BizLedger on Desktop & Browser
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
          The exact same business account and ledger data works instantly in your desktop web browser. Manage high-speed barcode billing, keyboard shortcuts, and full-screen reports.
        </p>

        {/* URL Box */}
        <div className="my-6 p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-left">
          <div className="truncate">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Web Portal URL</p>
            <p className="text-xs font-mono font-bold text-brand-700 truncate select-all">{webAppUrl}</p>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={handleShareLink}
            leftIcon={<Share2 className="w-4 h-4" />}
            className="w-full sm:w-auto font-bold shadow-md px-6 py-2.5 text-xs sm:text-sm"
          >
            Share Link with PC / Staff
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(webAppUrl, '_blank')}
            leftIcon={<ExternalLink className="w-4 h-4" />}
            className="w-full sm:w-auto font-bold text-xs sm:text-sm"
          >
            Open in Browser
          </Button>
        </div>
      </Card>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-subtle flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Seamless Cloud Sync</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Invoices created on mobile appear immediately on your desktop billing counter.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-subtle flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Zero Extra Charges</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Unlimited multi-device access included with your BizLedger installation.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-subtle flex items-start gap-3 sm:col-span-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Desktop Keyboard Shortcuts</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Use high-speed billing shortcuts: <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px]">Ctrl+N</kbd> create new sales invoice, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px]">Ctrl+S</kbd> save active invoice, and <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px]">Esc</kbd> dismiss any open dialog.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
