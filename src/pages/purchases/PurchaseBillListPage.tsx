import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ShoppingCart,
  Eye,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getLocalTransactions } from '../../lib/db';
import { Transaction } from '../../types';
import { formatCurrency } from '../../lib/gst';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const PurchaseBillListPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!activeBusiness) return;
    getLocalTransactions(activeBusiness.id).then(setTransactions);
  }, [activeBusiness]);

  const purchaseBills = transactions.filter((t) => t.document_type === 'purchase_bill');

  const filtered = purchaseBills.filter(
    (t) =>
      t.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.party_name && t.party_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPurchases = purchaseBills.reduce((sum, t) => sum + t.total_amount, 0);
  const totalPaid = purchaseBills.reduce((sum, t) => sum + t.paid_amount, 0);
  const totalDue = purchaseBills.reduce((sum, t) => sum + t.balance_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Purchases & Supplier Bills
          </h1>
          <p className="text-xs text-slate-500">
            Track inward stock purchases, supplier invoices, and payables
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/purchases/new')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Purchase Bill
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Purchases
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
            {formatCurrency(totalPurchases)}
          </span>
          <span className="text-[10px] text-slate-400">{purchaseBills.length} inward bills</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Paid to Suppliers
          </span>
          <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">
            {formatCurrency(totalPaid)}
          </span>
          <span className="text-[10px] text-slate-400">Settled payments</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider block">
            Payables Due
          </span>
          <span className="text-xl font-extrabold text-red-700 mt-0.5 block">
            {formatCurrency(totalDue)}
          </span>
          <span className="text-[10px] text-slate-400">Outstanding balance</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bill # or supplier name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Purchase Bills Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Bill #</th>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4 text-right">Bill Total (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No purchase bills recorded yet. Click "+ Add Purchase Bill" to record your first inventory purchase.
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
                      {tx.party_name || 'Counter Cash'}
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
                      <button
                        onClick={() => navigate(`/sales/view/${tx.id}`)}
                        className="text-brand-600 hover:text-brand-700 font-semibold"
                      >
                        View
                      </button>
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
