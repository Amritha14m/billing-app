import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import { AppLayout } from './components/layout/AppLayout';
import { AppLockScreen } from './components/layout/AppLockScreen';
import { AppShell } from './components/layout/AppShell';

// Onboarding Pages
import { LanguageSelectScreen } from './pages/onboarding/LanguageSelectScreen';
import { PermissionsScreen } from './pages/onboarding/PermissionsScreen';
import { BusinessSetupScreen } from './pages/onboarding/BusinessSetupScreen';
import { PrivacyPolicyPage } from './pages/onboarding/PrivacyPolicyPage';
import { TermsPage } from './pages/onboarding/TermsPage';
import { Login } from './pages/auth/Login';

// Main Application Pages
import { HomePage } from './pages/dashboard/HomePage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { GetDesktopPage } from './pages/dashboard/GetDesktopPage';
import { MenuPage } from './pages/menu/MenuPage';
import { PartyListPage } from './pages/parties/PartyListPage';
import { InvoiceListPage } from './pages/sales/InvoiceListPage';
import { InvoiceFormPage } from './pages/sales/InvoiceFormPage';
import { InvoiceDetailPage } from './pages/sales/InvoiceDetailPage';
import { PurchaseBillListPage } from './pages/purchases/PurchaseBillListPage';
import { PurchaseBillFormPage } from './pages/purchases/PurchaseBillFormPage';
import { ItemListPage } from './pages/items/ItemListPage';
import { ExpenseListPage } from './pages/expenses/ExpenseListPage';
import { CashBankPage } from './pages/accounts/CashBankPage';
import { ReportsDashboardPage } from './pages/reports/ReportsDashboardPage';
import { OnlineStorePage } from './pages/store/OnlineStorePage';
import { UtilitiesPage } from './pages/utilities/UtilitiesPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { HelpPage } from './pages/help/HelpPage';

function AppRoutes() {
  const { isLocked, isOnboardingCompleted } = useAuth();

  // If app is protected by PIN and currently locked
  if (isLocked) {
    return <AppLockScreen />;
  }

  return (
    <Routes>
      {/* Onboarding Flow (Mobile-First) */}
      <Route path="/welcome/language" element={<LanguageSelectScreen />} />
      <Route path="/welcome/permissions" element={<PermissionsScreen />} />
      <Route path="/welcome/business-setup" element={<BusinessSetupScreen />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<BusinessSetupScreen />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Main Application Shell with AppLayout */}
      <Route
        path="/"
        element={
          !isOnboardingCompleted && !localStorage.getItem('bizledger_onboarding_completed') ? (
            <Navigate to="/welcome/language" replace />
          ) : (
            <AppLayout />
          )
        }
      >
        {/* Five Main Mobile Tabs & Desktop Routes */}
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="items" element={<ItemListPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="desktop" element={<GetDesktopPage />} />

        {/* Ledger & Business Modules */}
        <Route path="parties" element={<PartyListPage />} />
        <Route path="sales" element={<InvoiceListPage />} />
        <Route path="sales/new" element={<InvoiceFormPage />} />
        <Route path="sales/edit/:id" element={<InvoiceFormPage />} />
        <Route path="sales/view/:id" element={<InvoiceDetailPage />} />
        <Route path="purchases" element={<PurchaseBillListPage />} />
        <Route path="purchases/new" element={<PurchaseBillFormPage />} />
        <Route path="expenses" element={<ExpenseListPage />} />
        <Route path="accounts" element={<CashBankPage />} />
        <Route path="reports" element={<ReportsDashboardPage />} />
        <Route path="store" element={<OnlineStorePage />} />
        <Route path="utilities" element={<UtilitiesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SyncProvider>
          <HashRouter>
            <AppShell>
              <AppRoutes />
            </AppShell>
          </HashRouter>
        </SyncProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
