import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { TopNavbar } from './TopNavbar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { BarcodeScannerModal } from '../barcode/BarcodeScannerModal';
import {
  X,
  Receipt,
  ShoppingCart,
  TrendingDown,
  Landmark,
  BarChart3,
  Globe,
  Wrench,
  Settings,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { businesses, activeBusiness, setActiveBusiness } = useAuth();
  const navigate = useNavigate();

  const secondaryNavItems = [
    { name: 'Purchases & Bills', path: '/purchases', icon: ShoppingCart },
    { name: 'Expenses', path: '/expenses', icon: TrendingDown },
    { name: 'Cash & Bank Accounts', path: '/accounts', icon: Landmark },
    { name: 'Reports & GST Statements', path: '/reports', icon: BarChart3 },
    { name: 'Online Storefront', path: '/store', icon: Globe },
    { name: 'Utilities & Barcodes', path: '/utilities', icon: Wrench },
    { name: 'Settings & Cloud Backup', path: '/settings', icon: Settings },
    { name: 'Help & Support', path: '/help', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-[#0F172A]">
      {/* Desktop Sidebar (visible on lg+) */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (hidden on lg+) */}
        <MobileHeader onOpenBarcodeScanner={() => setIsBarcodeOpen(true)} />

        {/* Desktop Top Navbar (hidden on small screens) */}
        <div className="hidden lg:block">
          <TopNavbar onOpenBarcodeScanner={() => setIsBarcodeOpen(true)} />
        </div>

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (hidden on lg+) */}
        <MobileBottomNav onOpenMoreMenu={() => setIsMoreMenuOpen(true)} />
      </div>

      {/* Global Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        onItemSelect={(item) => {
          navigate(`/items?search=${encodeURIComponent(item.name)}`);
        }}
      />

      {/* Mobile "More" Drawer */}
      {isMoreMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-600" />
                <span className="font-bold text-sm text-slate-900">
                  {activeBusiness?.name || 'Menu'}
                </span>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                All Modules
              </p>
              {secondaryNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 text-slate-500" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-500">
              BizLedger Mobile • Offline Ready
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
