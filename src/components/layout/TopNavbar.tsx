import React, { useState, useEffect } from 'react';
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
  Building2,
  Edit2,
  Bell,
  Settings,
  User,
  LogOut,
} from 'lucide-react';
import { useSync } from '../../context/SyncContext';
import { useAuth } from '../../context/AuthContext';
import { getLocalItems, getLocalParties } from '../../lib/db';
import { Button } from '../ui/Button';
import { BusinessSwitcherModal } from './BusinessSwitcherModal';
import { EditBusinessNameModal } from './EditBusinessNameModal';
import { NotificationCenterModal } from './NotificationCenterModal';

interface TopNavbarProps {
  onOpenBarcodeScanner?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenBarcodeScanner }) => {
  const { status, pendingCount, triggerSync } = useSync();
  const { user, role, activeBusiness, logout } = useAuth();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeBusiness) return;
    async function checkNotifications() {
      try {
        const [itms, pts] = await Promise.all([
          getLocalItems(activeBusiness!.id),
          getLocalParties(activeBusiness!.id),
        ]);
        const lowStock = itms.filter((i) => i.current_stock <= i.low_stock_alert).length;
        const overdue = pts.filter((p) => p.current_balance > 0 && (p.payment_due_days || 0) > 0).length;
        setUnreadCount(lowStock + overdue);
      } catch {
        // ignore
      }
    }
    checkNotifications();
  }, [activeBusiness]);

  const companyDisplayName = activeBusiness?.name?.trim() || 'Enter Company Name';
  const isNameEmpty = !activeBusiness?.name?.trim();

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
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-subtle">
        {/* Left: Business Icon & Editable Business Name */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className="w-9 h-9 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 transition-colors"
            title="Switch Business"
          >
            <Building2 className="w-5 h-5" />
          </button>

          <div
            onClick={() => setIsEditNameOpen(true)}
            className="flex items-center gap-2 cursor-pointer group py-1"
            title="Click to edit business name"
          >
            <span
              className={`text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors ${
                isNameEmpty ? 'italic text-slate-400' : ''
              }`}
            >
              {companyDisplayName}
            </span>
            <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition-colors" />
          </div>
        </div>

        {/* Center Search */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-sm mx-6">
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

          {/* Notifications with unread badge */}
          <button
            type="button"
            onClick={() => setIsNotificationOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {/* Settings Gear */}
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Account Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              title="User Account"
            >
              <div className="w-7 h-7 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
            </button>

            {isAccountMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 text-xs animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{user?.name || 'Business Owner'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.phone || user?.email || 'Active User'}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 capitalize">
                    {role || 'Owner'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Profile & Business Settings</span>
                </button>
                <button
                  onClick={async () => {
                    setIsAccountMenuOpen(false);
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

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
        </div>
      </header>

      {/* Modals */}
      <BusinessSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        onOpenEditName={() => setIsEditNameOpen(true)}
      />

      <EditBusinessNameModal
        isOpen={isEditNameOpen}
        onClose={() => setIsEditNameOpen(false)}
      />

      <NotificationCenterModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onCountChange={setUnreadCount}
      />
    </>
  );
};
