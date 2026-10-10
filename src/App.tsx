import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { InvoiceListPage } from './pages/sales/InvoiceListPage';
import { InvoiceFormPage } from './pages/sales/InvoiceFormPage';
import { InvoiceDetailPage } from './pages/sales/InvoiceDetailPage';
import { PurchaseBillListPage } from './pages/purchases/PurchaseBillListPage';
import { PurchaseBillFormPage } from './pages/purchases/PurchaseBillFormPage';
import { PartyListPage } from './pages/parties/PartyListPage';
import { ItemListPage } from './pages/items/ItemListPage';
import { ExpenseListPage } from './pages/expenses/ExpenseListPage';
import { CashBankPage } from './pages/accounts/CashBankPage';
import { ReportsDashboardPage } from './pages/reports/ReportsDashboardPage';
import { OnlineStorePage } from './pages/store/OnlineStorePage';
import { UtilitiesPage } from './pages/utilities/UtilitiesPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { HelpPage } from './pages/help/HelpPage';
import { Login } from './pages/auth/Login';
import { BusinessOnboarding } from './pages/onboarding/BusinessOnboarding';

export function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone Auth & Onboarding */}
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<BusinessOnboarding />} />

            {/* Main Application with AppLayout Shell */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="sales" element={<InvoiceListPage />} />
              <Route path="sales/new" element={<InvoiceFormPage />} />
              <Route path="sales/edit/:id" element={<InvoiceFormPage />} />
              <Route path="sales/view/:id" element={<InvoiceDetailPage />} />
              <Route path="purchases" element={<PurchaseBillListPage />} />
              <Route path="purchases/new" element={<PurchaseBillFormPage />} />
              <Route path="parties" element={<PartyListPage />} />
              <Route path="items" element={<ItemListPage />} />
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
        </BrowserRouter>
      </SyncProvider>
    </AuthProvider>
  );
}

export default App;
