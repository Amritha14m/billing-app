import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Printer,
  Share2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getLocalTransactions } from '../../lib/db';
import { Transaction, PaymentStatus } from '../../types';
import { formatCurrency } from '../../lib/gst';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { shareInvoice, triggerBrowserPrint } from '../../lib/pdf';

export const InvoiceListPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<'sales_invoice' | 'estimate' | 'all'>('all');

  useEffect(() => {
    if (!activeBusiness) return;
    getLocalTransactions(activeBusiness.id).then(setTransactions);
  }, [activeBusiness]);

  const salesTxs = transactions.filter((t) =>
    docTypeFilter === 'all'
      ? ['sales_invoice', 'estimate', 'sales_order'].includes(t.document_type)
      : t.document_type === docTypeFilter
  );

  const filtered = salesTxs.filter((tx) => {
    const matchesStatus = filterStatus === 'all' || tx.payment_status === filterStatus;
    const matchesSearch =
      tx.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.party_name && tx.party_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalSales = salesTxs.reduce((sum, t) => sum + t.total_amount, 0);
  const totalReceived = salesTxs.reduce((sum, t) => sum + t.paid_amount, 0);
  const totalBalance = salesTxs.reduce((sum, t) => sum + t.balance_amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Sales & Invoices
          </h1>
          <p className="text-xs text-slate-500">
            Manage tax invoices, cash memos, quotations, and payments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/sales/new?type=estimate')}
          >
            + Estimate
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/sales/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Sales
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
            {formatCurrency(totalSales)}
          </span>
          <span className="text-[10px] text-slate-400">{salesTxs.length} invoices generated</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Total Received
          </span>
          <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">
            {formatCurrency(totalReceived)}
          </span>
          <span className="text-[10px] text-slate-400">Settled payments</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider block">
            Total Outstanding Due
          </span>
          <span className="text-xl font-extrabold text-red-700 mt-0.5 block">
            {formatCurrency(totalBalance)}
          </span>
          <span className="text-[10px] text-slate-400">Unsettled credit</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice # or party..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {['all', 'paid', 'partial', 'unpaid'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-full font-medium capitalize transition-colors ${
                    filterStatus === st
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-right">Received (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No invoices matching the criteria. Click "+ Create Invoice" to generate one.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{tx.document_date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {tx.document_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {tx.party_name || 'Cash Customer'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(tx.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-medium">
                      {formatCurrency(tx.paid_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-600">
                      {formatCurrency(tx.balance_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          tx.payment_status === 'paid'
                            ? 'green'
                            : tx.payment_status === 'partial'
                            ? 'amber'
                            : 'red'
                        }
                        size="sm"
                      >
                        {tx.payment_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/sales/view/${tx.id}`)}
                          className="p-1 rounded text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                          title="View & Print"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (activeBusiness) shareInvoice(tx, activeBusiness);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-slate-100"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
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
    </div>
  );
};
