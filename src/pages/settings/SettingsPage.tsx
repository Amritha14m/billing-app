import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  Database,
  Building2,
  Receipt,
  ShieldCheck,
  Check,
  AlertCircle,
  Globe,
  Sun,
  Moon,
  Lock,
  Key,
  Bell,
  Package,
  Users,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../../lib/i18n';
import { isSupabaseConfigured } from '../../lib/supabase';
import { applyThemeSystemBars } from '../../components/layout/AppShell';
import {
  getLocalTransactions,
  getLocalParties,
  getLocalItems,
  getLocalAccounts,
  getLocalExpenses,
  getDB,
} from '../../lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { INDIAN_STATES, validateGSTIN } from '../../lib/gst';

export const SettingsPage: React.FC = () => {
  const { activeBusiness, updateActiveBusiness, hasPin, setAppPin } = useAuth();
  const { triggerSync } = useSync();
  const { language, setLanguage, t } = useLanguage();

  // Business profile form
  const [name, setName] = useState(activeBusiness?.name || '');
  const [mobile, setMobile] = useState(activeBusiness?.mobile || '');
  const [email, setEmail] = useState(activeBusiness?.email || '');
  const [gstRegistered, setGstRegistered] = useState(activeBusiness?.gst_registered || false);
  const [gstin, setGstin] = useState(activeBusiness?.gstin || '');
  const [address, setAddress] = useState(activeBusiness?.address || '');
  const [stateCode, setStateCode] = useState(activeBusiness?.state_code || '27');
  const [invoicePrefix, setInvoicePrefix] = useState(activeBusiness?.invoice_prefix || 'INV/');
  const [nextInvoiceNum, setNextInvoiceNum] = useState(activeBusiness?.invoice_next_number || 101);
  const [bankName, setBankName] = useState(activeBusiness?.bank_name || '');
  const [accountNo, setAccountNo] = useState(activeBusiness?.account_no || '');
  const [ifscCode, setIfscCode] = useState(activeBusiness?.ifsc_code || '');
  const [upiId, setUpiId] = useState(activeBusiness?.upi_id || '');
  const [defaultTerms, setDefaultTerms] = useState(activeBusiness?.default_terms || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Preference Settings (persisted in localStorage)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('bizledger_theme') as any) || 'light';
  });
  const [negativeStockRule, setNegativeStockRule] = useState<'allow' | 'warn' | 'block'>(() => {
    return (localStorage.getItem('bizledger_negative_stock') as any) || 'warn';
  });
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    return parseInt(localStorage.getItem('bizledger_low_stock_thresh') || '5', 10);
  });
  const [notifyLowStock, setNotifyLowStock] = useState<boolean>(() => {
    return localStorage.getItem('bizledger_notify_low_stock') !== 'false';
  });
  const [notifyPaymentDue, setNotifyPaymentDue] = useState<boolean>(() => {
    return localStorage.getItem('bizledger_notify_payment_due') !== 'false';
  });

  // App Lock Pin Modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    if (!activeBusiness) return;
    setProfileError(null);

    if (gstRegistered && gstin.trim()) {
      const gVal = validateGSTIN(gstin.trim(), stateCode);
      if (!gVal.isValid) {
        setProfileError(gVal.message || 'Invalid GSTIN');
        return;
      }
    }

    const stateObj = INDIAN_STATES.find((s) => s.code === stateCode);
    await updateActiveBusiness({
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      gst_registered: gstRegistered,
      gstin: gstRegistered ? gstin.trim().toUpperCase() : '',
      address: address.trim(),
      state: stateObj?.name || 'Maharashtra',
      state_code: stateCode,
      invoice_prefix: invoicePrefix.trim() || 'INV/',
      invoice_next_number: nextInvoiceNum,
      bank_name: bankName.trim(),
      account_no: accountNo.trim(),
      ifsc_code: ifscCode.trim().toUpperCase(),
      upi_id: upiId.trim(),
      default_terms: defaultTerms,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('bizledger_theme', newTheme);
    applyThemeSystemBars(newTheme);
  };

  const handleNegativeStockChange = (val: 'allow' | 'warn' | 'block') => {
    setNegativeStockRule(val);
    localStorage.setItem('bizledger_negative_stock', val);
  };

  const handleThresholdChange = (val: number) => {
    setLowStockThreshold(val);
    localStorage.setItem('bizledger_low_stock_thresh', val.toString());
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (pinInput.length !== 4) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinError('PIN confirmation does not match');
      return;
    }
    setAppPin(pinInput);
    setIsPinModalOpen(false);
    setPinInput('');
    setPinConfirm('');
  };

  const handleRemovePin = () => {
    if (confirm('Are you sure you want to disable App-Lock PIN?')) {
      setAppPin(null);
    }
  };

  // Backup & Restore
  const handleExportBackup = async () => {
    if (!activeBusiness) return;
    const [txs, pts, itms, accs, exps] = await Promise.all([
      getLocalTransactions(activeBusiness.id),
      getLocalParties(activeBusiness.id),
      getLocalItems(activeBusiness.id),
      getLocalAccounts(activeBusiness.id),
      getLocalExpenses(activeBusiness.id),
    ]);

    const backupData = {
      version: '1.2',
      exported_at: new Date().toISOString(),
      business: activeBusiness,
      parties: pts,
      items: itms,
      transactions: txs,
      accounts: accs,
      expenses: exps,
    };

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `bizledger_backup_${activeBusiness.name.replace(/\s+/g, '_')}_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.business || !parsed.transactions) {
          alert('Invalid BizLedger backup file format.');
          return;
        }

        const db = await getDB();
        await db.put('businesses', parsed.business);
        for (const p of parsed.parties || []) await db.put('parties', p);
        for (const item of parsed.items || []) await db.put('items', item);
        for (const tx of parsed.transactions || []) await db.put('transactions', tx);
        for (const acc of parsed.accounts || []) await db.put('accounts', acc);
        for (const exp of parsed.expenses || []) await db.put('expenses', exp);

        alert('Backup successfully restored! Reloading application...');
        window.location.reload();
      } catch {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t('settings')}
        </h1>
        <p className="text-xs text-slate-500">
          Configure business details, GSTIN, language, theme, inventory thresholds, and security
        </p>
      </div>

      {/* 1. LANGUAGE & THEME */}
      <Card className="rounded-2xl border-slate-200/90 shadow-subtle">
        <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-600" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Language & Theme
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Language Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Application Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.name}) {l.isComplete ? '✓ Fully Translated' : '(English Fallback)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Display Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'light', label: 'Light', icon: Sun },
                  { key: 'dark', label: 'Dark', icon: Moon },
                  { key: 'system', label: 'System', icon: Smartphone },
                ].map((tOpt) => {
                  const Icon = tOpt.icon;
                  const isCur = theme === tOpt.key;
                  return (
                    <button
                      key={tOpt.key}
                      type="button"
                      onClick={() => handleThemeChange(tOpt.key as any)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isCur
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tOpt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. BUSINESS PROFILE & GST SETTINGS */}
      <Card className="rounded-2xl border-slate-200/90 shadow-subtle">
        <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Business Profile & Invoice Numbering
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {profileError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Business Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Select
              label="Registration State *"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              options={INDIAN_STATES.map((s) => ({
                value: s.code,
                label: `${s.code} - ${s.name}`,
              }))}
            />
          </div>

          {/* GST Registered Toggle & GSTIN */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="gstRegisteredToggle" className="text-xs font-bold text-slate-800 cursor-pointer block">
                  GST Registered Business
                </label>
                <p className="text-[11px] text-slate-500">
                  Enable automatic CGST/SGST/IGST tax calculation on sales and purchase bills
                </p>
              </div>
              <input
                type="checkbox"
                id="gstRegisteredToggle"
                checked={gstRegistered}
                onChange={(e) => setGstRegistered(e.target.checked)}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>

            {gstRegistered && (
              <Input
                label="GSTIN (15 characters) *"
                placeholder="27AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                maxLength={15}
              />
            )}
          </div>

          <Input
            label="Street Address"
            placeholder="Shop No. 12, Market Complex"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          {/* Invoice Sequence & Banking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
            <Input
              label="Invoice Number Prefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="e.g. INV-26/"
            />
            <Input
              label="Next Invoice Sequence #"
              type="number"
              value={nextInvoiceNum}
              onChange={(e) => setNextInvoiceNum(parseInt(e.target.value) || 1)}
            />
            <Input
              label="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank"
            />
            <Input
              label="Bank Account Number"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
            />
            <Input
              label="Bank IFSC Code"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            />
            <Input
              label="UPI ID (for QR Code on Bills)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. store@upi"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Invoice Terms & Signature Notes
            </label>
            <textarea
              rows={2}
              value={defaultTerms}
              onChange={(e) => setDefaultTerms(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            {saveSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[3]" /> Settings updated successfully!
              </span>
            ) : (
              <div />
            )}
            <Button variant="primary" onClick={handleSaveProfile} className="font-bold shadow-md">
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. INVENTORY RULES & THRESHOLDS */}
      <Card className="rounded-2xl border-slate-200/90 shadow-subtle">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Inventory & Stock Rules
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Negative Stock Rule
              </label>
              <select
                value={negativeStockRule}
                onChange={(e) => handleNegativeStockChange(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value="allow">Allow Negative Stock (Billing never blocked)</option>
                <option value="warn">Warn on Negative Stock (Shows alert message)</option>
                <option value="block">Block Billing on Negative Stock (Strict inventory)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Default Low-Stock Alert Threshold
              </label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => handleThresholdChange(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. SECURITY (APP-LOCK PIN) */}
      <Card className="rounded-2xl border-slate-200/90 shadow-subtle">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-600" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Security & App Lock PIN
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <p className="font-bold text-slate-900">
                4-Digit Security PIN: {hasPin ? 'Enabled (Active)' : 'Disabled'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Protect your billing data, ledger balances, and margins when handing your device to staff.
              </p>
            </div>
            {hasPin ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsPinModalOpen(true)}>
                  Change PIN
                </Button>
                <Button variant="danger" size="sm" onClick={handleRemovePin}>
                  Disable
                </Button>
              </div>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setIsPinModalOpen(true)}>
                Set Security PIN
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. BACKUP & DISASTER RECOVERY */}
      <Card className="rounded-2xl border-slate-200/90 shadow-subtle">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-600" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Backup & Disaster Recovery
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
          <p className="text-slate-600">
            Export complete financial data including all parties, items, sales, purchases, and accounts into a structured JSON file for safe offline keeping or device migration.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExportBackup}
              leftIcon={<Download className="w-4 h-4 text-brand-600" />}
              className="font-bold"
            >
              Download Full Backup (JSON)
            </Button>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Restore from Backup</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportBackup}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* MODAL: SET / CHANGE SECURITY PIN */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Set Security PIN"
        size="sm"
      >
        <form onSubmit={handlePinSubmit} className="space-y-4">
          {pinError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {pinError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Enter 4-Digit PIN *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full p-2.5 text-center text-lg font-mono tracking-widest rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirm 4-Digit PIN *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full p-2.5 text-center text-lg font-mono tracking-widest rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsPinModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Security PIN
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
