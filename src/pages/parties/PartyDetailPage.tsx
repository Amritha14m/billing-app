import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  FileText,
  Download,
  Bell,
  Share2,
  Calendar,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getLocalTransactions,
  getLocalPayments,
  getLocalAccounts,
  saveLocalPayment,
  saveLocalParty,
  saveLocalAccount,
  saveLocalPartyReminder,
  saveLocalAuditLog,
} from '../../lib/db';
import { Party, Transaction, Payment, Account, PaymentMode } from '../../types';
import { formatCurrency, round2 } from '../../lib/gst';
import { shareViaWhatsApp, triggerBrowserPrint } from '../../lib/pdf';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

interface PartyDetailPageProps {
  party: Party;
  onBack: () => void;
  onPartyUpdated: (updatedParty: Party) => void;
}

interface KhataEntry {
  id: string;
  date: string;
  type: string;
  referenceNumber: string;
  description: string;
  gave: number; // You gave (debit)
  got: number;  // You got (credit)
  runningBalance: number;
}

export const PartyDetailPage: React.FC<PartyDetailPageProps> = ({
  party,
  onBack,
  onPartyUpdated,
}) => {
  const { activeBusiness } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [khataEntries, setKhataEntries] = useState<KhataEntry[]>([]);
  const [currentBalance, setCurrentBalance] = useState(party.current_balance);

  // Modal: "You gave" or "You got"
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'gave' | 'got'>('gave');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [notes, setNotes] = useState('');
  const [isSavingEntry, setIsSavingEntry] = useState(false);

  // Reminder feedback state
  const [reminderSentMessage, setReminderSentMessage] = useState<string | null>(null);

  const loadPartyData = async () => {
    if (!activeBusiness) return;
    const [txs, pays, accs] = await Promise.all([
      getLocalTransactions(activeBusiness.id),
      getLocalPayments(activeBusiness.id),
      getLocalAccounts(activeBusiness.id),
    ]);

    const partyTxs = txs.filter((t) => t.party_id === party.id);
    const partyPays = pays.filter((p) => p.party_id === party.id);

    setTransactions(partyTxs);
    setPayments(partyPays);
    setAccounts(accs);

    // Build unified sorted ledger
    interface RawItem {
      id: string;
      date: string;
      type: string;
      ref: string;
      desc: string;
      gave: number;
      got: number;
    }

    const raw: RawItem[] = [];

    // 1. Opening balance if non-zero
    if (party.opening_balance && party.opening_balance !== 0) {
      const isReceivable = party.balance_type === 'receivable';
      raw.push({
        id: `opening_${party.id}`,
        date: party.created_at.split('T')[0],
        type: 'Opening Balance',
        ref: 'OPENING',
        desc: 'Opening balance record',
        gave: isReceivable ? party.opening_balance : 0,
        got: !isReceivable ? party.opening_balance : 0,
      });
    }

    // 2. Transactions
    for (const tx of partyTxs) {
      if (tx.document_type === 'sales_invoice') {
        raw.push({
          id: tx.id,
          date: tx.document_date,
          type: 'Sale Invoice',
          ref: tx.document_number,
          desc: `Invoice #${tx.document_number}`,
          gave: tx.total_amount, // goods given
          got: tx.paid_amount || 0, // payment received in same bill
        });
      } else if (tx.document_type === 'purchase_bill') {
        raw.push({
          id: tx.id,
          date: tx.document_date,
          type: 'Purchase Bill',
          ref: tx.document_number,
          desc: `Bill #${tx.document_number}`,
          gave: tx.paid_amount || 0, // payment made
          got: tx.total_amount, // goods received
        });
      } else if (tx.document_type === 'credit_note') {
        raw.push({
          id: tx.id,
          date: tx.document_date,
          type: 'Sales Return',
          ref: tx.document_number,
          desc: `Credit Note #${tx.document_number}`,
          gave: 0,
          got: tx.total_amount,
        });
      }
    }

    // 3. Independent Payments
    for (const p of partyPays) {
      if (p.payment_type === 'payment_in') {
        raw.push({
          id: p.id,
          date: p.payment_date,
          type: 'Payment Received',
          ref: p.payment_number,
          desc: p.notes || `Receipt via ${p.payment_mode}`,
          gave: 0,
          got: p.amount,
        });
      } else {
        raw.push({
          id: p.id,
          date: p.payment_date,
          type: 'Payment Made',
          ref: p.payment_number,
          desc: p.notes || `Paid via ${p.payment_mode}`,
          gave: p.amount,
          got: 0,
        });
      }
    }

    // Sort chronologically ascending to compute running balance
    raw.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const computed: KhataEntry[] = raw.map((item) => {
      // For customer: Gave increases receivable, Got decreases receivable
      running += item.gave - item.got;
      return {
        id: item.id,
        date: item.date,
        type: item.type,
        referenceNumber: item.ref,
        description: item.desc,
        gave: item.gave,
        got: item.got,
        runningBalance: running,
      };
    });

    // Reverse for UI display (newest first)
    setKhataEntries([...computed].reverse());
    setCurrentBalance(running);

    // Reconcile party current_balance in DB if changed
    if (round2(running) !== round2(party.current_balance)) {
      const updated = {
        ...party,
        current_balance: round2(running),
        updated_at: new Date().toISOString(),
      };
      await saveLocalParty(updated);
      onPartyUpdated(updated);
    }
  };

  useEffect(() => {
    loadPartyData();
  }, [party.id]);

  // Handle "You gave" or "You got" Entry Save
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const entryAmount = parseFloat(amount);
    if (!entryAmount || entryAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (!activeBusiness) return;
    setIsSavingEntry(true);

    try {
      const isPaymentIn = entryType === 'got';
      const paymentNumber = `${isPaymentIn ? 'RCP' : 'PAY'}-${Date.now().toString().slice(-6)}`;

      const targetAccount =
        accounts.find((a) => a.account_type === (paymentMode === 'cash' ? 'cash' : 'bank')) ||
        accounts[0];

      const newPayment: Payment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        business_id: activeBusiness.id,
        party_id: party.id,
        party_name: party.name,
        payment_type: isPaymentIn ? 'payment_in' : 'payment_out',
        payment_number: paymentNumber,
        payment_date: date,
        amount: entryAmount,
        payment_mode: paymentMode,
        account_id: targetAccount?.id,
        account_name: targetAccount?.account_name,
        notes: notes.trim() || (isPaymentIn ? 'Payment received' : 'Payment made / credit given'),
        created_at: new Date().toISOString(),
      };

      await saveLocalPayment(newPayment);

      // Update Account balance
      if (targetAccount) {
        const delta = isPaymentIn ? entryAmount : -entryAmount;
        await saveLocalAccount({
          ...targetAccount,
          current_balance: targetAccount.current_balance + delta,
        });
      }

      // Record Audit Log
      await saveLocalAuditLog({
        id: `audit_${Date.now()}`,
        business_id: activeBusiness.id,
        action: isPaymentIn ? 'KHATA_YOU_GOT' : 'KHATA_YOU_GAVE',
        entity_type: 'payment',
        entity_id: newPayment.id,
        details: { party: party.name, amount: entryAmount, mode: paymentMode },
        created_at: new Date().toISOString(),
      });

      setIsEntryModalOpen(false);
      setAmount('');
      setNotes('');
      await loadPartyData();
    } finally {
      setIsSavingEntry(false);
    }
  };

  // WhatsApp / Share Reminder
  const handleSendReminder = async () => {
    if (!activeBusiness) return;
    const balanceText = formatCurrency(Math.abs(currentBalance));
    const message = `Dear ${party.name},\n\nThis is a friendly payment reminder from ${activeBusiness.name}. Your pending balance is ${balanceText}.\n\nKindly clear the payment at your earliest convenience.\n\nThank you!`;

    // Log the reminder in database
    await saveLocalPartyReminder({
      id: `rem_${Date.now()}`,
      business_id: activeBusiness.id,
      party_id: party.id,
      party_name: party.name,
      reminder_date: new Date().toISOString().split('T')[0],
      amount: Math.abs(currentBalance),
      message,
      channel: 'whatsapp',
      created_at: new Date().toISOString(),
    });

    // Save audit log
    await saveLocalAuditLog({
      id: `audit_${Date.now()}`,
      business_id: activeBusiness.id,
      action: 'SEND_PARTY_REMINDER',
      entity_type: 'party',
      entity_id: party.id,
      details: { party: party.name, balance: currentBalance },
      created_at: new Date().toISOString(),
    });

    shareViaWhatsApp(party.phone || '', message);
    setReminderSentMessage('Reminder logged and WhatsApp opened successfully!');
    setTimeout(() => setReminderSentMessage(null), 3000);
  };

  // Download PDF Statement (A4 print layout)
  const handleDownloadStatement = () => {
    triggerBrowserPrint();
  };

  const isCustomer = party.type !== 'supplier';
  const isPositiveBalance = currentBalance > 0;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24">
      {/* 1. TOP HEADER & PROFILE */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {party.name}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">
                  {party.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {party.phone ? `+91 ${party.phone}` : 'No phone'} {party.gstin ? `• GSTIN: ${party.gstin}` : ''}
              </p>
            </div>
          </div>

          {/* Quick Call & WhatsApp Action Buttons */}
          <div className="flex items-center gap-2">
            {party.phone && (
              <>
                <a
                  href={`tel:${party.phone}`}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Call Party"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={handleSendReminder}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                  title="WhatsApp Party"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Balance Card Banner */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Current Net Balance
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  currentBalance > 0
                    ? 'text-red-600'
                    : currentBalance < 0
                    ? 'text-emerald-600'
                    : 'text-slate-700'
                }`}
              >
                {formatCurrency(Math.abs(currentBalance))}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  currentBalance > 0
                    ? 'bg-red-100 text-red-800'
                    : currentBalance < 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {currentBalance > 0
                  ? 'You will get (Receivable)'
                  : currentBalance < 0
                  ? 'You will give (Payable)'
                  : 'Settled'}
              </span>
            </div>
          </div>

          {/* Top Actions: Reminder, Statement, Invoice */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminder}
              leftIcon={<Bell className="w-3.5 h-3.5 text-amber-600" />}
              className="flex-1 sm:flex-none text-xs font-bold"
            >
              Send Reminder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadStatement}
              leftIcon={<Download className="w-3.5 h-3.5 text-brand-600" />}
              className="flex-1 sm:flex-none text-xs font-bold"
            >
              Statement
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/sales/new?partyId=${party.id}`)}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
              className="flex-1 sm:flex-none text-xs font-bold"
            >
              New Bill
            </Button>
          </div>
        </div>

        {reminderSentMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reminderSentMessage}</span>
          </div>
        )}
      </div>

      {/* 2. TRANSACTION LEDGER TABLE */}
      <Card className="rounded-2xl border-slate-200/90 shadow-subtle overflow-hidden">
        <CardHeader className="py-3 px-4 sm:px-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-800">
            Transactions & Ledger
          </CardTitle>
          <span className="text-xs font-medium text-slate-500">
            {khataEntries.length} entries recorded
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {khataEntries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No transactions yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Record a transaction or tap "Payment Out" / "Payment In" below.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {khataEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 sm:px-6 hover:bg-slate-50/80 transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{entry.type}</span>
                      <span className="text-[10px] text-slate-400">#{entry.referenceNumber}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{entry.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{entry.date}</p>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    {/* Payment Out (Debit / Red) */}
                    {entry.gave > 0 && (
                      <div className="min-w-[70px]">
                        <p className="text-xs font-bold text-red-600">
                          {formatCurrency(entry.gave)}
                        </p>
                        <p className="text-[9px] text-slate-400 uppercase font-semibold">Payment Out</p>
                      </div>
                    )}

                    {/* Payment In (Credit / Green) */}
                    {entry.got > 0 && (
                      <div className="min-w-[70px]">
                        <p className="text-xs font-bold text-emerald-600">
                          {formatCurrency(entry.got)}
                        </p>
                        <p className="text-[9px] text-slate-400 uppercase font-semibold">Payment In</p>
                      </div>
                    )}

                    {/* Running balance */}
                    <div className="min-w-[80px] pl-2 border-l border-slate-200">
                      <p
                        className={`text-xs font-black ${
                          entry.runningBalance > 0
                            ? 'text-red-700'
                            : entry.runningBalance < 0
                            ? 'text-emerald-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {formatCurrency(Math.abs(entry.runningBalance))}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase">
                        {entry.runningBalance > 0 ? 'Receivable' : entry.runningBalance < 0 ? 'Payable' : 'Settled'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. STICKY BOTTOM ACTION BAR: PAYMENT OUT (RED) & PAYMENT IN (GREEN) */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 z-30 shadow-2xl">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-3">
          {/* Payment Out Button (Red) */}
          <button
            type="button"
            onClick={() => {
              setEntryType('gave');
              setIsEntryModalOpen(true);
            }}
            className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            <span>PAYMENT OUT ₹</span>
          </button>

          {/* Payment In Button (Green) */}
          <button
            type="button"
            onClick={() => {
              setEntryType('got');
              setIsEntryModalOpen(true);
            }}
            className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            <span>PAYMENT IN ₹</span>
          </button>
        </div>
      </div>

      {/* MODAL: RECORD PAYMENT OUT / PAYMENT IN ENTRY */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title={entryType === 'gave' ? `Payment Out to ${party.name}` : `Payment In from ${party.name}`}
        size="md"
      >
        <form onSubmit={handleSaveEntry} className="space-y-4">
          <Input
            label="Amount (₹) *"
            type="number"
            step="0.01"
            min="1"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            required
          />

          <Input
            label="Date *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
            label="Note / Remarks"
            placeholder="e.g. Part payment or credit given"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsEntryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={entryType === 'gave' ? 'danger' : 'primary'}
              size="sm"
              type="submit"
              disabled={isSavingEntry || !amount}
            >
              {isSavingEntry ? 'Saving...' : `Save ${entryType === 'gave' ? 'Payment Out' : 'Payment In'}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
