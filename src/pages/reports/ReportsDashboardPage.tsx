import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Boxes,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getLocalTransactions,
  getLocalParties,
  getLocalItems,
  getLocalExpenses,
} from '../../lib/db';
import { Transaction, Party, Item, Expense } from '../../types';
import { formatCurrency } from '../../lib/gst';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const ReportsDashboardPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<
    'pnl' | 'gstr1' | 'gstr3b' | 'sales_reg' | 'stock_val'
  >('gstr3b');

  useEffect(() => {
    if (!activeBusiness) return;
    getLocalTransactions(activeBusiness.id).then(setTransactions);
    getLocalParties(activeBusiness.id).then(setParties);
    getLocalItems(activeBusiness.id).then(setItems);
    getLocalExpenses(activeBusiness.id).then(setExpenses);
  }, [activeBusiness]);

  const salesTxs = transactions.filter((t) => t.document_type === 'sales_invoice');
  const purchaseBills = transactions.filter((t) => t.document_type === 'purchase_bill');

  // GSTR-1 Outward Supplies
  const b2bInvoices = salesTxs.filter((t) => t.party_gstin && t.party_gstin.trim().length > 0);
  const b2cInvoices = salesTxs.filter((t) => !t.party_gstin || t.party_gstin.trim().length === 0);

  const totalSalesTaxable = salesTxs.reduce((sum, t) => sum + t.taxable_amount, 0);
  const totalSalesCGST = salesTxs.reduce((sum, t) => sum + t.cgst_amount, 0);
  const totalSalesSGST = salesTxs.reduce((sum, t) => sum + t.sgst_amount, 0);
  const totalSalesIGST = salesTxs.reduce((sum, t) => sum + t.igst_amount, 0);
  const totalOutputTax = totalSalesCGST + totalSalesSGST + totalSalesIGST;

  // GSTR-3B Inward ITC
  const totalPurchaseTaxable = purchaseBills.reduce((sum, t) => sum + t.taxable_amount, 0);
  const totalInputCGST = purchaseBills.reduce((sum, t) => sum + t.cgst_amount, 0);
  const totalInputSGST = purchaseBills.reduce((sum, t) => sum + t.sgst_amount, 0);
  const totalInputIGST = purchaseBills.reduce((sum, t) => sum + t.igst_amount, 0);
  const totalEligibleITC = totalInputCGST + totalInputSGST + totalInputIGST;

  const netTaxPayable = Math.max(0, totalOutputTax - totalEligibleITC);

  // Profit and Loss
  const grossSales = totalSalesTaxable;
  const costOfGoodsPurchased = totalPurchaseTaxable;
  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossSales - costOfGoodsPurchased - totalOperatingExpenses;

  // Stock Valuation
  const totalStockValuation = items
    .filter((i) => i.type === 'product')
    .reduce((sum, i) => sum + i.current_stock * i.purchase_price, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Accounting & GST Reports
          </h1>
          <p className="text-xs text-slate-500">
            Computed financial statements, GST filings summaries, and stock valuation
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          leftIcon={<Printer className="w-4 h-4" />}
        >
          Print Report
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveReportTab('gstr3b')}
          className={`px-3.5 py-2 rounded-lg transition-colors ${
            activeReportTab === 'gstr3b'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          GSTR-3B Summary
        </button>
        <button
          onClick={() => setActiveReportTab('gstr1')}
          className={`px-3.5 py-2 rounded-lg transition-colors ${
            activeReportTab === 'gstr1'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          GSTR-1 Outward Register
        </button>
        <button
          onClick={() => setActiveReportTab('pnl')}
          className={`px-3.5 py-2 rounded-lg transition-colors ${
            activeReportTab === 'pnl'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Profit & Loss Statement
        </button>
        <button
          onClick={() => setActiveReportTab('stock_val')}
          className={`px-3.5 py-2 rounded-lg transition-colors ${
            activeReportTab === 'stock_val'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Stock Summary & Valuation
        </button>
      </div>

      {/* Disclaimer Alert */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between">
        <span>
          <strong>Internal Accounting Record:</strong> These tax reports are prepared from verified local transactions to assist filing. Actual portal submission requires authorized GST Suvidha Provider (GSP) API credentials.
        </span>
        <Badge variant="blue" size="sm">Prepared</Badge>
      </div>

      {/* REPORT 1: GSTR-3B Summary */}
      {activeReportTab === 'gstr3b' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GSTR-3B Monthly Return Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 3.1 Outward Taxable Supplies */}
              <div>
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                  3.1 Details of Outward Supplies (Sales)
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                      <tr>
                        <th className="p-2.5">Nature of Supplies</th>
                        <th className="p-2.5 text-right">Taxable Value (₹)</th>
                        <th className="p-2.5 text-right">IGST (₹)</th>
                        <th className="p-2.5 text-right">CGST (₹)</th>
                        <th className="p-2.5 text-right">SGST (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2.5 font-medium">Outward Taxable Supplies (other than zero rated)</td>
                        <td className="p-2.5 text-right font-bold">{formatCurrency(totalSalesTaxable)}</td>
                        <td className="p-2.5 text-right">{formatCurrency(totalSalesIGST)}</td>
                        <td className="p-2.5 text-right">{formatCurrency(totalSalesCGST)}</td>
                        <td className="p-2.5 text-right">{formatCurrency(totalSalesSGST)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Eligible ITC */}
              <div>
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                  4. Eligible Input Tax Credit (ITC on Purchases)
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                      <tr>
                        <th className="p-2.5">Details</th>
                        <th className="p-2.5 text-right">Taxable Value (₹)</th>
                        <th className="p-2.5 text-right">IGST (₹)</th>
                        <th className="p-2.5 text-right">CGST (₹)</th>
                        <th className="p-2.5 text-right">SGST (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2.5 font-medium">All other ITC (Inward supplies from registered suppliers)</td>
                        <td className="p-2.5 text-right font-bold">{formatCurrency(totalPurchaseTaxable)}</td>
                        <td className="p-2.5 text-right">{formatCurrency(totalInputIGST)}</td>
                        <td className="p-2.5 text-right">{formatCurrency(totalInputCGST)}</td>
                        <td className="p-2.5 text-right">{formatCurrency(totalInputSGST)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Net Tax Liability */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Net GST Cash Liability:</span>
                  <span className="text-slate-500">Output Tax ({formatCurrency(totalOutputTax)}) - Eligible ITC ({formatCurrency(totalEligibleITC)})</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-slate-900 block">
                    {formatCurrency(netTaxPayable)}
                  </span>
                  <span className="text-[10px] text-slate-400">Payable via challan PMT-06</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* REPORT 2: GSTR-1 Outward Supplies */}
      {activeReportTab === 'gstr1' && (
        <Card>
          <CardHeader>
            <CardTitle>GSTR-1 Outward Supplies Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border">
                <span className="text-slate-500 block">Table 4A - B2B Invoices (With GSTIN)</span>
                <span className="text-lg font-bold text-slate-900 mt-1 block">{b2bInvoices.length} Invoices</span>
                <span className="text-slate-600">{formatCurrency(b2bInvoices.reduce((s, t) => s + t.total_amount, 0))}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border">
                <span className="text-slate-500 block">Table 7 - B2C Small Invoices (Unregistered)</span>
                <span className="text-lg font-bold text-slate-900 mt-1 block">{b2cInvoices.length} Invoices</span>
                <span className="text-slate-600">{formatCurrency(b2cInvoices.reduce((s, t) => s + t.total_amount, 0))}</span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Invoice #</th>
                    <th className="p-2.5">Party / GSTIN</th>
                    <th className="p-2.5 text-right">Taxable (₹)</th>
                    <th className="p-2.5 text-right">CGST (₹)</th>
                    <th className="p-2.5 text-right">SGST (₹)</th>
                    <th className="p-2.5 text-right">IGST (₹)</th>
                    <th className="p-2.5 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesTxs.map((t) => (
                    <tr key={t.id}>
                      <td className="p-2.5 text-slate-600">{t.document_date}</td>
                      <td className="p-2.5 font-mono font-semibold">{t.document_number}</td>
                      <td className="p-2.5 font-medium">
                        {t.party_name}
                        {t.party_gstin && <span className="block text-[10px] text-slate-400 font-mono">{t.party_gstin}</span>}
                      </td>
                      <td className="p-2.5 text-right">{formatCurrency(t.taxable_amount)}</td>
                      <td className="p-2.5 text-right">{formatCurrency(t.cgst_amount)}</td>
                      <td className="p-2.5 text-right">{formatCurrency(t.sgst_amount)}</td>
                      <td className="p-2.5 text-right">{formatCurrency(t.igst_amount)}</td>
                      <td className="p-2.5 text-right font-bold">{formatCurrency(t.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* REPORT 3: Profit & Loss Statement */}
      {activeReportTab === 'pnl' && (
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-w-2xl text-xs">
            <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex justify-between py-1 text-slate-700">
                <span className="font-semibold">Revenue from Sales:</span>
                <span className="font-bold text-slate-900">{formatCurrency(grossSales)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 border-b pb-2">
                <span>Less: Cost of Purchases / Goods:</span>
                <span>-{formatCurrency(costOfGoodsPurchased)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-800 font-bold">
                <span>Gross Trading Margin:</span>
                <span>{formatCurrency(grossSales - costOfGoodsPurchased)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 border-b pb-2">
                <span>Less: Operating Expenses:</span>
                <span className="text-red-600">-{formatCurrency(totalOperatingExpenses)}</span>
              </div>
              <div className="flex justify-between py-2 text-base font-extrabold text-slate-900 border-t-2 border-slate-800">
                <span>Estimated Net Profit / (Loss):</span>
                <span className={netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* REPORT 4: Stock Valuation */}
      {activeReportTab === 'stock_val' && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Summary & Valuation Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="p-2.5">Item Name</th>
                    <th className="p-2.5">Unit</th>
                    <th className="p-2.5 text-right">Purchase Price (₹)</th>
                    <th className="p-2.5 text-right">Sale Price (₹)</th>
                    <th className="p-2.5 text-right">On Hand Qty</th>
                    <th className="p-2.5 text-right">Valuation (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items
                    .filter((i) => i.type === 'product')
                    .map((i) => (
                      <tr key={i.id}>
                        <td className="p-2.5 font-medium text-slate-900">{i.name}</td>
                        <td className="p-2.5 font-mono text-slate-500">{i.unit}</td>
                        <td className="p-2.5 text-right">{formatCurrency(i.purchase_price)}</td>
                        <td className="p-2.5 text-right">{formatCurrency(i.sale_price)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-800">{i.current_stock}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          {formatCurrency(i.current_stock * i.purchase_price)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
