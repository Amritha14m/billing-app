import React, { useState, useEffect } from 'react';
import { Landmark, Wallet, Plus, ArrowRightLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getLocalAccounts, saveLocalAccount } from '../../lib/db';
import { Account } from '../../types';
import { formatCurrency } from '../../lib/gst';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';

export const CashBankPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Add Account Modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'bank' | 'cash'>('bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(0);

  useEffect(() => {
    if (!activeBusiness) return;
    getLocalAccounts(activeBusiness.id).then(setAccounts);
  }, [activeBusiness]);

  const handleCreateAccount = async () => {
    if (!activeBusiness || !accountName.trim()) return;

    const newAcc: Account = {
      id: `acc_${Date.now()}`,
      business_id: activeBusiness.id,
      account_name: accountName.trim(),
      account_type: accountType,
      account_number: accountNumber.trim() || undefined,
      bank_name: bankName.trim() || undefined,
      ifsc: ifsc.trim().toUpperCase() || undefined,
      opening_balance: openingBalance,
      current_balance: openingBalance,
      created_at: new Date().toISOString(),
    };

    await saveLocalAccount(newAcc);
    setAccounts((prev) => [...prev, newAcc]);
    setIsAccountModalOpen(false);
  };

  const handleTransfer = async () => {
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId || transferAmount <= 0) {
      alert('Please select valid distinct source and destination accounts and amount.');
      return;
    }

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);
    if (!fromAcc || !toAcc) return;

    fromAcc.current_balance -= transferAmount;
    toAcc.current_balance += transferAmount;

    await saveLocalAccount(fromAcc);
    await saveLocalAccount(toAcc);

    setAccounts([...accounts]);
    setIsTransferModalOpen(false);
    setTransferAmount(0);
  };

  const totalLiquidity = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Cash & Bank Accounts
          </h1>
          <p className="text-xs text-slate-500">
            Manage business liquid cash, current accounts, and contra inter-account transfers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTransferModalOpen(true)}
            leftIcon={<ArrowRightLeft className="w-4 h-4 text-brand-600" />}
          >
            Transfer Between Accounts
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAccountModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Add Bank Account
          </Button>
        </div>
      </div>

      {/* Total Liquidity Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle border-l-4 border-l-brand-600 max-w-sm">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Total Liquid Balance
        </span>
        <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
          {formatCurrency(totalLiquidity)}
        </span>
        <span className="text-[11px] text-slate-400">Total available funds across all accounts</span>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <Card key={acc.id} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
                  {acc.account_type === 'cash' ? (
                    <Wallet className="w-6 h-6" />
                  ) : (
                    <Landmark className="w-6 h-6" />
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {acc.account_type}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base">{acc.account_name}</h3>
              {acc.account_number && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  A/C: {acc.account_number}
                </p>
              )}
              {acc.ifsc && (
                <p className="text-xs text-slate-400 font-mono">IFSC: {acc.ifsc}</p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-xs text-slate-500">Available Balance:</span>
                <span className="text-lg font-extrabold text-slate-900">
                  {formatCurrency(acc.current_balance)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Account Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="Add Bank or Cash Account"
        maxWidth="md"
      >
        <div className="space-y-3">
          <Input
            label="Account Display Name *"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g. HDFC Current Account"
            required
          />
          <Select
            label="Account Type *"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as 'bank' | 'cash')}
            options={[
              { value: 'bank', label: 'Bank Account' },
              { value: 'cash', label: 'Cash in Hand' },
            ]}
          />
          {accountType === 'bank' && (
            <>
              <Input
                label="Bank Name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank Ltd"
              />
              <Input
                label="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Bank account number"
              />
              <Input
                label="IFSC Code"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
              />
            </>
          )}
          <Input
            label="Opening Balance (₹) *"
            type="number"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsAccountModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateAccount}>
              Create Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inter-Account Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Funds Between Accounts"
        description="Contra entry: moves money from one account to another without affecting revenue or expense"
        maxWidth="md"
      >
        <div className="space-y-3">
          <Select
            label="From Account (Withdrawal) *"
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            options={[
              { value: '', label: '-- Select Source Account --' },
              ...accounts.map((a) => ({
                value: a.id,
                label: `${a.account_name} (${formatCurrency(a.current_balance)})`,
              })),
            ]}
          />
          <Select
            label="To Account (Deposit) *"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            options={[
              { value: '', label: '-- Select Destination Account --' },
              ...accounts.map((a) => ({
                value: a.id,
                label: `${a.account_name} (${formatCurrency(a.current_balance)})`,
              })),
            ]}
          />
          <Input
            label="Transfer Amount (₹) *"
            type="number"
            min="1"
            value={transferAmount}
            onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
            required
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleTransfer}>
              Confirm Transfer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
