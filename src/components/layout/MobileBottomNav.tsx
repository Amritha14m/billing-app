import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  BarChart3,
  Package,
  Menu,
  Monitor,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const MobileBottomNav: React.FC = () => {
  const { t } = useLanguage();

  const navItems = [
    { label: t('home'), path: '/', icon: Home, end: true },
    { label: t('dashboard'), path: '/dashboard', icon: BarChart3, end: false },
    { label: t('items'), path: '/items', icon: Package, end: false },
    { label: t('menu'), path: '/menu', icon: Menu, end: false },
    { label: t('get_desktop'), path: '/desktop', icon: Monitor, end: false },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-1.5 pt-1 z-40 shadow-lg select-none hide-on-keyboard transition-all"
      style={{
        paddingBottom: 'calc(0.25rem + var(--safe-area-bottom))',
        paddingLeft: 'calc(0.375rem + var(--safe-area-left))',
        paddingRight: 'calc(0.375rem + var(--safe-area-right))',
      }}
    >
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  isActive
                    ? 'text-brand-600 bg-brand-50/60'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5 stroke-[2.2]" />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
