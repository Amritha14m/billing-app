import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  CreditCard,
  Edit2,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getLocalParties, saveLocalParty, getLocalTransactions } from '../../lib/db';
import { Party, PartyType, GstType, BalanceDirection, Transaction } from '../../types';
import { formatCurrency, INDIAN_STATES, validateGSTIN } from '../../lib/gst';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { shareViaWhatsApp } from '../../lib/pdf';

export const PartyListPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [parties, setParties] = useState<Party[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'customer' | 'supplier'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<PartyType>('customer');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [stateCode, setStateCode] = useState(activeBusiness?.state_code || '27');
  const [pincode, setPincode] = useState('');
  const [gstType, setGstType] = useState<GstType>('unregistered');
  const [gstin, setGstin] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [balanceDirection, setBalanceDirection] = useState<BalanceDirection>('receivable');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [dueDays, setDueDays] = useState<number>(15);
  const [notes, setNotes] = useState('');
  const [gstError, setGstError] = useState<string | null>(null);

  // Statement modal
  const [statementParty, setStatementParty] = useState<Party | null>(null);

  useEffect(() => {
    if (!activeBusiness) return;
    getLocalParties(activeBusiness.id).then(setParties);
    getLocalTransactions(activeBusiness.id).then(setTransactions);

    if (searchParams.get('add') === 'customer' || searchParams.get('add') === 'supplier') {
      openAddModal((searchParams.get('add') as PartyType) || 'customer');
    }
  }, [activeBusiness, searchParams]);

  const openAddModal = (defaultType: PartyType = 'customer') => {
    setEditingParty(null);
    setName('');
    setType(defaultType);
    setPhone('');
    setEmail('');
    setContactPerson('');
    setBillingAddress('');
    setStateCode(activeBusiness?.state_code || '27');
    setPincode('');
    setGstType('unregistered');
    setGstin('');
    setOpeningBalance(0);
    setBalanceDirection('receivable');
    setCreditLimit(0);
    setDueDays(15);
    setNotes('');
    setGstError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Party) => {
    setEditingParty(p);
    setName(p.name);
    setType(p.type);
    setPhone(p.phone);
    setEmail(p.email || '');
    setContactPerson(p.contact_person || '');
    setBillingAddress(p.billing_address || '');
    setStateCode(p.state_code || '27');
    setPincode(p.pincode || '');
    setGstType(p.gst_type);
    setGstin(p.gstin || '');
    setOpeningBalance(p.opening_balance);
    setBalanceDirection(p.balance_type);
    setCreditLimit(p.credit_limit || 0);
    setDueDays(p.payment_due_days || 15);
    setNotes(p.notes || '');
    setGstError(null);
    setIsModalOpen(true);
  };

  const handleSaveParty = async () => {
    if (!name.trim() || !activeBusiness) return;

    if (gstin.trim()) {
      const gstinVal = validateGSTIN(gstin.trim());
      if (!gstinVal.isValid) {
        setGstError(gstinVal.message || 'Invalid GSTIN');
        return;
      }
    }

    const stateObj = INDIAN_STATES.find((s) => s.code === stateCode);
    const initialCurrentBal =
      balanceDirection === 'receivable' ? openingBalance : -openingBalance;

    const partyData: Party = {
      id: editingParty ? editingParty.id : `party_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      business_id: activeBusiness.id,
      name: name.trim(),
      type,
      phone: phone.trim(),
      email: email.trim(),
      contactPerson: contactPerson.trim(),
      billing_address: billingAddress.trim(),
      state: stateObj?.name || 'Maharashtra',
      state_code: stateCode,
      pincode: pincode.trim(),
      gst_type: gstType,
      gstin: gstin.trim().toUpperCase() || undefined,
      opening_balance: openingBalance,
      balance_type: balanceDirection,
      current_balance: editingParty ? editingParty.current_balance : initialCurrentBal,
      credit_limit: creditLimit,
      payment_due_days: dueDays,
      notes: notes.trim(),
      created_at: editingParty ? editingParty.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveLocalParty(partyData);

    setParties((prev) => {
      const exists = prev.some((p) => p.id === partyData.id);
      return exists ? prev.map((p) => (p.id === partyData.id ? partyData : p)) : [...prev, partyData];
    });

    setIsModalOpen(false);
  };

  const filteredParties = parties.filter((p) => {
    const matchesType =
      selectedType === 'all'
        ? true
        : selectedType === 'customer'
        ? p.type === 'customer' || p.type === 'both'
        : p.type === 'supplier' || p.type === 'both';

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone && p.phone.includes(searchQuery)) ||
      (p.gstin && p.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesSearch;
  });

  const totalReceivable = parties
    .filter((p) => p.current_balance > 0)
    .reduce((sum, p) => sum + p.current_balance, 0);

  const totalPayable = parties
    .filter((p) => p.current_balance < 0)
    .reduce((sum, p) => sum + Math.abs(p.current_balance), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Parties & Contacts
          </h1>
          <p className="text-xs text-slate-500">
            Manage customers, suppliers, balances, and GST registrations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAddModal('supplier')}
            leftIcon={<Plus className="w-4 h-4 text-emerald-600" />}
          >
            + Supplier
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openAddModal('customer')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Customer
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Receivables (Customers)
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1 block">
            {formatCurrency(totalReceivable)}
          </span>
          <span className="text-[11px] text-slate-400">
            {parties.filter((p) => p.current_balance > 0).length} parties have balance to pay you
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle border-l-4 border-l-red-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Payables (Suppliers)
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-red-700 mt-1 block">
            {formatCurrency(totalPayable)}
          </span>
          <span className="text-[11px] text-slate-400">
            {parties.filter((p) => p.current_balance < 0).length} suppliers to pay
          </span>
        </div>
      </div>

      {/* Search & Tabs */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by party name, phone, or GSTIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  selectedType === 'all'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({parties.length})
              </button>
              <button
                onClick={() => setSelectedType('customer')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  selectedType === 'customer'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Customers ({parties.filter((p) => p.type !== 'supplier').length})
              </button>
              <button
                onClick={() => setSelectedType('supplier')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  selectedType === 'supplier'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Suppliers ({parties.filter((p) => p.type !== 'customer').length})
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No parties found. Click "+ Customer" or "+ Supplier" to add one.
                  </td>
                </tr>
              ) : (
                filteredParties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{p.name}</span>
                      {p.contact_person && (
                        <span className="text-[10px] text-slate-500 block">
                          Attn: {p.contact_person}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <Badge variant={p.type === 'customer' ? 'blue' : p.type === 'supplier' ? 'purple' : 'gray'} size="sm">
                        {p.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{p.phone || '-'}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">
                      {p.gstin || 'Unregistered'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.state}</td>
                    <td className="py-3 px-4 text-right">
                      {p.current_balance > 0 ? (
                        <span className="font-bold text-emerald-700 block">
                          {formatCurrency(p.current_balance)}
                          <span className="text-[9px] uppercase font-normal text-emerald-600 block">
                            Receivable
                          </span>
                        </span>
                      ) : p.current_balance < 0 ? (
                        <span className="font-bold text-red-600 block">
                          {formatCurrency(Math.abs(p.current_balance))}
                          <span className="text-[9px] uppercase font-normal text-red-500 block">
                            Payable
                          </span>
                        </span>
                      ) : (
                        <span className="font-bold text-slate-400">₹ 0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Payment Reminder */}
                        {p.current_balance > 0 && p.phone && (
                          <button
                            onClick={() => {
                              const msg = `Dear ${p.name}, greeting from ${activeBusiness?.name}. An outstanding balance of ${formatCurrency(p.current_balance)} is due on your account. Kindly settle at your earliest convenience. Thank you!`;
                              shareViaWhatsApp(p.phone, msg);
                            }}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                            title="Send WhatsApp Payment Reminder"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setStatementParty(p)}
                          className="p-1 rounded text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                          title="View Statement & History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title="Edit Party"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Party Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingParty ? 'Edit Party Details' : 'Add New Customer or Supplier'}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Party / Business Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Electricals"
              required
            />
            <Select
              label="Party Type *"
              value={type}
              onChange={(e) => setType(e.target.value as PartyType)}
              options={[
                { value: 'customer', label: 'Customer' },
                { value: 'supplier', label: 'Supplier' },
                { value: 'both', label: 'Both Customer & Supplier' },
              ]}
            />
            <Input
              label="Mobile / Phone *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit number"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="billing@party.com"
            />
            <Input
              label="Contact Person Name"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Ramesh Shah"
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
          </div>

          {/* GST Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Select
              label="GST Registration Type"
              value={gstType}
              onChange={(e) => setGstType(e.target.value as GstType)}
              options={[
                { value: 'unregistered', label: 'Unregistered / Consumer' },
                { value: 'regular', label: 'Regular GST' },
                { value: 'composition', label: 'Composition Scheme' },
                { value: 'consumer', label: 'Consumer' },
              ]}
            />
            <Input
              label="GSTIN"
              value={gstin}
              onChange={(e) => {
                setGstin(e.target.value.toUpperCase());
                setGstError(null);
              }}
              error={gstError || undefined}
              placeholder="e.g. 27AAAPL1234C1Z9"
            />
          </div>

          {/* Balances & Credit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Opening Balance (₹)"
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
            />
            <Select
              label="Balance Direction"
              value={balanceDirection}
              onChange={(e) => setBalanceDirection(e.target.value as BalanceDirection)}
              options={[
                { value: 'receivable', label: 'Receivable (To Receive)' },
                { value: 'payable', label: 'Payable (To Pay)' },
              ]}
            />
            <Input
              label="Credit Limit (₹)"
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
            />
          </div>

          <Input
            label="Billing & Shipping Address"
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            placeholder="Complete street address..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveParty}>
              {editingParty ? 'Update Party' : 'Create Party'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Statement Modal */}
      {statementParty && (
        <Modal
          isOpen={Boolean(statementParty)}
          onClose={() => setStatementParty(null)}
          title={`Statement: ${statementParty.name}`}
          description={`Phone: ${statementParty.phone} | GST: ${statementParty.gstin || 'None'}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs text-slate-500">Current Outstanding:</span>
                <p className={`text-lg font-extrabold ${statementParty.current_balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatCurrency(Math.abs(statementParty.current_balance))}{' '}
                  <span className="text-xs font-normal">
                    ({statementParty.current_balance >= 0 ? 'To Receive' : 'To Pay'})
                  </span>
                </p>
              </div>
              {statementParty.current_balance > 0 && statementParty.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const msg = `Dear ${statementParty.name}, greeting from ${activeBusiness?.name}. An outstanding balance of ${formatCurrency(statementParty.current_balance)} is due on your account. Kindly settle at your earliest convenience. Thank you!`;
                    shareViaWhatsApp(statementParty.phone, msg);
                  }}
                  leftIcon={<Share2 className="w-4 h-4 text-emerald-600" />}
                >
                  WhatsApp Reminder
                </Button>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 font-semibold text-slate-700">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Ref #</th>
                    <th className="py-2 px-3 text-right">Debit / Sale (₹)</th>
                    <th className="py-2 px-3 text-right">Credit / Recd (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions
                    .filter((t) => t.party_id === statementParty.id)
                    .map((t) => (
                      <tr key={t.id}>
                        <td className="py-2 px-3 text-slate-600">{t.document_date}</td>
                        <td className="py-2 px-3 font-medium capitalize">
                          {t.document_type.replace('_', ' ')}
                        </td>
                        <td className="py-2 px-3 font-mono">{t.document_number}</td>
                        <td className="py-2 px-3 text-right font-medium">
                          {formatCurrency(t.total_amount)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-medium">
                          {formatCurrency(t.paid_amount)}
                        </td>
                      </tr>
                    ))}
                  {transactions.filter((t) => t.party_id === statementParty.id).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No transactions recorded for this party yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
