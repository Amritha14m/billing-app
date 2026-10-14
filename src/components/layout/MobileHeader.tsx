import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Edit2,
  Bell,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  ScanBarcode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { getLocalItems, getLocalParties } from '../../lib/db';
import { BusinessSwitcherModal } from './BusinessSwitcherModal';
import { EditBusinessNameModal } from './EditBusinessNameModal';
import { NotificationCenterModal } from './NotificationCenterModal';

interface MobileHeaderProps {
  onOpenBarcodeScanner?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenBarcodeScanner }) => {
  const { activeBusiness } = useAuth();
  const { status, triggerSync } = useSync();
  const navigate = useNavigate();

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <>
      <header
        className="lg:hidden bg-brand-600 text-white px-3 sticky top-0 z-30 shadow-md transition-all select-none"
        style={{
          paddingTop: 'var(--safe-area-top)',
          paddingLeft: 'calc(0.75rem + var(--safe-area-left))',
          paddingRight: 'calc(0.75rem + var(--safe-area-right))',
        }}
      >
        <div className="h-14 flex items-center justify-between">
          {/* Left: Business Icon & Editable Company Name */}
        <div className="flex items-center gap-2 overflow-hidden max-w-[65%]">
          {/* Business Switcher Trigger */}
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white shrink-0 transition-all border border-white/20"
            title="Switch Business"
          >
            <Building2 className="w-4 h-4" />
          </button>

          {/* Editable Company Name */}
          <div
            onClick={() => setIsEditNameOpen(true)}
            className="flex items-center gap-1.5 cursor-pointer truncate group py-1"
            title="Click to edit business name"
          >
            <span
              className={`text-xs sm:text-sm font-bold truncate ${
                isNameEmpty ? 'italic text-white/70' : 'text-white'
              }`}
            >
              {companyDisplayName}
            </span>
            <Edit2 className="w-3 h-3 text-white/70 group-hover:text-white shrink-0" />
          </div>
        </div>

        {/* Right: Sync, Barcode, Notifications & Settings Gear */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Sync indicator */}
          <button
            onClick={() => triggerSync()}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 transition-colors"
            title="Sync Status"
          >
            {status === 'offline' ? (
              <WifiOff className="w-4 h-4 text-amber-300" />
            ) : status === 'syncing' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-300" />
            )}
          </button>

          {/* Barcode scanner */}
          {onOpenBarcodeScanner && (
            <button
              onClick={onOpenBarcodeScanner}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white/90"
              title="Barcode Scanner"
            >
              <ScanBarcode className="w-4 h-4" />
            </button>
          )}

          {/* Notification Bell with unread badge */}
          <button
            type="button"
            onClick={() => setIsNotificationOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white relative transition-colors"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute 1 top-1 right-1 w-2 h-2 rounded-full bg-red-400 ring-2 ring-brand-600 animate-pulse" />
            )}
          </button>

          {/* Settings Gear */}
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
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
