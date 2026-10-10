import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  Package,
  Users,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMoreMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMoreMenu }) => {
  const navigate = useNavigate();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1.5 z-40 shadow-lg select-none">
      <div className="flex items-center justify-around">
        {/* Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[50px] py-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        {/* Parties */}
        <NavLink
          to="/parties"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[50px] py-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Parties</span>
        </NavLink>

        {/* Center Action Button (+ Invoice) */}
        <button
          onClick={() => navigate('/sales/new')}
          className="w-12 h-12 -mt-4 rounded-full bg-brand-600 text-white shadow-lg flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all focus:outline-none"
          title="New Invoice"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Items */}
        <NavLink
          to="/items"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[50px] py-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Items</span>
        </NavLink>

        {/* More Menu */}
        <button
          onClick={onOpenMoreMenu}
          className="flex flex-col items-center justify-center min-w-[50px] py-1 text-[10px] font-medium text-slate-500 hover:text-slate-900"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </div>
    </div>
  );
};
