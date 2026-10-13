import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Phone,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Edit2,
  Filter,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  getLocalParties,
  saveLocalParty,
  getLocalTransactions,
  saveLocalAuditLog,
} from '../../lib/db';
import { Party, PartyType, GstType, BalanceDirection, Transaction } from '../../types';
import { formatCurrency, INDIAN_STATES, validateGSTIN, validateIndianPhone } from '../../lib/gst';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { PartyDetailPage } from './PartyDetailPage';
import { EditBusinessNameModal } from '../../components/layout/EditBusinessNameModal';

export const PartyListPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [parties, setParties] = useState<Party[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer');

  // Search, sort, filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'recent'>('recent');
  const [filterMode, setFilterMode] = useState<'all' | 'with_balance' | 'overdue'>('all');

  // Selected party for detail view
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // Edit Business Name Modal
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);

  // Add Party Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyType, setPartyType] = useState<PartyType>('customer');
  const [isOptionalExpanded, setIsOptionalExpanded] = useState(false);

  // Optional Fields
  const [gstin, setGstin] = useState('');
  const [stateCode, setStateCode] = useState(activeBusiness?.state_code || '27');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [email, setEmail] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [balanceDirection, setBalanceDirection] = useState<BalanceDirection>('receivable');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [dueDays, setDueDays] = useState<number>(15);

  // Validation warnings & errors
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!activeBusiness) return;
    const [pts, txs] = await Promise.all([
      getLocalParties(activeBusiness.id),
      getLocalTransactions(activeBusiness.id),
    ]);
    setParties(pts);
    setTransactions(txs);
  };

  useEffect(() => {
    loadData();

    const paramAdd = searchParams.get('add');
    if (paramAdd === 'customer' || paramAdd === 'supplier') {
      openAddModal(paramAdd as PartyType);
    }
  }, [activeBusiness, searchParams]);

  const openAddModal = (defaultType: PartyType = 'customer') => {
    setPartyName('');
    setPartyPhone('');
    setPartyType(defaultType);
    setIsOptionalExpanded(false);
    setGstin('');
    setStateCode(activeBusiness?.state_code || '27');
    setBillingAddress('');
    setShippingAddress('');
    setEmail('');
    setOpeningBalance(0);
    setBalanceDirection(defaultType === 'customer' ? 'receivable' : 'payable');
    setCreditLimit(0);
    setDueDays(15);
    setFormError(null);
    setPhoneWarning(null);
    setIsAddModalOpen(true);
  };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setPartyPhone(clean);
    setFormError(null);

    // Duplicate phone check within same business
    if (clean.length === 10) {
      const existing = parties.find((p) => p.phone === clean);
      if (existing) {
        setPhoneWarning(`Note: A party "${existing.name}" is already registered with this mobile number.`);
      } else {
        setPhoneWarning(null);
      }
    } else {
      setPhoneWarning(null);
    }
  };

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!partyName.trim()) {
      setFormError('Party name is required.');
      return;
    }

    if (partyPhone.trim()) {
      const phoneVal = validateIndianPhone(partyPhone.trim());
      if (!phoneVal.isValid) {
        setFormError(phoneVal.message || 'Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    if (gstin.trim()) {
      const gstinVal = validateGSTIN(gstin.trim(), stateCode);
      if (!gstinVal.isValid) {
        setFormError(gstinVal.message || 'Invalid GSTIN.');
        return;
      }
    }

    if (!activeBusiness) return;
    setIsSubmitting(true);

    try {
      const selectedStateObj = INDIAN_STATES.find((s) => s.code === stateCode);
      const openingBalNum = Number(openingBalance) || 0;
      // Current balance: positive for receivable, negative for payable
      const initialCurrentBalance =
        balanceDirection === 'receivable' ? openingBalNum : -openingBalNum;

      const newParty: Party = {
        id: `party_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        business_id: activeBusiness.id,
        name: partyName.trim(),
        type: partyType,
        phone: partyPhone.trim(),
        email: email.trim() || undefined,
        billing_address: billingAddress.trim() || undefined,
        shipping_address: shippingAddress.trim() || undefined,
        state: selectedStateObj?.name || activeBusiness.state,
        state_code: stateCode,
        gst_type: gstin.trim() ? 'regular' : 'unregistered',
        gstin: gstin.trim().toUpperCase() || undefined,
        opening_balance: openingBalNum,
        balance_type: balanceDirection,
        current_balance: initialCurrentBalance,
        credit_limit: creditLimit > 0 ? creditLimit : undefined,
        payment_due_days: dueDays > 0 ? dueDays : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await saveLocalParty(newParty);

      // Audit log
      await saveLocalAuditLog({
        id: `audit_${Date.now()}`,
        business_id: activeBusiness.id,
        action: 'CREATE_PARTY',
        entity_type: 'party',
        entity_id: newParty.id,
        details: { name: newParty.name, type: newParty.type, balance: newParty.current_balance },
        created_at: new Date().toISOString(),
      });

      setIsAddModalOpen(false);
      await loadData();

      // Open newly created party detail screen
      setSelectedParty(newParty);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save party.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If a party is selected, render PartyDetailPage view
  if (selectedParty) {
    return (
      <PartyDetailPage
        party={selectedParty}
        onBack={() => {
          setSelectedParty(null);
          loadData();
        }}
        onPartyUpdated={(updated) => {
          setSelectedParty(updated);
          setParties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }}
      />
    );
  }

  // Real Ledger Calculations for Summary Strip
  // Total receivable from customers (positive balance)
  const youWillGet = parties
    .filter((p) => p.current_balance > 0)
    .reduce((sum, p) => sum + p.current_balance, 0);

  // Total payable to suppliers (negative balance)
  const youWillGive = parties
    .filter((p) => p.current_balance < 0)
    .reduce((sum, p) => sum + Math.abs(p.current_balance), 0);

  // Filter parties by active tab (Customer vs Supplier)
  const filteredParties = parties
    .filter((p) => {
      if (activeTab === 'customer') return p.type !== 'supplier';
      return p.type !== 'customer';
    })
    .filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.phone.includes(q);
    })
    .filter((p) => {
      if (filterMode === 'with_balance') return p.current_balance !== 0;
      if (filterMode === 'overdue') return p.current_balance > 0 && (p.payment_due_days || 0) > 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'amount') return Math.abs(b.current_balance) - Math.abs(a.current_balance);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-24">
      {/* 1. HEADER: Business Name (editable) & Add Shop Location */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            onClick={() => setIsEditNameOpen(true)}
            className="flex items-center gap-2 cursor-pointer group py-0.5"
            title="Click to edit business name"
          >
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">
              {activeBusiness?.name || 'Enter Company Name'}
            </h1>
            <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 ml-2 flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Add shop location</span>
          </button>
        </div>

        {/* Tab Switcher: CUSTOMERS vs SUPPLIERS */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-black tracking-wider transition-all ${
              activeTab === 'customer'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('customers')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('supplier')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-black tracking-wider transition-all ${
              activeTab === 'supplier'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('suppliers')}
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STRIP: "You will give" (Green) & "You will get" (Red) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* You Will Give */}
        <div className="sm:col-span-5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {t('you_will_give')} (Payable)
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
              {formatCurrency(youWillGive)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* You Will Get */}
        <div className="sm:col-span-5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
              {t('you_will_get')} (Receivable)
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-red-600 mt-1">
              {formatCurrency(youWillGet)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* View Reports Button */}
        <div className="sm:col-span-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/reports')}
            leftIcon={<FileText className="w-4 h-4 text-brand-600" />}
            className="w-full font-bold text-xs py-3.5 shadow-subtle"
          >
            {t('view_report')}
          </Button>
        </div>
      </div>

      {/* 3. SEARCH, SORT & FILTER BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab} by name or phone...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <select
            value={filterMode}
            onChange={(e: any) => setFilterMode(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700"
          >
            <option value="all">All Parties</option>
            <option value="with_balance">With Balance</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700"
          >
            <option value="recent">Recent Activity</option>
            <option value="name">Name (A-Z)</option>
            <option value="amount">Amount (High to Low)</option>
          </select>
        </div>
      </div>

      {/* 4. PARTY LIST OR EMPTY STATE */}
      {filteredParties.length === 0 ? (
        <Card className="rounded-2xl border-slate-200/90 shadow-subtle p-8 sm:p-12 text-center">
          {/* Original Friendly Illustration */}
          <div className="w-24 h-24 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 border border-brand-100 shadow-sm">
            <Users className="w-12 h-12 stroke-[1.8]" />
          </div>

          <h3 className="text-lg font-black text-slate-900">
            {activeTab === 'customer'
              ? t('khata_empty_customer')
              : t('khata_empty_supplier')}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'customer'
              ? 'Record credit sales, track pending dues, send payment reminders via WhatsApp, and view party statements.'
              : 'Keep track of purchases, inward bills, and debit notes for all your suppliers in one place.'}
          </p>
        </Card>
      ) : (
        <Card className="rounded-2xl border-slate-200/90 shadow-subtle overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredParties.map((party) => {
              const isReceivable = party.current_balance > 0;
              const isPayable = party.current_balance < 0;
              return (
                <div
                  key={party.id}
                  onClick={() => setSelectedParty(party)}
                  className="p-4 sm:px-6 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        activeTab === 'customer'
                          ? 'bg-blue-50 text-brand-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {party.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{party.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {party.phone ? `+91 ${party.phone}` : 'No phone'} • Last active:{' '}
                        {party.updated_at ? party.updated_at.split('T')[0] : party.created_at.split('T')[0]}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm sm:text-base font-black ${
                        isReceivable
                          ? 'text-red-600'
                          : isPayable
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {formatCurrency(Math.abs(party.current_balance))}
                    </p>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isReceivable
                          ? 'text-red-600'
                          : isPayable
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {isReceivable
                        ? 'You will get'
                        : isPayable
                        ? 'You will give'
                        : 'Settled'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 5. FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-16 sm:bottom-8 right-6 z-30">
        <button
          type="button"
          onClick={() => openAddModal(activeTab)}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-extrabold text-sm shadow-xl active:scale-95 transition-all ${
            activeTab === 'customer'
              ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
          }`}
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>{activeTab === 'customer' ? t('add_customer') : t('add_supplier')}</span>
        </button>
      </div>

      {/* 6. ADD PARTY MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={partyType === 'customer' ? 'Add New Customer' : 'Add New Supplier'}
        size="md"
      >
        <form onSubmit={handleSaveParty} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Party Name (auto-focused) */}
          <Input
            label="Party Name *"
            placeholder="e.g. Ramesh Traders"
            value={partyName}
            onChange={(e) => {
              setPartyName(e.target.value);
              setFormError(null);
            }}
            autoFocus
            required
          />

          {/* Mobile Number with +91 country code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Number (WhatsApp)
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 select-none">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={partyPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {phoneWarning && (
              <p className="text-[11px] text-amber-700 mt-1 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                {phoneWarning}
              </p>
            )}
          </div>

          {/* Who are they? Radio Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Who are they?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  partyType === 'customer'
                    ? 'border-brand-600 bg-brand-50/70 text-brand-700 font-bold'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="partyType"
                  value="customer"
                  checked={partyType === 'customer'}
                  onChange={() => {
                    setPartyType('customer');
                    setBalanceDirection('receivable');
                  }}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs">Customer</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  partyType === 'supplier'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-700 font-bold'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="partyType"
                  value="supplier"
                  checked={partyType === 'supplier'}
                  onChange={() => {
                    setPartyType('supplier');
                    setBalanceDirection('payable');
                  }}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs">Supplier</span>
              </label>
            </div>
          </div>

          {/* Expandable Section: + ADD GSTIN & ADDRESS (OPTIONAL) */}
          <div className="border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => setIsOptionalExpanded(!isOptionalExpanded)}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center justify-between w-full py-1.5"
            >
              <span>+ ADD GSTIN & ADDRESS (OPTIONAL)</span>
              {isOptionalExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {isOptionalExpanded && (
              <div className="space-y-3 pt-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 mt-1">
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
                  label="GSTIN"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  maxLength={15}
                />

                <Input
                  label="Billing Address"
                  placeholder="Street, locality, city"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                />

                <Input
                  label="Shipping Address"
                  placeholder="Leave empty if same as billing"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="accounts@client.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {/* Opening Balance with Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Opening Balance (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={openingBalance || ''}
                      onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                    />
                    <div className="flex rounded-xl border border-slate-200 p-0.5 bg-white text-xs font-bold shrink-0">
                      <button
                        type="button"
                        onClick={() => setBalanceDirection('receivable')}
                        className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                          balanceDirection === 'receivable'
                            ? 'bg-red-50 text-red-700'
                            : 'text-slate-500'
                        }`}
                      >
                        You will get
                      </button>
                      <button
                        type="button"
                        onClick={() => setBalanceDirection('payable')}
                        className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                          balanceDirection === 'payable'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-500'
                        }`}
                      >
                        You will give
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Credit Limit (₹)"
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={creditLimit || ''}
                    onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="Payment Terms (Days)"
                    type="number"
                    min="0"
                    placeholder="15"
                    value={dueDays}
                    onChange={(e) => setDueDays(parseInt(e.target.value) || 15)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Submit Button with dynamic label & color */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !partyName.trim()}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-extrabold text-sm shadow-md active:scale-95 transition-all ${
                partyType === 'customer'
                  ? 'bg-brand-600 hover:bg-brand-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting
                ? 'Saving...'
                : partyType === 'customer'
                ? 'ADD CUSTOMER'
                : 'ADD SUPPLIER'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Business Name Modal */}
      <EditBusinessNameModal
        isOpen={isEditNameOpen}
        onClose={() => setIsEditNameOpen(false)}
      />
    </div>
  );
};
