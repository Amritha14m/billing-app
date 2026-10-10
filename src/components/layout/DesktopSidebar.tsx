import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  Package,
  Wallet,
  Landmark,
  BarChart3,
  Globe,
  Wrench,
  Settings,
  ChevronDown,
  Building2,
  PlusCircle,
  HelpCircle,
  TrendingDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DesktopSidebar: React.FC = () => {
  const { businesses, activeBusiness, setActiveBusiness } = useAuth();
  const [showBizMenu, setShowBizMenu] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Sales & Invoices', path: '/sales', icon: Receipt },
    { name: 'Purchases & Bills', path: '/purchases', icon: ShoppingCart },
    { name: 'Parties & Customers', path: '/parties', icon: Users },
    { name: 'Items & Inventory', path: '/items', icon: Package },
    { name: 'Expenses', path: '/expenses', icon: TrendingDown },
    { name: 'Cash & Bank', path: '/accounts', icon: Landmark },
    { name: 'Reports & GST', path: '/reports', icon: BarChart3 },
    { name: 'Online Store', path: '/store', icon: Globe },
    { name: 'Utilities & Barcodes', path: '/utilities', icon: Wrench },
    { name: 'Settings & Backup', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 select-none h-screen sticky top-0 z-30">
      {/* Brand Header & Business Switcher */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            BL
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none text-base">BizLedger</h1>
            <span className="text-[11px] font-medium text-brand-600">GST Accounting ERP</span>
          </div>
        </div>

        {/* Current Business Selector Card */}
        <div className="relative">
          <button
            onClick={() => setShowBizMenu(!showBizMenu)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {activeBusiness?.name || 'Select Business'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {activeBusiness?.gstin ? `GST: ${activeBusiness.gstin}` : 'Non-GST'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Business Dropdown Menu */}
          {showBizMenu && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                My Businesses ({businesses.length})
              </div>
              {businesses.map((biz) => (
                <button
                  key={biz.id}
                  onClick={() => {
                    setActiveBusiness(biz);
                    setShowBizMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-brand-50 transition-colors ${
                    activeBusiness?.id === biz.id ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{biz.name}</span>
                  {activeBusiness?.id === biz.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                  )}
                </button>
              ))}
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowBizMenu(false);
                    navigate('/onboarding');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-brand-600 hover:bg-brand-50 flex items-center gap-1.5 font-medium"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + Create New Business
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>BizLedger v1.0</span>
          <NavLink to="/help" className="hover:text-brand-600 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Help
          </NavLink>
        </div>
      </div>
    </aside>
  );
};
