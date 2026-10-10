import React from 'react';
import { ScanBarcode, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';

interface MobileHeaderProps {
  onOpenBarcodeScanner?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenBarcodeScanner }) => {
  const { activeBusiness } = useAuth();
  const { status, pendingCount, triggerSync } = useSync();

  return (
    <header className="lg:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
          BL
        </div>
        <div className="truncate">
          <h2 className="text-xs font-bold text-slate-900 truncate">
            {activeBusiness?.name || 'BizLedger'}
          </h2>
          <p className="text-[10px] text-slate-500">
            {activeBusiness?.gst_registered ? `GST: ${activeBusiness.gstin || 'Registered'}` : 'Non-GST'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Sync Pill */}
        <button
          onClick={() => triggerSync()}
          className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          title="Sync Status"
        >
          {status === 'offline' ? (
            <WifiOff className="w-4 h-4 text-amber-500" />
          ) : status === 'syncing' ? (
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
          ) : (
            <Wifi className="w-4 h-4 text-emerald-500" />
          )}
        </button>

        {/* Barcode scanner */}
        {onOpenBarcodeScanner && (
          <button
            onClick={onOpenBarcodeScanner}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
            title="Scan Barcode"
          >
            <ScanBarcode className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
