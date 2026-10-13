import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  ShoppingCart,
  Users,
  Package,
  TrendingDown,
  CreditCard,
  Printer,
  Share2,
  CheckCircle,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  getLocalTransactions,
  getLocalParties,
  getLocalItems,
  getLocalAccounts,
  saveLocalTransaction,
  saveLocalParty,
  saveLocalAccount,
  saveLocalPayment,
  saveLocalAuditLog,
} from '../../lib/db';
import { Transaction, Party, Account, TransactionLine, DocumentType, Payment } from '../../types';
import { formatCurrency, calculateLineItem, round2 } from '../../lib/gst';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { InvoicePrintView } from '../../components/invoice/InvoicePrintView';

export const HomePage: React.FC = () => {
  const { activeBusiness, updateActiveBusiness } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [parties, setParties] = useState<Party[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Bill Form State
  const [customerName, setCustomerName] = useState('');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quickBillError, setQuickBillError] = useState<string | null>(null);
  const [generatedInvoice, setGeneratedInvoice] = useState<Transaction | null>(null);

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<Party[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Receive Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPartyId, setPaymentPartyId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank_transfer'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Recent transactions filter
  const [txFilter, setTxFilter] = useState<'all' | 'sales' | 'purchases' | 'expenses'>('all');

  const loadAllData = async () => {
    if (!activeBusiness) return;
    setIsLoading(true);
    try {
      const [pts, txs, accs] = await Promise.all([
        getLocalParties(activeBusiness.id),
        getLocalTransactions(activeBusiness.id),
        getLocalAccounts(activeBusiness.id),
      ]);
      setParties(pts);
      setTransactions(txs);
      setAccounts(accs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeBusiness]);

  // Autocomplete filtering for Quick Bill customer input
  const handleCustomerNameChange = (val: string) => {
    setCustomerName(val);
    setSelectedParty(null);
    setQuickBillError(null);
    if (val.trim().length > 0) {
      const query = val.toLowerCase();
      const filtered = parties.filter(
        (p) =>
          p.type !== 'supplier' &&
          (p.name.toLowerCase().includes(query) || p.phone.includes(query))
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectParty = (p: Party) => {
    setSelectedParty(p);
    setCustomerName(p.name);
    setShowSuggestions(false);
  };

  // Quick Bill Generator (Idempotent)
  const handleGenerateQuickBill = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGenerating) return; // Prevent duplicate generation

    setQuickBillError(null);
    const amount = parseFloat(invoiceAmount);
    if (!amount || amount <= 0) {
      setQuickBillError('Please enter a valid invoice amount.');
      return;
    }

    if (!activeBusiness) return;

    setIsGenerating(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const nextNum = (activeBusiness.invoice_next_number || 101);
      const prefix = activeBusiness.invoice_prefix || 'INV/';
      const docNumber = `${prefix}${nextNum}`;

      // GST Calculation
      const isGst = Boolean(activeBusiness.gst_registered);
      const taxRate = isGst ? 18 : 0;
      const isInterState = selectedParty?.state_code
        ? selectedParty.state_code !== activeBusiness.state_code
        : false;

      // Single line item "Sale" with tax-inclusive calculation
      const lineCalc = calculateLineItem({
        quantity: 1,
        unitPrice: amount,
        taxRate,
        isTaxInclusive: isGst,
        isGstInvoice: isGst,
        isInterState,
      });

      const lineItem: TransactionLine = {
        id: `line_qb_${Date.now()}`,
        item_id: 'item_general_sale',
        item_name: 'Sale',
        unit: 'PCS',
        quantity: 1,
        unit_price: amount,
        discount_percent: 0,
        discount_amount: 0,
        tax_rate: taxRate,
        taxable_amount: lineCalc.taxableAmount,
        cgst_rate: lineCalc.cgstRate,
        cgst_amount: lineCalc.cgstAmount,
        sgst_rate: lineCalc.sgstRate,
        sgst_amount: lineCalc.sgstAmount,
        igst_rate: lineCalc.igstRate,
        igst_amount: lineCalc.igstAmount,
        total_amount: amount,
      };

      const newTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        business_id: activeBusiness.id,
        party_id: selectedParty?.id || 'cash_customer',
        party_name: customerName.trim() || 'Cash Customer',
        party_phone: selectedParty?.phone || '',
        party_gstin: selectedParty?.gstin || '',
        party_state: selectedParty?.state || activeBusiness.state,
        party_address: selectedParty?.billing_address || '',
        document_type: 'sales_invoice',
        document_number: docNumber,
        document_date: todayStr,
        due_date: todayStr,
        place_of_supply: selectedParty?.state_code || activeBusiness.state_code,
        is_gst: isGst,
        subtotal: lineCalc.taxableAmount,
        total_discount: 0,
        taxable_amount: lineCalc.taxableAmount,
        cgst_amount: lineCalc.cgstAmount,
        sgst_amount: lineCalc.sgstAmount,
        igst_amount: lineCalc.igstAmount,
        round_off: 0,
        total_amount: amount,
        paid_amount: amount, // Default paid for quick counter bill
        balance_amount: 0,
        payment_status: 'paid',
        status: 'final',
        payment_mode: 'cash',
        notes: 'Generated via Quick Bill',
        lines: [lineItem],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. Save Transaction to local DB & sync queue
      await saveLocalTransaction(newTx);

      // 2. Update cash account balance
      const cashAcc = accounts.find((a) => a.account_type === 'cash') || accounts[0];
      if (cashAcc) {
        const updatedAcc = {
          ...cashAcc,
          current_balance: cashAcc.current_balance + amount,
        };
        await saveLocalAccount(updatedAcc);
      }

      // 3. Update business next invoice number
      await updateActiveBusiness({ invoice_next_number: nextNum + 1 });

      // 4. Record audit log
      await saveLocalAuditLog({
        id: `audit_${Date.now()}`,
        business_id: activeBusiness.id,
        action: 'CREATE_QUICK_BILL',
        entity_type: 'transaction',
        entity_id: newTx.id,
        details: { docNumber, amount, customer: newTx.party_name },
        created_at: new Date().toISOString(),
      });

      // Reset form and show PDF preview
      setGeneratedInvoice(newTx);
      setInvoiceAmount('');
      setCustomerName('');
      setSelectedParty(null);
      await loadAllData();
    } catch (err: any) {
      setQuickBillError(err?.message || 'Failed to generate Quick Bill.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Receive Payment Handler
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!paymentPartyId || !amount || amount <= 0) {
      alert('Please select party and valid amount');
      return;
    }
    if (!activeBusiness) return;

    setIsSavingPayment(true);
    try {
      const party = parties.find((p) => p.id === paymentPartyId);
      const targetAcc = accounts.find((a) => a.account_type === (paymentMode === 'cash' ? 'cash' : 'bank')) || accounts[0];

      const newPayment: Payment = {
        id: `pay_${Date.now()}`,
        business_id: activeBusiness.id,
        party_id: paymentPartyId,
        party_name: party?.name,
        payment_type: 'payment_in',
        payment_number: `RCP-${Date.now().toString().slice(-6)}`,
        payment_date: new Date().toISOString().split('T')[0],
        amount,
        payment_mode: paymentMode,
        account_id: targetAcc?.id,
        account_name: targetAcc?.account_name,
        notes: paymentNotes.trim() || 'Payment received',
        created_at: new Date().toISOString(),
      };

      await saveLocalPayment(newPayment);

      // Deduct from party receivable balance
      if (party) {
        await saveLocalParty({
          ...party,
          current_balance: party.current_balance - amount,
          updated_at: new Date().toISOString(),
        });
      }

      // Increase account balance
      if (targetAcc) {
        await saveLocalAccount({
          ...targetAcc,
          current_balance: targetAcc.current_balance + amount,
        });
      }

      // Record audit
      await saveLocalAuditLog({
        id: `audit_${Date.now()}`,
        business_id: activeBusiness.id,
        action: 'RECEIVE_PAYMENT',
        entity_type: 'payment',
        entity_id: newPayment.id,
        details: { amount, party: party?.name },
        created_at: new Date().toISOString(),
      });

      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentPartyId('');
      setPaymentNotes('');
      await loadAllData();
    } finally {
      setIsSavingPayment(false);
    }
  };

  // Compute Home Metrics from real DB
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = transactions
    .filter((t) => t.document_type === 'sales_invoice' && t.document_date === todayStr)
    .reduce((sum, t) => sum + t.total_amount, 0);

  // Total receivable ("You will get" - from customers with balance > 0)
  const youWillGet = parties
    .filter((p) => p.current_balance > 0)
    .reduce((sum, p) => sum + p.current_balance, 0);

  // Total payable ("You will give" - to suppliers with balance < 0)
  const youWillGive = parties
    .filter((p) => p.current_balance < 0)
    .reduce((sum, p) => sum + Math.abs(p.current_balance), 0);

  // Filtered transactions for recent activity
  const filteredTxs = transactions.filter((t) => {
    if (txFilter === 'sales') return t.document_type === 'sales_invoice';
    if (txFilter === 'purchases') return t.document_type === 'purchase_bill';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. QUICK BILL CARD */}
      <Card className="border-brand-200/90 shadow-md bg-gradient-to-br from-white to-brand-50/30 overflow-visible">
        <CardHeader className="pb-3 border-b border-slate-100/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-extrabold text-slate-900">
                  {t('quick_bill')}
                </CardTitle>
                <p className="text-[11px] text-slate-500">
                  Instant invoice generation with automatic GST & ledger updates
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const qAmt = invoiceAmount ? `&quickAmount=${encodeURIComponent(invoiceAmount)}` : '';
                const pId = selectedParty ? `&partyId=${encodeURIComponent(selectedParty.id)}` : '';
                navigate(`/sales/new?quick=true${qAmt}${pId}`);
              }}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 underline"
            >
              {t('customise_add_items')} →
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {quickBillError && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              {quickBillError}
            </div>
          )}

          <form onSubmit={handleGenerateQuickBill} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Customer Autocomplete Input */}
              <div className="sm:col-span-6 relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('customer_name')}
                </label>
                <input
                  type="text"
                  placeholder="Cash Customer (or type to search party)"
                  value={customerName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  onFocus={() => {
                    if (customerName.trim().length > 0) setShowSuggestions(true);
                  }}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                    {suggestions.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectParty(p)}
                        className="p-2.5 hover:bg-brand-50 cursor-pointer border-b border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.phone}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600">
                          Bal: {formatCurrency(p.current_balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoice Amount Input */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('invoice_amount')} (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={invoiceAmount}
                  onChange={(e) => {
                    setInvoiceAmount(e.target.value);
                    setQuickBillError(null);
                  }}
                  className="w-full px-3 py-2.5 text-sm font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 tracking-wider"
                  required
                />
              </div>

              {/* Generate Bill Button (Idempotent) */}
              <div className="sm:col-span-3">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isGenerating || !invoiceAmount || parseFloat(invoiceAmount) <= 0}
                  className="w-full py-2.5 font-bold shadow-md text-sm"
                  leftIcon={<Zap className="w-4 h-4" />}
                >
                  {isGenerating ? 'Generating...' : t('generate_bill')}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. REAL FINANCIAL METRICS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Today's Sales */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('today_sales')}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(todaySales)}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Amount to Collect ("You will get" - Red receivable) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
              {t('you_will_get')}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-red-600 mt-1">
              {formatCurrency(youWillGet)}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* Amount to Pay ("You will give" - Green payable) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              {t('you_will_give')}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
              {formatCurrency(youWillGive)}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTION BUTTONS */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-0.5">
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
          {/* Add Sale */}
          <button
            type="button"
            onClick={() => navigate('/sales/new')}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-subtle flex flex-col items-center justify-center text-center transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t('add_sale')}</span>
          </button>

          {/* Add Purchase */}
          <button
            type="button"
            onClick={() => navigate('/purchases/new')}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-subtle flex flex-col items-center justify-center text-center transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t('add_purchase')}</span>
          </button>

          {/* Receive Payment */}
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-subtle flex flex-col items-center justify-center text-center transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t('receive_payment')}</span>
          </button>

          {/* Add Expense */}
          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-subtle flex flex-col items-center justify-center text-center transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t('add_expense')}</span>
          </button>

          {/* Add Party */}
          <button
            type="button"
            onClick={() => navigate('/parties?add=customer')}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-subtle flex flex-col items-center justify-center text-center transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t('add_party')}</span>
          </button>

          {/* Add Item */}
          <button
            type="button"
            onClick={() => navigate('/items')}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-subtle flex flex-col items-center justify-center text-center transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t('add_item')}</span>
          </button>
        </div>
      </div>

      {/* 4. RECENT TRANSACTIONS LIST */}
      <Card className="rounded-2xl border-slate-200/90 shadow-subtle">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Recent Transactions
            </CardTitle>
            <p className="text-xs text-slate-500">Live ledger of sales, purchases, and receipts</p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(['all', 'sales', 'purchases'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTxFilter(mode)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  txFilter === mode
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredTxs.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No transactions yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Create a Quick Bill above or tap 'Add Sale' to record your first transaction.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTxs.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => navigate(`/sales/view/${tx.id}`)}
                  className="p-3.5 sm:px-6 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        tx.document_type === 'sales_invoice'
                          ? 'bg-blue-50 text-brand-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {tx.document_type === 'sales_invoice' ? 'SI' : 'PB'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {tx.party_name || 'Cash Customer'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        #{tx.document_number} • {tx.document_date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-black ${
                        tx.document_type === 'sales_invoice'
                          ? 'text-slate-900'
                          : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(tx.total_amount)}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        tx.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {tx.payment_status?.toUpperCase() || 'PAID'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL: GENERATED QUICK BILL PDF PREVIEW */}
      {generatedInvoice && activeBusiness && (
        <Modal
          isOpen={Boolean(generatedInvoice)}
          onClose={() => setGeneratedInvoice(null)}
          title={`Bill #${generatedInvoice.document_number} Generated`}
          size="lg"
        >
          <InvoicePrintView
            transaction={generatedInvoice}
            business={activeBusiness}
            party={parties.find((p) => p.id === generatedInvoice.party_id)}
            onBack={() => setGeneratedInvoice(null)}
          />
        </Modal>
      )}

      {/* MODAL: RECEIVE PAYMENT */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Receive Payment (Payment-In)"
        size="md"
      >
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Customer *
            </label>
            <select
              value={paymentPartyId}
              onChange={(e) => setPaymentPartyId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              <option value="">-- Choose Customer --</option>
              {parties
                .filter((p) => p.type !== 'supplier')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.phone ? `(${p.phone})` : ''} — Bal: {formatCurrency(p.current_balance)}
                  </option>
                ))}
            </select>
          </div>

          <Input
            label="Amount (₹) *"
            type="number"
            step="0.01"
            min="1"
            placeholder="0.00"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'upi', 'bank_transfer'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMode(m)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                    paymentMode === m
                      ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Notes / Reference"
            placeholder="e.g. Cleared invoice balance"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSavingPayment}
            >
              {isSavingPayment ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
