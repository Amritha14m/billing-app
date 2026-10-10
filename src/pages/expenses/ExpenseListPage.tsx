import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingDown, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getLocalExpenses,
  saveLocalExpense,
  getLocalAccounts,
  saveLocalAccount,
} from '../../lib/db';
import { Expense, PaymentMode, Account } from '../../types';
import { formatCurrency } from '../../lib/gst';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';

export const ExpenseListPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [categoryName, setCategoryName] = useState('Rent');
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [payee, setPayee] = useState('');
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!activeBusiness) return;
    getLocalExpenses(activeBusiness.id).then(setExpenses);
    getLocalAccounts(activeBusiness.id).then(setAccounts);
  }, [activeBusiness]);

  const handleSaveExpense = async () => {
    if (!activeBusiness || amount <= 0) return;

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      business_id: activeBusiness.id,
      category_name: categoryName,
      amount,
      expense_date: expenseDate,
      payment_mode: paymentMode,
      payee: payee.trim() || undefined,
      tax_amount: taxAmount,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    await saveLocalExpense(newExpense);

    // Deduct from matching cash/bank account
    const targetAcc =
      paymentMode === 'cash'
        ? accounts.find((a) => a.account_type === 'cash')
        : accounts.find((a) => a.account_type === 'bank');
    if (targetAcc) {
      targetAcc.current_balance -= amount;
      await saveLocalAccount(targetAcc);
    }

    setExpenses((prev) => [newExpense, ...prev]);
    setIsModalOpen(false);
    setAmount(0);
    setPayee('');
    setNotes('');
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Expenses
          </h1>
          <p className="text-xs text-slate-500">
            Track business operating costs, rent, electricity, salaries, and office supplies
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Record Expense
        </Button>
      </div>

      {/* KPI banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle border-l-4 border-l-red-500 max-w-sm">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Total Expenses
        </span>
        <span className="text-2xl font-extrabold text-red-600 mt-1 block">
          {formatCurrency(totalExpense)}
        </span>
        <span className="text-[11px] text-slate-400">{expenses.length} expense entries</span>
      </div>

      {/* Expenses Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payee / Vendor</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{exp.expense_date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{exp.category_name}</td>
                    <td className="py-3 px-4 text-slate-700">{exp.payee || '-'}</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{exp.payment_mode.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-right font-bold text-red-600">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{exp.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Business Expense"
        maxWidth="md"
      >
        <div className="space-y-3">
          <Select
            label="Expense Category *"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            options={[
              { value: 'Rent', label: 'Rent' },
              { value: 'Electricity Bill', label: 'Electricity Bill' },
              { value: 'Salaries & Wages', label: 'Salaries & Wages' },
              { value: 'Logistics & Transport', label: 'Logistics & Transport' },
              { value: 'Internet & Telephone', label: 'Internet & Telephone' },
              { value: 'Office Supplies & Stationery', label: 'Office Supplies & Stationery' },
              { value: 'Repairs & Maintenance', label: 'Repairs & Maintenance' },
              { value: 'Marketing & Advertising', label: 'Marketing & Advertising' },
              { value: 'Tea & Refreshments', label: 'Tea & Refreshments' },
              { value: 'Other Expense', label: 'Other Expense' },
            ]}
          />
          <Input
            label="Amount (₹) *"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            required
            autoFocus
          />
          <Input
            label="Date *"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />
          <Select
            label="Payment Mode *"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
            options={[
              { value: 'cash', label: 'Cash in Hand' },
              { value: 'upi', label: 'UPI / QR' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'card', label: 'Card' },
              { value: 'cheque', label: 'Cheque' },
            ]}
          />
          <Input
            label="Payee / Recipient"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="e.g. Landlord / Vendor Name"
          />
          <Input
            label="Remarks / Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details..."
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveExpense}>
              Save Expense
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
