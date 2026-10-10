import React, { useState } from 'react';
import { Transaction, Business, Party } from '../../types';
import { formatCurrency, numberToWordsIndian } from '../../lib/gst';
import { Button } from '../ui/Button';
import { Printer, Share2, Download, FileText, ArrowLeft } from 'lucide-react';
import { shareInvoice, triggerBrowserPrint } from '../../lib/pdf';

interface InvoicePrintViewProps {
  transaction: Transaction;
  business: Business;
  party?: Party;
  onBack?: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({
  transaction,
  business,
  party,
  onBack,
}) => {
  const [layout, setLayout] = useState<'a4' | 'thermal'>('a4');
  const isGst = transaction.is_gst;
  const isInterstate = transaction.igst_amount > 0;

  return (
    <div className="space-y-4">
      {/* Action Toolbar (no-print) */}
      <div className="no-print bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-subtle">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
          )}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setLayout('a4')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                layout === 'a4' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Standard A4
            </button>
            <button
              onClick={() => setLayout('thermal')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                layout === 'thermal' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Thermal (POS)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => shareInvoice(transaction, business, party)}
            leftIcon={<Share2 className="w-4 h-4 text-emerald-600" />}
          >
            Share
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={triggerBrowserPrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print
          </Button>
        </div>
      </div>

      {/* A4 Format Layout */}
      {layout === 'a4' ? (
        <div className="bg-white p-8 max-w-4xl mx-auto rounded-xl border border-slate-200 shadow-card print:border-none print:shadow-none print:p-0 text-slate-800 text-xs">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                {business.name}
              </h1>
              <p className="text-slate-600 mt-1">{business.address}</p>
              <p className="text-slate-600">
                {business.state} - {business.pincode} (State Code: {business.state_code})
              </p>
              <p className="text-slate-600">
                Phone: {business.mobile} | Email: {business.email}
              </p>
              {business.gstin && (
                <p className="font-bold text-slate-900 mt-0.5">GSTIN: {business.gstin}</p>
              )}
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded mb-2">
                {transaction.document_type === 'sales_invoice' ? 'Tax Invoice' : 'Document'}
              </span>
              <p className="font-bold text-slate-900 text-sm">
                Invoice #: {transaction.document_number}
              </p>
              <p className="text-slate-600 mt-0.5">Date: {transaction.document_date}</p>
              {transaction.due_date && (
                <p className="text-slate-600">Due Date: {transaction.due_date}</p>
              )}
              <p className="text-slate-600">Place of Supply: {transaction.place_of_supply}</p>
            </div>
          </div>

          {/* Bill To / Ship To */}
          <div className="grid grid-cols-2 gap-4 border border-slate-200 p-3 rounded-lg mb-4 bg-slate-50/50">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Billed To:
              </p>
              <p className="font-bold text-slate-900 text-sm">
                {transaction.party_name || party?.name || 'Cash Customer'}
              </p>
              {party?.billing_address && <p className="text-slate-600">{party.billing_address}</p>}
              {party?.phone && <p className="text-slate-600">Phone: {party.phone}</p>}
              {party?.gstin && <p className="font-semibold text-slate-900">GSTIN: {party.gstin}</p>}
              {party?.state && (
                <p className="text-slate-600">
                  State: {party.state} ({party.state_code})
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Payment Details:
              </p>
              <p className="text-slate-700">Status: <span className="font-bold uppercase">{transaction.payment_status}</span></p>
              <p className="text-slate-700">Payment Mode: {transaction.payment_mode || 'Cash'}</p>
              <p className="text-slate-700 font-semibold text-xs mt-1">
                Amount Received: {formatCurrency(transaction.paid_amount)}
              </p>
              <p className="text-red-600 font-bold text-xs">
                Balance Due: {formatCurrency(transaction.balance_amount)}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto mb-4 border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                  <th className="py-2 px-2.5 w-8">#</th>
                  <th className="py-2 px-2.5">Item Description</th>
                  <th className="py-2 px-2.5 text-center">HSN</th>
                  <th className="py-2 px-2.5 text-right">Qty</th>
                  <th className="py-2 px-2.5 text-right">Rate</th>
                  <th className="py-2 px-2.5 text-right">Disc</th>
                  <th className="py-2 px-2.5 text-right">Taxable</th>
                  {isGst && !isInterstate && (
                    <>
                      <th className="py-2 px-2 text-right">CGST</th>
                      <th className="py-2 px-2 text-right">SGST</th>
                    </>
                  )}
                  {isGst && isInterstate && <th className="py-2 px-2.5 text-right">IGST</th>}
                  <th className="py-2 px-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transaction.lines.map((line, idx) => (
                  <tr key={line.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-2.5 text-slate-400 text-center">{idx + 1}</td>
                    <td className="py-2 px-2.5 font-medium text-slate-900">{line.item_name}</td>
                    <td className="py-2 px-2.5 text-center text-slate-500">{line.hsn_code || '-'}</td>
                    <td className="py-2 px-2.5 text-right">
                      {line.quantity} {line.unit}
                    </td>
                    <td className="py-2 px-2.5 text-right">{formatCurrency(line.unit_price)}</td>
                    <td className="py-2 px-2.5 text-right text-slate-500">
                      {line.discount_amount > 0 ? formatCurrency(line.discount_amount) : '-'}
                    </td>
                    <td className="py-2 px-2.5 text-right font-medium">
                      {formatCurrency(line.taxable_amount)}
                    </td>
                    {isGst && !isInterstate && (
                      <>
                        <td className="py-2 px-2 text-right text-[11px]">
                          {line.cgst_amount > 0 ? `${formatCurrency(line.cgst_amount)} (${line.cgst_rate}%)` : '-'}
                        </td>
                        <td className="py-2 px-2 text-right text-[11px]">
                          {line.sgst_amount > 0 ? `${formatCurrency(line.sgst_amount)} (${line.sgst_rate}%)` : '-'}
                        </td>
                      </>
                    )}
                    {isGst && isInterstate && (
                      <td className="py-2 px-2.5 text-right text-[11px]">
                        {line.igst_amount > 0 ? `${formatCurrency(line.igst_amount)} (${line.igst_rate}%)` : '-'}
                      </td>
                    )}
                    <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(line.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals and Bank Info */}
          <div className="grid grid-cols-2 gap-6 mb-4">
            {/* Bank details & Terms */}
            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-2">
              <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Bank & Payment Details:
              </p>
              <div className="text-slate-700 space-y-0.5">
                <p>Bank: <span className="font-semibold">{business.bank_name || 'HDFC Bank'}</span></p>
                <p>Account No: <span className="font-semibold">{business.account_no || '-'}</span></p>
                <p>IFSC Code: <span className="font-semibold">{business.ifsc_code || '-'}</span></p>
                {business.upi_id && (
                  <p>UPI ID: <span className="font-semibold text-brand-600">{business.upi_id}</span></p>
                )}
              </div>
              {business.default_terms && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="font-bold text-slate-700 text-[10px] uppercase">Terms & Conditions:</p>
                  <p className="text-[10px] text-slate-600 whitespace-pre-line mt-0.5">
                    {business.default_terms}
                  </p>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="border border-slate-200 p-3 rounded-lg space-y-1.5 text-right bg-white">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              {transaction.total_discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discount:</span>
                  <span>-{formatCurrency(transaction.total_discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-100 pt-1">
                <span>Taxable Amount:</span>
                <span>{formatCurrency(transaction.taxable_amount)}</span>
              </div>
              {isGst && !isInterstate && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST:</span>
                    <span>{formatCurrency(transaction.cgst_amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST:</span>
                    <span>{formatCurrency(transaction.sgst_amount)}</span>
                  </div>
                </>
              )}
              {isGst && isInterstate && (
                <div className="flex justify-between text-slate-600">
                  <span>IGST:</span>
                  <span>{formatCurrency(transaction.igst_amount)}</span>
                </div>
              )}
              {transaction.round_off !== 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Round Off:</span>
                  <span>{formatCurrency(transaction.round_off)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t-2 border-slate-800 pt-2">
                <span>Grand Total:</span>
                <span>{formatCurrency(transaction.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div className="p-2.5 bg-slate-100 rounded-lg mb-6 text-slate-800">
            <span className="font-semibold text-slate-500 text-[10px] uppercase block">
              Amount In Words:
            </span>
            <span className="font-bold text-xs">{numberToWordsIndian(transaction.total_amount)}</span>
          </div>

          {/* Signature */}
          <div className="flex justify-between items-end pt-6 border-t border-slate-200">
            <div className="text-[10px] text-slate-400">
              Generated via BizLedger GST Billing
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900 text-xs mb-10">For {business.name}</p>
              <div className="border-t border-slate-400 pt-1 text-slate-600 text-[11px]">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Thermal 80mm / 58mm POS Format */
        <div className="bg-white p-4 max-w-[320px] mx-auto rounded-xl border border-slate-300 shadow-card font-mono text-[11px] text-black">
          <div className="text-center border-b border-dashed border-black pb-2 mb-2">
            <h2 className="font-bold text-sm uppercase">{business.name}</h2>
            <p className="text-[10px]">{business.address}</p>
            <p className="text-[10px]">Ph: {business.mobile}</p>
            {business.gstin && <p className="font-bold text-[10px]">GST: {business.gstin}</p>}
          </div>

          <div className="border-b border-dashed border-black pb-2 mb-2 text-[10px]">
            <p>Inv #: {transaction.document_number}</p>
            <p>Date: {transaction.document_date}</p>
            <p>Customer: {transaction.party_name || 'Cash'}</p>
          </div>

          {/* Thermal Items */}
          <div className="border-b border-dashed border-black pb-2 mb-2">
            <div className="flex justify-between font-bold border-b border-black pb-1 mb-1">
              <span>Item</span>
              <span>Qty x Rate</span>
              <span>Amt</span>
            </div>
            {transaction.lines.map((l, i) => (
              <div key={i} className="mb-1">
                <p className="font-semibold">{l.item_name}</p>
                <div className="flex justify-between text-[10px]">
                  <span>{l.quantity} {l.unit} @ {formatCurrency(l.unit_price)}</span>
                  <span>{formatCurrency(l.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Thermal Totals */}
          <div className="space-y-1 text-right border-b border-dashed border-black pb-2 mb-2">
            <div className="flex justify-between">
              <span>Taxable:</span>
              <span>{formatCurrency(transaction.taxable_amount)}</span>
            </div>
            {transaction.cgst_amount > 0 && (
              <div className="flex justify-between">
                <span>CGST:</span>
                <span>{formatCurrency(transaction.cgst_amount)}</span>
              </div>
            )}
            {transaction.sgst_amount > 0 && (
              <div className="flex justify-between">
                <span>SGST:</span>
                <span>{formatCurrency(transaction.sgst_amount)}</span>
              </div>
            )}
            {transaction.igst_amount > 0 && (
              <div className="flex justify-between">
                <span>IGST:</span>
                <span>{formatCurrency(transaction.igst_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-xs border-t border-black pt-1">
              <span>TOTAL:</span>
              <span>{formatCurrency(transaction.total_amount)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Paid:</span>
              <span>{formatCurrency(transaction.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span>Balance:</span>
              <span>{formatCurrency(transaction.balance_amount)}</span>
            </div>
          </div>

          <div className="text-center text-[10px] mt-2">
            <p>Thank you for your visit!</p>
            <p>Powered by BizLedger</p>
          </div>
        </div>
      )}
    </div>
  );
};
