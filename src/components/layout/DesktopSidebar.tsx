import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  BarChart3,
  Receipt,
  ShoppingCart,
  Users,
  Package,
  TrendingDown,
  Landmark,
  Globe,
  Wrench,
  Monitor,
  Menu,
  Settings,
  HelpCircle,
  Building2,
  ChevronDown,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BusinessSwitcherModal } from './BusinessSwitcherModal';
import { EditBusinessNameModal } from './EditBusinessNameModal';

export const DesktopSidebar: React.FC = () => {
  const { businesses, activeBusiness, setActiveBusiness } = useAuth();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const navigate = useNavigate();

  const navSections = [
    {
      heading: 'Core',
      items: [
        { name: 'Home', path: '/', icon: Home, end: true },
        { name: 'Dashboard', path: '/dashboard', icon: BarChart3, end: false },
      ],
    },
    {
      heading: 'My Business',
      items: [
        { name: 'Parties (Ledger)', path: '/parties', icon: Users, end: false },
        { name: 'Sales & Invoices', path: '/sales', icon: Receipt, end: false },
        { name: 'Purchases & Bills', path: '/purchases', icon: ShoppingCart, end: false },
        { name: 'Items & Stock', path: '/items', icon: Package, end: false },
        { name: 'Expenses', path: '/expenses', icon: TrendingDown, end: false },
        { name: 'Online Store', path: '/store', icon: Globe, end: false },
        { name: 'Reports & GST', path: '/reports', icon: BarChart3, end: false },
      ],
    },
    {
      heading: 'Cash & Bank',
      items: [
        { name: 'Bank & Cash Accounts', path: '/accounts', icon: Landmark, end: false },
      ],
    },
    {
      heading: 'Utilities & Others',
      items: [
        { name: 'Utilities & Barcodes', path: '/utilities', icon: Wrench, end: false },
        { name: 'All Modules (Menu)', path: '/menu', icon: Menu, end: false },
        { name: 'Get Desktop Software', path: '/desktop', icon: Monitor, end: false },
        { name: 'Settings & Security', path: '/settings', icon: Settings, end: false },
      ],
    },
  ];

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 select-none h-screen sticky top-0 z-30">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              BL
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 leading-none text-base">BizLedger</h1>
              <span className="text-[11px] font-bold text-brand-600">GST Accounting ERP</span>
            </div>
          </div>

          {/* Current Business Selector Card */}
          <button
            onClick={() => setIsSwitcherOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors group"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-brand-600">
                  {activeBusiness?.name || 'Select Business'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {activeBusiness?.gst_registered ? `GST: ${activeBusiness.gstin || 'Registered'}` : 'Non-GST'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                {section.heading}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
          <span>BizLedger v1.2</span>
          <NavLink to="/help" className="hover:text-brand-600 flex items-center gap-1 font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            Help
          </NavLink>
        </div>
      </aside>

      <BusinessSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        onOpenEditName={() => setIsEditNameOpen(true)}
      />

      <EditBusinessNameModal
        isOpen={isEditNameOpen}
        onClose={() => setIsEditNameOpen(false)}
      />
    </>
  );
};
