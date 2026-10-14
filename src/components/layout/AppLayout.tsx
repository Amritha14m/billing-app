import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { TopNavbar } from './TopNavbar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { BarcodeScannerModal } from '../barcode/BarcodeScannerModal';

export const AppLayout: React.FC = () => {
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const navigate = useNavigate();

  // Desktop Global Billing Keyboard Shortcuts (Ctrl+N, Ctrl+S, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N: New Sales Invoice
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        navigate('/sales/new');
      }

      // Ctrl+S or Cmd+S: Save active form
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        const submitBtn = document.querySelector('form button[type="submit"]') as HTMLButtonElement | null;
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
        }
      }

      // Esc: Close open modals / overlays
      if (e.key === 'Escape' && isBarcodeOpen) {
        setIsBarcodeOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isBarcodeOpen]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-[#0F172A]">
      {/* Desktop Persistent Sidebar (visible on lg+) */}
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
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto app-main-content">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (HOME | DASHBOARD | ITEMS | MENU | GET DESKTOP) */}
        <MobileBottomNav />
      </div>

      {/* Global Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        onItemSelect={(item) => {
          navigate(`/items?search=${encodeURIComponent(item.name)}`);
        }}
      />
    </div>
  );
};
