import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ShoppingCart,
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
} from '../../lib/db';
import {
  Party,
  Item,
  Transaction,
  TransactionLine,
  PaymentMode,
  StockMovement,
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

export const PurchaseBillFormPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const navigate = useNavigate();

  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [placeOfSupply, setPlaceOfSupply] = useState(activeBusiness?.state_code || '27');
  const [isGst, setIsGst] = useState(activeBusiness?.gst_registered || false);

  const [lines, setLines] = useState<TransactionLine[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('bank_transfer');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!activeBusiness) return;
    getLocalParties(activeBusiness.id).then((pts) => {
      setParties(pts);
      const suppliers = pts.filter((p) => p.type !== 'customer');
      if (suppliers.length > 0) setSelectedParty(suppliers[0]);
    });
    getLocalItems(activeBusiness.id).then((itms) => {
      setItems(itms);
      if (itms.length > 0 && lines.length === 0) {
        addLine(itms[0]);
      }
    });

    setBillNumber(`PUR-${Date.now().toString().slice(-5)}`);
  }, [activeBusiness]);

  const isInterState = placeOfSupply !== activeBusiness?.state_code;

  const addLine = (item: Item) => {
    const calc = calculateLineItem({
      quantity: 1,
      unitPrice: item.purchase_price || item.sale_price * 0.7,
      discountPercent: 0,
      taxRate: item.tax_rate,
      isTaxInclusive: false,
      isGstInvoice: isGst,
      isInterState,
    });

    const newLine: TransactionLine = {
      id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      item_id: item.id,
      item_name: item.name,
      hsn_code: item.hsn_code,
      unit: item.unit,
      quantity: 10,
      unit_price: item.purchase_price || item.sale_price * 0.7,
      discount_percent: 0,
      discount_amount: 0,
      tax_rate: item.tax_rate,
      taxable_amount: calc.taxableAmount * 10,
      cgst_rate: calc.cgstRate,
      cgst_amount: calc.cgstAmount * 10,
      sgst_rate: calc.sgstRate,
      sgst_amount: calc.sgstAmount * 10,
      igst_rate: calc.igstRate,
      igst_amount: calc.igstAmount * 10,
      total_amount: calc.totalAmount * 10,
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

  const subtotal = round2(lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0));
  const taxableAmount = round2(lines.reduce((sum, l) => sum + l.taxable_amount, 0));
  const cgstAmount = round2(lines.reduce((sum, l) => sum + l.cgst_amount, 0));
  const sgstAmount = round2(lines.reduce((sum, l) => sum + l.sgst_amount, 0));
  const igstAmount = round2(lines.reduce((sum, l) => sum + l.igst_amount, 0));
  const rawTotal = round2(taxableAmount + cgstAmount + sgstAmount + igstAmount);
  const roundOff = round2(Math.round(rawTotal) - rawTotal);
  const grandTotal = round2(rawTotal + roundOff);
  const balanceDue = round2(grandTotal - paidAmount);

  const handleSavePurchase = async () => {
    if (!activeBusiness || lines.length === 0) return;

    const txId = `tx_pur_${Date.now()}`;
    const transaction: Transaction = {
      id: txId,
      business_id: activeBusiness.id,
      party_id: selectedParty?.id || 'counter_supplier',
      party_name: selectedParty?.name || 'Counter Supplier',
      party_phone: selectedParty?.phone,
      party_gstin: selectedParty?.gstin,
      document_type: 'purchase_bill',
      document_number: billNumber,
      document_date: billDate,
      due_date: dueDate,
      place_of_supply: placeOfSupply,
      is_gst: isGst,
      subtotal,
      total_discount: 0,
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
      lines,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Save Transaction
    await saveLocalTransaction(transaction);

    // 2. Atomic Inward Stock Movements (Increases stock)
    for (const line of lines) {
      const item = items.find((i) => i.id === line.item_id);
      if (item && item.type === 'product') {
        const movement: StockMovement = {
          id: `sm_pur_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          business_id: activeBusiness.id,
          item_id: item.id,
          item_name: item.name,
          movement_type: 'purchase',
          reference_id: transaction.id,
          reference_type: 'purchase_bill',
          reference_number: transaction.document_number,
          quantity: line.quantity, // Positive for inward stock addition
          unit_price: line.unit_price,
          reason: `Purchased in Bill #${transaction.document_number}`,
          created_at: new Date().toISOString(),
        };
        await saveLocalStockMovement(movement);

        // Update item's stock and latest purchase price
        const updatedItem = {
          ...item,
          current_stock: item.current_stock + line.quantity,
          purchase_price: line.unit_price,
        };
        await saveLocalItem(updatedItem);
      }
    }

    // 3. Update Supplier Payable Balance
    if (selectedParty && balanceDue > 0) {
      const updatedParty = {
        ...selectedParty,
        current_balance: selectedParty.current_balance - balanceDue, // Negative = Payable
        updated_at: new Date().toISOString(),
      };
      await saveLocalParty(updatedParty);
    }

    // 4. Deduct payment from Bank/Cash account
    if (paidAmount > 0) {
      const accounts = await getLocalAccounts(activeBusiness.id);
      const targetAcc =
        paymentMode === 'cash'
          ? accounts.find((a) => a.account_type === 'cash')
          : accounts.find((a) => a.account_type === 'bank');
      if (targetAcc) {
        targetAcc.current_balance -= paidAmount;
        await saveLocalAccount(targetAcc);
      }
    }

    navigate('/purchases');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/purchases')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Record Inward Purchase Bill
            </h1>
            <p className="text-xs text-slate-500">
              Increases stock quantities and records accounts payable
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSavePurchase}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Purchase Bill
        </Button>
      </div>

      {/* Meta Card */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Supplier *
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
                <option value="">Counter Supplier / Cash Purchase</option>
                {parties
                  .filter((p) => p.type !== 'customer')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - Bal: {formatCurrency(p.current_balance)}
                    </option>
                  ))}
              </select>
            </div>

            <Input
              label="Supplier Bill / Invoice # *"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              required
            />

            <Input
              label="Bill Date *"
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Inward Stock Line Items</CardTitle>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (items.length > 0) addLine(items[0]);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Item Description</th>
                  <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                  <th className="py-2.5 px-3 w-24 text-right">Inward Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
                  {isGst && <th className="py-2.5 px-3 w-20 text-center">GST %</th>}
                  <th className="py-2.5 px-3 w-28 text-right">Total (₹)</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line, idx) => (
                  <tr key={line.id}>
                    <td className="py-2.5 px-3 text-slate-400 text-center">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <select
                        className="w-full p-1.5 rounded border border-slate-200 text-xs font-medium"
                        value={line.item_id}
                        onChange={(e) => {
                          const item = items.find((i) => i.id === e.target.value);
                          if (item) {
                            updateLine(idx, {
                              item_id: item.id,
                              item_name: item.name,
                              unit: item.unit,
                              unit_price: item.purchase_price || item.sale_price * 0.7,
                              tax_rate: item.tax_rate,
                            });
                          }
                        }}
                      >
                        {items
                          .filter((i) => i.type === 'product')
                          .map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name} (Current: {it.current_stock})
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-500 font-mono">{line.unit}</td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="1"
                        className="w-20 p-1.5 text-right rounded border border-slate-200"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, { quantity: Math.max(1, parseFloat(e.target.value) || 0) })
                        }
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 p-1.5 text-right rounded border border-slate-200"
                        value={line.unit_price}
                        onChange={(e) =>
                          updateLine(idx, { unit_price: Math.max(0, parseFloat(e.target.value) || 0) })
                        }
                      />
                    </td>
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
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(line.total_amount)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-red-600"
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

      {/* Payment & Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Payment Out</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Amount Paid to Supplier (₹)"
                type="number"
                min="0"
                max={grandTotal}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              />
              <Select
                label="Payment Mode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                options={[
                  { value: 'bank_transfer', label: 'Bank Transfer (NEFT/RTGS)' },
                  { value: 'cash', label: 'Cash in Hand' },
                  { value: 'upi', label: 'UPI' },
                  { value: 'cheque', label: 'Cheque' },
                ]}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaidAmount(grandTotal)}
              >
                Mark Full Payment ({formatCurrency(grandTotal)})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaidAmount(0)}
              >
                Full Credit (Pay Later)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50/50">
          <CardHeader>
            <CardTitle>Bill Total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Amount:</span>
              <span>{formatCurrency(taxableAmount)}</span>
            </div>
            {isGst && (
              <div className="flex justify-between text-slate-600">
                <span>Input Tax Credit (GST):</span>
                <span>{formatCurrency(cgstAmount + sgstAmount + igstAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-300 pt-2">
              <span>Grand Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-emerald-700">
              <span>Paid:</span>
              <span>{formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-red-600 border-t border-dashed border-slate-300 pt-1">
              <span>Payable to Supplier:</span>
              <span>{formatCurrency(balanceDue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
