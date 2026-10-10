import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Receipt,
  ShoppingCart,
  Wallet,
  Landmark,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getLocalTransactions,
  getLocalParties,
  getLocalItems,
  getLocalAccounts,
  getLocalExpenses,
} from '../../lib/db';
import { Transaction, Party, Item, Account, Expense, DashboardMetrics } from '../../types';
import { formatCurrency } from '../../lib/gst';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'fy'>('month');

  useEffect(() => {
    if (!activeBusiness) return;
    async function loadData() {
      setIsLoading(true);
      try {
        const [txs, pts, itms, accs, exps] = await Promise.all([
          getLocalTransactions(activeBusiness!.id),
          getLocalParties(activeBusiness!.id),
          getLocalItems(activeBusiness!.id),
          getLocalAccounts(activeBusiness!.id),
          getLocalExpenses(activeBusiness!.id),
        ]);
        setTransactions(txs);
        setParties(pts);
        setItems(itms);
        setAccounts(accs);
        setExpenses(exps);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [activeBusiness]);

  // Compute live dashboard metrics
  const todayStr = new Date().toISOString().split('T')[0];

  const salesTransactions = transactions.filter((t) => t.document_type === 'sales_invoice');
  const purchaseTransactions = transactions.filter((t) => t.document_type === 'purchase_bill');

  const todaySales = salesTransactions
    .filter((t) => t.document_date === todayStr)
    .reduce((sum, t) => sum + t.total_amount, 0);

  const todayPurchases = purchaseTransactions
    .filter((t) => t.document_date === todayStr)
    .reduce((sum, t) => sum + t.total_amount, 0);

  const totalReceivables = parties
    .filter((p) => p.current_balance > 0)
    .reduce((sum, p) => sum + p.current_balance, 0);

  const totalPayables = parties
    .filter((p) => p.current_balance < 0)
    .reduce((sum, p) => sum + Math.abs(p.current_balance), 0);

  const cashAccount = accounts.find((a) => a.account_type === 'cash');
  const cashInHand = cashAccount ? cashAccount.current_balance : 0;

  const bankBalance = accounts
    .filter((a) => a.account_type === 'bank')
    .reduce((sum, a) => sum + a.current_balance, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const totalSalesRevenue = salesTransactions.reduce((sum, t) => sum + t.taxable_amount, 0);
  const totalPurchaseCost = purchaseTransactions.reduce((sum, t) => sum + t.taxable_amount, 0);
  const estimatedProfit = totalSalesRevenue - totalPurchaseCost - totalExpenses;

  const lowStockItems = items.filter(
    (i) => i.type === 'product' && i.current_stock <= i.low_stock_alert
  );

  const overdueInvoices = salesTransactions.filter(
    (t) => t.payment_status !== 'paid' && t.due_date && t.due_date < todayStr
  );

  // Sales Trend Mock/Dynamic Chart Points
  const chartData = [
    { day: 'Mon', sales: 12500, purchases: 8000 },
    { day: 'Tue', sales: 18200, purchases: 12000 },
    { day: 'Wed', sales: 9800, purchases: 4500 },
    { day: 'Thu', sales: 24500, purchases: 15000 },
    { day: 'Fri', sales: 21300, purchases: 11000 },
    { day: 'Sat', sales: 32000, purchases: 18000 },
    { day: 'Sun', sales: 15400, purchases: 6000 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Financial overview for <span className="font-semibold text-slate-700">{activeBusiness?.name}</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/sales/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/purchases/new')}
            leftIcon={<ShoppingCart className="w-4 h-4 text-emerald-600" />}
          >
            Purchase Bill
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/parties?add=customer')}
            leftIcon={<Users className="w-4 h-4 text-brand-600" />}
          >
            + Party
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Receivables */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">To Receive</span>
              <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900">
              {formatCurrency(totalReceivables)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">From {parties.filter(p => p.current_balance > 0).length} customers</p>
          </CardContent>
        </Card>

        {/* Total Payables */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">To Pay</span>
              <span className="p-1 rounded-md bg-red-50 text-red-600">
                <TrendingDown className="w-4 h-4" />
              </span>
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900">
              {formatCurrency(totalPayables)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">To {parties.filter(p => p.current_balance < 0).length} suppliers</p>
          </CardContent>
        </Card>

        {/* Cash in Hand */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Cash in Hand</span>
              <span className="p-1 rounded-md bg-blue-50 text-brand-600">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900">
              {formatCurrency(cashInHand)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Physical counter cash</p>
          </CardContent>
        </Card>

        {/* Bank Balance */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Bank Balance</span>
              <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                <Landmark className="w-4 h-4" />
              </span>
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900">
              {formatCurrency(bankBalance)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Across bank accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-slate-400 text-[11px] block">Today's Sales</span>
          <span className="font-bold text-slate-900 text-sm">{formatCurrency(todaySales)}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[11px] block">Today's Purchases</span>
          <span className="font-bold text-slate-900 text-sm">{formatCurrency(todayPurchases)}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[11px] block">Total Expenses</span>
          <span className="font-bold text-red-600 text-sm">{formatCurrency(totalExpenses)}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[11px] block">Estimated Profit</span>
          <span className={`font-bold text-sm ${estimatedProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(estimatedProfit)}
          </span>
        </div>
      </div>

      {/* Charts & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Purchases Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Revenue & Purchase Trends</CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span> Sales
              </span>
              <span className="flex items-center gap-1 ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Purchases
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="purchases" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorPurchases)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock & Action Alerts */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm">Low Stock Alerts ({lowStockItems.length})</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/items?filter=low_stock')} className="text-[11px] p-0 h-auto">
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              {lowStockItems.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">All inventory levels are healthy.</p>
              ) : (
                lowStockItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500">Alert at: {item.low_stock_alert} {item.unit}</p>
                    </div>
                    <Badge variant="red" size="sm">{item.current_stock} left</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <CardTitle className="text-sm">Overdue Invoices ({overdueInvoices.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {overdueInvoices.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No overdue invoices.</p>
              ) : (
                overdueInvoices.slice(0, 2).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-red-50/40 border border-red-100">
                    <div>
                      <p className="font-semibold text-slate-900">{inv.party_name}</p>
                      <p className="text-[10px] text-red-600">Due: {inv.due_date}</p>
                    </div>
                    <span className="font-bold text-red-700">{formatCurrency(inv.balance_amount)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Latest sales invoices and bills</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/sales')} rightIcon={<ArrowRight className="w-4 h-4" />}>
            View All
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-100 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Party</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-slate-600">{tx.document_date}</td>
                  <td className="py-3 px-4">
                    <span className="capitalize font-medium text-slate-800">
                      {tx.document_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {tx.document_number}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{tx.party_name || 'Cash'}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(tx.total_amount)}
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
