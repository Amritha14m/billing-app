import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff,
  ScanBarcode,
  Receipt,
  ShoppingCart,
  UserPlus,
  PackagePlus,
  ArrowDownCircle,
} from 'lucide-react';
import { useSync } from '../../context/SyncContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface TopNavbarProps {
  onOpenBarcodeScanner?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenBarcodeScanner }) => {
  const { status, pendingCount, triggerSync } = useSync();
  const { user, activeBusiness } = useAuth();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const navigate = useNavigate();

  const getSyncBadge = () => {
    switch (status) {
      case 'offline':
        return (
          <button
            onClick={() => triggerSync()}
            title="Working offline. Click to test sync."
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            <span>Offline {pendingCount > 0 ? `(${pendingCount})` : ''}</span>
          </button>
        );
      case 'syncing':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Syncing...</span>
          </div>
        );
      default:
        return (
          <button
            onClick={() => triggerSync()}
            title={pendingCount > 0 ? `${pendingCount} changes queued. Click to sync.` : 'Online and synced.'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span>{pendingCount > 0 ? `Queued (${pendingCount})` : 'Online'}</span>
          </button>
        );
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-subtle">
      {/* Left Search / Breadcrumb */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoices, parties, items (Ctrl+K)..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Barcode Scanner Shortcut */}
        {onOpenBarcodeScanner && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenBarcodeScanner}
            leftIcon={<ScanBarcode className="w-4 h-4 text-brand-600" />}
            className="hidden sm:inline-flex"
          >
            Barcode
          </Button>
        )}

        {/* Sync Status Badge */}
        {getSyncBadge()}

        {/* Quick Add Menu */}
        <div className="relative">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Add New</span>
          </Button>

          {showQuickAdd && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-xs animate-in fade-in duration-100">
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  navigate('/sales/new');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                <Receipt className="w-4 h-4 text-brand-600" />
                <span>Sales Invoice</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  navigate('/purchases/new');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>Purchase Bill</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  navigate('/parties?add=customer');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Add Customer/Party</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  navigate('/items?add=item');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                <PackagePlus className="w-4 h-4 text-amber-600" />
                <span>Add Product/Item</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  navigate('/expenses?add=true');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                <ArrowDownCircle className="w-4 h-4 text-red-600" />
                <span>Record Expense</span>
              </button>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
