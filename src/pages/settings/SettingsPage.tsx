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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { isSupabaseConfigured } from '../../lib/supabase';
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
import { INDIAN_STATES } from '../../lib/gst';

export const SettingsPage: React.FC = () => {
  const { activeBusiness, updateActiveBusiness } = useAuth();
  const { status, triggerSync } = useSync();

  // Business profile form
  const [name, setName] = useState(activeBusiness?.name || '');
  const [mobile, setMobile] = useState(activeBusiness?.mobile || '');
  const [email, setEmail] = useState(activeBusiness?.email || '');
  const [gstin, setGstin] = useState(activeBusiness?.gstin || '');
  const [address, setAddress] = useState(activeBusiness?.address || '');
  const [stateCode, setStateCode] = useState(activeBusiness?.state_code || '27');
  const [invoicePrefix, setInvoicePrefix] = useState(activeBusiness?.invoice_prefix || 'INV/');
  const [bankName, setBankName] = useState(activeBusiness?.bank_name || '');
  const [accountNo, setAccountNo] = useState(activeBusiness?.account_no || '');
  const [ifscCode, setIfscCode] = useState(activeBusiness?.ifsc_code || '');
  const [upiId, setUpiId] = useState(activeBusiness?.upi_id || '');
  const [defaultTerms, setDefaultTerms] = useState(activeBusiness?.default_terms || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = async () => {
    if (!activeBusiness) return;
    const stateObj = INDIAN_STATES.find((s) => s.code === stateCode);
    await updateActiveBusiness({
      name,
      mobile,
      email,
      gstin: gstin.toUpperCase(),
      address,
      state: stateObj?.name || 'Maharashtra',
      state_code: stateCode,
      invoice_prefix: invoicePrefix,
      bank_name: bankName,
      account_no: accountNo,
      ifsc_code: ifscCode.toUpperCase(),
      upi_id: upiId,
      default_terms: defaultTerms,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
      version: '1.0',
      exported_at: new Date().toISOString(),
      business: activeBusiness,
      parties: pts,
      items: itms,
      transactions: txs,
      accounts: accs,
      expenses: exps,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bizledger_backup_${activeBusiness.name.replace(/\s+/g, '_')}_${Date.now()}.json`);
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
      } catch (err) {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Settings & Cloud Backup
        </h1>
        <p className="text-xs text-slate-500">
          Configure business details, invoice sequences, print terms, and cloud sync
        </p>
      </div>

      {/* Cloud & Supabase Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-600" />
            <CardTitle>Cloud Sync & Supabase Backend</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
            <div>
              <span className="font-bold text-slate-800 block text-sm">
                Cloud Sync Status: {isSupabaseConfigured() ? 'Connected' : 'Offline / Local Mode'}
              </span>
              <span className="text-slate-500">
                {isSupabaseConfigured()
                  ? 'All changes are safely synchronized to PostgreSQL on Supabase.'
                  : 'Running locally with IndexedDB offline storage. Configure VITE_SUPABASE_URL to sync across devices.'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => triggerSync()}>
              Sync Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Business Profile & Invoice Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Business Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="GSTIN"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g. 27AAAAA0000A1Z5"
            />
            <Input
              label="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Street Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Select
              label="State *"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              options={INDIAN_STATES.map((s) => ({
                value: s.code,
                label: `${s.code} - ${s.name}`,
              }))}
            />
            <Input
              label="Invoice Number Prefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="e.g. INV-26/"
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
              onChange={(e) => setIfscCode(e.target.value)}
            />
            <Input
              label="UPI ID"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. business@upi"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Invoice Terms & Conditions
            </label>
            <textarea
              rows={3}
              value={defaultTerms}
              onChange={(e) => setDefaultTerms(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            {saveSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Settings updated successfully!
              </span>
            ) : (
              <div></div>
            )}
            <Button variant="primary" onClick={handleSaveProfile}>
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore Card */}
      <Card>
        <CardHeader>
          <CardTitle>Data Backup & Disaster Recovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="text-slate-600">
            Export complete financial data including all parties, items, sales, purchases, and accounts into a structured JSON file for safe offline keeping or migration.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExportBackup}
              leftIcon={<Download className="w-4 h-4 text-brand-600" />}
            >
              Download Full Backup (JSON)
            </Button>

            <label className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm">
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
    </div>
  );
};
