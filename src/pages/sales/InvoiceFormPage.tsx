import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Printer,
  Share2,
  Save,
  ArrowLeft,
  ScanBarcode,
  Search,
  Check,
  Building,
  User,
  Calculator,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getLocalParties,
  getLocalItems,
  saveLocalTransaction,
  saveLocalParty,
  saveLocalItem,
  saveLocalStockMovement,
  saveLocalAccount,
  getLocalAccounts,
  getLocalTransactionById,
} from '../../lib/db';
import {
  Party,
  Item,
  Transaction,
  TransactionLine,
  PaymentMode,
  StockMovement,
  DocumentType,
} from '../../types';
import {
  INDIAN_STATES,
  GST_RATES,
  calculateLineItem,
  formatCurrency,
  round2,
} from '../../lib/gst';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { InvoicePrintView } from '../../components/invoice/InvoicePrintView';
import { BarcodeScannerModal } from '../../components/barcode/BarcodeScannerModal';

export const InvoiceFormPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [documentType, setDocumentType] = useState<DocumentType>('sales_invoice');
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // Form Fields
  const [docNumber, setDocNumber] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [placeOfSupply, setPlaceOfSupply] = useState(activeBusiness?.state_code || '27');
  const [isGst, setIsGst] = useState(activeBusiness?.gst_registered || false);

  // Line Items
  const [lines, setLines] = useState<TransactionLine[]>([]);

  // Payment
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [notes, setNotes] = useState('');

  // Modals & Views
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [savedTransaction, setSavedTransaction] = useState<Transaction | null>(null);
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyGstin, setNewPartyGstin] = useState('');
  const [newPartyState, setNewPartyState] = useState(activeBusiness?.state_code || '27');

  // Load existing parties and items
  useEffect(() => {
    if (!activeBusiness) return;
    getLocalParties(activeBusiness.id).then(setParties);
    getLocalItems(activeBusiness.id).then((itms) => {
      setItems(itms);
      // Auto-add an initial empty line if creating new
      if (lines.length === 0 && itms.length > 0) {
        addLineWithItem(itms[0]);
      }
    });

    if (id) {
      getLocalTransactionById(id).then((tx) => {
        if (tx) {
          setDocNumber(tx.document_number);
          setDocDate(tx.document_date);
          setDueDate(tx.due_date || '');
          setPlaceOfSupply(tx.place_of_supply);
          setIsGst(tx.is_gst);
          setLines(tx.lines);
          setPaidAmount(tx.paid_amount);
          setPaymentMode(tx.payment_mode || 'cash');
          setNotes(tx.notes || '');
          const p = parties.find((pt) => pt.id === tx.party_id);
          if (p) setSelectedParty(p);
        }
      });
    } else {
      // Auto-generate invoice number
      const prefix = activeBusiness.invoice_prefix || 'INV-';
      const num = activeBusiness.invoice_next_number || 101;
      setDocNumber(`${prefix}${num}`);
    }
  }, [activeBusiness, id]);

  const isInterState = placeOfSupply !== activeBusiness?.state_code;

  const addLineWithItem = (item: Item) => {
    const calc = calculateLineItem({
      quantity: 1,
      unitPrice: item.sale_price,
      discountPercent: 0,
      taxRate: item.tax_rate,
      isTaxInclusive: item.is_tax_inclusive,
      isGstInvoice: isGst,
      isInterState,
    });

    const newLine: TransactionLine = {
      id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      item_id: item.id,
      item_name: item.name,
      hsn_code: item.hsn_code,
      unit: item.unit,
      quantity: 1,
      unit_price: item.sale_price,
      discount_percent: 0,
      discount_amount: 0,
      tax_rate: item.tax_rate,
      taxable_amount: calc.taxableAmount,
      cgst_rate: calc.cgstRate,
      cgst_amount: calc.cgstAmount,
      sgst_rate: calc.sgstRate,
      sgst_amount: calc.sgstAmount,
      igst_rate: calc.igstRate,
      igst_amount: calc.igstAmount,
      total_amount: calc.totalAmount,
    };

    setLines((prev) => [...prev, newLine]);
  };

  const updateLine = (index: number, updates: Partial<TransactionLine>) => {
    setLines((prev) => {
      const next = [...prev];
      const current = { ...next[index], ...updates };

      const calc = calculateLineItem({
        quantity: current.quantity,
        unitPrice: current.unit_price,
        discountPercent: current.discount_percent,
        discountAmount: current.discount_amount,
        taxRate: current.tax_rate,
        isTaxInclusive: false,
        isGstInvoice: isGst,
        isInterState,
      });

      next[index] = {
        ...current,
        taxable_amount: calc.taxableAmount,
        cgst_rate: calc.cgstRate,
        cgst_amount: calc.cgstAmount,
        sgst_rate: calc.sgstRate,
        sgst_amount: calc.sgstAmount,
        igst_rate: calc.igstRate,
        igst_amount: calc.igstAmount,
        total_amount: calc.totalAmount,
      };
      return next;
    });
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Totals calculations
  const subtotal = round2(lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0));
  const totalDiscount = round2(lines.reduce((sum, l) => sum + l.discount_amount, 0));
  const taxableAmount = round2(lines.reduce((sum, l) => sum + l.taxable_amount, 0));
  const cgstAmount = round2(lines.reduce((sum, l) => sum + l.cgst_amount, 0));
  const sgstAmount = round2(lines.reduce((sum, l) => sum + l.sgst_amount, 0));
  const igstAmount = round2(lines.reduce((sum, l) => sum + l.igst_amount, 0));
  const rawTotal = round2(taxableAmount + cgstAmount + sgstAmount + igstAmount);
  const roundOff = round2(Math.round(rawTotal) - rawTotal);
  const grandTotal = round2(rawTotal + roundOff);
  const balanceDue = round2(grandTotal - paidAmount);

  // Quick Customer Creation
  const handleCreateParty = async () => {
    if (!newPartyName.trim() || !activeBusiness) return;
    const stateObj = INDIAN_STATES.find((s) => s.code === newPartyState);
    const newP: Party = {
      id: `party_${Date.now()}`,
      business_id: activeBusiness.id,
      name: newPartyName.trim(),
      type: 'customer',
      phone: newPartyPhone.trim(),
      state: stateObj?.name || 'Maharashtra',
      state_code: newPartyState,
      gst_type: newPartyGstin ? 'regular' : 'consumer',
      gstin: newPartyGstin.trim().toUpperCase() || undefined,
      opening_balance: 0,
      balance_type: 'receivable',
      current_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveLocalParty(newP);
    setParties((prev) => [...prev, newP]);
    setSelectedParty(newP);
    setPlaceOfSupply(newPartyState);
    setIsAddPartyOpen(false);
    setNewPartyName('');
    setNewPartyPhone('');
    setNewPartyGstin('');
  };

  // Atomic Save Handler
  const handleSaveInvoice = async () => {
    if (!activeBusiness) return;
    if (lines.length === 0) {
      alert('Please add at least one line item to the invoice.');
      return;
    }

    const txId = id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const partyName = selectedParty?.name || 'Cash Customer';

    const transaction: Transaction = {
      id: txId,
      business_id: activeBusiness.id,
      party_id: selectedParty?.id || 'cash_customer',
      party_name: partyName,
      party_phone: selectedParty?.phone,
      party_gstin: selectedParty?.gstin,
      party_state: selectedParty?.state,
      party_address: selectedParty?.billing_address,
      document_type: documentType,
      document_number: docNumber,
      document_date: docDate,
      due_date: dueDate,
      place_of_supply: placeOfSupply,
      is_gst: isGst,
      subtotal,
      total_discount: totalDiscount,
      taxable_amount: taxableAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      round_off: roundOff,
      total_amount: grandTotal,
      paid_amount: paidAmount,
      balance_amount: balanceDue,
      payment_status: balanceDue <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      status: 'final',
      payment_mode: paymentMode,
      notes,
      terms: activeBusiness.default_terms,
      lines,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Save Transaction
    await saveLocalTransaction(transaction);

    // 2. Atomic Stock Movements (reduce stock for sold items)
    if (documentType === 'sales_invoice') {
      for (const line of lines) {
        const item = items.find((i) => i.id === line.item_id);
        if (item && item.type === 'product') {
          const movement: StockMovement = {
            id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            business_id: activeBusiness.id,
            item_id: item.id,
            item_name: item.name,
            movement_type: 'sale',
            reference_id: transaction.id,
            reference_type: 'sales_invoice',
            reference_number: transaction.document_number,
            quantity: -line.quantity, // deduction
            unit_price: line.unit_price,
            reason: `Sold in Invoice #${transaction.document_number}`,
            created_at: new Date().toISOString(),
          };
          await saveLocalStockMovement(movement);

          // Update item's current stock
          const updatedItem = {
            ...item,
            current_stock: item.current_stock - line.quantity,
          };
          await saveLocalItem(updatedItem);
        }
      }

      // 3. Update Party Balance if not fully paid
      if (selectedParty && balanceDue > 0) {
        const updatedParty = {
          ...selectedParty,
          current_balance: selectedParty.current_balance + balanceDue,
          updated_at: new Date().toISOString(),
        };
        await saveLocalParty(updatedParty);
      }

      // 4. Update Cash/Bank account balance if payment collected
      if (paidAmount > 0) {
        const accounts = await getLocalAccounts(activeBusiness.id);
        const targetAcc =
          paymentMode === 'cash'
            ? accounts.find((a) => a.account_type === 'cash')
            : accounts.find((a) => a.account_type === 'bank');
        if (targetAcc) {
          targetAcc.current_balance += paidAmount;
          await saveLocalAccount(targetAcc);
        }
      }
    }

    setSavedTransaction(transaction);
  };

  // If saved, show print & share preview view
  if (savedTransaction && activeBusiness) {
    return (
      <InvoicePrintView
        transaction={savedTransaction}
        business={activeBusiness}
        party={selectedParty || undefined}
        onBack={() => navigate('/sales')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/sales')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {documentType === 'sales_invoice' ? 'Create Sales Invoice' : 'Create Estimate'}
            </h1>
            <p className="text-xs text-slate-500">Fast billing with automatic GST & stock update</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBarcodeOpen(true)}
            leftIcon={<ScanBarcode className="w-4 h-4 text-brand-600" />}
          >
            Scan Barcode
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveInvoice}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Meta Card */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Customer Selector */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between items-center">
                <span>Customer / Billed To *</span>
                <button
                  type="button"
                  onClick={() => setIsAddPartyOpen(true)}
                  className="text-brand-600 hover:text-brand-700 font-semibold text-[11px]"
                >
                  + Add New Customer
                </button>
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 text-sm p-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={selectedParty?.id || ''}
                onChange={(e) => {
                  const p = parties.find((pt) => pt.id === e.target.value);
                  setSelectedParty(p || null);
                  if (p?.state_code) setPlaceOfSupply(p.state_code);
                }}
              >
                <option value="">Cash Customer (Walk-in)</option>
                {parties
                  .filter((p) => p.type !== 'supplier')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''} - Bal: {formatCurrency(p.current_balance)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Invoice Number */}
            <Input
              label="Invoice Number *"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              required
            />

            {/* Invoice Date */}
            <Input
              label="Invoice Date *"
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              required
            />

            {/* Place of Supply */}
            <Select
              label="Place of Supply (State) *"
              value={placeOfSupply}
              onChange={(e) => setPlaceOfSupply(e.target.value)}
              options={INDIAN_STATES.map((s) => ({
                value: s.code,
                label: `${s.code} - ${s.name}`,
              }))}
            />

            {/* Due Date */}
            <Input
              label="Payment Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            {/* GST Tax Toggle */}
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isGstCheckbox"
                checked={isGst}
                onChange={(e) => setIsGst(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <label htmlFor="isGstCheckbox" className="text-xs font-semibold text-slate-700 select-none">
                Apply GST ({isInterState ? 'IGST Interstate' : 'CGST + SGST'})
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Items & Products</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBarcodeOpen(true)}
              leftIcon={<ScanBarcode className="w-4 h-4 text-brand-600" />}
            >
              Scan Barcode
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (items.length > 0) addLineWithItem(items[0]);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Row
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Item Description</th>
                  <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                  <th className="py-2.5 px-3 w-24 text-right">Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 w-20 text-right">Disc %</th>
                  {isGst && <th className="py-2.5 px-3 w-20 text-center">GST %</th>}
                  <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line, idx) => (
                  <tr key={line.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400 text-center">{idx + 1}</td>
                    {/* Item selector */}
                    <td className="py-2 px-3">
                      <select
                        className="w-full p-1.5 rounded border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-brand-500"
                        value={line.item_id}
                        onChange={(e) => {
                          const item = items.find((i) => i.id === e.target.value);
                          if (item) {
                            updateLine(idx, {
                              item_id: item.id,
                              item_name: item.name,
                              hsn_code: item.hsn_code,
                              unit: item.unit,
                              unit_price: item.sale_price,
                              tax_rate: item.tax_rate,
                            });
                          }
                        }}
                      >
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name} (Stock: {it.current_stock})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {line.unit}
                    </td>

                    {/* Quantity */}
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="1"
                        className="w-20 p-1.5 text-right rounded border border-slate-200 focus:ring-1 focus:ring-brand-500"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, { quantity: Math.max(1, parseFloat(e.target.value) || 0) })
                        }
                      />
                    </td>

                    {/* Unit Price */}
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 p-1.5 text-right rounded border border-slate-200 focus:ring-1 focus:ring-brand-500"
                        value={line.unit_price}
                        onChange={(e) =>
                          updateLine(idx, { unit_price: Math.max(0, parseFloat(e.target.value) || 0) })
                        }
                      />
                    </td>

                    {/* Discount % */}
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-16 p-1.5 text-right rounded border border-slate-200 focus:ring-1 focus:ring-brand-500"
                        value={line.discount_percent}
                        onChange={(e) =>
                          updateLine(idx, { discount_percent: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </td>

                    {/* GST Rate */}
                    {isGst && (
                      <td className="py-2 px-3 text-center">
                        <select
                          className="p-1.5 rounded border border-slate-200 text-xs"
                          value={line.tax_rate}
                          onChange={(e) =>
                            updateLine(idx, { tax_rate: parseInt(e.target.value) || 0 })
                          }
                        >
                          {GST_RATES.map((r) => (
                            <option key={r} value={r}>
                              {r}%
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    {/* Line Total */}
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(line.total_amount)}
                    </td>

                    {/* Remove Action */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary and Payment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Payment & Settlement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  className="w-full p-2 rounded-lg border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  className="w-full p-2 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-brand-500"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                >
                  <option value="cash">Cash in Hand</option>
                  <option value="upi">UPI / QR</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Quick settlement buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setPaidAmount(grandTotal)}
                className="text-xs"
              >
                Mark Fully Paid ({formatCurrency(grandTotal)})
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setPaidAmount(0)}
                className="text-xs"
              >
                Full Credit (₹ 0 Paid)
              </Button>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes & Remarks
              </label>
              <textarea
                rows={2}
                placeholder="Optional customer notes or instructions..."
                className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Calculation Breakdown */}
        <Card className="bg-slate-50/50">
          <CardHeader>
            <CardTitle>Calculation Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Line Discounts:</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-200 pt-2">
              <span>Taxable Value:</span>
              <span>{formatCurrency(taxableAmount)}</span>
            </div>

            {isGst && !isInterState && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>CGST:</span>
                  <span>{formatCurrency(cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST:</span>
                  <span>{formatCurrency(sgstAmount)}</span>
                </div>
              </>
            )}

            {isGst && isInterState && (
              <div className="flex justify-between text-slate-600">
                <span>IGST (Inter-state):</span>
                <span>{formatCurrency(igstAmount)}</span>
              </div>
            )}

            {roundOff !== 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Round Off:</span>
                <span>{formatCurrency(roundOff)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t-2 border-slate-300 pt-2">
              <span>Grand Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            <div className="flex justify-between text-xs font-semibold text-emerald-700 pt-1">
              <span>Paid Amount:</span>
              <span>{formatCurrency(paidAmount)}</span>
            </div>

            <div className="flex justify-between text-sm font-bold text-red-600 border-t border-dashed border-slate-300 pt-2">
              <span>Balance Due:</span>
              <span>{formatCurrency(balanceDue)}</span>
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-base font-bold shadow-md"
                onClick={handleSaveInvoice}
                leftIcon={<Save className="w-5 h-5" />}
              >
                Finalize & Save Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        onItemSelect={(item) => {
          addLineWithItem(item);
        }}
      />

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={isAddPartyOpen}
        onClose={() => setIsAddPartyOpen(false)}
        title="Add New Customer"
        maxWidth="md"
      >
        <div className="space-y-3">
          <Input
            label="Customer / Business Name *"
            value={newPartyName}
            onChange={(e) => setNewPartyName(e.target.value)}
            placeholder="e.g. Ramesh Stores"
            required
          />
          <Input
            label="Phone Number"
            value={newPartyPhone}
            onChange={(e) => setNewPartyPhone(e.target.value)}
            placeholder="10-digit mobile number"
          />
          <Input
            label="GSTIN (Optional)"
            value={newPartyGstin}
            onChange={(e) => setNewPartyGstin(e.target.value.toUpperCase())}
            placeholder="e.g. 27AAAAA0000A1Z5"
          />
          <Select
            label="State *"
            value={newPartyState}
            onChange={(e) => setNewPartyState(e.target.value)}
            options={INDIAN_STATES.map((s) => ({
              value: s.code,
              label: `${s.code} - ${s.name}`,
            }))}
          />
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setIsAddPartyOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateParty}>
              Save Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
