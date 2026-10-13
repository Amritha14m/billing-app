import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle2, Package, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getLocalItems, getLocalParties, getLocalPartyReminders } from '../../lib/db';
import { Item, Party, PartyReminder } from '../../types';
import { formatCurrency } from '../../lib/gst';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onCountChange,
}) => {
  const { activeBusiness } = useAuth();
  const [lowStockItems, setLowStockItems] = useState<Item[]>([]);
  const [overdueParties, setOverdueParties] = useState<Party[]>([]);
  const [recentReminders, setRecentReminders] = useState<PartyReminder[]>([]);

  useEffect(() => {
    if (!activeBusiness) return;
    async function loadAlerts() {
      const [itms, pts, rems] = await Promise.all([
        getLocalItems(activeBusiness!.id),
        getLocalParties(activeBusiness!.id),
        getLocalPartyReminders(activeBusiness!.id),
      ]);

      const lowStock = itms.filter((i) => i.current_stock <= i.low_stock_alert);
      const overdue = pts.filter((p) => p.current_balance > 0 && (p.payment_due_days || 0) > 0);

      setLowStockItems(lowStock);
      setOverdueParties(overdue);
      setRecentReminders(rems);

      const totalAlerts = lowStock.length + overdue.length;
      if (onCountChange) onCountChange(totalAlerts);
    }
    loadAlerts();
  }, [activeBusiness, isOpen, onCountChange]);

  const totalCount = lowStockItems.length + overdueParties.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification Center" size="md">
      <div className="space-y-4">
        {totalCount === 0 && recentReminders.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">All Caught Up!</h4>
            <p className="text-xs text-slate-500 mt-1">
              No low stock items or overdue payment alerts.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {/* Low stock alerts */}
            {lowStockItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
                  <Package className="w-3.5 h-3.5" />
                  <span>Low Stock Warnings ({lowStockItems.length})</span>
                </div>
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-amber-800 text-[11px]">
                        Current Stock: <strong>{item.current_stock} {item.unit}</strong> (Min alert: {item.low_stock_alert})
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded-md font-bold text-[10px]">
                      Restock Soon
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Overdue receivables */}
            {overdueParties.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  <span>Payment Collection Due ({overdueParties.length})</span>
                </div>
                {overdueParties.map((party) => (
                  <div
                    key={party.id}
                    className="p-3 bg-red-50/70 border border-red-200/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{party.name}</p>
                      <p className="text-slate-500 text-[11px]">{party.phone || 'No phone'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-700">{formatCurrency(party.current_balance)}</p>
                      <p className="text-[10px] text-red-600 font-medium">Payment Due</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
